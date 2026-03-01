package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemVariant {
    private Long id;
    private String name;
    private BigDecimal price;

    @JsonBackReference
    private MenuItem menuItem;
    private Long menuItemId; // For JDBC convenience
}
