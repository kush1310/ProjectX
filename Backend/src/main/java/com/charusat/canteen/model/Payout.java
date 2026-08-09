package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {
    public enum PayoutStatus {
        PENDING,
        PROCESSING,
        PAID,
        CANCELLED
    }

    private Long id;
    private Long canteenId;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private BigDecimal grossAmount;
    private BigDecimal fees;
    private BigDecimal netAmount;

    @Builder.Default
    private PayoutStatus status = PayoutStatus.PENDING;

    private LocalDateTime paidAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
