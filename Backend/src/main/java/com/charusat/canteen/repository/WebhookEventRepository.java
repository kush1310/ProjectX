package com.charusat.canteen.repository;

import com.charusat.canteen.model.WebhookEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * JDBC repository for Razorpay webhook event idempotency tracking.
 */
@Repository
@RequiredArgsConstructor
public class WebhookEventRepository {

    private final JdbcTemplate jdbcTemplate;

    public void save(WebhookEvent event) {
        jdbcTemplate.update(
                "INSERT INTO webhook_events (event_id, event_type, payload, processed, created_at) " +
                        "VALUES (?, ?, ?, ?, ?) ON CONFLICT (event_id) DO NOTHING",
                event.getEventId(),
                event.getEventType(),
                event.getPayload(),
                event.getProcessed() != null ? event.getProcessed() : false,
                Timestamp.valueOf(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now()));
    }

    public boolean existsByEventId(String eventId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM webhook_events WHERE event_id = ?",
                Integer.class, eventId);
        return count != null && count > 0;
    }

    public void markProcessed(String eventId) {
        jdbcTemplate.update(
                "UPDATE webhook_events SET processed = true WHERE event_id = ?",
                eventId);
    }
}
