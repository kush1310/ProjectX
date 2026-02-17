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
    
    public void notifyNewOrder(Order order) {
        log.info("Broadcasting new order notification for Order #{}", order.getOrderNumber());
        // In a real app, you might want a DTO here to avoid circular references or sending too much data
        // For now, we'll send the full order object or a simplified version
        messagingTemplate.convertAndSend("/topic/orders", order); // Simplified: Broadcast to all vendors
    }

    public void notifyStatusUpdate(Order order) {
        log.info("Broadcasting status update for Order #{}", order.getOrderNumber());
        messagingTemplate.convertAndSend("/topic/order-updates", order);
    }
}
