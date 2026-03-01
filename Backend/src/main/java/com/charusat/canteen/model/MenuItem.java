package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * MenuItem Entity - Represents a food item in a canteen's menu
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String subCategory;
    private Integer displayOrder;
    private String availableFrom;
    private String availableTo;
    private String imageUrl;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isVeg = true;

    private Integer preparationTime;
    private Integer spicyLevel;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private Boolean isRecommended = false;

    @Builder.Default
    private Boolean hasVariants = false;

    @Builder.Default
    private List<MenuItemVariant> variants = new ArrayList<>();

    @Builder.Default
    private Boolean hasAddons = false;

    @Builder.Default
    private List<AddonGroup> addonGroups = new ArrayList<>();

    @JsonIgnore
    private Canteen canteen;
    private Long canteenId; // For JDBC convenience

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
