package com.charusat.canteen.repository;

import com.charusat.canteen.model.CouponUsage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CouponUsageRepository {

    private final JdbcTemplate jdbc;

    public CouponUsageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @NonNull
    public static final RowMapper<CouponUsage> ROW_MAPPER = (rs, rowNum) -> {
        CouponUsage cu = new CouponUsage();
        cu.setId(rs.getLong("id"));
        cu.setCouponId(UUID.fromString(rs.getString("coupon_id")));
        cu.setUserId(rs.getObject("user_id") != null ? rs.getLong("user_id") : null);
        cu.setOrderId(rs.getObject("order_id") != null ? rs.getLong("order_id") : null);
        cu.setDiscountApplied(rs.getBigDecimal("discount_applied"));
        cu.setOrderTotal(rs.getBigDecimal("order_total"));
        cu.setUsedAt(rs.getTimestamp("used_at") != null ? rs.getTimestamp("used_at").toLocalDateTime() : null);
        return cu;
    };

    public Optional<CouponUsage> findById(Long id) {
        List<CouponUsage> list = jdbc.query("SELECT * FROM coupon_usage WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public long countByCouponIdAndUserId(UUID couponId, Long userId) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = ?::uuid AND user_id = ?",
                Long.class, couponId.toString(), userId);
        return c != null ? c : 0;
    }

    public long countByCouponId(UUID couponId) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = ?::uuid", Long.class,
                couponId.toString());
        return c != null ? c : 0;
    }

    public List<CouponUsage> findByCouponId(UUID couponId) {
        return jdbc.query("SELECT * FROM coupon_usage WHERE coupon_id = ?::uuid", ROW_MAPPER, couponId.toString());
    }

    public List<CouponUsage> findByUserId(Long userId) {
        return jdbc.query("SELECT * FROM coupon_usage WHERE user_id = ?", ROW_MAPPER, userId);
    }

    public BigDecimal totalDiscountByCouponId(UUID couponId) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(discount_applied), 0) FROM coupon_usage WHERE coupon_id = ?::uuid",
                BigDecimal.class, couponId.toString());
        return total != null ? total : BigDecimal.ZERO;
    }

    public List<CouponUsage> findByUsedAtBetween(LocalDateTime start, LocalDateTime end) {
        return jdbc.query("SELECT * FROM coupon_usage WHERE used_at BETWEEN ? AND ?", ROW_MAPPER,
                Timestamp.valueOf(start), Timestamp.valueOf(end));
    }

    public BigDecimal totalDiscountBetween(LocalDateTime start, LocalDateTime end) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(discount_applied), 0) FROM coupon_usage WHERE used_at BETWEEN ? AND ?",
                BigDecimal.class, Timestamp.valueOf(start), Timestamp.valueOf(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal totalOrderValueBetween(LocalDateTime start, LocalDateTime end) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(order_total), 0) FROM coupon_usage WHERE used_at BETWEEN ? AND ?",
                BigDecimal.class, Timestamp.valueOf(start), Timestamp.valueOf(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    public long countDistinctUsers() {
        Long c = jdbc.queryForObject("SELECT COUNT(DISTINCT user_id) FROM coupon_usage", Long.class);
        return c != null ? c : 0;
    }

    public long countPreviousUsageByUser(Long userId) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupon_usage WHERE user_id = ?", Long.class, userId);
        return c != null ? c : 0;
    }

    public long countByUserIdAndUsedAtBetween(Long userId, LocalDateTime start, LocalDateTime end) {
        Long c = jdbc.queryForObject(
                "SELECT COUNT(*) FROM coupon_usage WHERE user_id = ? AND used_at BETWEEN ? AND ?",
                Long.class, userId, Timestamp.valueOf(start), Timestamp.valueOf(end));
        return c != null ? c : 0;
    }

    public List<CouponUsage> findAll() {
        return jdbc.query("SELECT * FROM coupon_usage", ROW_MAPPER);
    }

    public CouponUsage save(CouponUsage cu) {
        if (cu.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied, order_total, used_at) VALUES (?::uuid,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, cu.getCouponId().toString());
                ps.setObject(2, cu.getUserId());
                ps.setObject(3, cu.getOrderId());
                ps.setBigDecimal(4, cu.getDiscountApplied());
                ps.setBigDecimal(5, cu.getOrderTotal());
                ps.setTimestamp(6, cu.getUsedAt() != null ? Timestamp.valueOf(cu.getUsedAt()) : null);
                return ps;
            }, kh);
            var keys = kh.getKeys();
            if (keys != null) {
                cu.setId(((Number) keys.get("id")).longValue());
            }
        } else {
            jdbc.update(
                    "UPDATE coupon_usage SET coupon_id=?::uuid, user_id=?, order_id=?, discount_applied=?, order_total=?, used_at=? WHERE id=?",
                    cu.getCouponId().toString(), cu.getUserId(), cu.getOrderId(), cu.getDiscountApplied(),
                    cu.getOrderTotal(),
                    cu.getUsedAt() != null ? Timestamp.valueOf(cu.getUsedAt()) : null, cu.getId());
        }
        return cu;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM coupon_usage WHERE id = ?", id);
    }
}
