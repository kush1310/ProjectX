package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Addon - Plain POJO (JDBC)
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
    
    private Long groupId; // FK
}
