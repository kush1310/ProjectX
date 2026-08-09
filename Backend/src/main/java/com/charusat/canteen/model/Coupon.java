package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Coupon Entity — Comprehensive discount management for all 6 coupon types.
 * Supports: GENERAL, BOGO, ITEM_SPECIFIC, COMBO, NEW_DISH, RUSH_HOUR
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Coupon {

    private UUID id;
    private String couponCode;
    private String title;
    private String description;
    private String color;

    @Builder.Default
    private CouponType couponType = CouponType.GENERAL;

    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    private BigDecimal discountValue;
    private BigDecimal maxDiscountCap;
    private BigDecimal minOrderValue;

    private Integer usageLimitTotal;
    private Integer usageLimitPerUser;

    @Builder.Default
    private Integer currentUsageCount = 0;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Builder.Default
    private Boolean rushHourFlag = false;

    private LocalTime rushHourStart;
    private LocalTime rushHourEnd;

    private Integer bogoBuyQty;
    private Integer bogoGetQty;
    private Long bogoFreeItemId;
    private String comboItems;

    @Builder.Default
    private Boolean newCustomerOnly = false;

    @Builder.Default
    private Boolean newDishFlag = false;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean isCustom = true;

    @Builder.Default
    private OfferCategory offerCategory = OfferCategory.COUPON;

    @Builder.Default
    private Boolean isArchived = false;

    private LocalDateTime archivedAt;
    private LocalDateTime originalEndTime;

    @JsonIgnoreProperties({ "menuItems", "owner" })
    private Canteen canteen;
    private Long canteenId; // For JDBC convenience

    @Builder.Default
    @JsonIgnoreProperties("coupon")
    private List<CouponApplicability> applicableItems = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ===== ENUMS =====

    public enum CouponType {
        GENERAL,
        BOGO,
        ITEM_SPECIFIC,
        COMBO,
        NEW_DISH,
        RUSH_HOUR
    }

    public enum DiscountType {
        PERCENTAGE,
        FLAT,
        BOGO
    }

    public enum OfferCategory {
        OFFER,
        COUPON,
        PROMO
    }

    // ===== HELPERS =====

    public boolean isCurrentlyValid() {
        if (!Boolean.TRUE.equals(isActive))
            return false;
        LocalDateTime now = LocalDateTime.now();
        if (startTime != null && now.isBefore(startTime))
            return false;
        if (endTime != null && now.isAfter(endTime))
            return false;
        if (Boolean.TRUE.equals(rushHourFlag)) {
            LocalTime nowTime = LocalTime.now();
            if (rushHourStart != null && rushHourEnd != null) {
                if (nowTime.isBefore(rushHourStart) || nowTime.isAfter(rushHourEnd))
                    return false;
            }
        }
        return true;
    }

    public boolean isExpired() {
        return endTime != null && LocalDateTime.now().isAfter(endTime);
    }

    public boolean isUsageLimitReached() {
        return usageLimitTotal != null && currentUsageCount >= usageLimitTotal;
    }
}
