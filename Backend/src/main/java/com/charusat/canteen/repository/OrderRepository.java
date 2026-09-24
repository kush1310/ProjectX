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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbc;

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<Order> ROW_MAPPER = (rs, rowNum) -> {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        o.setOrderNumber(rs.getString("order_number"));
        o.setCustomerId(rs.getObject("customer_id") != null ? rs.getLong("customer_id") : null);
        o.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
        o.setStatus(rs.getString("status") != null ? Order.OrderStatus.valueOf(rs.getString("status"))
                : Order.OrderStatus.PENDING);
        o.setTotalAmount(rs.getBigDecimal("total_amount"));
        o.setSubTotal(rs.getBigDecimal("sub_total"));
        o.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        o.setDeliveryFee(rs.getBigDecimal("delivery_fee"));
        String couponId = rs.getString("applied_coupon_id");
        o.setAppliedCouponId(couponId != null ? UUID.fromString(couponId) : null);
        o.setPaymentMethod(rs.getString("payment_method"));
        o.setPaymentStatus(
                rs.getString("payment_status") != null ? Order.PaymentStatus.valueOf(rs.getString("payment_status"))
                        : Order.PaymentStatus.PENDING);
        o.setSpecialInstructions(rs.getString("special_instructions"));
        o.setRejectionReason(rs.getString("rejection_reason"));
        o.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        o.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null);
        o.setCompletedAt(
                rs.getTimestamp("completed_at") != null ? rs.getTimestamp("completed_at").toLocalDateTime() : null);
        o.setOrderType(rs.getString("order_type") != null ? rs.getString("order_type") : "INSTANT");
        o.setScheduledFor(rs.getTimestamp("scheduled_for") != null ? rs.getTimestamp("scheduled_for").toLocalDateTime() : null);
        o.setReleaseAt(rs.getTimestamp("release_at") != null ? rs.getTimestamp("release_at").toLocalDateTime() : null);
        o.setReleasedAt(rs.getTimestamp("released_at") != null ? rs.getTimestamp("released_at").toLocalDateTime() : null);
        o.setItems(new ArrayList<>());
        return o;
    };

    public Optional<Order> findById(Long id) {
        List<Order> list = jdbc.query("SELECT * FROM orders WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<Order> findByOrderNumber(String orderNumber) {
        List<Order> list = jdbc.query("SELECT * FROM orders WHERE order_number = ?", ROW_MAPPER, orderNumber);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Order> findByCustomerId(Long customerId) {
        return jdbc.query("SELECT * FROM orders WHERE customer_id = ?", ROW_MAPPER, customerId);
    }

    public List<Order> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ?", ROW_MAPPER, canteenId);
    }

    public List<Order> findByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND status = ?", ROW_MAPPER, canteenId,
                status.name());
    }

    public List<Order> findByCanteenIdAndStatusIn(Long canteenId, List<Order.OrderStatus> statuses) {
        if (statuses == null || statuses.isEmpty())
            return new ArrayList<>();
        String placeholders = String.join(",",
                statuses.stream().map(s -> "'" + s.name() + "'").collect(java.util.stream.Collectors.toList()));
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND status IN (" + placeholders + ")", ROW_MAPPER,
                canteenId);
    }

    public Long countByCanteenIdAndStatusIn(Long canteenId, List<Order.OrderStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) return 0L;
        String placeholders = String.join(",", statuses.stream().map(s -> "'" + s.name() + "'").collect(java.util.stream.Collectors.toList()));
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE canteen_id = ? AND status IN (" + placeholders + ")", Long.class, canteenId);
        return count != null ? count : 0L;
    }

    public List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId) {
        return jdbc.query("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC", ROW_MAPPER,
                customerId);
    }

    public List<Order> findByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? ORDER BY created_at DESC", ROW_MAPPER, canteenId);
    }

    public List<Order> findPendingReleaseOrders(LocalDateTime now) {
        return jdbc.query("SELECT * FROM orders WHERE status = 'SCHEDULED' AND release_at <= ? ORDER BY release_at ASC",
                ROW_MAPPER, Timestamp.valueOf(now));
    }

    public List<Order> findScheduledOrdersByCanteen(Long canteenId) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND status = 'SCHEDULED' ORDER BY scheduled_for ASC",
                ROW_MAPPER, canteenId);
    }

    public List<Order> findRecentOrdersByCanteen(Long canteenId, LocalDateTime since) {
        return jdbc.query("SELECT * FROM orders WHERE canteen_id = ? AND created_at >= ? ORDER BY created_at DESC",
                ROW_MAPPER, canteenId, Timestamp.valueOf(since));
    }

    public Long countByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE canteen_id = ? AND status = ?", Long.class,
                canteenId, status.name());
    }

    public long countByCustomerId(Long customerId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE customer_id = ?", Long.class, customerId);
        return count != null ? count : 0;
    }

    public List<Order> findAll() {
        return jdbc.query("SELECT * FROM orders", ROW_MAPPER);
    }

    public Order save(Order o) {
        if (o.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO orders (order_number, customer_id, canteen_id, status, total_amount, sub_total, discount_amount, delivery_fee, applied_coupon_id, payment_method, payment_status, special_instructions, rejection_reason, created_at, updated_at, completed_at, order_type, scheduled_for, release_at, released_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, o.getOrderNumber());
                ps.setObject(2, o.getCustomerId());
                ps.setObject(3, o.getCanteenId());
                ps.setString(4, o.getStatus() != null ? o.getStatus().name() : "PENDING");
                ps.setBigDecimal(5, o.getTotalAmount());
                ps.setBigDecimal(6, o.getSubTotal());
                ps.setBigDecimal(7, o.getDiscountAmount());
                ps.setBigDecimal(8, o.getDeliveryFee());
                ps.setObject(9, o.getAppliedCouponId());
                ps.setString(10, o.getPaymentMethod());
                ps.setString(11, o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING");
                ps.setString(12, o.getSpecialInstructions());
                ps.setString(13, o.getRejectionReason());
                ps.setTimestamp(14, o.getCreatedAt() != null ? Timestamp.valueOf(o.getCreatedAt()) : null);
                ps.setTimestamp(15, o.getUpdatedAt() != null ? Timestamp.valueOf(o.getUpdatedAt()) : null);
                ps.setTimestamp(16, o.getCompletedAt() != null ? Timestamp.valueOf(o.getCompletedAt()) : null);
                ps.setString(17, o.getOrderType() != null ? o.getOrderType() : "INSTANT");
                ps.setTimestamp(18, o.getScheduledFor() != null ? Timestamp.valueOf(o.getScheduledFor()) : null);
                ps.setTimestamp(19, o.getReleaseAt() != null ? Timestamp.valueOf(o.getReleaseAt()) : null);
                ps.setTimestamp(20, o.getReleasedAt() != null ? Timestamp.valueOf(o.getReleasedAt()) : null);
                return ps;
            }, kh);
            o.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE orders SET order_number=?, customer_id=?, canteen_id=?, status=?, total_amount=?, sub_total=?, discount_amount=?, delivery_fee=?, applied_coupon_id=?, payment_method=?, payment_status=?, special_instructions=?, rejection_reason=?, created_at=?, updated_at=?, completed_at=?, order_type=?, scheduled_for=?, release_at=?, released_at=? WHERE id=?",
                    o.getOrderNumber(), o.getCustomerId(), o.getCanteenId(),
                    o.getStatus() != null ? o.getStatus().name() : "PENDING",
                    o.getTotalAmount(), o.getSubTotal(), o.getDiscountAmount(), o.getDeliveryFee(),
                    o.getAppliedCouponId(),
                    o.getPaymentMethod(), o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "PENDING",
                    o.getSpecialInstructions(), o.getRejectionReason(),
                    o.getCreatedAt() != null ? Timestamp.valueOf(o.getCreatedAt()) : null,
                    o.getUpdatedAt() != null ? Timestamp.valueOf(o.getUpdatedAt()) : null,
                    o.getCompletedAt() != null ? Timestamp.valueOf(o.getCompletedAt()) : null,
                    o.getOrderType() != null ? o.getOrderType() : "INSTANT",
                    o.getScheduledFor() != null ? Timestamp.valueOf(o.getScheduledFor()) : null,
                    o.getReleaseAt() != null ? Timestamp.valueOf(o.getReleaseAt()) : null,
                    o.getReleasedAt() != null ? Timestamp.valueOf(o.getReleasedAt()) : null,
                    o.getId());
        }
        return o;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM orders WHERE id = ?", id);
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return c != null ? c : 0;
    }

    public org.springframework.data.domain.Page<Order> findByCustomerId(Long customerId, org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE customer_id = ?", Long.class, customerId);
        long total = count != null ? count : 0;
        List<Order> content = jdbc.query(
                "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ROW_MAPPER, customerId, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public org.springframework.data.domain.Page<Order> findByCanteenId(Long canteenId, org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE canteen_id = ?", Long.class, canteenId);
        long total = count != null ? count : 0;
        List<Order> content = jdbc.query(
                "SELECT * FROM orders WHERE canteen_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ROW_MAPPER, canteenId, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public org.springframework.data.domain.Page<Order> findAll(org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        long total = count != null ? count : 0;
        List<Order> content = jdbc.query(
                "SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ROW_MAPPER, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }
}
