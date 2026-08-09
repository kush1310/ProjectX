package com.charusat.canteen.repository;

import com.charusat.canteen.model.RefreshToken;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class RefreshTokenRepository {

    private final JdbcTemplate jdbc;

    public RefreshTokenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<RefreshToken> ROW_MAPPER = (rs, rowNum) -> {
        RefreshToken rt = new RefreshToken();
        rt.setId(rs.getLong("id"));
        rt.setTokenHash(rs.getString("token_hash"));
        rt.setUserId(rs.getObject("user_id") != null ? rs.getLong("user_id") : null);
        rt.setExpiresAt(rs.getTimestamp("expires_at") != null ? rs.getTimestamp("expires_at").toLocalDateTime() : null);
        rt.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        rt.setDeviceInfo(rs.getString("device_info"));
        rt.setIpAddress(rs.getString("ip_address"));
        rt.setRevoked(rs.getObject("revoked", Boolean.class));
        rt.setRevokedAt(rs.getTimestamp("revoked_at") != null ? rs.getTimestamp("revoked_at").toLocalDateTime() : null);
        rt.setRevokedReason(rs.getString("revoked_reason"));
        return rt;
    };

    public Optional<RefreshToken> findById(Long id) {
        List<RefreshToken> list = jdbc.query("SELECT * FROM refresh_tokens WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        List<RefreshToken> list = jdbc.query("SELECT * FROM refresh_tokens WHERE token_hash = ?", ROW_MAPPER,
                tokenHash);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<RefreshToken> findByUserAndRevokedFalse(User user) {
        return jdbc.query("SELECT * FROM refresh_tokens WHERE user_id = ? AND revoked = false", ROW_MAPPER,
                user.getId());
    }

    @Transactional
    public int revokeAllByUser(User user, LocalDateTime revokedAt, String reason) {
        return jdbc.update(
                "UPDATE refresh_tokens SET revoked = true, revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked = false",
                Timestamp.valueOf(revokedAt), reason, user.getId());
    }

    @Transactional
    public int deleteExpiredTokens(LocalDateTime cutoff) {
        return jdbc.update("DELETE FROM refresh_tokens WHERE expires_at < ?", Timestamp.valueOf(cutoff));
    }

    public long countByUserAndRevokedFalse(User user) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM refresh_tokens WHERE user_id = ? AND revoked = false",
                Long.class, user.getId());
        return c != null ? c : 0;
    }

    public RefreshToken save(RefreshToken rt) {
        if (rt.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO refresh_tokens (token_hash, user_id, expires_at, created_at, device_info, ip_address, revoked, revoked_at, revoked_reason) VALUES (?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, rt.getTokenHash());
                ps.setObject(2, rt.getUserId());
                ps.setTimestamp(3, rt.getExpiresAt() != null ? Timestamp.valueOf(rt.getExpiresAt()) : null);
                ps.setTimestamp(4, rt.getCreatedAt() != null ? Timestamp.valueOf(rt.getCreatedAt()) : null);
                ps.setString(5, rt.getDeviceInfo());
                ps.setString(6, rt.getIpAddress());
                ps.setObject(7, rt.getRevoked());
                ps.setTimestamp(8, rt.getRevokedAt() != null ? Timestamp.valueOf(rt.getRevokedAt()) : null);
                ps.setString(9, rt.getRevokedReason());
                return ps;
            }, kh);
            rt.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE refresh_tokens SET token_hash=?, user_id=?, expires_at=?, created_at=?, device_info=?, ip_address=?, revoked=?, revoked_at=?, revoked_reason=? WHERE id=?",
                    rt.getTokenHash(), rt.getUserId(),
                    rt.getExpiresAt() != null ? Timestamp.valueOf(rt.getExpiresAt()) : null,
                    rt.getCreatedAt() != null ? Timestamp.valueOf(rt.getCreatedAt()) : null,
                    rt.getDeviceInfo(), rt.getIpAddress(), rt.getRevoked(),
                    rt.getRevokedAt() != null ? Timestamp.valueOf(rt.getRevokedAt()) : null,
                    rt.getRevokedReason(), rt.getId());
        }
        return rt;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM refresh_tokens WHERE id = ?", id);
    }

    public List<RefreshToken> findAll() {
        return jdbc.query("SELECT * FROM refresh_tokens", ROW_MAPPER);
    }
}
