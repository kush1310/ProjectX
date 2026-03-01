package com.charusat.canteen.repository;

import com.charusat.canteen.model.CouponApplicability;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CouponApplicabilityRepository {

    private final JdbcTemplate jdbc;

    public CouponApplicabilityRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<CouponApplicability> ROW_MAPPER = (rs, rowNum) -> {
        CouponApplicability ca = new CouponApplicability();
        ca.setId(rs.getLong("id"));
        ca.setCouponId(UUID.fromString(rs.getString("coupon_id")));
        ca.setMenuItemId(rs.getObject("menu_item_id") != null ? rs.getLong("menu_item_id") : null);
        ca.setRequiredQty(rs.getObject("required_qty") != null ? rs.getInt("required_qty") : 1);
        return ca;
    };

    public Optional<CouponApplicability> findById(Long id) {
        List<CouponApplicability> list = jdbc.query("SELECT * FROM coupon_applicability WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<CouponApplicability> findByCouponId(UUID couponId) {
        return jdbc.query("SELECT * FROM coupon_applicability WHERE coupon_id = ?::uuid", ROW_MAPPER,
                couponId.toString());
    }

    @Transactional
    public void deleteByCouponId(UUID couponId) {
        jdbc.update("DELETE FROM coupon_applicability WHERE coupon_id = ?::uuid", couponId.toString());
    }

    public List<CouponApplicability> findByCouponIdAndMenuItemIdIn(UUID couponId, List<Long> menuItemIds) {
        if (menuItemIds == null || menuItemIds.isEmpty())
            return List.of();
        String placeholders = String.join(",",
                menuItemIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.toList()));
        return jdbc.query(
                "SELECT * FROM coupon_applicability WHERE coupon_id = ?::uuid AND menu_item_id IN (" + placeholders
                        + ")",
                ROW_MAPPER, couponId.toString());
    }

    public long countByCouponId(UUID couponId) {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupon_applicability WHERE coupon_id = ?::uuid", Long.class,
                couponId.toString());
        return c != null ? c : 0;
    }

    public List<CouponApplicability> findAll() {
        return jdbc.query("SELECT * FROM coupon_applicability", ROW_MAPPER);
    }

    public CouponApplicability save(CouponApplicability ca) {
        if (ca.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO coupon_applicability (coupon_id, menu_item_id, required_qty) VALUES (?::uuid,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, ca.getCouponId().toString());
                ps.setObject(2, ca.getMenuItemId());
                ps.setObject(3, ca.getRequiredQty());
                return ps;
            }, kh);
            ca.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE coupon_applicability SET coupon_id=?::uuid, menu_item_id=?, required_qty=? WHERE id=?",
                    ca.getCouponId().toString(), ca.getMenuItemId(), ca.getRequiredQty(), ca.getId());
        }
        return ca;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM coupon_applicability WHERE id = ?", id);
    }

    public List<CouponApplicability> saveAll(List<CouponApplicability> items) {
        List<CouponApplicability> result = new java.util.ArrayList<>();
        for (CouponApplicability item : items) {
            result.add(save(item));
        }
        return result;
    }
}
