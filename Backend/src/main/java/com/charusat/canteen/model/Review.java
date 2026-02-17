package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Review Entity - Customer reviews for orders
 */
@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canteen_id", nullable = false)
    private Canteen canteen;
    
    @Column(nullable = false)
    @Min(1)
    @Max(5)
    private Integer rating;
    
    @Column(length = 500)
    private String comment;
    
    @Column(name = "food_rating")
    @Min(1)
    @Max(5)
    private Integer foodRating;
    
    @Column(name = "packing_rating")
    @Min(1)
    @Max(5)
    private Integer packingRating;
    
    @Column(name = "delivery_rating")
    @Min(1)
    @Max(5)
    private Integer deliveryRating;
    
    @Column(name = "is_anonymous")
    @Builder.Default
    private Boolean isAnonymous = false;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "vendor_reply")
    private String vendorReply;
    
    @Column(name = "replied_at")
    private LocalDateTime repliedAt;
}
