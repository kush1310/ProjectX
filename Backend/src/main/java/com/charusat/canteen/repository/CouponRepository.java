package com.charusat.canteen.repository;

import com.charusat.canteen.model.Coupon;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CouponRepository {

        private final JdbcTemplate jdbc;

        public CouponRepository(JdbcTemplate jdbc) {
                this.jdbc = jdbc;
        }

        @NonNull
        public static final RowMapper<Coupon> ROW_MAPPER = (rs, rowNum) -> {
                Coupon c = new Coupon();
                c.setId(UUID.fromString(rs.getString("id")));
                c.setCouponCode(rs.getString("coupon_code"));
                c.setTitle(rs.getString("title"));
                c.setDescription(rs.getString("description"));
                c.setColor(rs.getString("color"));
                c.setCouponType(rs.getString("coupon_type") != null
                                ? Coupon.CouponType.valueOf(rs.getString("coupon_type"))
                                : Coupon.CouponType.GENERAL);
                c.setDiscountType(rs.getString("discount_type") != null
                                ? Coupon.DiscountType.valueOf(rs.getString("discount_type"))
                                : Coupon.DiscountType.PERCENTAGE);
                c.setDiscountValue(rs.getBigDecimal("discount_value"));
                c.setMaxDiscountCap(rs.getBigDecimal("max_discount_cap"));
                c.setMinOrderValue(rs.getBigDecimal("min_order_value"));
                c.setUsageLimitTotal(rs.getObject("usage_limit_total") != null ? rs.getInt("usage_limit_total") : null);
                c.setUsageLimitPerUser(rs.getObject("usage_limit_per_user") != null ? rs.getInt("usage_limit_per_user")
                                : null);
                c.setCurrentUsageCount(
                                rs.getObject("current_usage_count") != null ? rs.getInt("current_usage_count") : 0);
                c.setStartTime(rs.getTimestamp("start_time") != null ? rs.getTimestamp("start_time").toLocalDateTime()
                                : null);
                c.setEndTime(rs.getTimestamp("end_time") != null ? rs.getTimestamp("end_time").toLocalDateTime()
                                : null);
                c.setRushHourFlag(rs.getObject("rush_hour_flag", Boolean.class));
                c.setRushHourStart(rs.getTime("rush_hour_start") != null ? rs.getTime("rush_hour_start").toLocalTime()
                                : null);
                c.setRushHourEnd(
                                rs.getTime("rush_hour_end") != null ? rs.getTime("rush_hour_end").toLocalTime() : null);
                c.setBogoBuyQty(rs.getObject("bogo_buy_qty") != null ? rs.getInt("bogo_buy_qty") : null);
                c.setBogoGetQty(rs.getObject("bogo_get_qty") != null ? rs.getInt("bogo_get_qty") : null);
                c.setBogoFreeItemId(rs.getObject("bogo_free_item_id") != null ? rs.getLong("bogo_free_item_id") : null);
                c.setComboItems(rs.getString("combo_items"));
                c.setNewCustomerOnly(rs.getObject("new_customer_only", Boolean.class));
                c.setNewDishFlag(rs.getObject("new_dish_flag", Boolean.class));
                c.setIsActive(rs.getObject("is_active", Boolean.class));
                c.setIsCustom(rs.getObject("is_custom", Boolean.class));
                c.setOfferCategory(rs.getString("offer_category") != null
                                ? Coupon.OfferCategory.valueOf(rs.getString("offer_category"))
                                : Coupon.OfferCategory.COUPON);
                c.setIsArchived(rs.getObject("is_archived", Boolean.class));
                c.setArchivedAt(rs.getTimestamp("archived_at") != null
                                ? rs.getTimestamp("archived_at").toLocalDateTime()
                                : null);
                c.setOriginalEndTime(rs.getTimestamp("original_end_time") != null
                                ? rs.getTimestamp("original_end_time").toLocalDateTime()
                                : null);
                c.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
                c.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime()
                                : null);
                c.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime()
                                : null);
                c.setApplicableItems(new ArrayList<>());
                return c;
        };

        public Optional<Coupon> findById(UUID id) {
                List<Coupon> list = jdbc.query("SELECT * FROM coupons WHERE id = ?::uuid", ROW_MAPPER, id.toString());
                return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        }

        public boolean existsByCouponCode(String couponCode) {
                Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE coupon_code = ?", Integer.class,
                                couponCode);
                return count != null && count > 0;
        }

        public Optional<Coupon> findByCouponCode(String couponCode) {
                List<Coupon> list = jdbc.query("SELECT * FROM coupons WHERE coupon_code = ?", ROW_MAPPER, couponCode);
                return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        }

        public List<Coupon> findByIsActiveTrue() {
                return jdbc.query("SELECT * FROM coupons WHERE is_active = true", ROW_MAPPER);
        }

        public List<Coupon> findByCanteenIdAndIsActiveTrue(Long canteenId) {
                return jdbc.query("SELECT * FROM coupons WHERE canteen_id = ? AND is_active = true", ROW_MAPPER,
                                canteenId);
        }

        public List<Coupon> findByCanteenId(Long canteenId) {
                return jdbc.query("SELECT * FROM coupons WHERE canteen_id = ?", ROW_MAPPER, canteenId);
        }

        public List<Coupon> findByIsArchivedFalse() {
                return jdbc.query("SELECT * FROM coupons WHERE is_archived = false", ROW_MAPPER);
        }

        public List<Coupon> findByCanteenIdAndIsArchivedFalse(Long canteenId) {
                return jdbc.query("SELECT * FROM coupons WHERE canteen_id = ? AND is_archived = false", ROW_MAPPER,
                                canteenId);
        }

        public List<Coupon> findByRushHourFlagTrueAndIsActiveTrue() {
                return jdbc.query("SELECT * FROM coupons WHERE rush_hour_flag = true AND is_active = true", ROW_MAPPER);
        }

        public List<Coupon> findByCouponType(Coupon.CouponType couponType) {
                return jdbc.query("SELECT * FROM coupons WHERE coupon_type = ?", ROW_MAPPER, couponType.name());
        }

        public List<Coupon> findActiveBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
                return jdbc.query(
                                "SELECT * FROM coupons WHERE is_active = true AND (start_time IS NULL OR start_time <= ?) AND (end_time IS NULL OR end_time >= ?)",
                                ROW_MAPPER, Timestamp.valueOf(endDate), Timestamp.valueOf(startDate));
        }

        public List<Coupon> findExpiredButActive(LocalDateTime now) {
                return jdbc.query(
                                "SELECT * FROM coupons WHERE is_active = true AND end_time IS NOT NULL AND end_time < ?",
                                ROW_MAPPER, Timestamp.valueOf(now));
        }

        @Transactional
        public int deactivateExpiredCoupons(LocalDateTime now) {
                return jdbc.update(
                                "UPDATE coupons SET is_active = false, updated_at = ? WHERE is_active = true AND end_time IS NOT NULL AND end_time < ?",
                                Timestamp.valueOf(now), Timestamp.valueOf(now));
        }

        public long countByIsActiveTrue() {
                Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE is_active = true", Long.class);
                return c != null ? c : 0;
        }

        public long countExpired(LocalDateTime now) {
                Long c = jdbc.queryForObject(
                                "SELECT COUNT(*) FROM coupons WHERE is_active = true AND end_time IS NOT NULL AND end_time < ?",
                                Long.class, Timestamp.valueOf(now));
                return c != null ? c : 0;
        }

        public long countExpiredInactive(LocalDateTime now) {
                Long c = jdbc.queryForObject(
                                "SELECT COUNT(*) FROM coupons WHERE is_active = false AND end_time IS NOT NULL AND end_time < ?",
                                Long.class, Timestamp.valueOf(now));
                return c != null ? c : 0;
        }

        public long countByRushHourFlagTrueAndIsActiveTrue() {
                Long c = jdbc.queryForObject(
                                "SELECT COUNT(*) FROM coupons WHERE rush_hour_flag = true AND is_active = true",
                                Long.class);
                return c != null ? c : 0;
        }

        public List<Coupon> findByIsCustomFalse() {
                return jdbc.query("SELECT * FROM coupons WHERE is_custom = false", ROW_MAPPER);
        }

        public List<Coupon> findByIsArchivedTrue() {
                return jdbc.query("SELECT * FROM coupons WHERE is_archived = true", ROW_MAPPER);
        }

        public List<Coupon> findByOfferCategory(Coupon.OfferCategory offerCategory) {
                return jdbc.query("SELECT * FROM coupons WHERE offer_category = ?", ROW_MAPPER, offerCategory.name());
        }

        public List<Coupon> findByIsCustomTrueAndIsArchivedFalse() {
                return jdbc.query("SELECT * FROM coupons WHERE is_custom = true AND is_archived = false", ROW_MAPPER);
        }

        public List<Coupon> findByIsActiveTrueAndIsArchivedFalse() {
                return jdbc.query("SELECT * FROM coupons WHERE is_active = true AND is_archived = false", ROW_MAPPER);
        }

        public List<Coupon> findAll() {
                return jdbc.query("SELECT * FROM coupons", ROW_MAPPER);
        }

        public Coupon save(Coupon c) {
                if (c.getId() == null)
                        c.setId(UUID.randomUUID());
                // Try update first, if no rows affected then insert
                int rows = jdbc.update(
                                "UPDATE coupons SET coupon_code=?, title=?, description=?, color=?, coupon_type=?, discount_type=?, discount_value=?, max_discount_cap=?, min_order_value=?, usage_limit_total=?, usage_limit_per_user=?, current_usage_count=?, start_time=?, end_time=?, rush_hour_flag=?, rush_hour_start=?, rush_hour_end=?, bogo_buy_qty=?, bogo_get_qty=?, bogo_free_item_id=?, combo_items=?, new_customer_only=?, new_dish_flag=?, is_active=?, is_custom=?, offer_category=?, is_archived=?, archived_at=?, original_end_time=?, canteen_id=?, created_at=?, updated_at=? WHERE id=?::uuid",
                                c.getCouponCode(), c.getTitle(), c.getDescription(), c.getColor(),
                                c.getCouponType() != null ? c.getCouponType().name() : "GENERAL",
                                c.getDiscountType() != null ? c.getDiscountType().name() : "PERCENTAGE",
                                c.getDiscountValue(), c.getMaxDiscountCap(), c.getMinOrderValue(),
                                c.getUsageLimitTotal(), c.getUsageLimitPerUser(), c.getCurrentUsageCount(),
                                c.getStartTime() != null ? Timestamp.valueOf(c.getStartTime()) : null,
                                c.getEndTime() != null ? Timestamp.valueOf(c.getEndTime()) : null,
                                c.getRushHourFlag(),
                                c.getRushHourStart() != null ? java.sql.Time.valueOf(c.getRushHourStart()) : null,
                                c.getRushHourEnd() != null ? java.sql.Time.valueOf(c.getRushHourEnd()) : null,
                                c.getBogoBuyQty(), c.getBogoGetQty(), c.getBogoFreeItemId(), c.getComboItems(),
                                c.getNewCustomerOnly(), c.getNewDishFlag(), c.getIsActive(), c.getIsCustom(),
                                c.getOfferCategory() != null ? c.getOfferCategory().name() : "COUPON",
                                c.getIsArchived(),
                                c.getArchivedAt() != null ? Timestamp.valueOf(c.getArchivedAt()) : null,
                                c.getOriginalEndTime() != null ? Timestamp.valueOf(c.getOriginalEndTime()) : null,
                                c.getCanteenId(),
                                c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null,
                                c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null,
                                c.getId().toString());
                if (rows == 0) {
                        jdbc.update(
                                        "INSERT INTO coupons (id, coupon_code, title, description, color, coupon_type, discount_type, discount_value, max_discount_cap, min_order_value, usage_limit_total, usage_limit_per_user, current_usage_count, start_time, end_time, rush_hour_flag, rush_hour_start, rush_hour_end, bogo_buy_qty, bogo_get_qty, bogo_free_item_id, combo_items, new_customer_only, new_dish_flag, is_active, is_custom, offer_category, is_archived, archived_at, original_end_time, canteen_id, created_at, updated_at) VALUES (?::uuid,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                                        c.getId().toString(), c.getCouponCode(), c.getTitle(), c.getDescription(),
                                        c.getColor(),
                                        c.getCouponType() != null ? c.getCouponType().name() : "GENERAL",
                                        c.getDiscountType() != null ? c.getDiscountType().name() : "PERCENTAGE",
                                        c.getDiscountValue(), c.getMaxDiscountCap(), c.getMinOrderValue(),
                                        c.getUsageLimitTotal(), c.getUsageLimitPerUser(), c.getCurrentUsageCount(),
                                        c.getStartTime() != null ? Timestamp.valueOf(c.getStartTime()) : null,
                                        c.getEndTime() != null ? Timestamp.valueOf(c.getEndTime()) : null,
                                        c.getRushHourFlag(),
                                        c.getRushHourStart() != null ? java.sql.Time.valueOf(c.getRushHourStart())
                                                        : null,
                                        c.getRushHourEnd() != null ? java.sql.Time.valueOf(c.getRushHourEnd()) : null,
                                        c.getBogoBuyQty(), c.getBogoGetQty(), c.getBogoFreeItemId(), c.getComboItems(),
                                        c.getNewCustomerOnly(), c.getNewDishFlag(), c.getIsActive(), c.getIsCustom(),
                                        c.getOfferCategory() != null ? c.getOfferCategory().name() : "COUPON",
                                        c.getIsArchived(),
                                        c.getArchivedAt() != null ? Timestamp.valueOf(c.getArchivedAt()) : null,
                                        c.getOriginalEndTime() != null ? Timestamp.valueOf(c.getOriginalEndTime())
                                                        : null,
                                        c.getCanteenId(),
                                        c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null,
                                        c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null);
                }
                return c;
        }

        public void deleteById(UUID id) {
                jdbc.update("DELETE FROM coupons WHERE id = ?::uuid", id.toString());
        }

        public boolean existsById(UUID id) {
                Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE id = ?::uuid", Integer.class,
                                id.toString());
                return count != null && count > 0;
        }

        public int incrementUsageCount(UUID id) {
                return jdbc.update(
                        "UPDATE coupons SET current_usage_count = current_usage_count + 1, updated_at = NOW() WHERE id = ?::uuid AND (usage_limit_total IS NULL OR current_usage_count < usage_limit_total)",
                        id.toString());
        }

        public long count() {
                Long c = jdbc.queryForObject("SELECT COUNT(*) FROM coupons", Long.class);
                return c != null ? c : 0;
        }

        public org.springframework.data.domain.Page<Coupon> findAll(org.springframework.data.domain.Pageable pageable) {
                Long count = jdbc.queryForObject("SELECT COUNT(*) FROM coupons", Long.class);
                long total = count != null ? count : 0;
                List<Coupon> content = jdbc.query("SELECT * FROM coupons ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, pageable.getPageSize(), pageable.getOffset());
                return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
        }

        public org.springframework.data.domain.Page<Coupon> findByCanteenId(Long canteenId, org.springframework.data.domain.Pageable pageable) {
                Long count = jdbc.queryForObject("SELECT COUNT(*) FROM coupons WHERE canteen_id = ?", Long.class, canteenId);
                long total = count != null ? count : 0;
                List<Coupon> content = jdbc.query("SELECT * FROM coupons WHERE canteen_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, canteenId, pageable.getPageSize(), pageable.getOffset());
                return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
        }
}
