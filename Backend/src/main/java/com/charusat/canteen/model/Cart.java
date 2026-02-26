package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Cart Entity - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {
    
    private Long id;
    private Long userId;    // FK
    private Long canteenId; // FK
    
    // Transient - populated by service
    private Canteen canteen;
    
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();
    
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
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
        item.setCartId(this.id);
        recalculateTotal();
    }
    
    public void removeItem(CartItem item) {
        items.remove(item);
        recalculateTotal();
    }
    
    public void clear() {
        items.clear();
        totalAmount = BigDecimal.ZERO;
        canteenId = null;
        canteen = null;
        updatedAt = LocalDateTime.now();
    }
}
