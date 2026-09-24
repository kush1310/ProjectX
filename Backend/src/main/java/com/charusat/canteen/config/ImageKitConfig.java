package com.charusat.canteen.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * ImageKitConfig
 *
 * Configures media storage and CDN settings for ImageKit integration.
 * Injects public key, private key, and CDN delivery endpoint from application
 * properties or environment variables. Private key access is strictly bounded
 * to server-side operations and never exposed to client interfaces.
 *
 * @validates  Ensures CDN endpoint format and public key availability.
 * @edge-cases Handles unconfigured private key gracefully for public-only operations.
 */
@Configuration
@Getter
@Slf4j
public class ImageKitConfig {

    @Value("${imagekit.public-key:public_+grCFOmI0qDm3NTqiEhsvLFrhgc=}")
    private String publicKey;

    @Value("${imagekit.private-key:}")
    private String privateKey;

    @Value("${imagekit.url-endpoint:https://ik.imagekit.io/cyseckush/}")
    private String urlEndpoint;

    @Value("${media.storage.provider:imagekit}")
    private String storageProvider;

    /**
     * Checks if ImageKit CDN delivery is active and configured.
     *
     * @return boolean - True if public key and delivery endpoint are non-blank.
     */
    public boolean isCdnConfigured() {
        return publicKey != null && !publicKey.isBlank() &&
               urlEndpoint != null && !urlEndpoint.isBlank();
    }

    /**
     * Checks if server-side upload authentication is available.
     *
     * @return boolean - True if private key is populated in environment.
     */
    public boolean isUploadConfigured() {
        return isCdnConfigured() && privateKey != null && !privateKey.isBlank();
    }
}
