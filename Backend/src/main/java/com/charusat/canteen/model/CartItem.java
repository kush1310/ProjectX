package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * CartItem Entity - Individual item in a cart
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    private Long id;

    @JsonIgnore
    private Cart cart;
    private Long cartId; // For JDBC convenience

    private MenuItem menuItem;
    private Long menuItemId; // For JDBC convenience

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
