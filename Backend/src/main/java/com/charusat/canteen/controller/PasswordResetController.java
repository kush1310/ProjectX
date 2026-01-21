package com.charusat.canteen.controller;

import com.charusat.canteen.model.PasswordResetToken;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.PasswordResetTokenRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Password Reset Controller - Secure token-based password reset
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
    
    /**
     * Request password reset - sends email with token
     */
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        log.info("Password reset requested for: {}", request.email());
        
        // Validate email format
        if (request.email() == null || !request.email().toLowerCase().endsWith("@charusat.edu.in")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Please use a valid @charusat.edu.in email"));
        }
        
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.email());
        
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists - always return success for security
            log.warn("Password reset requested for non-existent email: {}", request.email());
            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "If an account exists with this email, you will receive a reset link."
            ));
        }
        
        User user = userOpt.get();
        
        // Delete any existing tokens for this user
        tokenRepository.deleteByUser(user);
        
        // Create new token
        PasswordResetToken resetToken = PasswordResetToken.createForUser(user);
        tokenRepository.save(resetToken);
        
        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
        } catch (Exception e) {
            log.error("Failed to send reset email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to send email. Please try again."));
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password reset link sent to your email"
        ));
    }
    
    /**
     * Validate token - frontend calls this on page load
     */
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Token is required"));
        }
        
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", false, "message", "Invalid token"));
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        if (!resetToken.isValid()) {
            return ResponseEntity.ok(Map.of("valid", false, "message", "Token has expired or already been used"));
        }
        
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "email", resetToken.getUser().getEmail()
        ));
    }
    
    /**
     * Reset password with valid token
     */
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        // Validate inputs
        if (request.token() == null || request.token().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Token is required"));
        }
        
        if (request.password() == null || request.password().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Password must be at least 8 characters"));
        }
        
        if (request.password().length() > 128) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Password is too long"));
        }
        
        // Validate token
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(request.token());
        
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid token"));
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        if (!resetToken.isValid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Token has expired or already been used"));
        }
        
        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        log.info("Password reset successful for user: {}", user.getEmail());
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password has been reset successfully"
        ));
    }
    
    // Request DTOs
    public record ForgotPasswordRequest(String email) {}
    public record ResetPasswordRequest(String token, String password) {}
}
