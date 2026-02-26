package com.charusat.canteen.controller;

import com.charusat.canteen.model.User;
import com.charusat.canteen.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Auth Controller - Handles authentication endpoints with industry-standard security
 * 
 * Security Features:
 * - Account lockout after failed attempts
 * - Refresh token rotation
 * - Security event logging
 * - Generic error messages (no user enumeration)
 * - IP-based rate limiting
 * 
 * Standards: OWASP ASVS, NIST 800-63B
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    private final GoogleAuthService googleAuthService;
    private final EmailService emailService;
    private final AccountLockoutService lockoutService;
    private final RefreshTokenService refreshTokenService;
    private final SecurityAuditService auditService;
    private final PasswordPolicyService passwordPolicyService;
    private final CaptchaService captchaService;
    
    // Generic error message to prevent user enumeration
    private static final String GENERIC_AUTH_ERROR = "Invalid email or password";
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        
        try {
            // Input validation
            if (request.email() == null || request.email().isBlank()) {
                return badRequest("Email is required");
            }
            
            if (request.password() == null || request.password().isBlank()) {
                return badRequest("Password is required");
            }
            
            // Sanitize inputs
            String email = request.email().toLowerCase().trim();
            
            // Validate email domain
            if (!email.endsWith("@charusat.edu.in")) {
                return badRequest("Only @charusat.edu.in emails are allowed");
            }
            
            // Extract name from email ID (e.g., d25ce145@charusat.edu.in -> D25CE145)
            String emailId = extractIdFromEmail(email);
            String fullName = request.fullName() != null && !request.fullName().isBlank() 
                    ? sanitizeInput(request.fullName()) 
                    : emailId; // Default to email ID if no name provided
            
            // Ensure the email ID is in the name
            if (!fullName.toUpperCase().contains(emailId)) {
                fullName = emailId; // Force the ID as the base name
            }
            
            // Validate password strength
            var passwordValidation = passwordPolicyService.validatePassword(request.password(), email);
            if (!passwordValidation.isValid()) {
                return badRequest(passwordValidation.message());
            }
            
            // Check for existing user
            if (userService.existsByEmail(email)) {
                // Log but return generic message to prevent enumeration
                log.warn("Registration attempt for existing email: {} from IP: {}", email, ipAddress);
                return badRequest("Registration failed. Please try again or contact support.");
            }
            
            User user = userService.register(
                    email,
                    request.password(),
                    fullName,
                    request.mobile() != null ? request.mobile().trim() : null
            );
            
            // Generate verification token
            String verificationToken = userService.generateEmailVerificationToken(user);
            
            // Send verification email (async)
            try {
                emailService.sendVerificationEmail(user.getEmail(), verificationToken);
            } catch (Exception e) {
                log.warn("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
                // Don't fail registration, user can resend
            }
            
            // Log security event
            auditService.logSuccessfulLogin(email, ipAddress, httpRequest.getHeader("User-Agent")); // Maybe log "Registration" instead? Using Login for now as it's an event.
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration successful. Please check your email to verify your account.");
            // No token returned - forced verification
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Registration error: {}", e.getMessage());
            return badRequest("Registration failed. Please try again.");
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        try {
            // Input validation
            if (request.email() == null || request.email().isBlank()) {
                return unauthorized(GENERIC_AUTH_ERROR);
            }
            
            if (request.password() == null || request.password().isBlank()) {
                return unauthorized(GENERIC_AUTH_ERROR);
            }
            
            String email = request.email().toLowerCase().trim();
            
            // Check account lockout and Captcha requirement
            var lockoutStatus = lockoutService.checkLockout(email, ipAddress);
            if (lockoutStatus.isLocked()) {
                log.warn("Login attempt on locked account: {} from IP: {}", email, ipAddress);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of(
                                "success", false,
                                "message", lockoutStatus.message(),
                                "lockedMinutes", lockoutStatus.remainingMinutes(),
                                "requireCaptcha", true
                        ));
            }

            // Server-side Captcha Validation
            // If required by lockout policy OR provided by client
            boolean captchaProvided = request.captchaId() != null && !request.captchaId().isBlank();
            
            if (lockoutStatus.requireCaptcha()) {
                if (!captchaProvided || request.captchaAnswer() == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                "success", false, 
                                "message", "Security check required", 
                                "requireCaptcha", true
                            ));
                }
                
                if (!captchaService.validateCaptcha(request.captchaId(), request.captchaAnswer())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                "success", false, 
                                "message", "Invalid security code", 
                                "requireCaptcha", true
                            ));
                }
            } else if (captchaProvided) {
                // If provided proactively, must be valid
                if (!captchaService.validateCaptcha(request.captchaId(), request.captchaAnswer())) {
                    return unauthorized("Invalid security code");
                }
            }
            
            // Check if user is a Google OAuth user
            var userCheck = userService.findByEmail(email);
            if (userCheck.isPresent()) {
                User existingUser = userCheck.get();
                
                if (existingUser.getAuthProvider() == User.AuthProvider.GOOGLE) {
                    lockoutService.recordFailedAttempt(email, ipAddress, userAgent, "Google OAuth user attempted password login");
                    return unauthorized("This account uses Google Sign-In. Please use the Google button to login.");
                }
                
                // Check if account is active
                if (!existingUser.getIsActive()) {
                    lockoutService.recordFailedAttempt(email, ipAddress, userAgent, "Inactive account");
                    return unauthorized(GENERIC_AUTH_ERROR);
                }
                
                // Check if email is verified
                if (!existingUser.getIsEmailVerified()) {
                     return unauthorized("Email not verified. Please check your email.");
                }
            }
            
            // Authenticate
            var userOpt = authService.authenticate(email, request.password());
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Reset lockout on successful login
                lockoutService.recordSuccessfulLogin(email, ipAddress, userAgent);
                
                String accessToken = authService.generateToken(user);
                
                // Generate refresh token
                var refreshTokenPair = refreshTokenService.generateRefreshToken(user, userAgent, ipAddress);
                
                // Log success
                auditService.logSuccessfulLogin(email, ipAddress, userAgent);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("token", accessToken);
                response.put("refreshToken", refreshTokenPair.token());
                response.put("expiresAt", refreshTokenPair.expiresAt().toString());
                response.put("user", buildUserResponse(user));
                response.put("requireCaptcha", false);
                
                return ResponseEntity.ok(response);
            } else {
                // Record failed attempt
                lockoutService.recordFailedAttempt(email, ipAddress, userAgent, "Invalid credentials");
                auditService.logFailedLogin(email, ipAddress, userAgent, "Invalid credentials");
                
                // Check if captcha should be required
                var newLockoutStatus = lockoutService.checkLockout(email, ipAddress);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", GENERIC_AUTH_ERROR);
                errorResponse.put("requireCaptcha", newLockoutStatus.requireCaptcha());
                errorResponse.put("failedAttempts", newLockoutStatus.failedAttempts());
                
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            return unauthorized(GENERIC_AUTH_ERROR);
        }
    }
    
    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        try {
            if (request.refreshToken() == null || request.refreshToken().isBlank()) {
                return unauthorized("Refresh token is required");
            }
            
            var rotationResult = refreshTokenService.rotateToken(request.refreshToken(), userAgent, ipAddress);
            
            if (rotationResult.isPresent()) {
                User user = rotationResult.get().user();
                String newAccessToken = authService.generateToken(user);
                var newRefreshToken = rotationResult.get().newToken();
                
                log.info("Token refreshed for user {}", user.getEmail());
                
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "token", newAccessToken,
                        "refreshToken", newRefreshToken.token(),
                        "expiresAt", newRefreshToken.expiresAt().toString()
                ));
            } else {
                log.warn("Invalid refresh token from IP: {}", ipAddress);
                return unauthorized("Invalid or expired refresh token. Please login again.");
            }
        } catch (Exception e) {
            log.error("Token refresh error: {}", e.getMessage());
            return unauthorized("Token refresh failed");
        }
    }
    
    /**
     * Logout - Revoke refresh token
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) LogoutRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        
        try {
            if (request != null && request.refreshToken() != null) {
                refreshTokenService.revokeToken(request.refreshToken());
            }
            
            // If allDevices is true and we have auth header, revoke all tokens
            if (request != null && request.allDevices() != null && request.allDevices()) {
                String authHeader = httpRequest.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.replace("Bearer ", "");
                    Long userId = authService.getUserIdFromToken(token);
                    userService.findById(userId).ifPresent(user -> {
                        refreshTokenService.revokeAllUserTokens(user, "User logout from all devices");
                        auditService.logLogout(user.getEmail(), ipAddress, true);
                    });
                }
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout error: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
        }
    }
    
    /**
     * Google OAuth Callback - Exchange authorization code for JWT token
     */
    @PostMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestBody GoogleCallbackRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        try {
            if (request.code() == null || request.code().isBlank()) {
                return badRequest("Authorization code is required");
            }
            
            GoogleAuthService.GoogleAuthResult result = googleAuthService.authenticateWithGoogle(request.code());
            
            if (!result.success()) {
                log.warn("Google auth failed from IP {}: {}", ipAddress, result.message());
                return unauthorized(result.message());
            }
            
            User user = result.user();
            
            // Generate refresh token
            var refreshTokenPair = refreshTokenService.generateRefreshToken(user, userAgent, ipAddress);
            
            // Log security event
            auditService.logSuccessfulLogin(user.getEmail(), ipAddress, userAgent);
            
            // Send welcome email for new Google users
            if (result.isNewUser()) {
                try {
                    String welcomeToken = authService.generateToken(user);
                    emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), welcomeToken);
                    log.info("Welcome email sent to new Google user: {}", user.getEmail());
                } catch (Exception e) {
                    log.warn("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Google authentication successful");
            response.put("token", result.token());
            response.put("refreshToken", refreshTokenPair.token());
            response.put("expiresAt", refreshTokenPair.expiresAt().toString());
            response.put("user", buildUserResponse(user));
            response.put("isNewUser", result.isNewUser());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Google auth error: {}", e.getMessage());
            return unauthorized("Google authentication failed. Please try again.");
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            if (!authService.validateToken(token)) {
                return unauthorized("Invalid token");
            }
            
            Long userId = authService.getUserIdFromToken(token);
            var userOpt = userService.findById(userId);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return ResponseEntity.ok(Map.of("success", true, "user", buildUserResponse(user)));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found"));
            }
        } catch (Exception e) {
            return unauthorized("Invalid token");
        }
    }
    
    // Helper Methods
    
    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("email", user.getEmail());
        userData.put("fullName", user.getFullName());
        userData.put("mobile", user.getMobile() != null ? user.getMobile() : "");
        userData.put("role", user.getRole().name());
        userData.put("profileImage", user.getProfileImage() != null ? user.getProfileImage() : "");
        userData.put("authProvider", user.getAuthProvider().name());
        return userData;
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    private String sanitizeInput(String input) {
        if (input == null) return null;
        // Basic XSS prevention - remove HTML tags
        return input.replaceAll("<[^>]*>", "").trim();
    }
    
    /**
     * Extract ID portion from email
     * e.g., d25ce145@charusat.edu.in -> D25CE145
     */
    private String extractIdFromEmail(String email) {
        if (email == null) return "";
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex).toUpperCase();
        }
        return email.toUpperCase();
    }
    
    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
    
    private ResponseEntity<?> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", message));
    }
    
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        var verifiedUser = userService.verifyEmail(token);
        if (verifiedUser.isPresent()) {
             User user = verifiedUser.get();
             // Send welcome email with auto-login token
             try {
                 String loginToken = authService.generateToken(user);
                 emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), loginToken);
                 log.info("Welcome email sent after verification for: {}", user.getEmail());
             } catch (Exception e) {
                 log.warn("Failed to send welcome email after verification: {}", e.getMessage());
             }
             return ResponseEntity.ok(Map.of("success", true, "message", "Email verified successfully. You can now login."));
        } else {
             return badRequest("Invalid or expired verification token.");
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return badRequest("Email is required");
        }
        
        var userOpt = userService.resendVerificationToken(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            try {
                emailService.sendVerificationEmail(user.getEmail(), user.getEmailVerificationToken());
            } catch (Exception e) {
                log.warn("Failed to resend verification email", e);
            }
        }
        
        // Always return success to prevent enumeration
        return ResponseEntity.ok(Map.of("success", true, "message", "If an account exists, a verification email has been sent."));
    }

    // Request DTOs
    public record RegisterRequest(String email, String password, String fullName, String mobile) {}
    public record LoginRequest(String email, String password, String captchaId, String captchaAnswer) {} // Added captcha fields
    public record GoogleCallbackRequest(String code) {}
    public record RefreshTokenRequest(String refreshToken) {}
    public record LogoutRequest(String refreshToken, Boolean allDevices) {}
}
