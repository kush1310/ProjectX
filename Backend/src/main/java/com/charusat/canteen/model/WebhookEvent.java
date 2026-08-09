package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebhookEvent — Tracks processed Razorpay webhook events for idempotency.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookEvent {

    private Long id;
    private String eventId;
    private String eventType;
    private String payload;

    @Builder.Default
    private Boolean processed = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
