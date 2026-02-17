package com.charusat.canteen.service;

import com.charusat.canteen.model.PasswordHistory;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.PasswordHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Password Policy Service - Enforces strong password requirements
 * 
 * Policy (NIST 800-63B compliant):
 * - Minimum 8 characters (NIST recommends)
 * - Maximum 128 characters
 * - At least 1 uppercase, 1 lowercase, 1 digit
 * - Cannot reuse last 5 passwords
 * - Optional: Block common passwords
 * 
 * Industry Standard: NIST 800-63B Digital Identity Guidelines
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordPolicyService {
    
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${security.password.min-length:8}")
    private int minLength;
    
    @Value("${security.password.max-length:128}")
    private int maxLength;
    
    @Value("${security.password.require-uppercase:true}")
    private boolean requireUppercase;
    
    @Value("${security.password.require-lowercase:true}")
    private boolean requireLowercase;
    
    @Value("${security.password.require-digit:true}")
    private boolean requireDigit;
    
    @Value("${security.password.require-special:false}")
    private boolean requireSpecial;
    
    @Value("${security.password.history-count:5}")
    private int historyCount;
    
    // Common weak passwords to block
    private static final List<String> WEAK_PASSWORDS = List.of(
            "password", "123456", "12345678", "qwerty", "abc123",
            "password1", "admin", "letmein", "welcome", "monkey",
            "charusat", "charusat123", "canteen"
    );
    
    /**
     * Validate password strength
     */
    public ValidationResult validatePassword(String password, String email) {
        if (password == null) {
            return ValidationResult.failure("Password is required");
        }
        
        // Length check
        if (password.length() < minLength) {
            return ValidationResult.failure("Password must be at least " + minLength + " characters");
        }
        
        if (password.length() > maxLength) {
            return ValidationResult.failure("Password must be at most " + maxLength + " characters");
        }
        
        // Complexity checks
        if (requireUppercase && !Pattern.compile("[A-Z]").matcher(password).find()) {
            return ValidationResult.failure("Password must contain at least one uppercase letter");
        }
        
        if (requireLowercase && !Pattern.compile("[a-z]").matcher(password).find()) {
            return ValidationResult.failure("Password must contain at least one lowercase letter");
        }
        
        if (requireDigit && !Pattern.compile("[0-9]").matcher(password).find()) {
            return ValidationResult.failure("Password must contain at least one digit");
        }
        
        if (requireSpecial && !Pattern.compile("[!@#$%^&*(),.?\":{}|<>]").matcher(password).find()) {
            return ValidationResult.failure("Password must contain at least one special character");
        }
        
        // Check for weak passwords
        if (WEAK_PASSWORDS.contains(password.toLowerCase())) {
            return ValidationResult.failure("This password is too common. Choose a stronger password.");
        }
        
        // Check if password contains email/username
        if (email != null) {
            String username = email.split("@")[0].toLowerCase();
            if (password.toLowerCase().contains(username)) {
                return ValidationResult.failure("Password cannot contain your username");
            }
        }
        
        return ValidationResult.success();
    }
    
    /**
     * Check if password was recently used
     */
    public boolean isPasswordReused(User user, String newPassword) {
        List<PasswordHistory> history = passwordHistoryRepository.findTop5ByUserOrderByCreatedAtDesc(user);
        
        for (PasswordHistory ph : history) {
            if (passwordEncoder.matches(newPassword, ph.getPasswordHash())) {
                return true;
            }
        }
        
        // Also check current password
        if (user.getPassword() != null && passwordEncoder.matches(newPassword, user.getPassword())) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Save current password to history before changing
     */
    @Transactional
    public void saveToHistory(User user, String currentPasswordHash) {
        PasswordHistory history = PasswordHistory.create(user, currentPasswordHash);
        passwordHistoryRepository.save(history);
        
        // Cleanup old entries
        long count = passwordHistoryRepository.countByUser(user);
        if (count > historyCount) {
            passwordHistoryRepository.deleteOldHistory(user.getId(), historyCount);
        }
        
        log.info("Saved password to history for user {}", user.getEmail());
    }
    
    /**
     * Calculate password strength score (0-100)
     */
    public int calculateStrength(String password) {
        if (password == null || password.isEmpty()) return 0;
        
        int score = 0;
        
        // Length scoring
        score += Math.min(password.length() * 4, 40);
        
        // Complexity scoring
        if (Pattern.compile("[A-Z]").matcher(password).find()) score += 15;
        if (Pattern.compile("[a-z]").matcher(password).find()) score += 15;
        if (Pattern.compile("[0-9]").matcher(password).find()) score += 15;
        if (Pattern.compile("[!@#$%^&*(),.?\":{}|<>]").matcher(password).find()) score += 15;
        
        return Math.min(score, 100);
    }
    
    // DTO for validation result
    public record ValidationResult(boolean isValid, String message) {
        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }
        
        public static ValidationResult failure(String message) {
            return new ValidationResult(false, message);
        }
    }
}
