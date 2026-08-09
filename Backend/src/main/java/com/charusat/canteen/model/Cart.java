package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Cart Entity - Shopping cart for users
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    private Long id;
    @JsonIgnore
    private User user;
    private Long userId; // For JDBC convenience

    @JsonIgnoreProperties({ "menuItems", "owner", "hibernateLazyInitializer", "handler" })
    private Canteen canteen;
    private Long canteenId; // For JDBC convenience

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @JsonIgnoreProperties({ "applicableItems", "canteen", "hibernateLazyInitializer", "handler" })
    private Coupon appliedCoupon;
    private java.util.UUID appliedCouponId; // For JDBC convenience

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public void recalculateTotal() {
        this.totalAmount = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.updatedAt = LocalDateTime.now();
    }

    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
        recalculateTotal();
    }

    public void removeItem(CartItem item) {
        items.remove(item);
        item.setCart(null);
        recalculateTotal();
    }

    public void clear() {
        items.clear();
        totalAmount = BigDecimal.ZERO;
        canteen = null;
        updatedAt = LocalDateTime.now();
    }
}
