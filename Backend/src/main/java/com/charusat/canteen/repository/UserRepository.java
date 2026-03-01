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

    private static final RowMapper<User> ROW_MAPPER = (rs, rowNum) -> {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setEmail(rs.getString("email"));
        u.setPassword(rs.getString("password"));
        u.setFullName(rs.getString("full_name"));
        u.setMobile(rs.getString("mobile"));
        u.setRole(rs.getString("role") != null ? User.UserRole.valueOf(rs.getString("role")) : User.UserRole.USER);
        u.setAuthProvider(
                rs.getString("auth_provider") != null ? User.AuthProvider.valueOf(rs.getString("auth_provider"))
                        : User.AuthProvider.LOCAL);
        u.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        u.setLastLogin(rs.getTimestamp("last_login") != null ? rs.getTimestamp("last_login").toLocalDateTime() : null);
        u.setIsActive(rs.getObject("is_active", Boolean.class));
        u.setLockedUntil(
                rs.getTimestamp("locked_until") != null ? rs.getTimestamp("locked_until").toLocalDateTime() : null);
        u.setProfileImage(rs.getString("profile_image"));
        u.setIsEmailVerified(rs.getObject("is_email_verified", Boolean.class));
        u.setEmailVerificationToken(rs.getString("email_verification_token"));
        u.setEmailVerificationExpiry(rs.getTimestamp("email_verification_expiry") != null
                ? rs.getTimestamp("email_verification_expiry").toLocalDateTime()
                : null);
        u.setLastPasswordChange(rs.getTimestamp("last_password_change") != null
                ? rs.getTimestamp("last_password_change").toLocalDateTime()
                : null);
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
        u.setProfileImageType(rs.getString("profile_image_type"));
        // Note: profileImageData (bytea) not loaded by default for performance
        return u;
    };

    public Optional<User> findById(Long id) {
        List<User> list = jdbc.query("SELECT * FROM users WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findByEmail(String email) {
        List<User> list = jdbc.query("SELECT * FROM users WHERE email = ?", ROW_MAPPER, email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public Optional<User> findByEmailAndIsActiveTrue(String email) {
        List<User> list = jdbc.query("SELECT * FROM users WHERE email = ? AND is_active = true", ROW_MAPPER, email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findByEmailIgnoreCase(String email) {
        List<User> list = jdbc.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", ROW_MAPPER, email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findByEmailVerificationToken(String token) {
        List<User> list = jdbc.query("SELECT * FROM users WHERE email_verification_token = ?", ROW_MAPPER, token);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<User> findAll() {
        return jdbc.query("SELECT * FROM users", ROW_MAPPER);
    }

    public User save(User user) {
        if (user.getId() == null) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO users (email, password, full_name, mobile, role, auth_provider, created_at, last_login, is_active, locked_until, profile_image, is_email_verified, email_verification_token, email_verification_expiry, last_password_change, mfa_enabled, mfa_secret, date_of_birth, anniversary, gender, user_type, hostel_name, room_number, building_number, department, staff_room_number, profile_image_data, profile_image_type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                setUserPs(ps, user);
                return ps;
            }, keyHolder);
            user.setId(((Number) keyHolder.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE users SET email=?, password=?, full_name=?, mobile=?, role=?, auth_provider=?, created_at=?, last_login=?, is_active=?, locked_until=?, profile_image=?, is_email_verified=?, email_verification_token=?, email_verification_expiry=?, last_password_change=?, mfa_enabled=?, mfa_secret=?, date_of_birth=?, anniversary=?, gender=?, user_type=?, hostel_name=?, room_number=?, building_number=?, department=?, staff_room_number=?, profile_image_data=?, profile_image_type=? WHERE id=?",
                    user.getEmail(), user.getPassword(), user.getFullName(), user.getMobile(),
                    user.getRole() != null ? user.getRole().name() : "USER",
                    user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL",
                    user.getCreatedAt() != null ? Timestamp.valueOf(user.getCreatedAt()) : null,
                    user.getLastLogin() != null ? Timestamp.valueOf(user.getLastLogin()) : null,
                    user.getIsActive(), user.getLockedUntil() != null ? Timestamp.valueOf(user.getLockedUntil()) : null,
                    user.getProfileImage(), user.getIsEmailVerified(), user.getEmailVerificationToken(),
                    user.getEmailVerificationExpiry() != null ? Timestamp.valueOf(user.getEmailVerificationExpiry())
                            : null,
                    user.getLastPasswordChange() != null ? Timestamp.valueOf(user.getLastPasswordChange()) : null,
                    user.getMfaEnabled(), user.getMfaSecret(), user.getDateOfBirth(), user.getAnniversary(),
                    user.getGender(), user.getUserType(), user.getHostelName(), user.getRoomNumber(),
                    user.getBuildingNumber(), user.getDepartment(), user.getStaffRoomNumber(),
                    user.getProfileImageData(), user.getProfileImageType(),
                    user.getId());
        }
        return user;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM users WHERE id = ?", id);
    }

    public boolean existsById(Long id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    private void setUserPs(PreparedStatement ps, User u) throws java.sql.SQLException {
        ps.setString(1, u.getEmail());
        ps.setString(2, u.getPassword());
        ps.setString(3, u.getFullName());
        ps.setString(4, u.getMobile());
        ps.setString(5, u.getRole() != null ? u.getRole().name() : "USER");
        ps.setString(6, u.getAuthProvider() != null ? u.getAuthProvider().name() : "LOCAL");
        ps.setTimestamp(7, u.getCreatedAt() != null ? Timestamp.valueOf(u.getCreatedAt()) : null);
        ps.setTimestamp(8, u.getLastLogin() != null ? Timestamp.valueOf(u.getLastLogin()) : null);
        ps.setObject(9, u.getIsActive());
        ps.setTimestamp(10, u.getLockedUntil() != null ? Timestamp.valueOf(u.getLockedUntil()) : null);
        ps.setString(11, u.getProfileImage());
        ps.setObject(12, u.getIsEmailVerified());
        ps.setString(13, u.getEmailVerificationToken());
        ps.setTimestamp(14,
                u.getEmailVerificationExpiry() != null ? Timestamp.valueOf(u.getEmailVerificationExpiry()) : null);
        ps.setTimestamp(15, u.getLastPasswordChange() != null ? Timestamp.valueOf(u.getLastPasswordChange()) : null);
        ps.setObject(16, u.getMfaEnabled());
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
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        return c != null ? c : 0;
    }
}
