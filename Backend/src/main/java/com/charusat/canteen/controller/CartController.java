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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class CartController {
    
    private final CartService cartService;
    private final UserService userService;
    
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
                    request.instructions()
            );
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Item added to cart",
                    "cart", cart
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
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
    
    // DTOs
    public record AddToCartRequest(
            @NotNull Long menuItemId,
            @Min(1) Integer quantity,
            String variant,
            String addons,
            String instructions
    ) {}
    
    public record UpdateQuantityRequest(@Min(0) int quantity) {}
}
