package com.charusat.canteen.repository;

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
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<User> rowMapper = (rs, rowNum) -> {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setEmail(rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setFullName(rs.getString("full_name"));
        u.setMobile(rs.getString("mobile"));
        String role = rs.getString("role");
        u.setRole(role != null ? User.UserRole.valueOf(role) : User.UserRole.USER);
        String provider = rs.getString("auth_provider");
        u.setAuthProvider(provider != null ? User.AuthProvider.valueOf(provider) : User.AuthProvider.LOCAL);
        Timestamp createdAt = rs.getTimestamp("created_at");
        u.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        Timestamp lastLogin = rs.getTimestamp("last_login");
        u.setLastLogin(lastLogin != null ? lastLogin.toLocalDateTime() : null);
        u.setIsActive(rs.getObject("is_active", Boolean.class));
        Timestamp lockedUntil = rs.getTimestamp("locked_until");
        u.setLockedUntil(lockedUntil != null ? lockedUntil.toLocalDateTime() : null);
        u.setProfileImage(rs.getString("profile_image"));
        u.setIsEmailVerified(rs.getObject("is_email_verified", Boolean.class));
        u.setEmailVerificationToken(rs.getString("email_verification_token"));
        Timestamp evExpiry = rs.getTimestamp("email_verification_expiry");
        u.setEmailVerificationExpiry(evExpiry != null ? evExpiry.toLocalDateTime() : null);
        Timestamp lpChange = rs.getTimestamp("last_password_change");
        u.setLastPasswordChange(lpChange != null ? lpChange.toLocalDateTime() : null);
        u.setMfaEnabled(rs.getObject("mfa_enabled", Boolean.class));
        u.setMfaSecret(rs.getString("mfa_secret"));
        u.setDateOfBirth(rs.getString("date_of_birth"));
        u.setAnniversary(rs.getString("anniversary"));
        u.setGender(rs.getString("gender"));
        u.setUserType(rs.getString("user_type"));
        u.setHostelName(rs.getString("hostel_name"));
        u.setRoomNumber(rs.getString("room_number"));
        u.setBuildingNumber(rs.getString("building_number"));
        u.setDepartment(rs.getString("department"));
        u.setStaffRoomNumber(rs.getString("staff_room_number"));
        u.setProfileImageData(rs.getBytes("profile_image_data"));
        u.setProfileImageType(rs.getString("profile_image_type"));
        return u;
    };

    public Optional<User> findById(Long id) {
        List<User> results = jdbc.query("SELECT * FROM users WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public Optional<User> findByEmail(String email) {
        List<User> results = jdbc.query("SELECT * FROM users WHERE email = ?", rowMapper, email);
        return results.stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public Optional<User> findByEmailAndIsActiveTrue(String email) {
        List<User> results = jdbc.query("SELECT * FROM users WHERE email = ? AND is_active = true", rowMapper, email);
        return results.stream().findFirst();
    }

    public Optional<User> findByEmailIgnoreCase(String email) {
        List<User> results = jdbc.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", rowMapper, email);
        return results.stream().findFirst();
    }

    public Optional<User> findByEmailVerificationToken(String token) {
        List<User> results = jdbc.query("SELECT * FROM users WHERE email_verification_token = ?", rowMapper, token);
        return results.stream().findFirst();
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        return c != null ? c : 0;
    }

    public List<User> findAll() {
        return jdbc.query("SELECT * FROM users", rowMapper);
    }

    public User save(User user) {
        if (user.getId() == null) {
            return insert(user);
        } else {
            return update(user);
        }
    }

    private User insert(User u) {
        String sql = "INSERT INTO users (email, password, full_name, mobile, role, auth_provider, created_at, last_login, " +
                "is_active, locked_until, profile_image, is_email_verified, email_verification_token, email_verification_expiry, " +
                "last_password_change, mfa_enabled, mfa_secret, date_of_birth, anniversary, gender, user_type, hostel_name, " +
                "room_number, building_number, department, staff_room_number, profile_image_data, profile_image_type) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, u.getEmail());
            ps.setString(2, u.getPassword());
            ps.setString(3, u.getFullName());
            ps.setString(4, u.getMobile());
            ps.setString(5, u.getRole() != null ? u.getRole().name() : "USER");
            ps.setString(6, u.getAuthProvider() != null ? u.getAuthProvider().name() : "LOCAL");
            ps.setTimestamp(7, u.getCreatedAt() != null ? Timestamp.valueOf(u.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            ps.setTimestamp(8, u.getLastLogin() != null ? Timestamp.valueOf(u.getLastLogin()) : null);
            ps.setObject(9, u.getIsActive() != null ? u.getIsActive() : true);
            ps.setTimestamp(10, u.getLockedUntil() != null ? Timestamp.valueOf(u.getLockedUntil()) : null);
            ps.setString(11, u.getProfileImage());
            ps.setObject(12, u.getIsEmailVerified() != null ? u.getIsEmailVerified() : false);
            ps.setString(13, u.getEmailVerificationToken());
            ps.setTimestamp(14, u.getEmailVerificationExpiry() != null ? Timestamp.valueOf(u.getEmailVerificationExpiry()) : null);
            ps.setTimestamp(15, u.getLastPasswordChange() != null ? Timestamp.valueOf(u.getLastPasswordChange()) : null);
            ps.setObject(16, u.getMfaEnabled() != null ? u.getMfaEnabled() : false);
            ps.setString(17, u.getMfaSecret());
            ps.setString(18, u.getDateOfBirth());
            ps.setString(19, u.getAnniversary());
            ps.setString(20, u.getGender());
            ps.setString(21, u.getUserType());
            ps.setString(22, u.getHostelName());
            ps.setString(23, u.getRoomNumber());
            ps.setString(24, u.getBuildingNumber());
            ps.setString(25, u.getDepartment());
            ps.setString(26, u.getStaffRoomNumber());
            ps.setBytes(27, u.getProfileImageData());
            ps.setString(28, u.getProfileImageType());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) u.setId(key.longValue());
        return u;
    }

    private User update(User u) {
        String sql = "UPDATE users SET email=?, password=?, full_name=?, mobile=?, role=?, auth_provider=?, " +
                "last_login=?, is_active=?, locked_until=?, profile_image=?, is_email_verified=?, " +
                "email_verification_token=?, email_verification_expiry=?, last_password_change=?, mfa_enabled=?, " +
                "mfa_secret=?, date_of_birth=?, anniversary=?, gender=?, user_type=?, hostel_name=?, room_number=?, " +
                "building_number=?, department=?, staff_room_number=?, profile_image_data=?, profile_image_type=? WHERE id=?";
        jdbc.update(sql,
                u.getEmail(), u.getPassword(), u.getFullName(), u.getMobile(),
                u.getRole() != null ? u.getRole().name() : "USER",
                u.getAuthProvider() != null ? u.getAuthProvider().name() : "LOCAL",
                u.getLastLogin() != null ? Timestamp.valueOf(u.getLastLogin()) : null,
                u.getIsActive(), u.getLockedUntil() != null ? Timestamp.valueOf(u.getLockedUntil()) : null,
                u.getProfileImage(), u.getIsEmailVerified(), u.getEmailVerificationToken(),
                u.getEmailVerificationExpiry() != null ? Timestamp.valueOf(u.getEmailVerificationExpiry()) : null,
                u.getLastPasswordChange() != null ? Timestamp.valueOf(u.getLastPasswordChange()) : null,
                u.getMfaEnabled(), u.getMfaSecret(), u.getDateOfBirth(), u.getAnniversary(), u.getGender(),
                u.getUserType(), u.getHostelName(), u.getRoomNumber(), u.getBuildingNumber(), u.getDepartment(),
                u.getStaffRoomNumber(), u.getProfileImageData(), u.getProfileImageType(), u.getId());
        return u;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM users WHERE id = ?", id);
    }
}
