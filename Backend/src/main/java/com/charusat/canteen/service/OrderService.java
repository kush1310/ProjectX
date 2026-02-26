package com.charusat.canteen.service;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.MenuItemRepository;
import com.charusat.canteen.repository.OrderItemRepository;
import com.charusat.canteen.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Order Service - Business logic for order management
 */
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final WebSocketService webSocketService;
    
    public List<Order> findAll() {
        return orderRepository.findAll();
    }
    
    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }
    
    public Optional<Order> findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }
    
    public List<Order> findByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }
    
    public List<Order> findByCanteen(Long canteenId) {
        return orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId);
    }
    
    public List<Order> findActiveOrders(Long canteenId) {
        List<Order.OrderStatus> activeStatuses = List.of(
                Order.OrderStatus.PENDING,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PREPARING,
                Order.OrderStatus.READY
        );
        return orderRepository.findByCanteenIdAndStatusIn(canteenId, activeStatuses);
    }
    
    public List<Order> findRecentOrders(Long canteenId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return orderRepository.findRecentOrdersByCanteen(canteenId, since);
    }

    @Transactional
    public Order createOrder(User customer, Canteen canteen, List<Long> menuItemIds, 
                              List<Integer> quantities, String paymentMethod, String instructions) {
        
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerId(customer.getId())
                .canteenId(canteen.getId())
                .paymentMethod(paymentMethod)
                .specialInstructions(instructions)
                .status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();
        
        Order savedOrder = orderRepository.save(order);
        
        BigDecimal total = BigDecimal.ZERO;
        
        for (int i = 0; i < menuItemIds.size(); i++) {
            Long itemId = menuItemIds.get(i);
            Integer qty = quantities.get(i);
            
            MenuItem menuItem = menuItemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemId));
            
            BigDecimal itemTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(qty));
            
            OrderItem orderItem = OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .menuItemId(menuItem.getId())
                    .quantity(qty)
                    .unitPrice(menuItem.getPrice())
                    .totalPrice(itemTotal)
                    .build();
            
            orderItemRepository.save(orderItem);
            savedOrder.getItems().add(orderItem);
            total = total.add(itemTotal);
        }
        
        savedOrder.setTotalAmount(total);
        savedOrder = orderRepository.save(savedOrder);
        
        // Notify Vendors via WebSocket
        webSocketService.notifyNewOrder(savedOrder);
        
        return savedOrder;
    }
    
    @Transactional
    public Order updateStatus(Long orderId, Order.OrderStatus newStatus, String rejectionReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        
        if (newStatus == Order.OrderStatus.COMPLETED) {
            order.setCompletedAt(LocalDateTime.now());
        }
        
        if (newStatus == Order.OrderStatus.CANCELLED && rejectionReason != null) {
            order.setRejectionReason(rejectionReason);
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // Notify via WebSocket
        webSocketService.notifyStatusUpdate(savedOrder);
        
        return savedOrder;
    }

    @Transactional
    public Order updateStatus(Long orderId, Order.OrderStatus newStatus) {
        return updateStatus(orderId, newStatus, null);
    }
    
    @Transactional
    public Order cancelOrder(Long orderId) {
        return updateStatus(orderId, Order.OrderStatus.CANCELLED);
    }
    
    public Long countPendingOrders(Long canteenId) {
        return orderRepository.countByCanteenIdAndStatus(canteenId, Order.OrderStatus.PENDING);
    }
}
