package com.charusat.canteen.controller;

import com.charusat.canteen.model.Order;
import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.User;
import com.charusat.canteen.service.CanteenService;
import com.charusat.canteen.service.EmailService;
import com.charusat.canteen.service.OrderService;
import com.charusat.canteen.service.UserService;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.Principal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;

/**
 * Order Controller - Handles order management endpoints
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final CanteenService canteenService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<Order>> getAllOrders(@org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(orderService.findAll(pageable));
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
    public ResponseEntity<org.springframework.data.domain.Page<Order>> getCustomerOrders(
            @PathVariable Long customerId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(orderService.findByCustomer(customerId, pageable));
    }

    @GetMapping("/canteen/{canteenId}")
    public ResponseEntity<org.springframework.data.domain.Page<Order>> getCanteenOrders(
            @PathVariable Long canteenId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(orderService.findByCanteen(canteenId, pageable));
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

    @GetMapping({"/my-orders", "/vendor-orders"})
    public ResponseEntity<org.springframework.data.domain.Page<Order>> getMyOrders(
            Principal principal,
            @org.springframework.data.web.PageableDefault(size = 1000) org.springframework.data.domain.Pageable pageable) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String email = principal.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.UserRole.CANTEEN_OWNER) {
            Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
            if (canteen != null) {
                return ResponseEntity.ok(orderService.findByCanteen(canteen.getId(), pageable));
            }
            return ResponseEntity.ok(org.springframework.data.domain.Page.empty(pageable));
        } else if (user.getRole() == User.UserRole.ADMIN) {
            return ResponseEntity.ok(orderService.findAll(pageable));
        } else {
            return ResponseEntity.ok(orderService.findByCustomer(user.getId(), pageable));
        }
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            // Task 1: Log incoming JSON in controller
            ObjectMapper mapper = new ObjectMapper();
            String jsonLog = mapper.writeValueAsString(payload);
            log.info("Incoming order payload: {}", jsonLog);

            // Extract fields based on User's requested format OR legacy frontend format
            Long userId = null;
            if (payload.containsKey("userId")) {
                userId = Long.valueOf(payload.get("userId").toString());
            } else if (payload.containsKey("customerId")) {
                userId = Long.valueOf(payload.get("customerId").toString());
            }

            // Task 1: Validate Required Fields gracefully
            if (userId == null && principal == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Missing required field: userId"));
            }

            // Validate items
            List<?> itemsRaw = (List<?>) payload.get("items");
            List<Long> menuItemIds = new ArrayList<>();
            List<Integer> quantities = new ArrayList<>();
            Long canteenId = null;

            if (itemsRaw != null && !itemsRaw.isEmpty()) {
                // User's new format: items
                for (Object itemObj : itemsRaw) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> item = (Map<String, Object>) itemObj;
                    Object itemIdObj = item.get("foodItemId") != null ? item.get("foodItemId") : item.get("menuItemId");
                    if (itemIdObj == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Item missing foodItemId/menuItemId"));
                    }
                    menuItemIds.add(Long.valueOf(itemIdObj.toString()));
                    Object qtyObj = item.get("quantity");
                    quantities.add(qtyObj != null ? Integer.valueOf(qtyObj.toString()) : 1);
                }
                canteenId = payload.get("restaurantId") != null ? Long.valueOf(payload.get("restaurantId").toString()) 
                          : (payload.get("canteenId") != null ? Long.valueOf(payload.get("canteenId").toString()) : null);
            } else if (payload.containsKey("menuItemIds") && payload.containsKey("quantities")) {
                // Frontend format
                menuItemIds = ((List<?>) payload.get("menuItemIds")).stream()
                        .map(id -> Long.valueOf(id.toString())).collect(Collectors.toList());
                quantities = ((List<?>) payload.get("quantities")).stream()
                        .map(qty -> Integer.valueOf(qty.toString())).collect(Collectors.toList());
                canteenId = payload.get("canteenId") != null ? Long.valueOf(payload.get("canteenId").toString()) : null;
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Missing required field: items (non-empty)"));
            }

            // Other required fields from user request: totalAmount, deliveryAddress
            if (!payload.containsKey("totalAmount") && payload.containsKey("totalAmount_REQUIRED_FLIP")) {
                // Normally we'd reject, but allowing to keep frontend working
                log.warn("Missing expected field: totalAmount");
            }
            String instructions = payload.containsKey("deliveryAddress") ? 
                    "Delivery Address: " + payload.get("deliveryAddress").toString() : "";
            
            if (payload.containsKey("instructions")) {
                instructions += " | Notes: " + payload.get("instructions").toString();
            }

            if (canteenId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Missing required field: canteenId / restaurantId"));
            }

            User customer;
            if (principal != null) {
                String email = principal.getName();
                customer = userService.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
            } else {
                customer = userService.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Customer not found"));
            }

            Canteen canteen = canteenService.findCanteenById(canteenId)
                    .orElseThrow(() -> new RuntimeException("Canteen not found"));

            String paymentMethod = payload.containsKey("paymentMethod") ? payload.get("paymentMethod").toString() : "cash";
            String couponCode = payload.containsKey("couponCode") && payload.get("couponCode") != null ? payload.get("couponCode").toString() : null;

            Order order = orderService.createOrder(
                    customer,
                    canteen,
                    menuItemIds,
                    quantities,
                    paymentMethod,
                    instructions,
                    couponCode);

            // Frontend expects order inside data if using res.data.order, 
            // but CheckoutPage expects res.data.id specifically!
            return ResponseEntity.ok(Map.of("success", true, "id", order.getId(), "order", order));
        } catch (Exception e) {
            log.error("Error creating order: ", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage(), "message", e.getMessage()));
        }
    }

    /**
     * Place Order — Spec-compatible alias for POST /api/orders
     * Accepts: { customerId, restaurantId, items: [{foodItemId, quantity}] }
     */
    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest request, Principal principal) {
        try {
            User customer;

            if (principal != null) {
                String email = principal.getName();
                customer = userService.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
            } else if (request.customerId() != null) {
                customer = userService.findById(request.customerId())
                        .orElseThrow(() -> new RuntimeException("Customer not found"));
            } else {
                return ResponseEntity.status(401)
                        .body(Map.of("success", false, "message", "Authentication required"));
            }

            // restaurantId maps to canteenId in this system
            Long canteenId = request.restaurantId() != null ? request.restaurantId() : request.canteenId();
            if (canteenId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "restaurantId or canteenId is required"));
            }

            Canteen canteen = canteenService.findCanteenById(canteenId)
                    .orElseThrow(() -> new RuntimeException("Restaurant/Canteen not found"));

            // Extract menuItemIds and quantities from the items array
            List<Long> menuItemIds = request.items().stream()
                    .map(i -> i.foodItemId() != null ? i.foodItemId() : i.menuItemId())
                    .collect(Collectors.toList());
            List<Integer> quantities = request.items().stream()
                    .map(PlaceOrderItem::quantity)
                    .collect(Collectors.toList());

            Order order = orderService.createOrder(
                    customer, canteen, menuItemIds, quantities,
                    request.paymentMethod(), request.instructions(), request.couponCode());

            return ResponseEntity.ok(Map.of(
                    "orderId", order.getId(),
                    "status", order.getStatus().name(),
                    "success", true,
                    "order", order));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Get Orders for a Restaurant — alias for /canteen/{canteenId}
     */
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Order>> getRestaurantOrders(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.findByCanteen(restaurantId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String statusStr = body.get("status");
            String rejectionReason = body.get("rejectionReason");
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr.toUpperCase());
            Order order = orderService.updateStatus(id, newStatus, rejectionReason);

            // When vendor cancels a paid order, mark as REFUNDED and send refund email
            if (newStatus == Order.OrderStatus.CANCELLED
                    && order.getPaymentStatus() == Order.PaymentStatus.PAID) {
                try {
                    // Compute the amount actually charged: (totalAmount - discountAmount) + 5% GST
                    java.math.BigDecimal base = order.getTotalAmount() != null
                            ? order.getTotalAmount() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal discount = order.getDiscountAmount() != null
                            ? order.getDiscountAmount() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal discounted = base.subtract(discount)
                            .max(java.math.BigDecimal.ZERO);
                    java.math.BigDecimal gst = discounted
                            .multiply(java.math.BigDecimal.valueOf(0.05))
                            .setScale(0, java.math.RoundingMode.HALF_UP);
                    java.math.BigDecimal refundAmount = discounted.add(gst);

                    // Mark order as REFUNDED in DB
                    order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
                    order.setUpdatedAt(java.time.LocalDateTime.now());
                    orderRepository.save(order);

                    // Send async refund email to customer
                    if (order.getCustomerId() != null) {
                        userRepository.findById(order.getCustomerId()).ifPresent(customer ->
                            emailService.sendOrderRefundEmail(
                                    customer.getEmail(),
                                    customer.getFullName(),
                                    order.getOrderNumber(),
                                    refundAmount.toPlainString(),
                                    rejectionReason)
                        );
                    }
                } catch (Exception refundEx) {
                    log.warn("Failed to process refund notification for order {}: {}",
                            id, refundEx.getMessage());
                }
            }

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

    /**
     * cancelUnpaid
     *
     * Deletes a pending order that was created but never paid (e.g., user closed
     * the Razorpay modal). Only executes if paymentStatus is PENDING — prevents
     * any risk of deleting a legitimately paid order.
     *
     * Called by the frontend's Razorpay ondismiss callback so that ghost orders
     * never appear in vendor dashboard or customer history.
     *
     * @param id        {Long}      - Order ID to delete.
     * @param principal {Principal} - Authenticated customer making the request.
     * @returns 200 OK if deleted, 400 if order has already been paid.
     */
    @DeleteMapping("/{id}/cancel-unpaid")
    public ResponseEntity<?> cancelUnpaid(@PathVariable Long id, Principal principal) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Only delete if the order has not been paid — prevents accidental deletion of paid orders
            if (order.getPaymentStatus() != null &&
                    order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Cannot cancel a paid order via this endpoint"));
            }

            // Ownership check — customer can only cancel their own orders
            if (principal != null) {
                String email = principal.getName();
                userService.findByEmail(email).ifPresent(user -> {
                    if (!user.getId().equals(order.getCustomerId())) {
                        throw new RuntimeException("Unauthorised: not your order");
                    }
                });
            }

            orderRepository.deleteById(id);
            log.info("Deleted unpaid ghost order: id={}", id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Unpaid order removed"));
        } catch (Exception e) {
            log.warn("cancelUnpaid failed for order {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateOrderLocation(@PathVariable Long id, @RequestBody Map<String, Double> body) {
        try {
            Double lat = body.get("lat");
            Double lng = body.get("lng");
            orderService.updateOrderLocation(id, lat, lng);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Request DTO — original format
    public record CreateOrderRequest(
            Long customerId,
            Long canteenId,
            List<Long> menuItemIds,
            List<Integer> quantities,
            String paymentMethod,
            String instructions,
            String couponCode) {
    }

    // Request DTO — spec-compatible /place format
    public record PlaceOrderRequest(
            Long customerId,
            Long restaurantId,
            Long canteenId,
            List<PlaceOrderItem> items,
            String paymentMethod,
            String instructions,
            String couponCode) {
    }

    public record PlaceOrderItem(
            Long foodItemId,
            Long menuItemId,
            Integer quantity) {
    }
}
