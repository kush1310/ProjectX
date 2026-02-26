package com.charusat.canteen.repository;

import com.charusat.canteen.model.RefreshToken;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class RefreshTokenRepository {

    private final JdbcTemplate jdbc;

    public RefreshTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<RefreshToken> rowMapper = (rs, rowNum) -> {
        RefreshToken rt = new RefreshToken();
        rt.setId(rs.getLong("id"));
        rt.setTokenHash(rs.getString("token_hash"));
        long userId = rs.getLong("user_id");
        rt.setUserId(rs.wasNull() ? null : userId);
        Timestamp expiresAt = rs.getTimestamp("expires_at");
        rt.setExpiresAt(expiresAt != null ? expiresAt.toLocalDateTime() : null);
        Timestamp createdAt = rs.getTimestamp("created_at");
        rt.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        rt.setDeviceInfo(rs.getString("device_info"));
        rt.setIpAddress(rs.getString("ip_address"));
        rt.setRevoked(rs.getObject("revoked", Boolean.class));
        Timestamp revokedAt = rs.getTimestamp("revoked_at");
        rt.setRevokedAt(revokedAt != null ? revokedAt.toLocalDateTime() : null);
        rt.setRevokedReason(rs.getString("revoked_reason"));
        return rt;
    };

    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        List<RefreshToken> results = jdbc.query("SELECT * FROM refresh_tokens WHERE token_hash = ?", rowMapper, tokenHash);
        return results.stream().findFirst();
    }

    public List<RefreshToken> findByUserIdAndRevokedFalse(Long userId) {
        return jdbc.query("SELECT * FROM refresh_tokens WHERE user_id = ? AND revoked = false", rowMapper, userId);
    }

    public int revokeAllByUserId(Long userId, LocalDateTime revokedAt, String reason) {
        return jdbc.update("UPDATE refresh_tokens SET revoked = true, revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked = false",
                Timestamp.valueOf(revokedAt), reason, userId);
    }

    public int deleteExpiredTokens(LocalDateTime cutoff) {
        return jdbc.update("DELETE FROM refresh_tokens WHERE expires_at < ?", Timestamp.valueOf(cutoff));
    }

    public long countByUserIdAndRevokedFalse(Long userId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM refresh_tokens WHERE user_id = ? AND revoked = false",
                Long.class, userId);
        return count != null ? count : 0;
    }

    public RefreshToken save(RefreshToken rt) {
        if (rt.getId() == null) {
            return insert(rt);
        } else {
            return update(rt);
        }
    }

    private RefreshToken insert(RefreshToken rt) {
        String sql = "INSERT INTO refresh_tokens (token_hash, user_id, expires_at, created_at, device_info, " +
                "ip_address, revoked, revoked_at, revoked_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, rt.getTokenHash());
            ps.setObject(2, rt.getUserId());
            ps.setTimestamp(3, rt.getExpiresAt() != null ? Timestamp.valueOf(rt.getExpiresAt()) : null);
            ps.setTimestamp(4, rt.getCreatedAt() != null ? Timestamp.valueOf(rt.getCreatedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            ps.setString(5, rt.getDeviceInfo());
            ps.setString(6, rt.getIpAddress());
            ps.setObject(7, rt.getRevoked() != null ? rt.getRevoked() : false);
            ps.setTimestamp(8, rt.getRevokedAt() != null ? Timestamp.valueOf(rt.getRevokedAt()) : null);
            ps.setString(9, rt.getRevokedReason());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) rt.setId(key.longValue());
        return rt;
    }

    private RefreshToken update(RefreshToken rt) {
        jdbc.update("UPDATE refresh_tokens SET revoked=?, revoked_at=?, revoked_reason=? WHERE id=?",
                rt.getRevoked(), rt.getRevokedAt() != null ? Timestamp.valueOf(rt.getRevokedAt()) : null,
                rt.getRevokedReason(), rt.getId());
        return rt;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM refresh_tokens WHERE id = ?", id);
    }
}
