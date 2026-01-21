package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Canteen Entity - Represents a canteen on campus
 */
@Entity
@Table(name = "canteens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Canteen {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String location;
    
    private String description;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "is_open")
    @Builder.Default
    private Boolean isOpen = true;
    
    @Column(name = "rush_hour_enabled")
    @Builder.Default
    private Boolean rushHourEnabled = false;
    
    @Column(name = "opening_time")
    private String openingTime;
    
    @Column(name = "closing_time")
    private String closingTime;
    

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @JsonIgnore
    @OneToMany(mappedBy = "canteen", cascade = CascadeType.ALL)
    private List<MenuItem> menuItems;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
