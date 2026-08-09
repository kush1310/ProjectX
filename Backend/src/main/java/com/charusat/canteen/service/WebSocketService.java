package com.charusat.canteen.service;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.Order;
import com.charusat.canteen.model.OrderItem;
import com.charusat.canteen.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WebSocket Service — Broadcasts encrypted order notifications.
 *
 * All payloads are AES-256-GCM encrypted before sending over STOMP.
 * Even if WebSocket traffic is intercepted, the body is unreadable.
 *
 * Topics:
 *   /topic/orders                       → global new order feed (existing)
 *   /topic/order-updates                → global status update feed (existing)
 *   /topic/restaurant/{canteenId}       → per-restaurant new orders
 *   /topic/customer/{customerId}        → per-customer status updates
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final PayloadCryptoService cryptoService;

    /**
     * Broadcast a NEW_ORDER event when an order is placed.
     * Sends enriched payload with customer details, items, and location.
     */
    public void notifyNewOrder(Order order) {
        log.info("Broadcasting encrypted order notification for Order #{}", order.getOrderNumber());

        // Build enriched payload for the restaurant/vendor
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "NEW_ORDER");
        payload.put("orderId", order.getId());
        payload.put("id", order.getId());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("status", order.getStatus() != null ? order.getStatus().name() : "PENDING");
        payload.put("totalAmount", order.getTotalAmount());
        payload.put("canteenId", order.getCanteenId());
        payload.put("customerId", order.getCustomerId());
        payload.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");
        payload.put("paymentMethod", order.getPaymentMethod());
        payload.put("paymentStatus", order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        payload.put("specialInstructions", order.getSpecialInstructions());

        // Enrich with customer details if available
        if (order.getCustomer() != null) {
            User customer = order.getCustomer();
            payload.put("customerName", customer.getFullName());
            payload.put("customerPhone", customer.getMobile());
            payload.put("customerEmail", customer.getEmail());

            // Build customer object for frontend
            Map<String, Object> customerMap = new LinkedHashMap<>();
            customerMap.put("id", customer.getId());
            customerMap.put("fullName", customer.getFullName());
            customerMap.put("email", customer.getEmail());
            customerMap.put("mobile", customer.getMobile());
            payload.put("customer", customerMap);
        }

        // Enrich with canteen details if available
        if (order.getCanteen() != null) {
            Canteen canteen = order.getCanteen();
            Map<String, Object> canteenMap = new LinkedHashMap<>();
            canteenMap.put("id", canteen.getId());
            canteenMap.put("name", canteen.getName());
            canteenMap.put("location", canteen.getLocation());
            payload.put("canteen", canteenMap);
        }

        // Enrich with order items if available
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<Map<String, Object>> itemsList = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("unitPrice", item.getUnitPrice());
                itemMap.put("totalPrice", item.getTotalPrice());
                itemMap.put("menuItemId", item.getMenuItemId());
                if (item.getMenuItem() != null) {
                    Map<String, Object> menuItemMap = new LinkedHashMap<>();
                    menuItemMap.put("id", item.getMenuItem().getId());
                    menuItemMap.put("name", item.getMenuItem().getName());
                    menuItemMap.put("price", item.getMenuItem().getPrice());
                    menuItemMap.put("isVeg", item.getMenuItem().getIsVeg());
                    itemMap.put("menuItem", menuItemMap);
                    itemMap.put("name", item.getMenuItem().getName());
                }
                itemsList.add(itemMap);
            }
            payload.put("items", itemsList);
        }

        String jsonPayload = toJson(payload);
        String encrypted = cryptoService.encrypt(jsonPayload);

        // Send to global topic (existing frontend compatibility)
        messagingTemplate.convertAndSend("/topic/orders", Map.of("enc", encrypted));

        // Send to per-restaurant topic
        if (order.getCanteenId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/restaurant/" + order.getCanteenId(),
                    Map.of("enc", encrypted));
        }

        log.info("Order #{} notification sent to /topic/orders and /topic/restaurant/{}",
                order.getOrderNumber(), order.getCanteenId());
    }

    /**
     * Broadcast an ORDER_STATUS_UPDATE event when order status changes.
     * Sends enriched payload with restaurant contact info.
     */
    public void notifyStatusUpdate(Order order) {
        log.info("Broadcasting encrypted status update for Order #{}", order.getOrderNumber());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "ORDER_STATUS_UPDATE");
        payload.put("orderId", order.getId());
        payload.put("id", order.getId());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("status", order.getStatus() != null ? order.getStatus().name() : "PENDING");
        payload.put("totalAmount", order.getTotalAmount());
        payload.put("canteenId", order.getCanteenId());
        payload.put("customerId", order.getCustomerId());
        payload.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");
        payload.put("paymentMethod", order.getPaymentMethod());
        payload.put("paymentStatus", order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        payload.put("rejectionReason", order.getRejectionReason());
        payload.put("completedAt", order.getCompletedAt() != null ? order.getCompletedAt().toString() : null);

        // Enrich with customer info
        if (order.getCustomer() != null) {
            Map<String, Object> customerMap = new LinkedHashMap<>();
            customerMap.put("id", order.getCustomer().getId());
            customerMap.put("fullName", order.getCustomer().getFullName());
            customerMap.put("email", order.getCustomer().getEmail());
            customerMap.put("mobile", order.getCustomer().getMobile());
            payload.put("customer", customerMap);
        }

        // Enrich with canteen/restaurant contact for customer
        if (order.getCanteen() != null) {
            Canteen canteen = order.getCanteen();
            Map<String, Object> canteenMap = new LinkedHashMap<>();
            canteenMap.put("id", canteen.getId());
            canteenMap.put("name", canteen.getName());
            canteenMap.put("location", canteen.getLocation());
            payload.put("canteen", canteenMap);
            payload.put("restaurantContact", canteen.getName());
        }

        // Include items for frontend display
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<Map<String, Object>> itemsList = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("unitPrice", item.getUnitPrice());
                itemMap.put("totalPrice", item.getTotalPrice());
                if (item.getMenuItem() != null) {
                    Map<String, Object> menuItemMap = new LinkedHashMap<>();
                    menuItemMap.put("id", item.getMenuItem().getId());
                    menuItemMap.put("name", item.getMenuItem().getName());
                    menuItemMap.put("price", item.getMenuItem().getPrice());
                    menuItemMap.put("isVeg", item.getMenuItem().getIsVeg());
                    itemMap.put("menuItem", menuItemMap);
                }
                itemsList.add(itemMap);
            }
            payload.put("items", itemsList);
        }

        String jsonPayload = toJson(payload);
        String encrypted = cryptoService.encrypt(jsonPayload);

        // Send to global topic (existing frontend compatibility)
        messagingTemplate.convertAndSend("/topic/order-updates", Map.of("enc", encrypted));

        // Send to per-customer topic
        if (order.getCustomerId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/customer/" + order.getCustomerId(),
                    Map.of("enc", encrypted));
        }

        // Also notify restaurant topic so vendor dashboard gets status changes
        if (order.getCanteenId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/restaurant/" + order.getCanteenId(),
                    Map.of("enc", encrypted));
        }

        log.info("Status update for Order #{}: {} \u2192 sent to /topic/order-updates, /topic/customer/{}, /topic/restaurant/{}",
                order.getOrderNumber(), order.getStatus(), order.getCustomerId(), order.getCanteenId());
    }

    /**
     * notifyCanteenStatusChange
     *
     * Broadcasts a CANTEEN_STATUS_CHANGED event when a vendor toggles the
     * restaurant open/closed state. Published to:
     *   /topic/canteens           \u2014 global feed (all customer dashboards)
     *   /topic/canteen/{id}/status \u2014 per-canteen (menu page, card)
     *
     * The customer dashboard and menu page subscribe to these topics and
     * update the "Closed" overlay in real-time without any page reload.
     *
     * @param canteen  {Canteen} - The updated canteen entity with new isOpen value.
     */
    public void notifyCanteenStatusChange(Canteen canteen) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type",      "CANTEEN_STATUS_CHANGED");
        payload.put("canteenId", canteen.getId());
        payload.put("name",      canteen.getName());
        payload.put("isOpen",    canteen.getIsOpen());
        payload.put("timestamp", java.time.Instant.now().toString());

        String jsonPayload = toJson(payload);
        String encrypted   = cryptoService.encrypt(jsonPayload);

        // Global feed \u2014 student dashboard uses this to flip all canteen cards
        messagingTemplate.convertAndSend("/topic/canteens", Map.of("enc", encrypted));

        // Per-canteen topic \u2014 menu page and individual canteen cards subscribe here
        messagingTemplate.convertAndSend(
                "/topic/canteen/" + canteen.getId() + "/status",
                Map.of("enc", encrypted));

        log.info("Canteen status change broadcast: canteen={} isOpen={}", canteen.getId(), canteen.getIsOpen());
    }

    // ===== COUPON BROADCAST METHODS =====

    /**
     * Broadcast a COUPON_CREATED event when a vendor creates a new coupon.
     * Customers subscribed to /topic/coupons or /topic/coupons/{canteenId} get real-time updates.
     */
    public void notifyCouponCreated(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_CREATED", couponPayload);
    }

    /**
     * Broadcast a COUPON_UPDATED event when a vendor edits a coupon.
     */
    public void notifyCouponUpdated(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_UPDATED", couponPayload);
    }

    /**
     * Broadcast a COUPON_DELETED event when a vendor removes a coupon.
     */
    public void notifyCouponDeleted(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_DELETED", couponPayload);
    }

    /**
     * Broadcast a COUPON_TOGGLED event when vendor activates/deactivates.
     */
    public void notifyCouponToggled(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_TOGGLED", couponPayload);
    }

    /**
     * Broadcast a COUPON_ARCHIVED event.
     */
    public void notifyCouponArchived(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_ARCHIVED", couponPayload);
    }

    /**
     * Broadcast a COUPON_RESTORED event.
     */
    public void notifyCouponRestored(Map<String, Object> couponPayload) {
        broadcastCouponEvent("COUPON_RESTORED", couponPayload);
    }

    /**
     * Internal helper — sends encrypted coupon event to global + per-canteen topics.
     */
    private void broadcastCouponEvent(String eventType, Map<String, Object> couponPayload) {
        Map<String, Object> payload = new LinkedHashMap<>(couponPayload);
        payload.put("type", eventType);
        payload.put("timestamp", java.time.Instant.now().toString());

        String jsonPayload = toJson(payload);
        String encrypted = cryptoService.encrypt(jsonPayload);

        // Global coupon topic — all customers
        messagingTemplate.convertAndSend("/topic/coupons", Map.of("enc", encrypted));

        // Per-canteen topic for targeted delivery
        Object canteenId = couponPayload.get("canteenId");
        if (canteenId != null) {
            messagingTemplate.convertAndSend(
                    "/topic/coupons/" + canteenId,
                    Map.of("enc", encrypted));
        }

        log.info("Coupon event [{}] broadcast for coupon: {} → /topic/coupons{}",
                eventType, couponPayload.get("couponCode"),
                canteenId != null ? " + /topic/coupons/" + canteenId : "");
    }

    /**
     * Simple JSON serializer for Map payloads.
     * Uses Jackson-compatible format via string building for reliability.
     */
    private String toJson(Map<String, Object> map) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket payload to JSON", e);
            // Fallback to minimal payload
            return String.format(
                    "{\"id\":%s,\"status\":\"%s\",\"orderNumber\":\"%s\"}",
                    map.get("orderId"), map.get("status"), map.get("orderNumber"));
        }
    }

    public void notifyMenuItemUpdated(com.charusat.canteen.model.MenuItem item) {
        if (item == null || item.getCanteenId() == null) return;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "MENU_ITEM_UPDATED");
        payload.put("itemId", item.getId());
        payload.put("canteenId", item.getCanteenId());
        payload.put("name", item.getName());
        payload.put("isAvailable", item.getIsAvailable());
        payload.put("price", item.getPrice());
        payload.put("tags", item.getTags());

        String jsonPayload = toJson(payload);
        String encrypted = cryptoService.encrypt(jsonPayload);
        messagingTemplate.convertAndSend("/topic/canteen/" + item.getCanteenId() + "/menu", Map.of("enc", encrypted));
        messagingTemplate.convertAndSend("/topic/canteens", Map.of("enc", encrypted));
    }
}
