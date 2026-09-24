package com.charusat.canteen.service;

import com.charusat.canteen.config.ImageKitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ImageKitFolderService
 *
 * Automates creation and verification of media directory structures inside ImageKit CDN.
 * Guarantees idempotent operations so existing folders remain intact without duplicate errors.
 * Dynamically provisions vendor-specific subdirectories on demand.
 *
 * @validates  Ensures valid folder naming, path sanitization, and credential availability.
 * @edge-cases Fails open gracefully if ImageKit API is unreachable or network times out.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageKitFolderService {

    private static final String IMAGEKIT_FOLDER_API = "https://api.imagekit.io/v1/folder/";
    private static final String IMAGEKIT_FILES_API = "https://api.imagekit.io/v1/files";
    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(10);

    private static final List<String> BASE_FOLDERS = List.of(
            "charusatneeds",
            "charusatneeds/canteens",
            "charusatneeds/menu-items",
            "charusatneeds/offers",
            "charusatneeds/banners",
            "charusatneeds/videos"
    );

    private final ImageKitConfig imageKitConfig;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(HTTP_TIMEOUT)
            .build();

    /** In-memory cache of already-created or verified folders to prevent redundant API calls */
    private final Set<String> verifiedFolders = ConcurrentHashMap.newKeySet();

    /**
     * Initializes the standard CharusatNeeds folder hierarchy.
     * Safe to invoke multiple times during application lifecycle.
     *
     * @return Map<String, Boolean> Mapping of folder path to creation/verification success.
     */
    public Map<String, Boolean> initBaseFolderHierarchy() {
        if (!imageKitConfig.isUploadConfigured()) {
            log.warn("ImageKit private key is not configured; skipping automatic media folder initialization");
            return Collections.emptyMap();
        }

        log.info("Starting automated ImageKit folder hierarchy initialization...");
        Map<String, Boolean> results = new LinkedHashMap<>();

        for (String folderPath : BASE_FOLDERS) {
            boolean success = ensureFolderPath(folderPath);
            results.put(folderPath, success);
            if (success) {
                log.info("ImageKit folder verified/created: [{}]", folderPath);
            } else {
                log.warn("Failed to verify/create ImageKit folder: [{}]", folderPath);
            }
        }

        log.info("ImageKit folder hierarchy initialization completed ({} of {} folders ready)",
                results.values().stream().filter(Boolean::booleanValue).count(),
                BASE_FOLDERS.size());

        return results;
    }

    /**
     * Ensures an entire nested folder path exists by creating each level from root down.
     *
     * @param fullPath Target directory path, e.g. "charusatneeds/menu-items/campus-bites".
     * @return boolean - True if the folder path exists or was successfully created.
     */
    public boolean ensureFolderPath(String fullPath) {
        if (fullPath == null || fullPath.isBlank()) {
            return false;
        }

        String normalized = fullPath.trim().replace("\\", "/");
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        if (verifiedFolders.contains(normalized)) {
            return true;
        }

        String[] segments = normalized.split("/");
        StringBuilder currentPath = new StringBuilder();

        for (int i = 0; i < segments.length; i++) {
            String segment = segments[i].trim();
            if (segment.isEmpty()) {
                continue;
            }

            String parentPath = (i == 0) ? "/" : "/" + currentPath.toString();
            String pathToCheck = (i == 0) ? segment : currentPath.toString() + "/" + segment;

            if (!verifiedFolders.contains(pathToCheck)) {
                boolean created = createFolderViaApi(segment, parentPath);
                if (created) {
                    verifiedFolders.add(pathToCheck);
                } else {
                    return false;
                }
            }

            if (currentPath.length() > 0) {
                currentPath.append("/");
            }
            currentPath.append(segment);
        }

        verifiedFolders.add(normalized);
        return true;
    }

    /**
     * Dynamically provisions vendor-specific media paths.
     * Supported categories: "menu-items", "canteens", "offers", "banners".
     *
     * @param category    Media category folder name.
     * @param canteenSlug Canteen slug or identifier.
     * @return String Fully qualified folder path inside ImageKit.
     */
    public String ensureVendorFolder(String category, String canteenSlug) {
        String sanitizedCategory = sanitizeSlug(category);
        String sanitizedSlug = sanitizeSlug(canteenSlug);
        String fullPath = String.format("charusatneeds/%s/%s", sanitizedCategory, sanitizedSlug);

        boolean success = ensureFolderPath(fullPath);
        if (success) {
            log.info("Vendor folder ensured: [{}]", fullPath);
        } else {
            log.warn("Could not ensure vendor folder: [{}]", fullPath);
        }

        return fullPath;
    }

    /**
     * Executes single folder creation call against ImageKit Media REST API.
     *
     * @param folderName       Name of the leaf directory to create.
     * @param parentFolderPath Path of the parent directory.
     * @return boolean - True on HTTP 201 (Created), HTTP 200 (OK), or already exists.
     */
    private boolean createFolderViaApi(String folderName, String parentFolderPath) {
        if (!imageKitConfig.isUploadConfigured()) {
            return false;
        }

        try {
            String authHeader = getBasicAuthHeader();
            String jsonPayload = String.format(
                    "{\"folderName\":\"%s\",\"parentFolderPath\":\"%s\"}",
                    escapeJson(folderName),
                    escapeJson(parentFolderPath)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(IMAGEKIT_FOLDER_API))
                    .timeout(HTTP_TIMEOUT)
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("User-Agent", "CharusatNeeds-MediaService/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();

            // HTTP 201 = Created, HTTP 200 = Success, HTTP 400 = Folder already exists
            if (statusCode == 201 || statusCode == 200) {
                return true;
            }

            if (statusCode == 400 && response.body() != null &&
                    response.body().toLowerCase().contains("already exists")) {
                return true;
            }

            log.warn("ImageKit create folder API returned HTTP status {}: {}", statusCode, response.body());
            return false;
        } catch (Exception ex) {
            log.warn("Failed to create ImageKit folder [{}] in [{}]: {}", folderName, parentFolderPath, ex.getMessage());
            return false;
        }
    }

    /**
     * Queries ImageKit to verify the current state of configured media directories.
     *
     * @return Map<String, Object> Detailed verification summary.
     */
    public Map<String, Object> verifyFolderHierarchy() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("timestamp", System.currentTimeMillis());
        summary.put("provider", "imagekit");
        summary.put("cdnEndpoint", imageKitConfig.getUrlEndpoint());
        summary.put("uploadConfigured", imageKitConfig.isUploadConfigured());

        if (!imageKitConfig.isUploadConfigured()) {
            summary.put("status", "UNCONFIGURED_CREDENTIALS");
            summary.put("verifiedFolders", Collections.emptyList());
            return summary;
        }

        List<Map<String, Object>> folderStatuses = new ArrayList<>();
        boolean allHealthy = true;

        for (String folder : BASE_FOLDERS) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("path", folder);
            try {
                String queryUrl = IMAGEKIT_FILES_API + "?path=" + folder;
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(queryUrl))
                        .timeout(HTTP_TIMEOUT)
                        .header("Authorization", getBasicAuthHeader())
                        .header("Accept", "application/json")
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                boolean exists = (resp.statusCode() == 200);
                item.put("exists", exists);
                item.put("httpStatus", resp.statusCode());
                if (!exists) {
                    allHealthy = false;
                }
            } catch (Exception ex) {
                item.put("exists", false);
                item.put("error", ex.getMessage());
                allHealthy = false;
            }
            folderStatuses.add(item);
        }

        summary.put("allFoldersActive", allHealthy);
        summary.put("folders", folderStatuses);
        return summary;
    }

    private String getBasicAuthHeader() {
        String token = imageKitConfig.getPrivateKey() + ":";
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private String sanitizeSlug(String input) {
        if (input == null) return "general";
        return input.trim().toLowerCase()
                .replaceAll("[^a-z0-9_-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private String escapeJson(String input) {
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
