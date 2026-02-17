package com.charusat.canteen.service;

import com.charusat.canteen.model.LoginAttempt;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.LoginAttemptRepository;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Account Lockout Service - Prevents brute force attacks
 * 
 * Security Algorithm:
 * - Progressive lockout: 5 failures = 5min, 10 = 15min, 15+ = 1hr
 * - Lockout resets after successful login
 * - Both user-based and IP-based tracking
 * 
 * Industry Standard: OWASP A07:2021 - Identification and Authentication Failures
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccountLockoutService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserRepository userRepository;
    
    @Value("${security.lockout.max-attempts:5}")
    private int maxAttempts;
    
    @Value("${security.lockout.window-minutes:15}")
    private int windowMinutes;
    
    @Value("${security.lockout.duration-minutes:5}")
    private int baseLockoutMinutes;
    
    @Value("${security.rate-limit.ip-max-attempts:20}")
    private int ipMaxAttempts;
    
    /**
     * Check if account is locked
     */
    public LockoutStatus checkLockout(String email, String ipAddress) {
        // Check IP-based rate limiting first
        long ipFailures = loginAttemptRepository.countFailedAttemptsFromIpSince(
                ipAddress, LocalDateTime.now().minusMinutes(windowMinutes));
        
        if (ipFailures >= ipMaxAttempts) {
            log.warn("IP {} blocked due to excessive failed attempts: {}", ipAddress, ipFailures);
            return LockoutStatus.ipBlocked(calculateLockoutMinutes((int) ipFailures));
        }
        
        // Check user-based lockout
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Check if currently in lockout period
            if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
                long minutesRemaining = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
                log.warn("Account {} is locked for {} more minutes", email, minutesRemaining);
                return LockoutStatus.locked((int) minutesRemaining + 1);
            }
        }
        
        // Count recent failures
        long recentFailures = loginAttemptRepository.countFailedAttemptsSince(
                email, LocalDateTime.now().minusMinutes(windowMinutes));
        
        if (recentFailures >= maxAttempts) {
            int lockoutMinutes = calculateLockoutMinutes((int) recentFailures);
            log.warn("Account {} reached {} failed attempts, locking for {} minutes", 
                    email, recentFailures, lockoutMinutes);
            
            // Set lockout on user record
            userOpt.ifPresent(user -> {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
                userRepository.save(user);
            });
            
            return LockoutStatus.locked(lockoutMinutes);
        }
        
        // Check if CAPTCHA should be required (after 3 failures)
        boolean requireCaptcha = recentFailures >= 3;
        
        return LockoutStatus.unlocked((int) recentFailures, requireCaptcha);
    }
    
    /**
     * Record a failed login attempt
     */
    @Transactional
    public void recordFailedAttempt(String email, String ipAddress, String userAgent, String reason) {
        LoginAttempt attempt = LoginAttempt.failed(email, ipAddress, userAgent, reason);
        loginAttemptRepository.save(attempt);
        
        log.info("Failed login attempt recorded for {} from IP {}", email, ipAddress);
    }
    
    /**
     * Record a successful login and reset lockout
     */
    @Transactional
    public void recordSuccessfulLogin(String email, String ipAddress, String userAgent) {
        LoginAttempt attempt = LoginAttempt.success(email, ipAddress, userAgent);
        loginAttemptRepository.save(attempt);
        
        // Reset lockout on successful login
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            user.setLockedUntil(null);
            userRepository.save(user);
        });
        
        log.info("Successful login recorded for {} from IP {}", email, ipAddress);
    }
    
    /**
     * Calculate lockout duration based on failure count (progressive lockout)
     */
    private int calculateLockoutMinutes(int failureCount) {
        if (failureCount >= 15) {
            return 60; // 1 hour after 15+ failures
        } else if (failureCount >= 10) {
            return 15; // 15 minutes after 10+ failures
        } else {
            return baseLockoutMinutes; // Base lockout (5 minutes)
        }
    }
    
    /**
     * Lockout status result
     */
    public record LockoutStatus(
            boolean isLocked,
            boolean isIpBlocked,
            int remainingMinutes,
            int failedAttempts,
            boolean requireCaptcha,
            String message
    ) {
        public static LockoutStatus unlocked(int failedAttempts, boolean requireCaptcha) {
            return new LockoutStatus(false, false, 0, failedAttempts, requireCaptcha, null);
        }
        
        public static LockoutStatus locked(int minutes) {
            return new LockoutStatus(true, false, minutes, 0, true, 
                    "Account temporarily locked. Try again in " + minutes + " minutes.");
        }
        
        public static LockoutStatus ipBlocked(int minutes) {
            return new LockoutStatus(true, true, minutes, 0, true,
                    "Too many requests from this IP. Try again in " + minutes + " minutes.");
        }
    }
}
