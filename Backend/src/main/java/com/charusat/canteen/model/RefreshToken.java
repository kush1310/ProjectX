package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Refresh Token Entity - Secure refresh token with rotation support
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_LENGTH = 64;

    private Long id;
    private String tokenHash;
    private User user;
    private Long userId; // For JDBC convenience
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private String deviceInfo;
    private String ipAddress;

    @Builder.Default
    private Boolean revoked = false;

    private LocalDateTime revokedAt;
    private String revokedReason;

    public static String generateSecureToken() {
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    public static RefreshToken createForUser(User user, String deviceInfo, String ipAddress, int expiryDays) {
        return RefreshToken.builder()
                .user(user)
                .userId(user.getId())
                .tokenHash(generateSecureToken())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(expiryDays))
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .revoked(false)
                .build();
    }

    public boolean isValid() {
        return !revoked && LocalDateTime.now().isBefore(expiresAt);
    }

    public void revoke(String reason) {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
        this.revokedReason = reason;
    }
}
