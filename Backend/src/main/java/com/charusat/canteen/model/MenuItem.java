package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * MenuItem Entity - Represents a food item in a canteen's menu
 */
@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    private String category;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;
    
    @Column(name = "is_veg")
    @Builder.Default
    private Boolean isVeg = true;
    
    @Column(name = "preparation_time")
    private Integer preparationTime; // in minutes
    
    @Column(name = "spicy_level")
    private Integer spicyLevel; // 0-3
    
    @ElementCollection
    @CollectionTable(name = "menu_item_tags", joinColumns = @JoinColumn(name = "menu_item_id"))
    @Column(name = "tag")
    private java.util.List<String> tags;
    

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canteen_id", nullable = false)
    private Canteen canteen;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
