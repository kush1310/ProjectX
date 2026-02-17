package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Coupon - Discount management entity
 */
@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code; // e.g., "WELCOME50"
    
    @Column(nullable = false)
    private String title; // Short display name e.g. "Summer Sale"

    private String description;
    
    private String color; // Hex color for UI background
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private DiscountType discountType; // PERCENTAGE, FLAT
    
    @Column(nullable = true, precision = 10, scale = 2)
    private BigDecimal discountValue; // 50.00 (amount) or 20.00 (%)
    
    @Column(name = "min_order_value", precision = 10, scale = 2)
    private BigDecimal minOrderValue;
    
    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount; // Cap for percentage discounts
    
    @Column(name = "valid_from")
    private LocalDateTime validFrom;
    
    @Column(name = "valid_until")
    private LocalDateTime validUntil;
    
    @Column(name = "usage_limit")
    private Integer usageLimit; // Total times this coupon can be used globally
    
    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "is_custom")
    @Builder.Default
    private Boolean isCustom = true; // To distinguish system vs vendor coupons
    
    // Vendor specific (null = global platform coupon)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canteen_id")
    private Canteen canteen;
    
    // Advanced Logic Fields
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    @Builder.Default
    private CouponType type = CouponType.DISCOUNT; // DISCOUNT or BOGO

    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    @Builder.Default
    private Scope scope = Scope.GLOBAL; // GLOBAL, CATEGORY, ITEM

    @Column(name = "target_ids")
    private String targetIds; // Comma-separated IDs (Category names or Item IDs)

    @Column(name = "bogo_buy_qty")
    private Integer bogoBuyQty; // Buy X

    @Column(name = "bogo_get_qty")
    private Integer bogoGetQty; // Get Y
    
    public enum DiscountType {
        PERCENTAGE,
        FLAT
    }

    public enum CouponType {
        DISCOUNT,
        BOGO
    }

    public enum Scope {
        GLOBAL,
        CATEGORY,
        ITEM
    }
    
    public boolean isValid() {
        if (!isActive) return false;
        LocalDateTime now = LocalDateTime.now();
        if (validFrom != null && now.isBefore(validFrom)) return false;
        if (validUntil != null && now.isAfter(validUntil)) return false;
        if (usageLimit != null && usageCount >= usageLimit) return false;
        return true;
    }
}
