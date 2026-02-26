package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Review - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    private Long id;
    private Long orderId;    // FK
    private Long customerId; // FK
    private Long canteenId;  // FK
    
    // Transient - populated by service for JSON
    private User customer;
    
    private Integer rating;
    private String comment;
    private Integer foodRating;
    private Integer packingRating;
    private Integer deliveryRating;
    
    @Builder.Default
    private Boolean isAnonymous = false;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String vendorReply;
    private LocalDateTime repliedAt;
}
