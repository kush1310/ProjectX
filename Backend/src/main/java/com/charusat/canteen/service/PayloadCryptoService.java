package com.charusat.canteen.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Payload Crypto Service — AES-256-GCM encryption for API request/response
 * bodies.
 *
 * Defense-in-depth: Even if Burp Suite intercepts HTTPS (via its CA cert),
 * the JSON body is encrypted at the application layer.
 *
 * Protocol:
 * - Request comes as: { "enc": "<Base64(IV + AES-GCM ciphertext)>" }
 * - Response goes as: { "enc": "<Base64(IV + AES-GCM ciphertext)>" }
 * - Both sides use the same shared key derived from server config
 */
@Service
@Slf4j
public class PayloadCryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKeySpec payloadKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PayloadCryptoService(@Value("${security.payload.encryption.key:CharusatNeedsPayloadKey2026!!}") String key) {
        byte[] keyBytes = deriveKey(key);
        this.payloadKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Encrypt plaintext JSON → Base64(IV + ciphertext)
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty())
            return plaintext;

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, payloadKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            log.error("Payload encryption failed: {}", e.getMessage());
            throw new RuntimeException("Payload encryption failed", e);
        }
    }

    /**
     * Decrypt Base64(IV + ciphertext) → plaintext JSON
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null || encryptedBase64.isEmpty())
            return encryptedBase64;

        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedBase64);

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, payloadKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Payload decryption failed: {}", e.getMessage());
            throw new RuntimeException("Payload decryption failed", e);
        }
    }

    /**
     * Derive a 32-byte key from the config string using HMAC-SHA256.
     */
    private byte[] deriveKey(String input) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec("CharusatNeedsKDF".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return hmac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            // Fallback: pad/truncate to 32 bytes
            byte[] keyBytes = new byte[32];
            byte[] provided = input.getBytes(StandardCharsets.UTF_8);
            System.arraycopy(provided, 0, keyBytes, 0, Math.min(provided.length, 32));
            return keyBytes;
        }
    }
}
