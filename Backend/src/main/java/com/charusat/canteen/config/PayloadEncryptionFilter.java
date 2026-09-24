package com.charusat.canteen.config;

import com.charusat.canteen.service.PayloadCryptoService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Payload Encryption Filter — Encrypts JSON responses and decrypts JSON
 * requests
 * using AES-256-GCM at the application layer.
 *
 * This defeats Burp Suite / Wireshark inspection even with HTTPS MITM:
 * - Responses: JSON body → encrypted { "enc": "..." }
 * - Requests: { "enc": "..." } → decrypted JSON body for controllers
 *
 * Skipped for:
 * - Non-JSON content types (file uploads, HTML, images)
 * - Public auth endpoints where no encryption key is available yet
 * - WebSocket upgrade requests
 * - Actuator/health endpoints
 */
@Component
@Order(5) // After URL sanitization (HIGHEST_PRECEDENCE) but before security filters
@RequiredArgsConstructor
@Slf4j
public class PayloadEncryptionFilter extends OncePerRequestFilter {

    private final PayloadCryptoService cryptoService;

    /** Endpoints that skip encryption (public, no JWT yet) */
    private static final Set<String> SKIP_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/google",
            "/api/auth/refresh-token",
            "/api/auth/verify-email",
            "/api/auth/resend-verification",
            "/api/mfa/validate",
            "/api/captcha",
            "/api/auth/captcha",
            "/api/password-reset",
            "/api/public/health",
            "/api/public/media",
            "/healthz",
            "/health",
            "/ws",
            "/actuator");

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip encryption for public endpoints and non-API paths
        if (shouldSkip(path, request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // === DECRYPT INCOMING REQUEST (if encrypted) ===
        HttpServletRequest processedRequest = request;
        // Parentheses are required: (hasJsonBody AND (POST OR PUT)) — without them, all PUT
        // requests would unconditionally enter decryptRequest due to OR precedence.
        if (hasJsonBody(request) && ("POST".equalsIgnoreCase(request.getMethod())
                || "PUT".equalsIgnoreCase(request.getMethod())
                || "PATCH".equalsIgnoreCase(request.getMethod()))) {
            processedRequest = decryptRequest(request);
        }

        // === WRAP RESPONSE TO CAPTURE OUTPUT ===
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        // Execute the rest of the filter chain with potentially decrypted request
        filterChain.doFilter(processedRequest, responseWrapper);

        // === ENCRYPT OUTGOING RESPONSE ===
        if (isJsonResponse(responseWrapper)) {
            encryptResponse(responseWrapper, response);
        } else {
            responseWrapper.copyBodyToResponse();
        }
    }

    /**
     * Decrypt an encrypted request body: { "enc": "..." } → plaintext JSON
     */
    private HttpServletRequest decryptRequest(HttpServletRequest request) {
        try {
            String body = request.getReader().lines().collect(Collectors.joining());

            if (body.contains("\"enc\"")) {
                // Extract the encrypted payload
                String encValue = extractEncValue(body);
                if (encValue != null) {
                    String decrypted = cryptoService.decrypt(encValue);
                    log.debug("Decrypted request body for: {}", request.getRequestURI());
                    return new WrappedRequest(request, decrypted);
                }
            }

            // Not encrypted — pass through as-is
            return new WrappedRequest(request, body);
        } catch (Exception e) {
            log.warn("Request decryption failed, passing raw body: {}", e.getMessage());
            return request;
        }
    }

    /**
     * Encrypt response body → { "enc": "..." }
     */
    private void encryptResponse(ContentCachingResponseWrapper responseWrapper, HttpServletResponse response)
            throws IOException {
        byte[] content = responseWrapper.getContentAsByteArray();
        if (content.length == 0) {
            responseWrapper.copyBodyToResponse();
            return;
        }

        String originalBody = new String(content, StandardCharsets.UTF_8);
        String encrypted = cryptoService.encrypt(originalBody);

        String encryptedBody = "{\"enc\":\"" + encrypted + "\"}";

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setContentLength(encryptedBody.getBytes(StandardCharsets.UTF_8).length);
        response.getOutputStream().write(encryptedBody.getBytes(StandardCharsets.UTF_8));
        response.getOutputStream().flush();
    }

    private boolean shouldSkip(String path, HttpServletRequest request) {
        // Skip for WebSocket upgrade
        if ("websocket".equalsIgnoreCase(request.getHeader("Upgrade")))
            return true;

        // Skip for listed paths
        for (String skip : SKIP_PATHS) {
            if (path.startsWith(skip))
                return true;
        }

        // Skip non-API paths
        if (!path.startsWith("/api/"))
            return true;

        // Skip multipart (file uploads) — cannot be AES-encrypted
        String contentType = request.getContentType();
        if (contentType != null && contentType.startsWith("multipart/"))
            return true;

        return false;
    }

    private boolean hasJsonBody(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.contains("application/json");
    }

    private boolean isJsonResponse(ContentCachingResponseWrapper response) {
        String contentType = response.getContentType();
        return contentType != null && contentType.contains("application/json")
                && response.getContentAsByteArray().length > 0;
    }

    /**
     * Extract the "enc" value from { "enc": "..." }
     */
    private String extractEncValue(String json) {
        try {
            // Simple extraction — avoids Jackson dependency in filter
            int start = json.indexOf("\"enc\"");
            if (start < 0)
                return null;
            int colonPos = json.indexOf(':', start);
            int quoteStart = json.indexOf('"', colonPos + 1);
            int quoteEnd = json.indexOf('"', quoteStart + 1);
            if (quoteStart >= 0 && quoteEnd > quoteStart) {
                return json.substring(quoteStart + 1, quoteEnd);
            }
        } catch (Exception e) {
            log.warn("Failed to extract enc value: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Wraps an HttpServletRequest with a replaced body.
     */
    private static class WrappedRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        public WrappedRequest(HttpServletRequest request, String body) {
            super(request);
            this.body = body.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return bais.read();
                }

                @Override
                public boolean isFinished() {
                    return bais.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }

        @Override
        public int getContentLength() {
            return body.length;
        }

        @Override
        public long getContentLengthLong() {
            return body.length;
        }
    }
}
