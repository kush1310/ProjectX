package com.charusat.canteen.service;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.CartItemRepository;
import com.charusat.canteen.repository.CartRepository;
import com.charusat.canteen.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Cart Service - Business logic for shopping cart
 */
@Service
@RequiredArgsConstructor
public class CartService {
    
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuItemRepository menuItemRepository;
    
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart cart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(cart);
                });
    }
    
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId).orElse(null);
    }
    
    @Transactional
    public Cart addToCart(User user, Long menuItemId, Integer quantity, 
                         String variant, String addons, String instructions) {
        Cart cart = getOrCreateCart(user);
        
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        
        // Check if same item already in cart
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getMenuItem().getId().equals(menuItemId) 
                        && (variant == null || variant.equals(item.getSelectedVariant())))
                .findFirst();
        
        if (existingItem.isPresent()) {
            // Update quantity
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            // Add new item
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .menuItem(menuItem)
                    .quantity(quantity)
                    .unitPrice(menuItem.getPrice())
                    .selectedVariant(variant)
                    .selectedAddons(addons)
                    .specialInstructions(instructions)
                    .build();
            cart.addItem(cartItem);
            cartItemRepository.save(cartItem);
        }
        
        // Set canteen if first item
        if (cart.getCanteen() == null) {
            cart.setCanteen(menuItem.getCanteen());
        }
        
        cart.recalculateTotal();
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }
    
    @Transactional
    public Cart updateCartItemQuantity(Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        if (quantity <= 0) {
            return removeFromCart(itemId);
        }
        
        item.setQuantity(quantity);
        cartItemRepository.save(item);
        
        Cart cart = item.getCart();
        cart.recalculateTotal();
        return cartRepository.save(cart);
    }
    
    @Transactional
    public Cart removeFromCart(Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        Cart cart = item.getCart();
        cart.removeItem(item);
        cartItemRepository.delete(item);
        
        if (cart.getItems().isEmpty()) {
            cart.setCanteen(null);
        }
        
        cart.recalculateTotal();
        return cartRepository.save(cart);
    }
    
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart != null) {
            cart.clear();
            cartRepository.save(cart);
        }
    }
    
    public BigDecimal calculateTotal(Long cartId) {
        Cart cart = cartRepository.findById(cartId).orElse(null);
        return cart != null ? cart.getTotalAmount() : BigDecimal.ZERO;
    }
}
