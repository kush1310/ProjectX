package com.charusat.canteen.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

/**
 * Security Headers Configuration - Adds essential security headers and request correlation
 * to all incoming and outgoing requests.
 * 
 * Headers Implemented:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-XSS-Protection: Additional XSS protection
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 * - X-Request-Id: Distributed request correlation identifier
 * 
 * Standards: OWASP Security Headers & SRE Request Correlation Standards
 */
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        FilterRegistrationBean<SecurityHeadersFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new SecurityHeadersFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(1);
        return registrationBean;
    }

    public static class SecurityHeadersFilter implements Filter {

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            // Distributed Request Correlation (X-Request-Id)
            String requestId = httpRequest.getHeader("X-Request-Id");
            if (requestId == null || requestId.isBlank()) {
                requestId = httpRequest.getHeader("X-Request-ID");
            }
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }
            httpResponse.setHeader("X-Request-Id", requestId);
            MDC.put("requestId", requestId);

            // Prevent clickjacking
            httpResponse.setHeader("X-Frame-Options", "DENY");

            // Prevent MIME type sniffing
            httpResponse.setHeader("X-Content-Type-Options", "nosniff");

            // XSS Protection (legacy browsers)
            httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

            // Referrer Policy - don't leak sensitive URLs
            httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            // Permissions Policy - disable unnecessary features
            httpResponse.setHeader("Permissions-Policy",
                    "geolocation=(), microphone=(), camera=(), payment=()");

            // HSTS - Enforce HTTPS (1 year, include subdomains)
            httpResponse.setHeader("Strict-Transport-Security",
                    "max-age=31536000; includeSubDomains; preload");

            // Content Security Policy - Prevent XSS
            httpResponse.setHeader("Content-Security-Policy",
                    "default-src 'self'; " +
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; " +
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                            "font-src 'self' https://fonts.gstatic.com; " +
                            "img-src 'self' data: https: blob:; " +
                            "connect-src 'self' http://localhost:* ws://localhost:* https://*.googleapis.com https://accounts.google.com; "
                            +
                            "frame-src https://accounts.google.com; " +
                            "object-src 'none'; " +
                            "form-action 'self'; " +
                            "base-uri 'self';");

            // Cache control for sensitive data — prevents back-button data leaks
            httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            httpResponse.setHeader("Pragma", "no-cache");
            httpResponse.setHeader("Expires", "0");

            try {
                chain.doFilter(request, response);
            } finally {
                MDC.remove("requestId");
            }
        }

        @Override
        public void init(FilterConfig filterConfig) throws ServletException {
        }

        @Override
        public void destroy() {
        }
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization", "X-Request-Id")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
