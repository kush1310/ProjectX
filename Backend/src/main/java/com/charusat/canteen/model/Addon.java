package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Addon - Individual modification option
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Addon {

    private Long id;
    private String name;

    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Builder.Default
    private Boolean isAvailable = true;

    @JsonIgnore
    private AddonGroup group;
    private Long groupId; // For JDBC convenience
}
