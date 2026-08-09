package com.charusat.canteen.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * URL Sanitization Filter — Blocks malicious URL patterns.
 *
 * Protects against:
 * - XSS via URL (script tags, javascript: URIs, event handlers)
 * - Path traversal (../ sequences)
 * - SQL injection keywords in URLs
 * - Null byte injection
 * - Encoded attack patterns (%3Cscript, %00, etc.)
 *
 * Runs FIRST in the filter chain (highest precedence).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class UrlSanitizationFilter extends OncePerRequestFilter {

    // ── Malicious patterns to block ──────────────────────────────────
    private static final Pattern[] BLOCKED_PATTERNS = {
            // XSS: script tags and javascript URIs
            Pattern.compile("(?i)<\\s*script"),
            Pattern.compile("(?i)javascript\\s*:"),
            Pattern.compile("(?i)on(load|error|click|mouseover|submit|focus|blur)\\s*="),
            Pattern.compile("(?i)<\\s*(iframe|object|embed|applet|form|img\\s+[^>]*onerror)"),

            // Path traversal
            Pattern.compile("\\.\\.[\\\\/]"),
            Pattern.compile("%2e%2e[\\\\/]", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\.\\.%2f", Pattern.CASE_INSENSITIVE),
            Pattern.compile("%2e%2e%2f", Pattern.CASE_INSENSITIVE),

            // Null byte injection
            Pattern.compile("%00"),
            Pattern.compile("\\x00"),

            // SQL injection patterns in URL
            Pattern.compile(
                    "(?i)(union\\s+(all\\s+)?select|select\\s+.*from|insert\\s+into|delete\\s+from|drop\\s+table|alter\\s+table)"),
            Pattern.compile("(?i)('\\s*(or|and)\\s+'|\"\\s*(or|and)\\s+\")"),

            // Command injection
            Pattern.compile("[;|`]\\s*(cat|ls|dir|wget|curl|nc|bash|sh|cmd|powershell)"),

            // Encoded script tags
            Pattern.compile("(?i)%3c\\s*script", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)%3cscript", Pattern.CASE_INSENSITIVE),
    };

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        String fullUrl = queryString != null ? uri + "?" + queryString : uri;

        // Decode for double-encoding attacks
        String decoded = java.net.URLDecoder.decode(fullUrl, "UTF-8");

        // Check against blocked patterns
        for (Pattern pattern : BLOCKED_PATTERNS) {
            if (pattern.matcher(decoded).find() || pattern.matcher(fullUrl).find()) {
                log.warn("🚫 BLOCKED malicious URL: {} from IP: {}", fullUrl, getClientIp(request));

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"Forbidden\",\"message\":\"Malicious request blocked\"}");
                return; // Stop the filter chain — do NOT process this request
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty())
            return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
