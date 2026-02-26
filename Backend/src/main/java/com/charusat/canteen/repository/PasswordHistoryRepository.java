package com.charusat.canteen.repository;

import com.charusat.canteen.model.PasswordHistory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class PasswordHistoryRepository {

    private final JdbcTemplate jdbc;

    public PasswordHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<PasswordHistory> rowMapper = (rs, rowNum) -> {
        PasswordHistory ph = new PasswordHistory();
        ph.setId(rs.getLong("id"));
        long userId = rs.getLong("user_id");
        ph.setUserId(rs.wasNull() ? null : userId);
        ph.setPasswordHash(rs.getString("password_hash"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        ph.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        return ph;
    };

    public List<PasswordHistory> findTop5ByUserIdOrderByCreatedAtDesc(Long userId) {
        return jdbc.query("SELECT * FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                rowMapper, userId);
    }

    public void deleteOldHistory(Long userId, int keepCount) {
        jdbc.update("DELETE FROM password_history WHERE user_id = ? AND id NOT IN " +
                "(SELECT id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?)",
                userId, userId, keepCount);
    }

    public long countByUserId(Long userId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM password_history WHERE user_id = ?", Long.class, userId);
        return count != null ? count : 0;
    }

    public PasswordHistory save(PasswordHistory ph) {
        String sql = "INSERT INTO password_history (user_id, password_hash, created_at) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, ph.getUserId());
            ps.setString(2, ph.getPasswordHash());
            ps.setTimestamp(3, ph.getCreatedAt() != null ? Timestamp.valueOf(ph.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) ph.setId(key.longValue());
        return ph;
    }
}
