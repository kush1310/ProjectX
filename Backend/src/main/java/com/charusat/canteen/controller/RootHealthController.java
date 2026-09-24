package com.charusat.canteen.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * RootHealthController
 *
 * Exposes lightweight root health endpoints (/healthz and /health)
 * required by container orchestrators, cloud providers (Render, Vercel, Docker),
 * and external uptime monitors (UptimeRobot).
 */
@RestController
@RequiredArgsConstructor
public class RootHealthController {

    private final HealthController healthController;

    @GetMapping({"/healthz", "/health"})
    public ResponseEntity<Map<String, Object>> getRootLiveness() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("service", "charusat-needs-backend");
        response.put("uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        response.put("status", "UP");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/healthz/readiness")
    public ResponseEntity<Map<String, Object>> getRootReadiness() {
        return healthController.checkHealthStatus();
    }
}
