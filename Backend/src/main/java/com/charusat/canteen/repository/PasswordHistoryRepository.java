package com.charusat.canteen.repository;

import com.charusat.canteen.model.PasswordHistory;
import com.charusat.canteen.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class PasswordHistoryRepository {

    private final JdbcTemplate jdbc;

    public PasswordHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<PasswordHistory> ROW_MAPPER = (rs, rowNum) -> {
        PasswordHistory ph = new PasswordHistory();
        ph.setId(rs.getLong("id"));
        ph.setUserId(rs.getObject("user_id") != null ? rs.getLong("user_id") : null);
        ph.setPasswordHash(rs.getString("password_hash"));
        ph.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return ph;
    };

    public Optional<PasswordHistory> findById(Long id) {
        List<PasswordHistory> list = jdbc.query("SELECT * FROM password_history WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /**
     * Get last 5 passwords for a user (ordered by most recent)
     */
    public List<PasswordHistory> findTop5ByUserOrderByCreatedAtDesc(User user) {
        return jdbc.query("SELECT * FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                ROW_MAPPER, user.getId());
    }

    /**
     * Delete old password history (keep only last N)
     */
    @Transactional
    public void deleteOldHistory(Long userId, int keepCount) {
        jdbc.update("DELETE FROM password_history WHERE user_id = ? AND id NOT IN " +
                "(SELECT id FROM (SELECT id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?) AS recent)",
                userId, userId, keepCount);
    }

    /**
     * Count password history entries for a user
     */
    public long countByUser(User user) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM password_history WHERE user_id = ?", Long.class,
                user.getId());
        return c != null ? c : 0;
    }

    public PasswordHistory save(PasswordHistory ph) {
        if (ph.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO password_history (user_id, password_hash, created_at) VALUES (?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, ph.getUserId());
                ps.setString(2, ph.getPasswordHash());
                ps.setTimestamp(3, ph.getCreatedAt() != null ? Timestamp.valueOf(ph.getCreatedAt()) : null);
                return ps;
            }, kh);
            ph.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE password_history SET user_id=?, password_hash=?, created_at=? WHERE id=?",
                    ph.getUserId(), ph.getPasswordHash(),
                    ph.getCreatedAt() != null ? Timestamp.valueOf(ph.getCreatedAt()) : null, ph.getId());
        }
        return ph;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM password_history WHERE id = ?", id);
    }

    public List<PasswordHistory> findAll() {
        return jdbc.query("SELECT * FROM password_history", ROW_MAPPER);
    }
}
