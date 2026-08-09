package com.charusat.canteen.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM Field Encryptor for sensitive database columns.
 *
 * Usage:
 * String encrypted = encryptor.encrypt("sensitive data");
 * String decrypted = encryptor.decrypt(encrypted);
 *
 * Features:
 * - AES-256-GCM (authenticated encryption)
 * - Random 12-byte IV per encryption (prepended to ciphertext)
 * - Base64 output for DB storage in TEXT/VARCHAR columns
 *
 * Security: OWASP recommendation for encrypting PII at rest.
 */
@Component
@Slf4j
public class FieldEncryptor {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // bits

    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public FieldEncryptor(@Value("${security.encryption.key}") String key) {
        try {
            // Derive exactly 32 bytes via SHA-256(key). Using SHA-256 eliminates the
            // zero-padding vulnerability that occurs when arraycopy is used with keys
            // shorter than 32 bytes. The digest always produces a full-entropy 32-byte key.
            java.security.MessageDigest sha256 = java.security.MessageDigest.getInstance("SHA-256");
            byte[] derivedKey = sha256.digest(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(derivedKey, "AES");
        } catch (java.security.NoSuchAlgorithmException e) {
            // SHA-256 is mandated by the JVM specification — this path is unreachable
            throw new RuntimeException("SHA-256 unavailable — JVM is non-compliant", e);
        }
    }

    /**
     * Encrypt a plaintext string. Returns Base64-encoded ciphertext.
     * Returns null if input is null.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null)
            return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            // Prepend IV to ciphertext: [IV (12 bytes)][ciphertext]
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            log.error("Encryption failed: {}", e.getMessage());
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypt a Base64-encoded ciphertext. Returns plaintext string.
     * Returns null if input is null.
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null)
            return null;
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext);

            // Extract IV from first 12 bytes
            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(encrypted));
        } catch (Exception e) {
            // If decryption fails, the data might be unencrypted (migration case)
            log.warn("Decryption failed, returning raw value (may be unencrypted legacy data)");
            return ciphertext;
        }
    }

    /**
     * Check if a value appears to be encrypted (Base64-encoded with min length).
     */
    public boolean isEncrypted(String value) {
        if (value == null || value.length() < 20)
            return false;
        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            return decoded.length > GCM_IV_LENGTH;
        } catch (Exception e) {
            return false;
        }
    }
}
