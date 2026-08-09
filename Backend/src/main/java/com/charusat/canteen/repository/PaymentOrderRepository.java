package com.charusat.canteen.repository;

import com.charusat.canteen.model.PaymentOrder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Map;
import java.util.Optional;

/**
 * JDBC-based repository for PaymentOrder — matches project's existing repository pattern.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class PaymentOrderRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<PaymentOrder> ROW_MAPPER = (rs, rowNum) -> PaymentOrder.builder()
            .id(rs.getLong("id"))
            .razorpayOrderId(rs.getString("razorpay_order_id"))
            .razorpayPaymentId(rs.getString("razorpay_payment_id"))
            .amountInPaise(rs.getLong("amount_in_paise"))
            .currency(rs.getString("currency"))
            .status(PaymentOrder.PaymentOrderStatus.valueOf(rs.getString("status")))
            .userId(rs.getLong("user_id"))
            .foodOrderId(rs.getObject("food_order_id") != null ? rs.getLong("food_order_id") : null)
            .idempotencyKey(rs.getString("idempotency_key"))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
            .build();

    public PaymentOrder save(PaymentOrder order) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO payment_orders (razorpay_order_id, razorpay_payment_id, amount_in_paise, " +
                            "currency, status, user_id, food_order_id, idempotency_key, created_at, updated_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, order.getRazorpayOrderId());
            ps.setString(2, order.getRazorpayPaymentId());
            ps.setLong(3, order.getAmountInPaise());
            ps.setString(4, order.getCurrency());
            ps.setString(5, order.getStatus().name());
            ps.setLong(6, order.getUserId());
            if (order.getFoodOrderId() != null) {
                ps.setLong(7, order.getFoodOrderId());
            } else {
                ps.setNull(7, java.sql.Types.BIGINT);
            }
            ps.setString(8, order.getIdempotencyKey());
            ps.setTimestamp(9, Timestamp.valueOf(order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now()));
            ps.setTimestamp(10, order.getUpdatedAt() != null ? Timestamp.valueOf(order.getUpdatedAt()) : null);
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            order.setId(((Number) keys.get("id")).longValue());
        }
        return order;
    }

    public void update(PaymentOrder order) {
        jdbcTemplate.update(
                "UPDATE payment_orders SET razorpay_payment_id = ?, status = ?, " +
                        "food_order_id = ?, updated_at = ? WHERE id = ?",
                order.getRazorpayPaymentId(),
                order.getStatus().name(),
                order.getFoodOrderId(),
                Timestamp.valueOf(LocalDateTime.now()),
                order.getId());
    }

    public void updateStatusByRazorpayOrderId(String razorpayOrderId, String status, String paymentId) {
        jdbcTemplate.update(
                "UPDATE payment_orders SET status = ?, razorpay_payment_id = ?, updated_at = ? " +
                        "WHERE razorpay_order_id = ?",
                status, paymentId, Timestamp.valueOf(LocalDateTime.now()), razorpayOrderId);
    }

    public Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId) {
        List<PaymentOrder> results = jdbcTemplate.query(
                "SELECT * FROM payment_orders WHERE razorpay_order_id = ?",
                ROW_MAPPER, razorpayOrderId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<PaymentOrder> findByIdempotencyKey(String idempotencyKey) {
        List<PaymentOrder> results = jdbcTemplate.query(
                "SELECT * FROM payment_orders WHERE idempotency_key = ?",
                ROW_MAPPER, idempotencyKey);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<PaymentOrder> findByUserId(Long userId) {
        return jdbcTemplate.query(
                "SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC",
                ROW_MAPPER, userId);
    }

    public Optional<PaymentOrder> findByFoodOrderId(Long foodOrderId) {
        List<PaymentOrder> results = jdbcTemplate.query(
                "SELECT * FROM payment_orders WHERE food_order_id = ?",
                ROW_MAPPER, foodOrderId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<PaymentOrder> findAll() {
        return jdbcTemplate.query(
                "SELECT * FROM payment_orders ORDER BY created_at DESC",
                ROW_MAPPER);
    }

    public List<PaymentOrder> findAllPaginated(int offset, int limit) {
        return jdbcTemplate.query(
                "SELECT * FROM payment_orders ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ROW_MAPPER, limit, offset);
    }

    public long count() {
        Long result = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM payment_orders", Long.class);
        return result != null ? result : 0;
    }

    public long countByStatus(String status) {
        Long result = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM payment_orders WHERE status = ?", Long.class, status);
        return result != null ? result : 0;
    }

    public Long sumAmountByStatus(String status) {
        Long result = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount_in_paise), 0) FROM payment_orders WHERE status = ?",
                Long.class, status);
        return result != null ? result : 0L;
    }
}
