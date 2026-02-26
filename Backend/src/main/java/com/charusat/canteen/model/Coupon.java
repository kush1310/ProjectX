package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Coupon - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    
    private Long id;
    private String code;
    private String title;
    private String description;
    private String color;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer usageLimit;
    
    @Builder.Default
    private Integer usageCount = 0;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Boolean isCustom = true;
    
    private Long canteenId; // FK
    
    @Builder.Default
    private CouponType type = CouponType.DISCOUNT;

    @Builder.Default
    private Scope scope = Scope.GLOBAL;

    private String targetIds;
    private Integer bogoBuyQty;
    private Integer bogoGetQty;
    
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
