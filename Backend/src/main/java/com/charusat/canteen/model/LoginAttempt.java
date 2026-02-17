package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Login Attempt Entity - Tracks authentication attempts for security monitoring
 * 
 * Security Features:
 * - Tracks failed/successful attempts per user and IP
 * - Enables account lockout after threshold
 * - Supports suspicious activity detection
 * - IP-based brute force protection
 */
@Entity
@Table(name = "login_attempts", indexes = {
    @Index(name = "idx_login_attempt_email", columnList = "email"),
    @Index(name = "idx_login_attempt_ip", columnList = "ipAddress"),
    @Index(name = "idx_login_attempt_timestamp", columnList = "attemptedAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String ipAddress;
    
    @Column
    private String userAgent;
    
    @Column(nullable = false)
    private LocalDateTime attemptedAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean successful = false;
    
    @Column
    private String failureReason;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AttemptType attemptType = AttemptType.LOGIN;
    
    @Column
    private String countryCode;
    
    @Column
    private Boolean suspicious;
    
    public enum AttemptType {
        LOGIN,
        REGISTRATION,
        PASSWORD_RESET,
        TOKEN_REFRESH,
        LOGOUT
    }
    
    /**
     * Create a failed login attempt record
     */
    public static LoginAttempt failed(String email, String ipAddress, String userAgent, String reason) {
        return LoginAttempt.builder()
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .attemptedAt(LocalDateTime.now())
                .successful(false)
                .failureReason(reason)
                .attemptType(AttemptType.LOGIN)
                .build();
    }
    
    /**
     * Create a successful login attempt record
     */
    public static LoginAttempt success(String email, String ipAddress, String userAgent) {
        return LoginAttempt.builder()
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .attemptedAt(LocalDateTime.now())
                .successful(true)
                .attemptType(AttemptType.LOGIN)
                .build();
    }
}
