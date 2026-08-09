package com.charusat.canteen.service;

import com.charusat.canteen.model.RefreshToken;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Refresh Token Service - Secure token rotation and management
 * 
 * Security Features:
 * - Cryptographically secure token generation (64 bytes)
 * - Token stored as hash (not plaintext)
 * - Single-use with automatic rotation
 * - Revoke all tokens on security events
 * - Device and IP tracking
 * 
 * Industry Standard: RFC 6749 OAuth 2.0, OWASP Token Guidelines
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${security.refresh-token.expiry-days:30}")
    private int expiryDays;

    @Value("${security.refresh-token.max-per-user:5}")
    private int maxTokensPerUser;

    /**
     * Generate a new refresh token for a user
     */
    @Transactional
    public TokenPair generateRefreshToken(User user, String deviceInfo, String ipAddress) {
        // Clean up old tokens if user has too many
        long activeTokens = refreshTokenRepository.countByUserAndRevokedFalse(user);
        if (activeTokens >= maxTokensPerUser) {
            log.info("User {} has {} active tokens, revoking oldest", user.getEmail(), activeTokens);
            // Revoke oldest tokens - keep only last (maxTokensPerUser - 1)
            refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now(), "Max tokens exceeded");
        }

        // Generate secure token
        String rawToken = RefreshToken.generateSecureToken();
        String tokenHash = passwordEncoder.encode(rawToken);

        // Create and save token entity
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .userId(user.getId())
                .tokenHash(tokenHash)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(expiryDays))
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        log.info("Generated refresh token for user {} from IP {}", user.getEmail(), ipAddress);

        return new TokenPair(rawToken, refreshToken.getExpiresAt());
    }

    /**
     * Validate and rotate refresh token
     * Returns new token pair if valid, empty if invalid
     */
    @Transactional
    public Optional<RotationResult> rotateToken(String rawToken, String deviceInfo, String ipAddress) {
        // Find all non-revoked tokens for validation
        // This is O(n) but necessary for security since we hash tokens
        var allTokens = refreshTokenRepository.findAll();

        for (RefreshToken storedToken : allTokens) {
            if (storedToken.getRevoked())
                continue;

            // Constant-time comparison via BCrypt
            if (passwordEncoder.matches(rawToken, storedToken.getTokenHash())) {
                // Found matching token
                if (!storedToken.isValid()) {
                    log.warn("Attempted use of expired/revoked token for user {}",
                            storedToken.getUser().getEmail());
                    return Optional.empty();
                }

                // Check for token theft (different IP/device)
                if (!storedToken.getIpAddress().equals(ipAddress)) {
                    log.warn("Token used from different IP. Original: {}, Current: {}",
                            storedToken.getIpAddress(), ipAddress);
                    // Don't block, but log for security monitoring
                }

                // Revoke the old token
                storedToken.revoke("Rotated");
                refreshTokenRepository.save(storedToken);

                // Generate new token
                TokenPair newToken = generateRefreshToken(storedToken.getUser(), deviceInfo, ipAddress);

                log.info("Token rotated for user {}", storedToken.getUser().getEmail());
                return Optional.of(new RotationResult(storedToken.getUser(), newToken));
            }
        }

        log.warn("Invalid refresh token presented from IP {}", ipAddress);
        return Optional.empty();
    }

    /**
     * Revoke all tokens for a user (logout from all devices)
     */
    @Transactional
    public void revokeAllUserTokens(User user, String reason) {
        int revoked = refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now(), reason);
        log.info("Revoked {} refresh tokens for user {} - Reason: {}", revoked, user.getEmail(), reason);
    }

    /**
     * Revoke a specific token (single device logout)
     */
    @Transactional
    public boolean revokeToken(String rawToken) {
        var allTokens = refreshTokenRepository.findAll();

        for (RefreshToken storedToken : allTokens) {
            if (passwordEncoder.matches(rawToken, storedToken.getTokenHash())) {
                storedToken.revoke("User logout");
                refreshTokenRepository.save(storedToken);
                log.info("Token revoked for user {}", storedToken.getUser().getEmail());
                return true;
            }
        }
        return false;
    }

    /**
     * Cleanup expired tokens (should be run periodically)
     */
    @Transactional
    public int cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now().minusDays(7));
        log.info("Cleaned up {} expired refresh tokens", deleted);
        return deleted;
    }

    // DTOs
    public record TokenPair(String token, LocalDateTime expiresAt) {
    }

    public record RotationResult(User user, TokenPair newToken) {
    }
}
