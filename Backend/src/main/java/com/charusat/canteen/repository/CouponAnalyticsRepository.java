package com.charusat.canteen.repository;

import com.charusat.canteen.model.CouponAnalytics;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CouponAnalyticsRepository {

    private final JdbcTemplate jdbc;

    public CouponAnalyticsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<CouponAnalytics> ROW_MAPPER = (rs, rowNum) -> {
        CouponAnalytics ca = new CouponAnalytics();
        ca.setId(rs.getLong("id"));
        ca.setCouponId(UUID.fromString(rs.getString("coupon_id")));
        ca.setSnapshotDate(rs.getDate("snapshot_date") != null ? rs.getDate("snapshot_date").toLocalDate() : null);
        ca.setTimesUsed(rs.getInt("times_used"));
        ca.setTotalDiscountGiven(rs.getBigDecimal("total_discount_given"));
        ca.setTotalOrderValue(rs.getBigDecimal("total_order_value"));
        ca.setNewCustomersGained(rs.getInt("new_customers_gained"));
        ca.setRepeatCustomersCount(rs.getInt("repeat_customers_count"));
        return ca;
    };

    public Optional<CouponAnalytics> findById(Long id) {
        List<CouponAnalytics> list = jdbc.query("SELECT * FROM coupon_analytics WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<CouponAnalytics> findByCouponIdAndSnapshotDateBetween(UUID couponId, LocalDate start, LocalDate end) {
        return jdbc.query("SELECT * FROM coupon_analytics WHERE coupon_id = ?::uuid AND snapshot_date BETWEEN ? AND ?",
                ROW_MAPPER, couponId.toString(), Date.valueOf(start), Date.valueOf(end));
    }

    public List<CouponAnalytics> findBySnapshotDateBetween(LocalDate start, LocalDate end) {
        return jdbc.query("SELECT * FROM coupon_analytics WHERE snapshot_date BETWEEN ? AND ?",
                ROW_MAPPER, Date.valueOf(start), Date.valueOf(end));
    }

    public BigDecimal totalDiscountInPeriod(LocalDate start, LocalDate end) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(total_discount_given), 0) FROM coupon_analytics WHERE snapshot_date BETWEEN ? AND ?",
                BigDecimal.class, Date.valueOf(start), Date.valueOf(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal totalOrderValueInPeriod(LocalDate start, LocalDate end) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(total_order_value), 0) FROM coupon_analytics WHERE snapshot_date BETWEEN ? AND ?",
                BigDecimal.class, Date.valueOf(start), Date.valueOf(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    public long totalUsageInPeriod(LocalDate start, LocalDate end) {
        Long c = jdbc.queryForObject(
                "SELECT COALESCE(SUM(times_used), 0) FROM coupon_analytics WHERE snapshot_date BETWEEN ? AND ?",
                Long.class, Date.valueOf(start), Date.valueOf(end));
        return c != null ? c : 0;
    }

    public List<CouponAnalytics> findAll() {
        return jdbc.query("SELECT * FROM coupon_analytics", ROW_MAPPER);
    }

    public CouponAnalytics save(CouponAnalytics ca) {
        if (ca.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO coupon_analytics (coupon_id, snapshot_date, times_used, total_discount_given, total_order_value, new_customers_gained, repeat_customers_count) VALUES (?::uuid,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, ca.getCouponId().toString());
                ps.setDate(2, ca.getSnapshotDate() != null ? Date.valueOf(ca.getSnapshotDate()) : null);
                ps.setInt(3, ca.getTimesUsed() != null ? ca.getTimesUsed() : 0);
                ps.setBigDecimal(4, ca.getTotalDiscountGiven());
                ps.setBigDecimal(5, ca.getTotalOrderValue());
                ps.setInt(6, ca.getNewCustomersGained() != null ? ca.getNewCustomersGained() : 0);
                ps.setInt(7, ca.getRepeatCustomersCount() != null ? ca.getRepeatCustomersCount() : 0);
                return ps;
            }, kh);
            ca.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE coupon_analytics SET coupon_id=?::uuid, snapshot_date=?, times_used=?, total_discount_given=?, total_order_value=?, new_customers_gained=?, repeat_customers_count=? WHERE id=?",
                    ca.getCouponId().toString(),
                    ca.getSnapshotDate() != null ? Date.valueOf(ca.getSnapshotDate()) : null,
                    ca.getTimesUsed(), ca.getTotalDiscountGiven(), ca.getTotalOrderValue(),
                    ca.getNewCustomersGained(), ca.getRepeatCustomersCount(), ca.getId());
        }
        return ca;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM coupon_analytics WHERE id = ?", id);
    }
}
