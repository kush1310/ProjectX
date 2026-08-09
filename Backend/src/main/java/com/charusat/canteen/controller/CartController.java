package com.charusat.canteen.controller;

import com.charusat.canteen.model.Cart;
import com.charusat.canteen.model.User;
import com.charusat.canteen.service.CartService;
import com.charusat.canteen.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * Cart Controller - Shopping cart API endpoints
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://localhost:3000" })
public class CartController {

    private final CartService cartService;
    private final UserService userService;
    private final com.charusat.canteen.service.CouponService couponService;
    private final com.charusat.canteen.repository.CouponRepository couponRepository;
    private final com.charusat.canteen.repository.CartRepository cartRepository;

    @GetMapping
    public ResponseEntity<?> getCart(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartService.getOrCreateCart(user);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(Principal principal, @Valid @RequestBody AddToCartRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Cart cart = cartService.addToCart(
                    user,
                    request.menuItemId(),
                    request.quantity() != null ? request.quantity() : 1,
                    request.variant(),
                    request.addons(),
                    request.instructions());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Item added to cart",
                    "cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @PutMapping("/update/{itemId}")
    public ResponseEntity<?> updateQuantity(
            Principal principal,
            @PathVariable Long itemId,
            @RequestBody UpdateQuantityRequest request) {

        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            Cart cart = cartService.updateCartItemQuantity(itemId, request.quantity());
            return ResponseEntity.ok(Map.of("success", true, "cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<?> removeItem(Principal principal, @PathVariable Long itemId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            Cart cart = cartService.removeFromCart(itemId);
            return ResponseEntity.ok(Map.of("success", true, "cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            cartService.clearCart(user.getId());
            return ResponseEntity.ok(Map.of("success", true, "message", "Cart cleared"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/apply-coupon")
    public ResponseEntity<?> applyCoupon(Principal principal, @RequestBody Map<String, String> payload) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        try {
            String couponCode = payload.get("couponCode");
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Cart cart = cartService.getOrCreateCart(user);

            // 1. Validate logic re-used from service or called here
            // For simplicity in this iteration, we validate and then set
            // In a full refactor, this logic belongs in CartService.applyCoupon

            // Create Validation Request
            var cartItems = cart.getItems().stream()
                    .map(item -> new com.charusat.canteen.dto.CouponDTOs.CartItemInfo(
                            item.getMenuItem().getId(),
                            item.getMenuItem().getName(),
                            item.getQuantity(),
                            item.getUnitPrice()))
                    .toList();

            var valReq = com.charusat.canteen.dto.CouponDTOs.ValidateCouponRequest.builder()
                    .couponCode(couponCode)
                    .userId(user.getId())
                    .orderTotal(cart.getTotalAmount())
                    .cartItems(cartItems)
                    .build();

            var result = couponService.validateCoupon(valReq);

            if (!result.isValid()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", result.getMessage()));
            }

            // 2. Persist to Cart
            var coupon = couponRepository.findByCouponCode(couponCode).orElseThrow();
            cart.setAppliedCoupon(coupon);
            cart.setDiscountAmount(result.getDiscountAmount());
            cart.setFinalAmount(
                    cart.getTotalAmount().subtract(result.getDiscountAmount()).max(java.math.BigDecimal.ZERO));

            cartRepository.save(cart);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Coupon applied",
                    "cart", cart,
                    "discount", result.getDiscountAmount()));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove-coupon")
    public ResponseEntity<?> removeCoupon(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        try {
            User user = userService.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Cart cart = cartService.getOrCreateCart(user);
            cart.setAppliedCoupon(null);
            cart.setDiscountAmount(java.math.BigDecimal.ZERO);
            cart.setFinalAmount(cart.getTotalAmount());
            cartRepository.save(cart);

            return ResponseEntity.ok(Map.of("success", true, "message", "Coupon removed", "cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // DTOs
    public record AddToCartRequest(
            @NotNull Long menuItemId,
            @Min(1) Integer quantity,
            String variant,
            String addons,
            String instructions) {
    }

    public record UpdateQuantityRequest(@Min(0) int quantity) {
    }
}
