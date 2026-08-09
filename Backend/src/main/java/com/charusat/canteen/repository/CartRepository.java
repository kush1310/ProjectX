package com.charusat.canteen.repository;

import com.charusat.canteen.model.Cart;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CartRepository {

    private final JdbcTemplate jdbc;

    public CartRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<Cart> ROW_MAPPER = (rs, rowNum) -> {
        Cart c = new Cart();
        c.setId(rs.getLong("id"));
        c.setUserId(rs.getObject("user_id") != null ? rs.getLong("user_id") : null);
        c.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
        c.setTotalAmount(rs.getBigDecimal("total_amount"));
        String couponId = rs.getString("applied_coupon_id");
        c.setAppliedCouponId(couponId != null ? UUID.fromString(couponId) : null);
        c.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        c.setFinalAmount(rs.getBigDecimal("final_amount"));
        c.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        c.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null);
        c.setItems(new ArrayList<>());
        return c;
    };

    public Optional<Cart> findById(Long id) {
        List<Cart> list = jdbc.query("SELECT * FROM carts WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<Cart> findByUserId(Long userId) {
        List<Cart> list = jdbc.query("SELECT * FROM carts WHERE user_id = ?", ROW_MAPPER, userId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Cart save(Cart c) {
        if (c.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO carts (user_id, canteen_id, total_amount, applied_coupon_id, discount_amount, final_amount, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, c.getUserId());
                ps.setObject(2, c.getCanteenId());
                ps.setBigDecimal(3, c.getTotalAmount());
                ps.setObject(4, c.getAppliedCouponId());
                ps.setBigDecimal(5, c.getDiscountAmount());
                ps.setBigDecimal(6, c.getFinalAmount());
                ps.setTimestamp(7, c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null);
                ps.setTimestamp(8, c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null);
                return ps;
            }, kh);
            c.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE carts SET user_id=?, canteen_id=?, total_amount=?, applied_coupon_id=?, discount_amount=?, final_amount=?, created_at=?, updated_at=? WHERE id=?",
                    c.getUserId(), c.getCanteenId(), c.getTotalAmount(), c.getAppliedCouponId(),
                    c.getDiscountAmount(), c.getFinalAmount(),
                    c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null,
                    c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null,
                    c.getId());
        }
        return c;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM carts WHERE id = ?", id);
    }

    public void deleteByUserId(Long userId) {
        jdbc.update("DELETE FROM carts WHERE user_id = ?", userId);
    }
}
