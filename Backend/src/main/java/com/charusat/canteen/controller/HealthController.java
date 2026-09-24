package com.charusat.canteen.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HealthController provides non-sensitive, deterministic liveness and readiness health checks
 * for production load balancers, orchestrators, and reverse proxy monitoring.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://charusatneeds.charusat.edu.in"})
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    /**
     * checkHealthStatus
     *
     * Validates database connectivity and service responsiveness by executing an atomic
     * SELECT 1 query against the configured PostgreSQL connection pool. Returns service
     * availability status and uptime metrics without exposing credentials or internal topology.
     *
     * @return  ResponseEntity<Map<String, Object>> - HTTP 200 with status UP when database is reachable;
     *                                                HTTP 503 with status DOWN when query fails.
     * @validates                                   - Database pool connectivity via active query execution.
     * @edge-cases                                  - Handles database timeout, connection exhaustion, and
     *                                                network partition by returning graceful 503 response.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealthStatus() {
        Map<String, Object> healthResponse = new LinkedHashMap<>();
        healthResponse.put("timestamp", Instant.now().toString());
        healthResponse.put("service", "charusat-needs-backend");
        healthResponse.put("uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);

        try {
            Integer queryResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (queryResult != null && queryResult == 1) {
                healthResponse.put("status", "UP");
                healthResponse.put("database", "UP");
                return ResponseEntity.ok(healthResponse);
            } else {
                healthResponse.put("status", "DOWN");
                healthResponse.put("database", "UNEXPECTED_RESPONSE");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthResponse);
            }
        } catch (Exception databaseException) {
            healthResponse.put("status", "DOWN");
            healthResponse.put("database", "DOWN");
            healthResponse.put("error", "Database connection probe failed");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthResponse);
        }
    }

    /**
     * checkLiveness
     *
     * Validates that the Spring Boot application context is alive and responding.
     * Does not evaluate external dependencies to prevent orchestration restart loops.
     */
    @GetMapping("/health/liveness")
    public ResponseEntity<Map<String, Object>> checkLiveness() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("service", "charusat-needs-backend");
        response.put("uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }

    /**
     * checkReadiness
     *
     * Validates that the service and its critical database dependencies are ready
     * to safely receive inbound traffic from upstream reverse proxies and load balancers.
     */
    @GetMapping("/health/readiness")
    public ResponseEntity<Map<String, Object>> checkReadiness() {
        return checkHealthStatus();
    }
}

