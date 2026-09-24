package com.charusat.canteen.service;

import com.charusat.canteen.config.ImageKitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * ImageKitService
 *
 * Provides media CDN url synthesis and client upload authentication tokens
 * compliant with ImageKit REST authentication protocols.
 *
 * @validates  Ensures valid HMAC-SHA1 signature generation using private key.
 * @edge-cases Returns unauthenticated fallback if private key is not configured.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageKitService {

    private static final String HMAC_SHA1 = "HmacSHA1";
    private static final long TOKEN_VALIDITY_SECONDS = 1800; // 30 minutes

    private final ImageKitConfig imageKitConfig;

    /**
     * Generates authentication parameters for secure client-side direct uploads.
     * The client passes token, expire, and signature to ImageKit SDK without exposing
     * the private key.
     *
     * @return Map<String, Object> containing token, expire (epoch seconds), and signature.
     */
    public Map<String, Object> generateUploadAuth() {
        if (!imageKitConfig.isUploadConfigured()) {
            log.warn("ImageKit private key is not configured; upload signature cannot be signed");
            return Map.of(
                    "token", "",
                    "expire", 0,
                    "signature", "",
                    "publicKey", imageKitConfig.getPublicKey(),
                    "urlEndpoint", imageKitConfig.getUrlEndpoint()
            );
        }

        String token = UUID.randomUUID().toString();
        long expire = Instant.now().getEpochSecond() + TOKEN_VALIDITY_SECONDS;
        String dataToSign = token + expire;

        try {
            Mac mac = Mac.getInstance(HMAC_SHA1);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    imageKitConfig.getPrivateKey().getBytes(StandardCharsets.UTF_8),
                    HMAC_SHA1
            );
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8));
            String signature = HexFormat.of().formatHex(rawHmac);

            return Map.of(
                    "token", token,
                    "expire", expire,
                    "signature", signature,
                    "publicKey", imageKitConfig.getPublicKey(),
                    "urlEndpoint", imageKitConfig.getUrlEndpoint()
            );
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            log.error("Failed to generate ImageKit HMAC-SHA1 upload signature: {}", ex.getMessage());
            throw new IllegalStateException("Crypto error during upload auth generation", ex);
        }
    }

    /**
     * Builds an optimized delivery URL with standard thumbnail transformations.
     *
     * @param imagePath Relative image path (e.g. "menu-items/item1.jpg") or absolute URL.
     * @param width     Desired width in pixels.
     * @param height    Desired height in pixels.
     * @return Transformed CDN URL with auto WebP/AVIF format and perceptual quality.
     */
    public String buildTransformedUrl(String imagePath, int width, int height) {
        if (imagePath == null || imagePath.isBlank()) {
            return "";
        }

        String endpoint = imageKitConfig.getUrlEndpoint();
        if (!endpoint.endsWith("/")) {
            endpoint += "/";
        }

        String cleanPath = imagePath.startsWith("/") ? imagePath.substring(1) : imagePath;
        String transformParams = String.format("?tr=w-%d,h-%d,fo-auto,q-80,f-auto", width, height);

        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath + (imagePath.contains("?") ? "&" : "?") + String.format("tr=w-%d,h-%d,fo-auto,q-80,f-auto", width, height);
        }

        return endpoint + cleanPath + transformParams;
    }
}
