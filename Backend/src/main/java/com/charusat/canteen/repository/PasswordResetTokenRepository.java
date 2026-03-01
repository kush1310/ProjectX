package com.charusat.canteen.repository;

import com.charusat.canteen.model.PasswordResetToken;
import com.charusat.canteen.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class PasswordResetTokenRepository {

    private final JdbcTemplate jdbc;

    public PasswordResetTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<PasswordResetToken> ROW_MAPPER = (rs, rowNum) -> {
        PasswordResetToken t = new PasswordResetToken();
        t.setId(rs.getLong("id"));
        t.setToken(rs.getString("token"));
        t.setUserId(rs.getObject("user_id") != null ? rs.getLong("user_id") : null);
        t.setExpiresAt(rs.getTimestamp("expires_at") != null ? rs.getTimestamp("expires_at").toLocalDateTime() : null);
        t.setUsed(rs.getObject("used", Boolean.class));
        t.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return t;
    };

    public Optional<PasswordResetToken> findById(Long id) {
        List<PasswordResetToken> list = jdbc.query("SELECT * FROM password_reset_tokens WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<PasswordResetToken> findByToken(String token) {
        List<PasswordResetToken> list = jdbc.query("SELECT * FROM password_reset_tokens WHERE token = ?", ROW_MAPPER,
                token);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public void deleteByUser(User user) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = ?", user.getId());
    }

    public PasswordResetToken save(PasswordResetToken t) {
        if (t.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO password_reset_tokens (token, user_id, expires_at, used, created_at) VALUES (?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, t.getToken());
                ps.setObject(2, t.getUserId());
                ps.setTimestamp(3, t.getExpiresAt() != null ? Timestamp.valueOf(t.getExpiresAt()) : null);
                ps.setObject(4, t.getUsed());
                ps.setTimestamp(5, t.getCreatedAt() != null ? Timestamp.valueOf(t.getCreatedAt()) : null);
                return ps;
            }, kh);
            t.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE password_reset_tokens SET token=?, user_id=?, expires_at=?, used=?, created_at=? WHERE id=?",
                    t.getToken(), t.getUserId(),
                    t.getExpiresAt() != null ? Timestamp.valueOf(t.getExpiresAt()) : null,
                    t.getUsed(), t.getCreatedAt() != null ? Timestamp.valueOf(t.getCreatedAt()) : null, t.getId());
        }
        return t;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE id = ?", id);
    }
}
