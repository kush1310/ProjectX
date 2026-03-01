package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Login Attempt Entity - Tracks authentication attempts for security monitoring
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {

    private Long id;
    private String email;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime attemptedAt;

    @Builder.Default
    private Boolean successful = false;

    private String failureReason;

    @Builder.Default
    private AttemptType attemptType = AttemptType.LOGIN;

    private String countryCode;
    private Boolean suspicious;

    public enum AttemptType {
        LOGIN,
        REGISTRATION,
        PASSWORD_RESET,
        TOKEN_REFRESH,
        LOGOUT
    }

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
