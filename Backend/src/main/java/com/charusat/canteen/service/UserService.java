package com.charusat.canteen.service;

import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Service - Business logic for user management
 */
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    @Transactional
    public User register(String email, String password, String fullName, String mobile) {
        if (existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .mobile(mobile)
                .role(User.UserRole.USER)
                .authProvider(User.AuthProvider.LOCAL) // Email/password registration
                .build();
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User createAdmin(String email, String password, String fullName, String mobile) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .mobile(mobile)
                .role(User.UserRole.ADMIN)
                .build();
        
        return userRepository.save(user);
    }
    
    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    @Transactional
    public User updateUser(Long id, String fullName, String mobile) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFullName(fullName);
        user.setMobile(mobile);
        return userRepository.save(user);
    }
    
    public boolean validatePassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    @Transactional
    public String generateEmailVerificationToken(User user) {
        String token = java.util.UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        user.setEmailVerificationExpiry(LocalDateTime.now().plusHours(24));
        user.setIsEmailVerified(false);
        userRepository.save(user);
        return token;
    }

    /**
     * verifyEmail
     *
     * Validates the email verification token. If valid and unexpired, marks the
     * user's email as verified, clears the token and expiry, and returns the
     * verified User so the caller can trigger post-verification actions (e.g.,
     * welcome email). Returns empty Optional if the token is not found or expired.
     *
     * @param token {String} - UUID verification token from the email link.
     * @returns     {Optional<User>} - Verified user on success; empty on failure.
     * @validates   - Token existence, expiry timestamp.
     * @edge-cases  - Expired tokens return empty without updating the user record.
     */
    @Transactional
    public Optional<User> verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        User user = userOpt.get();
        if (user.getEmailVerificationExpiry().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }
        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);
        return Optional.of(user);
    }

    @Transactional
    public java.util.Optional<User> resendVerificationToken(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getIsEmailVerified()) {
                return Optional.empty(); // Already verified
            }
            generateEmailVerificationToken(user);
            return Optional.of(user);
        }
        return Optional.empty();
    }

    /**
     * findVendorByCanteenId
     *
     * Resolves the vendor (canteen owner) User for a given canteen ID.
     * Used by ComplaintService to email the vendor on new complaints.
     *
     * @param canteenId {Long} - Target canteen whose owner should be resolved.
     * @returns {Optional<User>} — Present if the canteen exists and has an owner record.
     */
    public Optional<User> findVendorByCanteenId(Long canteenId) {
        if (canteenId == null) return Optional.empty();
        try {
            return userRepository.findByCanteenId(canteenId);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
