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

    public static final RowMapper<Review> ROW_MAPPER = (rs, rowNum) -> {
        Review r = new Review();
        r.setId(rs.getLong("id"));
        r.setOrderId(rs.getObject("order_id") != null ? rs.getLong("order_id") : null);
        r.setCustomerId(rs.getObject("customer_id") != null ? rs.getLong("customer_id") : null);
        r.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
        r.setRating(rs.getObject("rating") != null ? rs.getInt("rating") : null);
        r.setComment(rs.getString("comment"));
        r.setFoodRating(rs.getObject("food_rating") != null ? rs.getInt("food_rating") : null);
        r.setPackingRating(rs.getObject("packing_rating") != null ? rs.getInt("packing_rating") : null);
        r.setDeliveryRating(rs.getObject("delivery_rating") != null ? rs.getInt("delivery_rating") : null);
        r.setIsAnonymous(rs.getObject("is_anonymous", Boolean.class));
        r.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        r.setVendorReply(rs.getString("vendor_reply"));
        r.setRepliedAt(rs.getTimestamp("replied_at") != null ? rs.getTimestamp("replied_at").toLocalDateTime() : null);
        return r;
    };

    public Optional<Review> findById(Long id) {
        List<Review> list = jdbc.query("SELECT * FROM reviews WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Review> findByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM reviews WHERE canteen_id = ? ORDER BY created_at DESC", ROW_MAPPER, canteenId);
    }

    public Optional<Review> findByOrderId(Long orderId) {
        List<Review> list = jdbc.query("SELECT * FROM reviews WHERE order_id = ?", ROW_MAPPER, orderId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId) {
        return jdbc.query("SELECT * FROM reviews WHERE customer_id = ? ORDER BY created_at DESC", ROW_MAPPER,
                customerId);
    }

    public Double getAverageRatingByCanteenId(Long canteenId) {
        return jdbc.queryForObject("SELECT AVG(CAST(rating AS DOUBLE PRECISION)) FROM reviews WHERE canteen_id = ?",
                Double.class, canteenId);
    }

    public Long countByCanteenId(Long canteenId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE canteen_id = ?", Long.class, canteenId);
    }

    public List<Review> findTop5ByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM reviews WHERE canteen_id = ? ORDER BY created_at DESC LIMIT 5", ROW_MAPPER,
                canteenId);
    }

    public List<Review> findAll() {
        return jdbc.query("SELECT * FROM reviews", ROW_MAPPER);
    }

    public Review save(Review r) {
        if (r.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO reviews (order_id, customer_id, canteen_id, rating, comment, food_rating, packing_rating, delivery_rating, is_anonymous, created_at, vendor_reply, replied_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, r.getOrderId());
                ps.setObject(2, r.getCustomerId());
                ps.setObject(3, r.getCanteenId());
                ps.setObject(4, r.getRating());
                ps.setString(5, r.getComment());
                ps.setObject(6, r.getFoodRating());
                ps.setObject(7, r.getPackingRating());
                ps.setObject(8, r.getDeliveryRating());
                ps.setObject(9, r.getIsAnonymous());
                ps.setTimestamp(10, r.getCreatedAt() != null ? Timestamp.valueOf(r.getCreatedAt()) : null);
                ps.setString(11, r.getVendorReply());
                ps.setTimestamp(12, r.getRepliedAt() != null ? Timestamp.valueOf(r.getRepliedAt()) : null);
                return ps;
            }, kh);
            r.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE reviews SET order_id=?, customer_id=?, canteen_id=?, rating=?, comment=?, food_rating=?, packing_rating=?, delivery_rating=?, is_anonymous=?, created_at=?, vendor_reply=?, replied_at=? WHERE id=?",
                    r.getOrderId(), r.getCustomerId(), r.getCanteenId(), r.getRating(), r.getComment(),
                    r.getFoodRating(), r.getPackingRating(), r.getDeliveryRating(), r.getIsAnonymous(),
                    r.getCreatedAt() != null ? Timestamp.valueOf(r.getCreatedAt()) : null,
                    r.getVendorReply(), r.getRepliedAt() != null ? Timestamp.valueOf(r.getRepliedAt()) : null,
                    r.getId());
        }
        return r;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM reviews WHERE id = ?", id);
    }
}
