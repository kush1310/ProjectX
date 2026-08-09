package com.charusat.canteen.dto;

import com.charusat.canteen.model.Coupon;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * All Coupon-related DTOs with comprehensive validation.
 */
public class CouponDTOs {

    // ===== CREATE =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCouponRequest {

        @NotBlank(message = "Coupon code is required")
        @Size(min = 3, max = 30, message = "Coupon code must be 3-30 characters")
        @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Coupon code must be uppercase alphanumeric (hyphens allowed)")
        private String couponCode;

        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 100)
        private String title;

        @Size(max = 500)
        private String description;

        private String color;

        @NotNull(message = "Coupon type is required")
        private Coupon.CouponType couponType;

        @NotNull(message = "Discount type is required")
        private Coupon.DiscountType discountType;

        @DecimalMin(value = "0.0", message = "Discount value must be non-negative")
        private BigDecimal discountValue;

        @DecimalMin(value = "0.0")
        private BigDecimal maxDiscountCap;

        @DecimalMin(value = "0.0")
        private BigDecimal minOrderValue;

        @Min(value = 1, message = "Total usage limit must be at least 1")
        private Integer usageLimitTotal;

        @Min(value = 1, message = "Per-user limit must be at least 1")
        private Integer usageLimitPerUser;

        private LocalDateTime startTime;
        private LocalDateTime endTime;

        // Rush Hour
        private Boolean rushHourFlag;
        private LocalTime rushHourStart;
        private LocalTime rushHourEnd;

        // BOGO
        @Min(1)
        private Integer bogoBuyQty;
        @Min(1)
        private Integer bogoGetQty;
        private Long bogoFreeItemId;

        // Combo
        private String comboItems; // JSON string

        // Flags
        private Boolean newCustomerOnly;
        private Boolean newDishFlag;

        // Category
        private Coupon.OfferCategory offerCategory;

        // Relationships
        private Long canteenId;
        private List<Long> applicableItemIds; // Menu item IDs
    }

    // ===== UPDATE =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCouponRequest {

        @Size(min = 2, max = 100)
        private String title;

        @Size(max = 500)
        private String description;

        private String color;
        private Coupon.DiscountType discountType;

        @DecimalMin(value = "0.01")
        private BigDecimal discountValue;

        @DecimalMin(value = "0.0")
        private BigDecimal maxDiscountCap;

        @DecimalMin(value = "0.0")
        private BigDecimal minOrderValue;

        @Min(1)
        private Integer usageLimitTotal;
        @Min(1)
        private Integer usageLimitPerUser;

        private LocalDateTime startTime;
        private LocalDateTime endTime;

        private Boolean rushHourFlag;
        private LocalTime rushHourStart;
        private LocalTime rushHourEnd;

        @Min(1)
        private Integer bogoBuyQty;
        @Min(1)
        private Integer bogoGetQty;
        private Long bogoFreeItemId;

        private String comboItems;
        private Boolean newCustomerOnly;
        private Boolean newDishFlag;
        private Boolean isActive;
        private Coupon.OfferCategory offerCategory;
        private List<Long> applicableItemIds;
    }

    // ===== VALIDATE =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidateCouponRequest {

        @NotBlank(message = "Coupon code is required")
        private String couponCode;

        @NotNull(message = "Order total is required")
        @DecimalMin(value = "0.0")
        private BigDecimal orderTotal;

        @NotNull(message = "User ID is required")
        private Long userId;

        private List<CartItemInfo> cartItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemInfo {
        private Long menuItemId;
        private String itemName;
        private Integer quantity;
        private BigDecimal price;
    }

    // ===== RESPONSE =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponResponse {
        private UUID id;
        private String couponCode;
        private String title;
        private String description;
        private String color;
        private Coupon.CouponType couponType;
        private Coupon.DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal maxDiscountCap;
        private BigDecimal minOrderValue;
        private Integer usageLimitTotal;
        private Integer usageLimitPerUser;
        private Integer currentUsageCount;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean rushHourFlag;
        private LocalTime rushHourStart;
        private LocalTime rushHourEnd;
        private Integer bogoBuyQty;
        private Integer bogoGetQty;
        private Long bogoFreeItemId;
        private String comboItems;
        private Boolean newCustomerOnly;
        private Boolean newDishFlag;
        private Boolean isActive;
        private Boolean isCustom;
        private Coupon.OfferCategory offerCategory;
        private Boolean isArchived;
        private LocalDateTime archivedAt;
        private LocalDateTime originalEndTime;
        private Long canteenId;
        private String canteenName;
        private List<ApplicableItemInfo> applicableItems;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        // Computed
        private Boolean isExpired;
        private Boolean isCurrentlyInRushHour;
        private Long remainingSeconds; // Countdown for timer
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicableItemInfo {
        private Long menuItemId;
        private String itemName;
        private BigDecimal itemPrice;
        private Integer requiredQty;
    }

    // ===== VALIDATION RESULT =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResult {
        private boolean valid;
        private String message;
        private BigDecimal discountAmount;
        private BigDecimal finalTotal;
        private String couponCode;
        private String couponTitle;
        private Coupon.CouponType couponType;
        private Coupon.DiscountType discountType;
    }

    // ===== DASHBOARD =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardResponse {
        private long totalCoupons;
        private long activeCoupons;
        private long expiredCoupons;
        private long rushHourRunning;
        private long totalUsageCount;
        private BigDecimal totalDiscountGiven;
        private List<RushHourTimerInfo> liveTimers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RushHourTimerInfo {
        private UUID couponId;
        private String couponCode;
        private String title;
        private LocalTime rushHourStart;
        private LocalTime rushHourEnd;
        private Long remainingSeconds;
        private boolean isCurrentlyActive;
    }

    // ===== ANALYTICS =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsResponse {
        private List<SalesVsDiscountPoint> salesVsDiscount;
        private List<VendorImpact> vendorImpact;
        private List<TypePerformance> typePerformance;
        private CustomerAnalytics customerAnalytics;
        private List<ItemCouponAnalytics> itemAnalytics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesVsDiscountPoint {
        private String period; // "2026-W07", "2026-01", "2026"
        private BigDecimal totalSales;
        private BigDecimal totalDiscount;
        private BigDecimal netRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorImpact {
        private Long canteenId;
        private String canteenName;
        private BigDecimal totalRevenue;
        private BigDecimal totalDiscount;
        private BigDecimal netIncome;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypePerformance {
        private Coupon.CouponType couponType;
        private long timesUsed;
        private BigDecimal totalDiscount;
        private BigDecimal avgOrderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerAnalytics {
        private long newCustomersViaCoupon;
        private long repeatCustomers;
        private double retentionRate;
        private long totalCustomerGrowth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemCouponAnalytics {
        private Long menuItemId;
        private String itemName;
        private long salesBeforeCoupon;
        private long salesAfterCoupon;
        private double conversionUplift;
    }

    // ===== CALENDAR =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarResponse {
        private List<CalendarEntry> entries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarEntry {
        private LocalDate date;
        private List<CalendarCouponInfo> coupons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarCouponInfo {
        private UUID couponId;
        private String couponCode;
        private String title;
        private Coupon.CouponType couponType;
        private String color;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean isActive;
    }

    // ===== RESTORE COUPON =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestoreCouponRequest {
        @NotNull(message = "New start time is required")
        private LocalDateTime newStartTime;

        @NotNull(message = "New end time is required")
        private LocalDateTime newEndTime;
    }
}
