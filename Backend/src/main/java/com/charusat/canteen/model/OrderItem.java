package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * OrderItem Entity - Represents an item within an order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    private Long id;

    @JsonIgnore
    private Order order;
    private Long orderId; // For JDBC convenience

    @JsonIgnoreProperties({ "canteen", "variants", "addonGroups", "tags" })
    private MenuItem menuItem;
    private Long menuItemId; // For JDBC convenience

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String notes;
}
