package com.charusat.canteen.service;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.CanteenRepository;
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
    private final CanteenRepository canteenRepository;

    /**
     * Load a cart with its items and menu item details (JDBC eager loading)
     */
    private Cart loadCartWithItems(Cart cart) {
        if (cart == null)
            return null;

        // Hydrate Canteen from canteenId (JDBC ROW_MAPPER only sets canteenId, not Canteen object)
        if (cart.getCanteen() == null && cart.getCanteenId() != null) {
            canteenRepository.findById(cart.getCanteenId()).ifPresent(cart::setCanteen);
        }

        // Load cart items from DB
        var items = cartItemRepository.findByCartId(cart.getId());

        // Hydrate each CartItem with its MenuItem
        for (var item : items) {
            item.setCart(cart);
            if (item.getMenuItemId() != null) {
                menuItemRepository.findById(item.getMenuItemId())
                        .ifPresent(item::setMenuItem);
            }
        }

        cart.setItems(new java.util.ArrayList<>(items));
        return cart;
    }

    public Cart getOrCreateCart(User user) {
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .userId(user.getId())
                            .build();
                    return cartRepository.save(newCart);
                });
        return loadCartWithItems(cart);
    }

    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .map(this::loadCartWithItems)
                .orElse(null);
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
                    .cartId(cart.getId())
                    .menuItem(menuItem)
                    .menuItemId(menuItem.getId())
                    .quantity(quantity)
                    .unitPrice(menuItem.getPrice())
                    .selectedVariant(variant)
                    .selectedAddons(addons)
                    .specialInstructions(instructions)
                    .build();
            cart.addItem(cartItem);
            cartItemRepository.save(cartItem);
        }

        // Set canteen if first item — use canteenId from JDBC since getCanteen() is not loaded
        if (cart.getCanteen() == null && cart.getCanteenId() == null) {
            Long itemCanteenId = menuItem.getCanteenId();
            if (itemCanteenId != null) {
                canteenRepository.findById(itemCanteenId).ifPresent(canteen -> {
                    cart.setCanteen(canteen);
                    cart.setCanteenId(canteen.getId());
                });
            }
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

        // Load the full cart with items
        Cart cart = cartRepository.findById(item.getCartId()).orElseThrow();
        cart = loadCartWithItems(cart);
        cart.recalculateTotal();
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart removeFromCart(Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        Long cartId = item.getCartId();
        cartItemRepository.delete(item);

        // Reload the full cart with remaining items
        Cart cart = cartRepository.findById(cartId).orElseThrow();
        cart = loadCartWithItems(cart);

        if (cart.getItems().isEmpty()) {
            cart.setCanteen(null);
            cart.setCanteenId(null);
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

    @Transactional
    public Cart applyCoupon(Long userId, String couponCode) {
        Cart cart = getCartByUserId(userId);
        if (cart == null)
            throw new RuntimeException("Cart not found");

        // This method assumes validation happens in controller or before calling this
        // ideally we would call couponService.validateCoupon here but for now we set
        // the relation
        // In a real scenario, we'd inject CouponService and validate again

        return cart; // Placeholder for now - logic moved to controller to orchestrate
    }

    // We need CouponService to validate and fetch coupon entity
}
