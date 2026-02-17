package com.charusat.canteen.controller;

import com.charusat.canteen.model.Order;
import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.User;
import com.charusat.canteen.service.CanteenService;
import com.charusat.canteen.service.OrderService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.security.Principal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Order Controller - Handles order management endpoints
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class OrderController {
    
    private final OrderService orderService;
    private final UserService userService;
    private final CanteenService canteenService;
    
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<?> getOrderByNumber(@PathVariable String orderNumber) {
        return orderService.findByOrderNumber(orderNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getCustomerOrders(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.findByCustomer(customerId));
    }
    
    @GetMapping("/canteen/{canteenId}")
    public ResponseEntity<List<Order>> getCanteenOrders(@PathVariable Long canteenId) {
        return ResponseEntity.ok(orderService.findByCanteen(canteenId));
    }
    
    @GetMapping("/canteen/{canteenId}/active")
    public ResponseEntity<List<Order>> getActiveOrders(@PathVariable Long canteenId) {
        return ResponseEntity.ok(orderService.findActiveOrders(canteenId));
    }
    
    @GetMapping("/canteen/{canteenId}/recent")
    public ResponseEntity<List<Order>> getRecentOrders(
            @PathVariable Long canteenId,
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(orderService.findRecentOrders(canteenId, hours));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        String email = principal.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (user.getRole() == User.UserRole.CANTEEN_OWNER) {
            // Find canteen owned by this user
            // Assuming 1-to-1 mapping for now or finding first canteen
            Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
            if (canteen != null) {
               return ResponseEntity.ok(orderService.findByCanteen(canteen.getId()));
            }
            return ResponseEntity.ok(List.of());
        } else if (user.getRole() == User.UserRole.ADMIN) {
             return ResponseEntity.ok(orderService.findAll());
        } else {
            // Standard User
            return ResponseEntity.ok(orderService.findByCustomer(user.getId()));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            User customer = userService.findById(request.customerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            Canteen canteen = canteenService.findCanteenById(request.canteenId())
                    .orElseThrow(() -> new RuntimeException("Canteen not found"));
            
            Order order = orderService.createOrder(
                    customer,
                    canteen,
                    request.menuItemIds(),
                    request.quantities(),
                    request.paymentMethod(),
                    request.instructions()
            );
            
            return ResponseEntity.ok(Map.of("success", true, "order", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String statusStr = body.get("status");
            String rejectionReason = body.get("rejectionReason");
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr.toUpperCase());
            Order order = orderService.updateStatus(id, newStatus, rejectionReason);
            return ResponseEntity.ok(Map.of("success", true, "order", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            Order order = orderService.cancelOrder(id);
            return ResponseEntity.ok(Map.of("success", true, "order", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/canteen/{canteenId}/pending/count")
    public ResponseEntity<?> getPendingCount(@PathVariable Long canteenId) {
        Long count = orderService.countPendingOrders(canteenId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    // Request DTO
    public record CreateOrderRequest(
            Long customerId, 
            Long canteenId, 
            List<Long> menuItemIds, 
            List<Integer> quantities, 
            String paymentMethod, 
            String instructions
    ) {}
}
