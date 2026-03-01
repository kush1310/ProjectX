package com.charusat.canteen.service;

import com.charusat.canteen.model.LoginAttempt;
import com.charusat.canteen.repository.LoginAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Security Audit Service - Logs and monitors security events
 * 
 * Features:
 * - Logs all authentication events
 * - Tracks suspicious activity patterns
 * - Provides audit trail for compliance
 * 
 * Industry Standard: OWASP Logging Cheat Sheet, NIST 800-53
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    
    /**
     * Log a security event
     */
    public void logSecurityEvent(SecurityEvent event) {
        LoginAttempt attempt = LoginAttempt.builder()
                .email(event.email())
                .ipAddress(event.ipAddress())
                .userAgent(event.userAgent())
                .attemptedAt(LocalDateTime.now())
                .successful(event.successful())
                .failureReason(event.details())
                .attemptType(event.type())
                .suspicious(event.suspicious())
                .build();
        
        loginAttemptRepository.save(attempt);
        
        // Log to application logs as well
        if (event.suspicious()) {
            log.warn("SECURITY ALERT - {} for {} from IP {}: {}", 
                    event.type(), event.email(), event.ipAddress(), event.details());
        } else {
            log.info("Security event - {} for {} from IP {}", 
                    event.type(), event.email(), event.ipAddress());
        }
    }
    
    /**
     * Log successful login
     */
    public void logSuccessfulLogin(String email, String ipAddress, String userAgent) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, userAgent, 
                LoginAttempt.AttemptType.LOGIN, 
                true, null, false
        ));
    }
    
    /**
     * Log failed login
     */
    public void logFailedLogin(String email, String ipAddress, String userAgent, String reason) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, userAgent,
                LoginAttempt.AttemptType.LOGIN,
                false, reason, false
        ));
    }
    
    /**
     * Log password reset request
     */
    public void logPasswordResetRequest(String email, String ipAddress) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, null,
                LoginAttempt.AttemptType.PASSWORD_RESET,
                true, "Password reset requested", false
        ));
    }
    
    /**
     * Log password change
     */
    public void logPasswordChange(String email, String ipAddress) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, null,
                LoginAttempt.AttemptType.PASSWORD_RESET,
                true, "Password changed successfully", false
        ));
    }
    
    /**
     * Log logout event
     */
    public void logLogout(String email, String ipAddress, boolean allDevices) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, null,
                LoginAttempt.AttemptType.LOGOUT,
                true, allDevices ? "Logged out from all devices" : "Logged out", false
        ));
    }
    
    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String email, String ipAddress, String details) {
        logSecurityEvent(new SecurityEvent(
                email, ipAddress, null,
                LoginAttempt.AttemptType.LOGIN,
                false, details, true
        ));
    }
    
    // DTO for security events
    public record SecurityEvent(
            String email,
            String ipAddress,
            String userAgent,
            LoginAttempt.AttemptType type,
            boolean successful,
            String details,
            boolean suspicious
    ) {}
}
