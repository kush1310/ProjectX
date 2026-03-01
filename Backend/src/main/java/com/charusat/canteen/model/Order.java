package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order Entity - Represents a customer order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Order {

    private Long id;
    private String orderNumber;

    private User customer;
    private Long customerId; // For JDBC convenience

    @JsonIgnoreProperties({ "menuItems", "owner", "hibernateLazyInitializer", "handler" })
    private Canteen canteen;
    private Long canteenId; // For JDBC convenience

    private List<OrderItem> items;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    private BigDecimal totalAmount;
    private BigDecimal subTotal;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @JsonIgnoreProperties({ "applicableItems", "canteen", "hibernateLazyInitializer", "handler" })
    private Coupon appliedCoupon;
    private java.util.UUID appliedCouponId; // For JDBC convenience

    private String paymentMethod;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String specialInstructions;
    private String rejectionReason;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    public enum OrderStatus {
        PENDING,
        CONFIRMED,
        PREPARING,
        READY,
        COMPLETED,
        CANCELLED
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }
}
