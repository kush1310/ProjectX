package com.charusat.canteen.config;

import com.charusat.canteen.service.ImageKitFolderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * ImageKitFolderInitializer
 *
 * Automatically verifies and provisions the required CharusatNeeds folder
 * hierarchy in ImageKit CDN upon application bootstrap.
 *
 * @validates  Ensures idempotent creation without crashing application on network failure.
 * @edge-cases Fails open cleanly if ImageKit API is unreachable or private key is missing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImageKitFolderInitializer implements ApplicationRunner {

    private final ImageKitConfig imageKitConfig;
    private final ImageKitFolderService imageKitFolderService;

    @Override
    public void run(ApplicationArguments args) {
        if (!imageKitConfig.isUploadConfigured()) {
            log.info("ImageKit upload credentials not configured; automated folder provisioning skipped.");
            return;
        }

        try {
            log.info("Initiating automated ImageKit media hierarchy check for CDN [{}]...",
                    imageKitConfig.getUrlEndpoint());
            imageKitFolderService.initBaseFolderHierarchy();
        } catch (Exception ex) {
            // Fault-tolerant guarantee: do NOT fail Spring Boot startup on ImageKit outages
            log.warn("ImageKit media folder initialization encountered a non-fatal exception: {}",
                    ex.getMessage());
        }
    }
}
