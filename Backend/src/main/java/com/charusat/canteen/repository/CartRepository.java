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

@Repository
public class CartRepository {

    private final JdbcTemplate jdbc;

    public CartRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Cart> rowMapper = (rs, rowNum) -> {
        Cart c = new Cart();
        c.setId(rs.getLong("id"));
        long userId = rs.getLong("user_id");
        c.setUserId(rs.wasNull() ? null : userId);
        long canteenId = rs.getLong("canteen_id");
        c.setCanteenId(rs.wasNull() ? null : canteenId);
        c.setTotalAmount(rs.getBigDecimal("total_amount"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        c.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        c.setUpdatedAt(updatedAt != null ? updatedAt.toLocalDateTime() : null);
        c.setItems(new ArrayList<>());
        return c;
    };

    public Optional<Cart> findById(Long id) {
        List<Cart> results = jdbc.query("SELECT * FROM carts WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public Optional<Cart> findByUserId(Long userId) {
        List<Cart> results = jdbc.query("SELECT * FROM carts WHERE user_id = ?", rowMapper, userId);
        return results.stream().findFirst();
    }

    public Cart save(Cart c) {
        if (c.getId() == null) {
            return insert(c);
        } else {
            return update(c);
        }
    }

    private Cart insert(Cart c) {
        String sql = "INSERT INTO carts (user_id, canteen_id, total_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, c.getUserId());
            ps.setObject(2, c.getCanteenId());
            ps.setBigDecimal(3, c.getTotalAmount());
            ps.setTimestamp(4, c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            ps.setTimestamp(5, c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) c.setId(key.longValue());
        return c;
    }

    private Cart update(Cart c) {
        jdbc.update("UPDATE carts SET canteen_id=?, total_amount=?, updated_at=? WHERE id=?",
                c.getCanteenId(), c.getTotalAmount(),
                c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()),
                c.getId());
        return c;
    }

    public void deleteByUserId(Long userId) {
        jdbc.update("DELETE FROM carts WHERE user_id = ?", userId);
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM carts WHERE id = ?", id);
    }
}
