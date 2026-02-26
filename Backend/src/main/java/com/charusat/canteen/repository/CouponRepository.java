package com.charusat.canteen.repository;

import com.charusat.canteen.model.Coupon;
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
public class CouponRepository {

    private final JdbcTemplate jdbc;

    public CouponRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Coupon> rowMapper = (rs, rowNum) -> {
        Coupon c = new Coupon();
        c.setId(rs.getLong("id"));
        c.setCode(rs.getString("code"));
        c.setTitle(rs.getString("title"));
        c.setDescription(rs.getString("description"));
        c.setColor(rs.getString("color"));
        String dt = rs.getString("discount_type");
        c.setDiscountType(dt != null ? Coupon.DiscountType.valueOf(dt) : null);
        c.setDiscountValue(rs.getBigDecimal("discount_value"));
        c.setMinOrderValue(rs.getBigDecimal("min_order_value"));
        c.setMaxDiscountAmount(rs.getBigDecimal("max_discount_amount"));
        Timestamp validFrom = rs.getTimestamp("valid_from");
        c.setValidFrom(validFrom != null ? validFrom.toLocalDateTime() : null);
        Timestamp validUntil = rs.getTimestamp("valid_until");
        c.setValidUntil(validUntil != null ? validUntil.toLocalDateTime() : null);
        c.setUsageLimit(rs.getObject("usage_limit", Integer.class));
        c.setUsageCount(rs.getObject("usage_count", Integer.class));
        c.setIsActive(rs.getObject("is_active", Boolean.class));
        c.setIsCustom(rs.getObject("is_custom", Boolean.class));
        long canteenId = rs.getLong("canteen_id");
        c.setCanteenId(rs.wasNull() ? null : canteenId);
        String type = rs.getString("type");
        c.setType(type != null ? Coupon.CouponType.valueOf(type) : Coupon.CouponType.DISCOUNT);
        String scope = rs.getString("scope");
        c.setScope(scope != null ? Coupon.Scope.valueOf(scope) : Coupon.Scope.GLOBAL);
        c.setTargetIds(rs.getString("target_ids"));
        c.setBogoBuyQty(rs.getObject("bogo_buy_qty", Integer.class));
        c.setBogoGetQty(rs.getObject("bogo_get_qty", Integer.class));
        return c;
    };

    public Optional<Coupon> findById(Long id) {
        List<Coupon> results = jdbc.query("SELECT * FROM coupons WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupons", Long.class);
        return c != null ? c : 0;
    }

    public List<Coupon> findAll() {
        return jdbc.query("SELECT * FROM coupons", rowMapper);
    }

    public List<Coupon> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM coupons WHERE canteen_id = ?", rowMapper, canteenId);
    }

    public boolean existsByCode(String code) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE code = ?", Integer.class, code);
        return count != null && count > 0;
    }

    public Coupon save(Coupon c) {
        if (c.getId() == null) {
            return insert(c);
        } else {
            return update(c);
        }
    }

    private Coupon insert(Coupon c) {
        String sql = "INSERT INTO coupons (code, title, description, color, discount_type, discount_value, " +
                "min_order_value, max_discount_amount, valid_from, valid_until, usage_limit, usage_count, " +
                "is_active, is_custom, canteen_id, type, scope, target_ids, bogo_buy_qty, bogo_get_qty) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, c.getCode());
            ps.setString(2, c.getTitle());
            ps.setString(3, c.getDescription());
            ps.setString(4, c.getColor());
            ps.setString(5, c.getDiscountType() != null ? c.getDiscountType().name() : null);
            ps.setBigDecimal(6, c.getDiscountValue());
            ps.setBigDecimal(7, c.getMinOrderValue());
            ps.setBigDecimal(8, c.getMaxDiscountAmount());
            ps.setTimestamp(9, c.getValidFrom() != null ? Timestamp.valueOf(c.getValidFrom()) : null);
            ps.setTimestamp(10, c.getValidUntil() != null ? Timestamp.valueOf(c.getValidUntil()) : null);
            ps.setObject(11, c.getUsageLimit());
            ps.setObject(12, c.getUsageCount() != null ? c.getUsageCount() : 0);
            ps.setObject(13, c.getIsActive() != null ? c.getIsActive() : true);
            ps.setObject(14, c.getIsCustom() != null ? c.getIsCustom() : true);
            ps.setObject(15, c.getCanteenId());
            ps.setString(16, c.getType() != null ? c.getType().name() : "DISCOUNT");
            ps.setString(17, c.getScope() != null ? c.getScope().name() : "GLOBAL");
            ps.setString(18, c.getTargetIds());
            ps.setObject(19, c.getBogoBuyQty());
            ps.setObject(20, c.getBogoGetQty());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) c.setId(key.longValue());
        return c;
    }

    private Coupon update(Coupon c) {
        String sql = "UPDATE coupons SET code=?, title=?, description=?, color=?, discount_type=?, discount_value=?, " +
                "min_order_value=?, max_discount_amount=?, valid_from=?, valid_until=?, usage_limit=?, usage_count=?, " +
                "is_active=?, is_custom=?, canteen_id=?, type=?, scope=?, target_ids=?, bogo_buy_qty=?, bogo_get_qty=? WHERE id=?";
        jdbc.update(sql, c.getCode(), c.getTitle(), c.getDescription(), c.getColor(),
                c.getDiscountType() != null ? c.getDiscountType().name() : null,
                c.getDiscountValue(), c.getMinOrderValue(), c.getMaxDiscountAmount(),
                c.getValidFrom() != null ? Timestamp.valueOf(c.getValidFrom()) : null,
                c.getValidUntil() != null ? Timestamp.valueOf(c.getValidUntil()) : null,
                c.getUsageLimit(), c.getUsageCount(), c.getIsActive(), c.getIsCustom(),
                c.getCanteenId(),
                c.getType() != null ? c.getType().name() : "DISCOUNT",
                c.getScope() != null ? c.getScope().name() : "GLOBAL",
                c.getTargetIds(), c.getBogoBuyQty(), c.getBogoGetQty(), c.getId());
        return c;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM coupons WHERE id = ?", id);
    }
}
