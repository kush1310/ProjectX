package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Refresh Token Entity - Secure refresh token with rotation support
 * 
 * Security Features:
 * - Tokens stored as secure hashes
 * - Single-use with rotation
 * - Automatic expiry
 * - Device/IP tracking for anomaly detection
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_token_hash", columnList = "tokenHash"),
    @Index(name = "idx_refresh_token_user", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {
    
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_LENGTH = 64;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String tokenHash;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private String deviceInfo;
    
    @Column
    private String ipAddress;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;
    
    @Column
    private LocalDateTime revokedAt;
    
    @Column
    private String revokedReason;
    
    /**
     * Generate a cryptographically secure random token
     */
    public static String generateSecureToken() {
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }
    
    /**
     * Create a new refresh token for a user
     */
    public static RefreshToken createForUser(User user, String deviceInfo, String ipAddress, int expiryDays) {
        return RefreshToken.builder()
                .user(user)
                .tokenHash(generateSecureToken()) // Will be hashed before storage
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(expiryDays))
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .revoked(false)
                .build();
    }
    
    /**
     * Check if token is valid (not expired or revoked)
     */
    public boolean isValid() {
        return !revoked && LocalDateTime.now().isBefore(expiresAt);
    }
    
    /**
     * Revoke this token
     */
    public void revoke(String reason) {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
        this.revokedReason = reason;
    }
}
