package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Review Entity - Customer reviews for orders
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    private Long id;

    @JsonIgnore
    private Order order;
    private Long orderId; // For JDBC convenience

    private User customer;
    private Long customerId; // For JDBC convenience

    private Canteen canteen;
    private Long canteenId; // For JDBC convenience

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
