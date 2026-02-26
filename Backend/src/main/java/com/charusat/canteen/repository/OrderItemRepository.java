package com.charusat.canteen.repository;

import com.charusat.canteen.model.OrderItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderItemRepository {

    private final JdbcTemplate jdbc;

    public OrderItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<OrderItem> rowMapper = (rs, rowNum) -> {
        OrderItem oi = new OrderItem();
        oi.setId(rs.getLong("id"));
        long orderId = rs.getLong("order_id");
        oi.setOrderId(rs.wasNull() ? null : orderId);
        long menuItemId = rs.getLong("menu_item_id");
        oi.setMenuItemId(rs.wasNull() ? null : menuItemId);
        oi.setQuantity(rs.getInt("quantity"));
        oi.setUnitPrice(rs.getBigDecimal("unit_price"));
        oi.setTotalPrice(rs.getBigDecimal("total_price"));
        oi.setNotes(rs.getString("notes"));
        return oi;
    };

    public List<OrderItem> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM order_items WHERE order_id = ?", rowMapper, orderId);
    }

    public Optional<OrderItem> findById(Long id) {
        List<OrderItem> results = jdbc.query("SELECT * FROM order_items WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public OrderItem save(OrderItem oi) {
        if (oi.getId() == null) {
            return insert(oi);
        } else {
            return update(oi);
        }
    }

    private OrderItem insert(OrderItem oi) {
        String sql = "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, oi.getOrderId());
            ps.setObject(2, oi.getMenuItemId());
            ps.setInt(3, oi.getQuantity());
            ps.setBigDecimal(4, oi.getUnitPrice());
            ps.setBigDecimal(5, oi.getTotalPrice());
            ps.setString(6, oi.getNotes());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) oi.setId(key.longValue());
        return oi;
    }

    private OrderItem update(OrderItem oi) {
        jdbc.update("UPDATE order_items SET quantity=?, unit_price=?, total_price=?, notes=? WHERE id=?",
                oi.getQuantity(), oi.getUnitPrice(), oi.getTotalPrice(), oi.getNotes(), oi.getId());
        return oi;
    }

    public void deleteByOrderId(Long orderId) {
        jdbc.update("DELETE FROM order_items WHERE order_id = ?", orderId);
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM order_items WHERE id = ?", id);
    }
}
