package com.charusat.canteen.controller;

import com.charusat.canteen.model.LoginAttempt;
import com.charusat.canteen.model.User;
import com.charusat.canteen.service.*;
import com.charusat.canteen.util.FieldEncryptor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

/**
 * Auth Controller - Handles authentication endpoints with industry-standard
 * security
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
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
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
    private final MfaService mfaService;
    private final FieldEncryptor fieldEncryptor;

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
                    request.mobile() != null ? request.mobile().trim() : null);

            // Generate verification token
            String verificationToken = userService.generateEmailVerificationToken(user);

            // Send verification email (async)
            try {
                emailService.sendVerificationEmail(user.getEmail(), verificationToken);
            } catch (Exception e) {
                log.warn("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
                // Don't fail registration, user can resend
            }

            // Log registration security event
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    email, ipAddress, httpRequest.getHeader("User-Agent"),
                    com.charusat.canteen.model.LoginAttempt.AttemptType.LOGIN,
                    true, "New user registration", false));

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
                                "requireCaptcha", true));
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
                                    "requireCaptcha", true));
                }

                if (!captchaService.validateCaptcha(request.captchaId(), request.captchaAnswer())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of(
                                    "success", false,
                                    "message", "Invalid security code",
                                    "requireCaptcha", true));
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
                    lockoutService.recordFailedAttempt(email, ipAddress, userAgent,
                            "Google OAuth user attempted password login");
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

                // ── MFA Check ──
                // If MFA is enabled, don't issue tokens yet — require TOTP verification first
                if (Boolean.TRUE.equals(user.getMfaEnabled())) {
                    String mfaCode = request.mfaCode != null ? request.mfaCode : null;

                    if (mfaCode == null || mfaCode.isEmpty()) {
                        // Password verified, but MFA required — return challenge
                        lockoutService.recordSuccessfulLogin(email, ipAddress, userAgent);
                        return ResponseEntity.ok(Map.of(
                                "mfaRequired", true,
                                "email", email,
                                "message", "MFA verification required. Enter your authenticator code."));
                    }

                    // Decrypt the stored TOTP secret before validating the code.
                    // The secret is AES-256-GCM encrypted in the DB (FieldEncryptor).
                    String decryptedMfaSecret = fieldEncryptor.decrypt(user.getMfaSecret());
                    if (!mfaService.validateCode(decryptedMfaSecret, mfaCode)) {
                        auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                                email, ipAddress, userAgent,
                                LoginAttempt.AttemptType.MFA_EVENT, false,
                                "Invalid MFA code during login", false));
                        return ResponseEntity.status(401).body(Map.of(
                                "success", false,
                                "error", "Invalid MFA code"));
                    }
                }

                // Reset lockout on successful login
                lockoutService.recordSuccessfulLogin(email, ipAddress, userAgent);

                // ── Deletion Recovery ──
                // If user has a pending deletion request, revoke it on login
                if (user.getDeletionRequestedAt() != null) {
                    log.info("Revoking account deletion for user {} — logged in during 5-day buffer", email);
                    user.setDeletionRequestedAt(null);
                    userService.save(user);
                    auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                            email, ipAddress, userAgent,
                            LoginAttempt.AttemptType.LOGIN, true,
                            "Account deletion revoked — user logged in during buffer period", false));
                }

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
            log.error("Login error for {}: {}", request.email(), e.getMessage(), e);
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
                        "expiresAt", newRefreshToken.expiresAt().toString()));
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
    public ResponseEntity<?> logout(@RequestBody(required = false) LogoutRequest request,
            HttpServletRequest httpRequest) {
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
    public ResponseEntity<?> googleCallback(@RequestBody GoogleCallbackRequest request,
            HttpServletRequest httpRequest) {
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

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Google authentication successful");
            response.put("token", result.token());
            response.put("refreshToken", refreshTokenPair.token());
            response.put("expiresAt", refreshTokenPair.expiresAt().toString());
            response.put("user", buildUserResponse(user));

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
        userData.put("mfaEnabled", Boolean.TRUE.equals(user.getMfaEnabled()));
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
        if (input == null)
            return null;
        // Basic XSS prevention - remove HTML tags
        return input.replaceAll("<[^>]*>", "").trim();
    }

    /**
     * Extract ID portion from email
     * e.g., d25ce145@charusat.edu.in -> D25CE145
     */
    private String extractIdFromEmail(String email) {
        if (email == null)
            return "";
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

    /**
     * verifyEmail
     *
     * Validates the email verification token provided via the link in the
     * verification email. On success, marks the user as verified and dispatches
     * a welcome email asynchronously. On failure (token not found or expired),
     * returns a 400 with a generic message to prevent enumeration.
     *
     * @param token {String} - UUID verification token from the email link.
     * @returns     {ResponseEntity} - 200 with success flag; 400 on invalid token.
     * @validates   - Token existence, expiry.
     * @redirects   - None (frontend handles redirect after 200).
     * @edge-cases  - Expired tokens return 400 without modifying any user state.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        log.info("Verify-email attempt with token: {}", token);
        var verifiedUserOpt = userService.verifyEmail(token);
        if (verifiedUserOpt.isPresent()) {
            User verifiedUser = verifiedUserOpt.get();
            log.info("Email verified successfully for user: {}", verifiedUser.getEmail());
            // Fire welcome email asynchronously — does not block the HTTP response
            try {
                emailService.sendWelcomeEmail(verifiedUser.getEmail(), verifiedUser.getFullName());
            } catch (Exception e) {
                log.warn("Failed to send welcome email to {}: {}", verifiedUser.getEmail(), e.getMessage());
            }
            return ResponseEntity
                    .ok(Map.of("success", true, "message", "Email verified successfully. You can now login."));
        } else {
            log.warn("Email verification failed for token: {} — not found or expired", token);
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
        return ResponseEntity
                .ok(Map.of("success", true, "message", "If an account exists, a verification email has been sent."));
    }

    // Request DTOs
    public record RegisterRequest(String email, String password, String fullName, String mobile) {
    }

    public record LoginRequest(String email, String password, String captchaId, String captchaAnswer, String mfaCode) {
    }

    public record GoogleCallbackRequest(String code) {
    }

    public record RefreshTokenRequest(String refreshToken) {
    }

    public record LogoutRequest(String refreshToken, Boolean allDevices) {
    }

    public record DeleteAccountRequest(String password) {
    }

    /**
     * DELETE /api/auth/delete-account
     * Initiates a 5-day account deletion buffer.
     * - Sets deletion_requested_at = now (NOT immediate deactivation)
     * - User can still login during the 5-day buffer to cancel
     * - After 5 days, a scheduled task flags the account (is_active = false)
     * - Orders are preserved for vendor side
     * - Sends deletion email with recovery login link
     */
    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestBody DeleteAccountRequest request, Principal principal,
            HttpServletRequest httpRequest) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication required"));
        }

        String email = principal.getName();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        try {
            // Find user
            var userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return badRequest("Account not found");
            }

            User user = userOpt.get();

            // Google OAuth users can't have password confirmation — allow deletion
            if (user.getAuthProvider() != User.AuthProvider.GOOGLE) {
                // Verify password for non-Google accounts
                if (request.password() == null || request.password().isBlank()) {
                    return badRequest("Password confirmation is required");
                }

                var authResult = authService.authenticate(email, request.password());
                if (authResult.isEmpty()) {
                    auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                            email, ipAddress, userAgent,
                            LoginAttempt.AttemptType.LOGOUT, false,
                            "Failed account deletion — invalid password", false));
                    return badRequest("Incorrect password");
                }
            }

            // Set 5-day deletion buffer — DON'T deactivate yet
            user.setDeletionRequestedAt(java.time.LocalDateTime.now());
            // Keep isActive = true so user can login to recover
            userService.save(user);

            // Log security event
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    email, ipAddress, userAgent,
                    LoginAttempt.AttemptType.LOGOUT, true,
                    "Account deletion requested — 5-day buffer started", false));

            // Send deletion email with recovery login link
            try {
                emailService.sendAccountDeletionEmail(email, user.getFullName());
            } catch (Exception e) {
                log.warn("Failed to send account deletion email: {}", e.getMessage());
            }

            log.info("Account deletion requested for user: {} — 5-day buffer started", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message",
                    "Account deletion scheduled. You have 5 days to recover your account by logging in. A confirmation email has been sent."));

        } catch (Exception e) {
            log.error("Account deletion failed for {}: {}", email, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Account deletion failed. Please try again."));
        }
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        try {
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            authService.changePassword(user.getId(), request.currentPassword(), request.newPassword());
            refreshTokenService.revokeAllUserTokens(user, "Password changed");
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error changing password", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to change password"));
        }
    }
}
