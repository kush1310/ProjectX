package com.charusat.canteen.repository;

import com.charusat.canteen.model.LoginAttempt;
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

@Repository
public class LoginAttemptRepository {

    private final JdbcTemplate jdbc;

    public LoginAttemptRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<LoginAttempt> rowMapper = (rs, rowNum) -> {
        LoginAttempt la = new LoginAttempt();
        la.setId(rs.getLong("id"));
        la.setEmail(rs.getString("email"));
        la.setIpAddress(rs.getString("ip_address"));
        la.setUserAgent(rs.getString("user_agent"));
        Timestamp attemptedAt = rs.getTimestamp("attempted_at");
        la.setAttemptedAt(attemptedAt != null ? attemptedAt.toLocalDateTime() : null);
        la.setSuccessful(rs.getObject("successful", Boolean.class));
        la.setFailureReason(rs.getString("failure_reason"));
        String type = rs.getString("attempt_type");
        la.setAttemptType(type != null ? LoginAttempt.AttemptType.valueOf(type) : LoginAttempt.AttemptType.LOGIN);
        la.setCountryCode(rs.getString("country_code"));
        la.setSuspicious(rs.getObject("suspicious", Boolean.class));
        return la;
    };

    public LoginAttempt save(LoginAttempt la) {
        if (la.getId() == null) {
            return insert(la);
        }
        return la;
    }

    private LoginAttempt insert(LoginAttempt la) {
        String sql = "INSERT INTO login_attempts (email, ip_address, user_agent, attempted_at, successful, " +
                "failure_reason, attempt_type, country_code, suspicious) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, la.getEmail());
            ps.setString(2, la.getIpAddress());
            ps.setString(3, la.getUserAgent());
            ps.setTimestamp(4, la.getAttemptedAt() != null ? Timestamp.valueOf(la.getAttemptedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            ps.setObject(5, la.getSuccessful() != null ? la.getSuccessful() : false);
            ps.setString(6, la.getFailureReason());
            ps.setString(7, la.getAttemptType() != null ? la.getAttemptType().name() : "LOGIN");
            ps.setString(8, la.getCountryCode());
            ps.setObject(9, la.getSuspicious());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) la.setId(key.longValue());
        return la;
    }

    public long countFailedAttemptsSince(String email, LocalDateTime since) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE email = ? AND successful = false AND attempted_at > ?",
                Long.class, email, Timestamp.valueOf(since));
        return count != null ? count : 0;
    }

    public long countFailedAttemptsFromIpSince(String ip, LocalDateTime since) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND successful = false AND attempted_at > ?",
                Long.class, ip, Timestamp.valueOf(since));
        return count != null ? count : 0;
    }

    public List<LoginAttempt> findTop10ByEmailOrderByAttemptedAtDesc(String email) {
        return jdbc.query("SELECT * FROM login_attempts WHERE email = ? ORDER BY attempted_at DESC LIMIT 10",
                rowMapper, email);
    }

    public List<LoginAttempt> findTop10ByIpAddressOrderByAttemptedAtDesc(String ipAddress) {
        return jdbc.query("SELECT * FROM login_attempts WHERE ip_address = ? ORDER BY attempted_at DESC LIMIT 10",
                rowMapper, ipAddress);
    }

    public void deleteByAttemptedAtBefore(LocalDateTime cutoff) {
        jdbc.update("DELETE FROM login_attempts WHERE attempted_at < ?", Timestamp.valueOf(cutoff));
    }

    public boolean hasSuccessfulLoginSince(String email, LocalDateTime since) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE email = ? AND successful = true AND attempted_at > ?",
                Long.class, email, Timestamp.valueOf(since));
        return count != null && count > 0;
    }
}
