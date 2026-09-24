package com.charusat.canteen.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration - CORS, password encoding, JWT filter, and endpoint
 * security
 */
@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Comma-separated list of allowed CORS origins injected from environment.
     * - Default profile:  http://localhost:5173,http://localhost:3000,http://localhost:5174
     * - Docker profile:   http://localhost:5173,http://localhost:3000,http://localhost:80
     * - Prod profile:     ${CORS_ALLOWED_ORIGINS} set in Render Dashboard.
     *
     * This field feeds the Spring Security CORS filter (higher priority than
     * WebMvcConfigurer) and ensures cross-origin requests from the production
     * Vercel frontend are accepted on all secured endpoints.
     *
     * @see SecurityHeadersConfig#corsConfigurer() for the WebMvcConfigurer binding
     */
    @Value("${spring.web.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:5174}")
    private String corsAllowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF is intentionally disabled per OWASP guidelines for stateless JWT APIs.
                // Tokens are sent via Authorization header (not cookies), making CSRF
                // unexploitable.
                // See:
                // https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/healthz", "/health").permitAll()
                        .requestMatchers("/api/map/**").permitAll()
                        .requestMatchers("/api/vendor-applications").permitAll()
                        .requestMatchers("/api/password/**").permitAll()
                        .requestMatchers("/api/mfa/validate").permitAll()

                        // Public GET endpoints for menu browsing
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/canteens/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/menu/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/canteen/**").permitAll()

                        // Razorpay webhook — must be public (Razorpay cannot attach JWT)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/payments/webhook").permitAll()

                        // Public profile image endpoint
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/profile/image/**")
                        .permitAll()

                        // Public coupon READ (customers browse deals without login)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/coupons/**").permitAll()

                        // WebSocket endpoint
                        .requestMatchers("/ws/**").permitAll()

                        // Swagger / OpenAPI documentation
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // H2 Console (dev only)
                        .requestMatchers("/h2-console/**").permitAll()

                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Allow H2 Console frames
                .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        /*
         * Reads the comma-separated CORS origins list from spring.web.cors.allowed-origins,
         * which maps to the CORS_ALLOWED_ORIGINS environment variable in production.
         *
         * This is the authoritative CORS configuration. It applies to ALL routes via the
         * Spring Security filter chain, including secured endpoints where WebMvcConfigurer
         * CORS mappings (SecurityHeadersConfig) are not evaluated.
         *
         * @returns CorsConfigurationSource applied to every HTTP request path
         */
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> originList = Arrays.asList(corsAllowedOrigins.split(","));
        configuration.setAllowedOrigins(originList);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
