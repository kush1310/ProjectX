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
import java.util.Optional;

@Repository
public class LoginAttemptRepository {

    private final JdbcTemplate jdbc;

    public LoginAttemptRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<LoginAttempt> ROW_MAPPER = (rs, rowNum) -> {
        LoginAttempt la = new LoginAttempt();
        la.setId(rs.getLong("id"));
        la.setEmail(rs.getString("email"));
        la.setIpAddress(rs.getString("ip_address"));
        la.setUserAgent(rs.getString("user_agent"));
        la.setAttemptedAt(
                rs.getTimestamp("attempted_at") != null ? rs.getTimestamp("attempted_at").toLocalDateTime() : null);
        la.setSuccessful(rs.getObject("successful", Boolean.class));
        la.setFailureReason(rs.getString("failure_reason"));
        la.setAttemptType(
                rs.getString("attempt_type") != null ? LoginAttempt.AttemptType.valueOf(rs.getString("attempt_type"))
                        : LoginAttempt.AttemptType.LOGIN);
        la.setCountryCode(rs.getString("country_code"));
        la.setSuspicious(rs.getObject("suspicious", Boolean.class));
        return la;
    };

    public Optional<LoginAttempt> findById(Long id) {
        List<LoginAttempt> list = jdbc.query("SELECT * FROM login_attempts WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public long countFailedAttemptsSince(String email, LocalDateTime since) {
        Long c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE email = ? AND successful = false AND attempted_at > ?",
                Long.class, email, Timestamp.valueOf(since));
        return c != null ? c : 0;
    }

    public long countFailedAttemptsFromIpSince(String ip, LocalDateTime since) {
        Long c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND successful = false AND attempted_at > ?",
                Long.class, ip, Timestamp.valueOf(since));
        return c != null ? c : 0;
    }

    public List<LoginAttempt> findTop10ByEmailOrderByAttemptedAtDesc(String email) {
        return jdbc.query("SELECT * FROM login_attempts WHERE email = ? ORDER BY attempted_at DESC LIMIT 10",
                ROW_MAPPER, email);
    }

    public List<LoginAttempt> findTop10ByIpAddressOrderByAttemptedAtDesc(String ipAddress) {
        return jdbc.query("SELECT * FROM login_attempts WHERE ip_address = ? ORDER BY attempted_at DESC LIMIT 10",
                ROW_MAPPER, ipAddress);
    }

    public void deleteByAttemptedAtBefore(LocalDateTime cutoff) {
        jdbc.update("DELETE FROM login_attempts WHERE attempted_at < ?", Timestamp.valueOf(cutoff));
    }

    public boolean hasSuccessfulLoginSince(String email, LocalDateTime since) {
        Long c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM login_attempts WHERE email = ? AND successful = true AND attempted_at > ?",
                Long.class, email, Timestamp.valueOf(since));
        return c != null && c > 0;
    }

    public LoginAttempt save(LoginAttempt la) {
        if (la.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO login_attempts (email, ip_address, user_agent, attempted_at, successful, failure_reason, attempt_type, country_code, suspicious) VALUES (?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, la.getEmail());
                ps.setString(2, la.getIpAddress());
                ps.setString(3, la.getUserAgent());
                ps.setTimestamp(4, la.getAttemptedAt() != null ? Timestamp.valueOf(la.getAttemptedAt()) : null);
                ps.setObject(5, la.getSuccessful());
                ps.setString(6, la.getFailureReason());
                ps.setString(7, la.getAttemptType() != null ? la.getAttemptType().name() : "LOGIN");
                ps.setString(8, la.getCountryCode());
                ps.setObject(9, la.getSuspicious());
                return ps;
            }, kh);
            la.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE login_attempts SET email=?, ip_address=?, user_agent=?, attempted_at=?, successful=?, failure_reason=?, attempt_type=?, country_code=?, suspicious=? WHERE id=?",
                    la.getEmail(), la.getIpAddress(), la.getUserAgent(),
                    la.getAttemptedAt() != null ? Timestamp.valueOf(la.getAttemptedAt()) : null,
                    la.getSuccessful(), la.getFailureReason(),
                    la.getAttemptType() != null ? la.getAttemptType().name() : "LOGIN",
                    la.getCountryCode(), la.getSuspicious(), la.getId());
        }
        return la;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM login_attempts WHERE id = ?", id);
    }

    public List<LoginAttempt> findAll() {
        return jdbc.query("SELECT * FROM login_attempts", ROW_MAPPER);
    }
}
