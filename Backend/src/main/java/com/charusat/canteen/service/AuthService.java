package com.charusat.canteen.service;

import com.charusat.canteen.dto.*;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.exception.BadRequestException;
import com.charusat.canteen.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Authentication Service - Handles user registration, login, and password reset
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int LOCKOUT_DURATION_SECONDS = 44;

    /**
     * Register a new user
     */
    @Transactional
    public AuthResponse.UserDto register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if email exists
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Check if phone exists
        if (userRepository.existsByContactNumber(request.getContactNumber())) {
            throw new BadRequestException("Contact number already registered");
        }

        // Create user
        User user = User.builder()
                .fullName(sanitizeInput(request.getFullName()))
                .email(request.getEmail().toLowerCase().trim())
                .contactNumber(request.getContactNumber().replaceAll("[\\s-]", ""))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.USER)
                .isActive(true)
                .isEmailVerified(false)
                .emailVerificationToken(UUID.randomUUID().toString())
                .emailVerificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), user.getEmailVerificationToken());

        return mapToUserDto(user);
    }

    /**
     * Authenticate user login
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        // Check if account is locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).getSeconds();
            throw new BadRequestException("Account locked. Try again in " + remainingSeconds + " seconds");
        }

        // Reset lockout if expired
        if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(LocalDateTime.now())) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedLogin(user);
            int remaining = MAX_FAILED_ATTEMPTS - user.getFailedLoginAttempts();
            if (remaining > 0) {
                throw new BadRequestException("Invalid email or password. " + remaining + " attempts remaining");
            } else {
                throw new BadRequestException("Too many failed attempts. Account locked for " + LOCKOUT_DURATION_SECONDS + " seconds");
            }
        }

        // Check if account is active
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is deactivated. Contact support.");
        }

        // Clear failed attempts on successful login
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(user);
        long expiresIn = jwtService.getExpirationTime();

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .user(mapToUserDto(user))
                .build();
    }

    /**
     * Send OTP for 2FA
     */
    public void sendOtp(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String otp = generateOtp();
        // In production, store OTP with expiry (e.g., in Redis)
        log.info("OTP generated for {}: {}", email, otp);

        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp);
    }

    /**
     * Request password reset
     */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetToken);
        log.info("Password reset requested for: {}", email);
    }

    /**
     * Reset password with token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        log.info("Password reset completed for: {}", user.getEmail());
    }

    /**
     * Verify email with token
     */
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        user.setIsEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);

        log.info("Email verified for: {}", user.getEmail());
    }

    // ==================== Helper Methods ====================

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusSeconds(LOCKOUT_DURATION_SECONDS));
            log.warn("Account locked for {}: too many failed attempts", user.getEmail());
        }

        userRepository.save(user);
    }

    private String generateOtp() {
        return String.format("%06d", new java.util.Random().nextInt(999999));
    }

    private String sanitizeInput(String input) {
        return input
                .replaceAll("[<>]", "")
                .replaceAll("(?i)javascript:", "")
                .replaceAll("(?i)on\\w+=", "")
                .trim();
    }

    private AuthResponse.UserDto mapToUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .contactNumber(user.getContactNumber())
                .role(user.getRole().name())
                .isEmailVerified(user.getIsEmailVerified())
                .build();
    }
}
