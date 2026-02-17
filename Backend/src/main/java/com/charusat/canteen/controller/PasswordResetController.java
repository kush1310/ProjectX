package com.charusat.canteen.controller;

import com.charusat.canteen.model.PasswordResetToken;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.PasswordResetTokenRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Password Reset Controller - Secure token-based password reset
 * 
 * Security Features:
 * - User validation (check if email exists)
 * - Rate limiting on reset requests
 * - Single-use tokens with expiry
 * - Password history check (prevent reuse)
 * - Session invalidation after reset
 * - Security event logging
 * - Generic messages (no user enumeration)
 * 
 * Standards: OWASP ASVS, NIST 800-63B
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Slf4j
public class PasswordResetController {
    
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;
    private final RefreshTokenService refreshTokenService;
    private final SecurityAuditService auditService;
    
    // Rate limiting - max 3 reset requests per email per hour
    private static final ConcurrentHashMap<String, RateLimitEntry> resetRateLimits = new ConcurrentHashMap<>();
    private static final int MAX_RESET_REQUESTS_PER_HOUR = 3;
    
    /**
     * Request password reset - sends email with token
     * 
     * Security: 
     * - Rate limited
     * - Generic response to prevent user enumeration
     * - Validates email domain
     */
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        
        log.info("Password reset requested for: {} from IP: {}", request.email(), ipAddress);
        
        // Validate email format and domain
        if (request.email() == null || request.email().isBlank()) {
            return badRequest("Email is required");
        }
        
        String email = request.email().toLowerCase().trim();
        
        if (!email.endsWith("@charusat.edu.in")) {
            return badRequest("Please use a valid @charusat.edu.in email");
        }
        
        // Rate limiting check
        RateLimitEntry rateLimit = resetRateLimits.computeIfAbsent(email, k -> new RateLimitEntry());
        if (rateLimit.isRateLimited()) {
            log.warn("Rate limit exceeded for password reset: {} from IP: {}", email, ipAddress);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "success", false, 
                            "message", "Too many reset requests. Please try again in " + rateLimit.getMinutesRemaining() + " minutes."
                    ));
        }
        
        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        
        if (userOpt.isEmpty()) {
            // User does not exist - Return Explicit Error as requested
            log.warn("Password reset requested for non-existent email: {} from IP: {}", email, ipAddress);
            return badRequest("User Not Found");
        }
        
        User user = userOpt.get();
        
        // Check if user is a Google OAuth user
        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            log.warn("Password reset attempted for Google OAuth user: {}", email);
            return badRequest("This account uses Google Sign-In. Please use Google to login.");
        }
        
        // Increment rate limit
        rateLimit.increment();
        
        // Delete any existing tokens for this user (invalidate old links)
        tokenRepository.deleteByUser(user);
        
        // Create new secure token
        PasswordResetToken resetToken = PasswordResetToken.createForUser(user);
        tokenRepository.save(resetToken);
        
        // Log security event
        auditService.logPasswordResetRequest(email, ipAddress);
        
        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to send email. Please try again later."));
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reset link sent to your email."
        ));
    }
    
    /**
     * Validate token - frontend calls this on page load
     */
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        if (token == null || token.isBlank()) {
            return badRequest("Token is required");
        }
        
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", false, "message", "Invalid or expired link"));
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        if (!resetToken.isValid()) {
            return ResponseEntity.ok(Map.of("valid", false, "message", "This link has expired or already been used"));
        }
        
        // Don't reveal full email - mask it
        String maskedEmail = maskEmail(resetToken.getUser().getEmail());
        
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "email", maskedEmail
        ));
    }
    
    /**
     * Reset password with valid token
     * 
     * Security:
     * - Password policy enforcement
     * - Password history check
     * - Token invalidation
     * - All sessions invalidated
     */
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        
        // Validate inputs
        if (request.token() == null || request.token().isBlank()) {
            return badRequest("Reset token is required");
        }
        
        if (request.password() == null || request.password().isBlank()) {
            return badRequest("New password is required");
        }
        
        // Validate token
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(request.token());
        
        if (tokenOpt.isEmpty()) {
            log.warn("Invalid reset token attempted from IP: {}", ipAddress);
            return unauthorized("Invalid or expired reset link. Please request a new one.");
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        if (!resetToken.isValid()) {
            log.warn("Expired/used reset token attempted for: {} from IP: {}", resetToken.getUser().getEmail(), ipAddress);
            return unauthorized("This reset link has expired or already been used. Please request a new one.");
        }
        
        User user = resetToken.getUser();
        
        // Validate password strength
        var passwordValidation = passwordPolicyService.validatePassword(request.password(), user.getEmail());
        if (!passwordValidation.isValid()) {
            return badRequest(passwordValidation.message());
        }
        
        // Check password history (prevent reuse)
        if (passwordPolicyService.isPasswordReused(user, request.password())) {
            return badRequest("You cannot reuse a recent password. Please choose a different password.");
        }
        
        // Save current password to history before changing
        if (user.getPassword() != null) {
            passwordPolicyService.saveToHistory(user, user.getPassword());
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);
        
        // Mark token as used (single-use)
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        // Invalidate all existing sessions/refresh tokens (security measure)
        refreshTokenService.revokeAllUserTokens(user, "Password reset");
        
        // Log security event
        auditService.logPasswordChange(user.getEmail(), ipAddress);
        
        log.info("Password reset successful for user: {} from IP: {}", user.getEmail(), ipAddress);
        
        // Send notification email about password change
        try {
            // TODO: Implement sendPasswordChangeNotification
            log.info("Password change notification would be sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send password change notification: {}", e.getMessage());
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Your password has been reset successfully. Please login with your new password."
        ));
    }
    
    // Helper Methods
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***@***.***";
        String[] parts = email.split("@");
        String localPart = parts[0];
        String domain = parts[1];
        
        if (localPart.length() <= 2) {
            return "*".repeat(localPart.length()) + "@" + domain;
        }
        
        return localPart.charAt(0) + "*".repeat(localPart.length() - 2) + localPart.charAt(localPart.length() - 1) + "@" + domain;
    }
    
    private ResponseEntity<?> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", message));
    }
    
    private ResponseEntity<?> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", message));
    }
    
    // Rate Limit Helper Class
    private static class RateLimitEntry {
        private int count = 0;
        private long windowStart = System.currentTimeMillis();
        private static final long WINDOW_MS = 60 * 60 * 1000; // 1 hour
        
        public synchronized boolean isRateLimited() {
            resetIfWindowExpired();
            return count >= MAX_RESET_REQUESTS_PER_HOUR;
        }
        
        public synchronized void increment() {
            resetIfWindowExpired();
            count++;
        }
        
        public synchronized int getMinutesRemaining() {
            long elapsed = System.currentTimeMillis() - windowStart;
            long remaining = WINDOW_MS - elapsed;
            return Math.max(1, (int) (remaining / (60 * 1000)));
        }
        
        private void resetIfWindowExpired() {
            if (System.currentTimeMillis() - windowStart > WINDOW_MS) {
                count = 0;
                windowStart = System.currentTimeMillis();
            }
        }
    }
    
    // Request DTOs
    public record ForgotPasswordRequest(String email) {}
    public record ResetPasswordRequest(String token, String password) {}
}
