package com.charusat.canteen.service;

import com.charusat.canteen.model.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Notify vendors about a new order.
     * Broadcasts to:
     *  - /topic/orders (global — all vendors)
     *  - /topic/canteen/{canteenId}/orders (canteen-specific)
     */
    public void notifyNewOrder(Order order) {
        log.info("Broadcasting new order notification for Order #{}", order.getOrderNumber());
        
        // Global broadcast (backward compatibility)
        messagingTemplate.convertAndSend("/topic/orders", order);
        
        // Canteen-specific broadcast
        if (order.getCanteen() != null) {
            String canteenTopic = "/topic/canteen/" + order.getCanteen().getId() + "/orders";
            messagingTemplate.convertAndSend(canteenTopic, order);
            log.debug("Sent to canteen topic: {}", canteenTopic);
        }
    }

    /**
     * Notify about order status update.
     * Broadcasts to:
     *  - /topic/order-updates (global — all vendors)
     *  - /topic/canteen/{canteenId}/order-updates (canteen-specific)
     *  - /topic/user/{userId}/orders (user-specific for live tracking)
     */
    public void notifyStatusUpdate(Order order) {
        log.info("Broadcasting status update for Order #{} -> {}", order.getOrderNumber(), order.getStatus());
        
        // Global broadcast (backward compatibility)
        messagingTemplate.convertAndSend("/topic/order-updates", order);
        
        // Canteen-specific broadcast
        if (order.getCanteen() != null) {
            String canteenTopic = "/topic/canteen/" + order.getCanteen().getId() + "/order-updates";
            messagingTemplate.convertAndSend(canteenTopic, order);
        }
        
        // User-specific broadcast for live order tracking
        if (order.getCustomer() != null) {
            String userTopic = "/topic/user/" + order.getCustomer().getId() + "/orders";
            messagingTemplate.convertAndSend(userTopic, order);
            log.debug("Sent status update to user topic: {}", userTopic);
        }
    }
}
