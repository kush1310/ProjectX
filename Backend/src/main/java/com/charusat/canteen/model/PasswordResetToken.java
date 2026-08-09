package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * PasswordResetToken Entity — Stores hashed reset tokens for password recovery.
 *
 * Security design:
 * - Raw token: 256-bit SecureRandom, Base64url-encoded (high entropy, URL-safe)
 * - Stored token: SHA-256(rawToken) in Base64 — a DB dump exposes only the hash,
 *   not the usable token, defeating offline brute-force and timing attacks.
 * - Raw token is sent to the user via email; only they possess it.
 * - Single-use: marked `used=true` after first successful reset.
 * - Expiry: 15 minutes (NIST 800-63B recommendation).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    private Long id;

    /** SHA-256 hash of the raw token — this is what is stored and queried in the DB. */
    private String token;

    /**
     * The raw (unhashed) token — NOT stored in DB. Only populated after createForUser()
     * so that the caller (PasswordResetController) can include it in the email.
     */
    @Builder.Default
    private transient String rawToken = null;

    private User user;
    private Long userId;
    private LocalDateTime expiresAt;

    @Builder.Default
    private Boolean used = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Factory method — generates a 256-bit SecureRandom token, stores only its SHA-256
     * hash in the entity, and retains the raw token in `rawToken` (transient field)
     * so the caller can dispatch it via email without re-querying.
     *
     * @param user  The user requesting the reset.
     * @return      Populated PasswordResetToken with rawToken set (not persisted).
     */
    public static PasswordResetToken createForUser(User user) {
        // Generate 32 bytes (256 bits) from SecureRandom — 128x stronger than UUID
        byte[] rawBytes = new byte[32];
        new SecureRandom().nextBytes(rawBytes);

        // Base64url encode for URL safety (no +, /, = characters in reset links)
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

        // SHA-256 hash to store in DB — raw token never touches the DB
        String hashedToken = sha256Hex(rawToken);

        return PasswordResetToken.builder()
                .token(hashedToken)
                .rawToken(rawToken)
                .user(user)
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
    }

    /**
     * Compute SHA-256 hash of the provided string and return as hex string.
     * Used by both token creation and token lookup to hash incoming tokens.
     *
     * @param input  The raw reset token from the email link.
     * @return       Lowercase hex SHA-256 digest.
     */
    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexBuilder = new StringBuilder(hashBytes.length * 2);
            for (byte hashByte : hashBytes) {
                hexBuilder.append(String.format("%02x", hashByte));
            }
            return hexBuilder.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            // SHA-256 is mandated by JVM spec — this branch is unreachable
            throw new RuntimeException("SHA-256 algorithm unavailable — JVM is non-compliant", e);
        }
    }

    /**
     * Token is valid if it has not been used and has not expired.
     *
     * @return true if the token can be used to reset a password.
     */
    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiresAt);
    }
}
