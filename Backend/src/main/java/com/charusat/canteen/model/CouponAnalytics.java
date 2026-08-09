package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * CouponAnalytics — Daily analytics snapshot for each coupon.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponAnalytics {

    private Long id;
    private UUID couponId;
    private LocalDate snapshotDate;

    @Builder.Default
    private Integer timesUsed = 0;

    @Builder.Default
    private BigDecimal totalDiscountGiven = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal totalOrderValue = BigDecimal.ZERO;

    @Builder.Default
    private Integer newCustomersGained = 0;

    @Builder.Default
    private Integer repeatCustomersCount = 0;
}
