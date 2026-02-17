package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;

/**
 * Addon - Individual modification option
 * Example: "Extra Cheese" (+20.00)
 */
@Entity
@Table(name = "addons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Addon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;
    
    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private AddonGroup group;
}
