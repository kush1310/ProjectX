package com.charusat.canteen.repository;

import com.charusat.canteen.model.Review;
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
public class ReviewRepository {

    private final JdbcTemplate jdbc;

    public ReviewRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Review> rowMapper = (rs, rowNum) -> {
        Review r = new Review();
        r.setId(rs.getLong("id"));
        long orderId = rs.getLong("order_id");
        r.setOrderId(rs.wasNull() ? null : orderId);
        long customerId = rs.getLong("customer_id");
        r.setCustomerId(rs.wasNull() ? null : customerId);
        long canteenId = rs.getLong("canteen_id");
        r.setCanteenId(rs.wasNull() ? null : canteenId);
        r.setRating(rs.getInt("rating"));
        r.setComment(rs.getString("comment"));
        r.setFoodRating(rs.getObject("food_rating", Integer.class));
        r.setPackingRating(rs.getObject("packing_rating", Integer.class));
        r.setDeliveryRating(rs.getObject("delivery_rating", Integer.class));
        r.setIsAnonymous(rs.getObject("is_anonymous", Boolean.class));
        Timestamp createdAt = rs.getTimestamp("created_at");
        r.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        r.setVendorReply(rs.getString("vendor_reply"));
        Timestamp repliedAt = rs.getTimestamp("replied_at");
        r.setRepliedAt(repliedAt != null ? repliedAt.toLocalDateTime() : null);
        return r;
    };

    public Optional<Review> findById(Long id) {
        List<Review> results = jdbc.query("SELECT * FROM reviews WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public List<Review> findByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM reviews WHERE canteen_id = ? ORDER BY created_at DESC", rowMapper, canteenId);
    }

    public Optional<Review> findByOrderId(Long orderId) {
        List<Review> results = jdbc.query("SELECT * FROM reviews WHERE order_id = ?", rowMapper, orderId);
        return results.stream().findFirst();
    }

    public List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId) {
        return jdbc.query("SELECT * FROM reviews WHERE customer_id = ? ORDER BY created_at DESC", rowMapper, customerId);
    }

    public Double getAverageRatingByCanteenId(Long canteenId) {
        return jdbc.queryForObject("SELECT AVG(rating) FROM reviews WHERE canteen_id = ?", Double.class, canteenId);
    }

    public Long countByCanteenId(Long canteenId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE canteen_id = ?", Long.class, canteenId);
    }

    public List<Review> findTop5ByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM reviews WHERE canteen_id = ? ORDER BY created_at DESC LIMIT 5", rowMapper, canteenId);
    }

    public List<Review> findAll() {
        return jdbc.query("SELECT * FROM reviews", rowMapper);
    }

    public Review save(Review r) {
        if (r.getId() == null) {
            return insert(r);
        } else {
            return update(r);
        }
    }

    private Review insert(Review r) {
        String sql = "INSERT INTO reviews (order_id, customer_id, canteen_id, rating, comment, food_rating, " +
                "packing_rating, delivery_rating, is_anonymous, created_at, vendor_reply, replied_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, r.getOrderId());
            ps.setObject(2, r.getCustomerId());
            ps.setObject(3, r.getCanteenId());
            ps.setInt(4, r.getRating());
            ps.setString(5, r.getComment());
            ps.setObject(6, r.getFoodRating());
            ps.setObject(7, r.getPackingRating());
            ps.setObject(8, r.getDeliveryRating());
            ps.setObject(9, r.getIsAnonymous() != null ? r.getIsAnonymous() : false);
            ps.setTimestamp(10, r.getCreatedAt() != null ? Timestamp.valueOf(r.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            ps.setString(11, r.getVendorReply());
            ps.setTimestamp(12, r.getRepliedAt() != null ? Timestamp.valueOf(r.getRepliedAt()) : null);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) r.setId(key.longValue());
        return r;
    }

    private Review update(Review r) {
        String sql = "UPDATE reviews SET rating=?, comment=?, food_rating=?, packing_rating=?, delivery_rating=?, " +
                "is_anonymous=?, vendor_reply=?, replied_at=? WHERE id=?";
        jdbc.update(sql, r.getRating(), r.getComment(), r.getFoodRating(), r.getPackingRating(),
                r.getDeliveryRating(), r.getIsAnonymous(), r.getVendorReply(),
                r.getRepliedAt() != null ? Timestamp.valueOf(r.getRepliedAt()) : null, r.getId());
        return r;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM reviews WHERE id = ?", id);
    }
}
