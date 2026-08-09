package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CouponUsage — Tracks every coupon redemption per user per order.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponUsage {

    private Long id;
    private UUID couponId;

    @JsonIgnoreProperties({ "password", "profileImageData", "mfaSecret" })
    private User user;
    private Long userId; // For JDBC convenience

    @JsonIgnoreProperties({ "items", "customer" })
    private Order order;
    private Long orderId; // For JDBC convenience

    private BigDecimal discountApplied;
    private BigDecimal orderTotal;

    @Builder.Default
    private LocalDateTime usedAt = LocalDateTime.now();
}
