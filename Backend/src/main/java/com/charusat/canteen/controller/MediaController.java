package com.charusat.canteen.controller;

import com.charusat.canteen.config.ImageKitConfig;
import com.charusat.canteen.service.ImageKitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * MediaController
 *
 * Exposes public endpoints for media storage configuration and direct client
 * upload authorization parameters for ImageKit CDN integration.
 *
 * @validates  Public access allowed under /api/public/** security rule.
 * @edge-cases Returns minimal parameters if private key is not configured.
 */
@RestController
@RequestMapping("/api/public/media")
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final ImageKitConfig imageKitConfig;
    private final ImageKitService imageKitService;

    /**
     * Retrieves public CDN configuration details for client-side rendering.
     *
     * @return 200 OK with public key, url endpoint, and provider name.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getMediaConfig() {
        return ResponseEntity.ok(Map.of(
                "provider", imageKitConfig.getStorageProvider(),
                "publicKey", imageKitConfig.getPublicKey(),
                "urlEndpoint", imageKitConfig.getUrlEndpoint()
        ));
    }

    /**
     * Generates HMAC-SHA1 client upload authentication tokens.
     *
     * @return 200 OK with token, expire, and signature for client upload.
     */
    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> getUploadAuth() {
        return ResponseEntity.ok(imageKitService.generateUploadAuth());
    }
}
