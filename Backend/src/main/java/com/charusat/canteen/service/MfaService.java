package com.charusat.canteen.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

/**
 * MFA Service — RFC 6238 TOTP implementation.
 *
 * Features:
 * - Secret generation (160-bit random, Base32-encoded)
 * - QR code URI generation for authenticator apps
 * - TOTP code validation with configurable time drift tolerance
 *
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
@Service
@Slf4j
public class MfaService {

    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final int SECRET_SIZE = 20; // 160 bits

    @Value("${security.mfa.issuer:CharusatNeeds}")
    private String issuer;

    @Value("${security.mfa.code-length:6}")
    private int codeLength;

    @Value("${security.mfa.time-period:30}")
    private int timePeriod;

    @Value("${security.mfa.allowed-time-drift:1}")
    private int allowedTimeDrift;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Base32 base32 = new Base32();

    /**
     * Generate a new Base32-encoded TOTP secret.
     */
    public String generateSecret() {
        byte[] bytes = new byte[SECRET_SIZE];
        secureRandom.nextBytes(bytes);
        return base32.encodeAsString(bytes).replaceAll("=", "");
    }

    /**
     * Generate the otpauth:// URI for QR code scanning.
     * Format:
     * otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
     */
    public String generateQrCodeUri(String email, String secret) {
        try {
            String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
            String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
            return String.format(
                    "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                    encodedIssuer, encodedEmail, secret, encodedIssuer, codeLength, timePeriod);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR URI", e);
        }
    }

    /**
     * Validate a TOTP code against the secret.
     * Allows time drift of ±allowedTimeDrift periods (default: ±1 = 90 second
     * window).
     */
    public boolean validateCode(String secret, String code) {
        if (secret == null || code == null || code.length() != codeLength) {
            return false;
        }

        try {
            long currentTime = System.currentTimeMillis() / 1000;
            long timeStep = currentTime / timePeriod;

            for (int i = -allowedTimeDrift; i <= allowedTimeDrift; i++) {
                String expectedCode = generateTotpCode(secret, timeStep + i);
                if (expectedCode.equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("TOTP validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generate the current TOTP code for a given secret (for testing/debugging).
     */
    public String getCurrentCode(String secret) {
        long timeStep = (System.currentTimeMillis() / 1000) / timePeriod;
        return generateTotpCode(secret, timeStep);
    }

    /**
     * RFC 6238 TOTP code generation.
     */
    private String generateTotpCode(String base32Secret, long timeStep) {
        try {
            byte[] key = base32.decode(base32Secret.toUpperCase());
            byte[] data = ByteBuffer.allocate(8).putLong(timeStep).array();

            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
            byte[] hash = mac.doFinal(data);

            // Dynamic truncation (RFC 4226, Section 5.4)
            int offset = hash[hash.length - 1] & 0xF;
            int truncatedHash = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = truncatedHash % (int) Math.pow(10, codeLength);
            return String.format("%0" + codeLength + "d", otp);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }
}
