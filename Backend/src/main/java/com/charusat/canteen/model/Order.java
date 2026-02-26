package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order Entity - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    
    private Long id;
    private String orderNumber;
    private Long customerId;  // FK
    private Long canteenId;   // FK
    
    // Transient - populated by service
    private User customer;
    private Canteen canteen;
    private List<OrderItem> items;
    
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    
    private BigDecimal totalAmount;
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
