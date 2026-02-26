package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * CartItem - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    private Long id;
    private Long cartId;     // FK
    private Long menuItemId; // FK
    
    // Transient - populated by service for JSON
    private MenuItem menuItem;
    
    @Builder.Default
    private Integer quantity = 1;
    
    private BigDecimal unitPrice;
    private String selectedVariant;
    private String selectedAddons;
    private String specialInstructions;
    
    public BigDecimal getSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
    
    public void incrementQuantity() {
        this.quantity++;
    }
    
    public void decrementQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
        }
    }
}
