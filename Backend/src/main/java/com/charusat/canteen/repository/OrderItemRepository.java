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

    public static final RowMapper<OrderItem> ROW_MAPPER = (rs, rowNum) -> {
        OrderItem oi = new OrderItem();
        oi.setId(rs.getLong("id"));
        oi.setOrderId(rs.getObject("order_id") != null ? rs.getLong("order_id") : null);
        oi.setMenuItemId(rs.getObject("menu_item_id") != null ? rs.getLong("menu_item_id") : null);
        oi.setQuantity(rs.getInt("quantity"));
        oi.setUnitPrice(rs.getBigDecimal("unit_price"));
        oi.setTotalPrice(rs.getBigDecimal("total_price"));
        oi.setNotes(rs.getString("notes"));
        return oi;
    };

    public Optional<OrderItem> findById(Long id) {
        List<OrderItem> list = jdbc.query("SELECT * FROM order_items WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<OrderItem> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM order_items WHERE order_id = ?", ROW_MAPPER, orderId);
    }

    public List<OrderItem> findAll() {
        return jdbc.query("SELECT * FROM order_items", ROW_MAPPER);
    }

    public OrderItem save(OrderItem oi) {
        if (oi.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, notes) VALUES (?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, oi.getOrderId());
                ps.setObject(2, oi.getMenuItemId());
                ps.setInt(3, oi.getQuantity());
                ps.setBigDecimal(4, oi.getUnitPrice());
                ps.setBigDecimal(5, oi.getTotalPrice());
                ps.setString(6, oi.getNotes());
                return ps;
            }, kh);
            oi.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE order_items SET order_id=?, menu_item_id=?, quantity=?, unit_price=?, total_price=?, notes=? WHERE id=?",
                    oi.getOrderId(), oi.getMenuItemId(), oi.getQuantity(), oi.getUnitPrice(), oi.getTotalPrice(),
                    oi.getNotes(), oi.getId());
        }
        return oi;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM order_items WHERE id = ?", id);
    }

    public void deleteByOrderId(Long orderId) {
        jdbc.update("DELETE FROM order_items WHERE order_id = ?", orderId);
    }
}
