package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PaymentOrder — Tracks Razorpay payment orders linked to food orders.
 * Uses JDBC (not JPA) to match existing repository pattern.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    private Long id;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Long amountInPaise;
    private String currency;

    @Builder.Default
    private PaymentOrderStatus status = PaymentOrderStatus.CREATED;

    private Long userId;
    private Long foodOrderId;
    private String idempotencyKey;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public enum PaymentOrderStatus {
        CREATED,
        AUTHORIZED,
        CAPTURED,
        FAILED,
        REFUNDED
    }
}
