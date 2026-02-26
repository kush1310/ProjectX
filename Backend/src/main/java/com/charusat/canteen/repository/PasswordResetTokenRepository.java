package com.charusat.canteen.repository;

import com.charusat.canteen.model.PasswordResetToken;
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

    private final RowMapper<PasswordResetToken> rowMapper = (rs, rowNum) -> {
        PasswordResetToken prt = new PasswordResetToken();
        prt.setId(rs.getLong("id"));
        prt.setToken(rs.getString("token"));
        long userId = rs.getLong("user_id");
        prt.setUserId(rs.wasNull() ? null : userId);
        Timestamp expiresAt = rs.getTimestamp("expires_at");
        prt.setExpiresAt(expiresAt != null ? expiresAt.toLocalDateTime() : null);
        prt.setUsed(rs.getObject("used", Boolean.class));
        Timestamp createdAt = rs.getTimestamp("created_at");
        prt.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        return prt;
    };

    public Optional<PasswordResetToken> findByToken(String token) {
        List<PasswordResetToken> results = jdbc.query("SELECT * FROM password_reset_tokens WHERE token = ?", rowMapper, token);
        return results.stream().findFirst();
    }

    public void deleteByUserId(Long userId) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = ?", userId);
    }

    public PasswordResetToken save(PasswordResetToken prt) {
        if (prt.getId() == null) {
            return insert(prt);
        } else {
            return update(prt);
        }
    }

    private PasswordResetToken insert(PasswordResetToken prt) {
        String sql = "INSERT INTO password_reset_tokens (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, prt.getToken());
            ps.setObject(2, prt.getUserId());
            ps.setTimestamp(3, prt.getExpiresAt() != null ? Timestamp.valueOf(prt.getExpiresAt()) : null);
            ps.setObject(4, prt.getUsed() != null ? prt.getUsed() : false);
            ps.setTimestamp(5, prt.getCreatedAt() != null ? Timestamp.valueOf(prt.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) prt.setId(key.longValue());
        return prt;
    }

    private PasswordResetToken update(PasswordResetToken prt) {
        jdbc.update("UPDATE password_reset_tokens SET used=?, expires_at=? WHERE id=?",
                prt.getUsed(), prt.getExpiresAt() != null ? Timestamp.valueOf(prt.getExpiresAt()) : null, prt.getId());
        return prt;
    }
}
