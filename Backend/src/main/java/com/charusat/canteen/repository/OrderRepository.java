package com.charusat.canteen.repository;

import com.charusat.canteen.model.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbc;

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Order> rowMapper = (rs, rowNum) -> {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        o.setOrderNumber(rs.getString("order_number"));
        long customerId = rs.getLong("customer_id");
        o.setCustomerId(rs.wasNull() ? null : customerId);
        long canteenId = rs.getLong("canteen_id");
        o.setCanteenId(rs.wasNull() ? null : canteenId);
        String status = rs.getString("status");
        o.setStatus(status != null ? Order.OrderStatus.valueOf(status) : Order.OrderStatus.PENDING);
        o.setTotalAmount(rs.getBigDecimal("total_amount"));
        o.setPaymentMethod(rs.getString("payment_method"));
        String paymentStatus = rs.getString("payment_status");
        o.setPaymentStatus(paymentStatus != null ? Order.PaymentStatus.valueOf(paymentStatus) : Order.PaymentStatus.PENDING);
        o.setSpecialInstructions(rs.getString("special_instructions"));
        o.setRejectionReason(rs.getString("rejection_reason"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        o.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        o.setUpdatedAt(updatedAt != null ? updatedAt.toLocalDateTime() : null);
        Timestamp completedAt = rs.getTimestamp("completed_at");
        o.setCompletedAt(completedAt != null ? completedAt.toLocalDateTime() : null);
        return o;
    };

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return c != null ? c : 0;
    }

    public Optional<Order> findById(Long id) {
        List<Order> results = jdbc.query("SELECT * FROM orders WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public Optional<Order> findByOrderNumber(String orderNumber) {
        List<Order> results = jdbc.query("SELECT * FROM orders WHERE order_number = ?", rowMapper, orderNumber);
        return results.stream().findFirst();
    }

    public List<Order> findByCustomerId(Long customerId) {
        return jdbc.query("SELECT * FROM orders WHERE customer_id = ?", rowMapper, customerId);
    }

    public List<Order> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ?", rowMapper, canteenId);
    }

    public List<Order> findByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND status = ?", rowMapper, canteenId, status.name());
    }

    public List<Order> findByCanteenIdAndStatusIn(Long canteenId, List<Order.OrderStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) return List.of();
        String placeholders = String.join(",", statuses.stream().map(s -> "?").toList());
        String sql = "SELECT * FROM orders WHERE canteen_id = ? AND status IN (" + placeholders + ")";
        Object[] args = new Object[statuses.size() + 1];
        args[0] = canteenId;
        for (int i = 0; i < statuses.size(); i++) {
            args[i + 1] = statuses.get(i).name();
        }
        return jdbc.query(sql, rowMapper, args);
    }

    public List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId) {
        return jdbc.query("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC", rowMapper, customerId);
    }

    public List<Order> findByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? ORDER BY created_at DESC", rowMapper, canteenId);
    }

    public List<Order> findRecentOrdersByCanteen(Long canteenId, LocalDateTime since) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND created_at >= ? ORDER BY created_at DESC",
                rowMapper, canteenId, Timestamp.valueOf(since));
    }

    public Long countByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE canteen_id = ? AND status = ?",
                Long.class, canteenId, status.name());
    }

    public List<Order> findAll() {
        return jdbc.query("SELECT * FROM orders", rowMapper);
    }

    public Order save(Order o) {
        if (o.getId() == null) {
            return insert(o);
        } else {
            return update(o);
        }
    }

    private Order insert(Order o) {
        String sql = "INSERT INTO orders (order_number, customer_id, canteen_id, status, total_amount, payment_method, " +
                "payment_status, special_instructions, rejection_reason, created_at, updated_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, o.getOrderNumber());
            ps.setObject(2, o.getCustomerId());
            ps.setObject(3, o.getCanteenId());
            ps.setString(4, o.getStatus() != null ? o.getStatus().name() : "PENDING");
            ps.setBigDecimal(5, o.getTotalAmount());
            ps.setString(6, o.getPaymentMethod());
            ps.setString(7, o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING");
            ps.setString(8, o.getSpecialInstructions());
            ps.setString(9, o.getRejectionReason());
            ps.setTimestamp(10, o.getCreatedAt() != null ? Timestamp.valueOf(o.getCreatedAt()) : Timestamp.valueOf(LocalDateTime.now()));
            ps.setTimestamp(11, o.getUpdatedAt() != null ? Timestamp.valueOf(o.getUpdatedAt()) : null);
            ps.setTimestamp(12, o.getCompletedAt() != null ? Timestamp.valueOf(o.getCompletedAt()) : null);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) o.setId(key.longValue());
        return o;
    }

    private Order update(Order o) {
        String sql = "UPDATE orders SET order_number=?, customer_id=?, canteen_id=?, status=?, total_amount=?, " +
                "payment_method=?, payment_status=?, special_instructions=?, rejection_reason=?, updated_at=?, completed_at=? WHERE id=?";
        jdbc.update(sql, o.getOrderNumber(), o.getCustomerId(), o.getCanteenId(),
                o.getStatus() != null ? o.getStatus().name() : "PENDING",
                o.getTotalAmount(), o.getPaymentMethod(),
                o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING",
                o.getSpecialInstructions(), o.getRejectionReason(),
                o.getUpdatedAt() != null ? Timestamp.valueOf(o.getUpdatedAt()) : Timestamp.valueOf(LocalDateTime.now()),
                o.getCompletedAt() != null ? Timestamp.valueOf(o.getCompletedAt()) : null,
                o.getId());
        return o;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM orders WHERE id = ?", id);
    }
}
