package com.charusat.canteen.repository;

import com.charusat.canteen.model.MfaEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * MFA Event Repository — JDBC-based persistence for MFA audit trail.
 */
@Repository
@RequiredArgsConstructor
public class MfaEventRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<MfaEvent> ROW_MAPPER = (rs, rowNum) -> MfaEvent.builder()
            .id(rs.getLong("id"))
            .userId(rs.getLong("user_id"))
            .eventType(rs.getString("event_type"))
            .ipAddress(rs.getString("ip_address"))
            .userAgent(rs.getString("user_agent"))
            .success(rs.getBoolean("success"))
            .detail(rs.getString("detail"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .build();

    public MfaEvent save(MfaEvent event) {
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }

        String sql = """
                INSERT INTO mfa_events (user_id, event_type, ip_address, user_agent, success, detail, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """;

        Long id = jdbcTemplate.queryForObject(sql, Long.class,
                event.getUserId(),
                event.getEventType(),
                event.getIpAddress(),
                event.getUserAgent(),
                event.isSuccess(),
                event.getDetail(),
                Timestamp.valueOf(event.getCreatedAt()));

        event.setId(id);
        return event;
    }

    public List<MfaEvent> findByUserId(Long userId) {
        return jdbcTemplate.query(
                "SELECT * FROM mfa_events WHERE user_id = ? ORDER BY created_at DESC",
                ROW_MAPPER, userId);
    }

    public List<MfaEvent> findByUserIdAndEventType(Long userId, String eventType) {
        return jdbcTemplate.query(
                "SELECT * FROM mfa_events WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC",
                ROW_MAPPER, userId, eventType);
    }

    public long countFailedAttempts(Long userId, LocalDateTime since) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM mfa_events WHERE user_id = ? AND success = FALSE AND created_at > ?",
                Long.class, userId, Timestamp.valueOf(since));
        return count != null ? count : 0;
    }
}
