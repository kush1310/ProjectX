package com.charusat.canteen.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PublicStatsController {

    private final JdbcTemplate jdbc;

    @GetMapping("/stats")
    public ResponseEntity<?> getPublicStats() {
        Long totalCanteens = jdbc.queryForObject("SELECT COUNT(*) FROM canteens WHERE is_open = true", Long.class);
        Long totalOrdersServed = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE status = 'COMPLETED'", Long.class);
        Long activeDishes = jdbc.queryForObject(
                "SELECT COUNT(*) FROM menu_items m WHERE m.is_available = true AND NOT EXISTS (" +
                "SELECT 1 FROM menu_item_tags t WHERE t.menu_item_id = m.id AND t.tag LIKE '%#hidden%')",
                Long.class
        );
        Long activeCoupons = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE is_active = true", Long.class);
        Double avgRating = jdbc.queryForObject("SELECT COALESCE(AVG(rating), 4.5) FROM reviews", Double.class);

        return ResponseEntity.ok(Map.of(
                "totalCanteens", totalCanteens != null ? totalCanteens : 0,
                "totalOrdersServed", totalOrdersServed != null ? totalOrdersServed : 0,
                "activeDishes", activeDishes != null ? activeDishes : 0,
                "activeCoupons", activeCoupons != null ? activeCoupons : 0,
                "avgRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 4.5
        ));
    }
}
