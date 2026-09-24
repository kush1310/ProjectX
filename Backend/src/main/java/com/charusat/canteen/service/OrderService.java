package com.charusat.canteen.service;

import com.charusat.canteen.exception.ResourceNotFoundException;
import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.MenuItemRepository;
import com.charusat.canteen.repository.OrderItemRepository;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;
    private final CouponService couponService;
    private final EmailService emailService;
    private final com.charusat.canteen.repository.CouponRepository couponRepository; // Direct access or via service

    private Order enrichOrder(Order order) {
        if (order == null) return null;
        if (order.getCustomerId() != null) {
            userRepository.findById(order.getCustomerId()).ifPresent(order::setCustomer);
        }
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            if (item.getMenuItemId() != null) {
                menuItemRepository.findById(item.getMenuItemId()).ifPresent(item::setMenuItem);
            }
        }
        order.setItems(items);
        return order;
    }

    private List<Order> enrichOrders(List<Order> orders) {
        if (orders != null) {
            orders.forEach(this::enrichOrder);
        }
        return orders;
    }

    public List<Order> findAll() {
        return enrichOrders(orderRepository.findAll());
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id).map(this::enrichOrder);
    }

    public Optional<Order> findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber).map(this::enrichOrder);
    }

    public List<Order> findByCustomer(Long customerId) {
        return enrichOrders(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId));
    }

    public org.springframework.data.domain.Page<Order> findByCustomer(Long customerId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Order> page = orderRepository.findByCustomerId(customerId, pageable);
        enrichOrders(page.getContent());
        return page;
    }

    public List<Order> findByCanteen(Long canteenId) {
        return enrichOrders(orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId));
    }

    public org.springframework.data.domain.Page<Order> findByCanteen(Long canteenId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Order> page = orderRepository.findByCanteenId(canteenId, pageable);
        enrichOrders(page.getContent());
        return page;
    }

    public org.springframework.data.domain.Page<Order> findAll(org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Order> page = orderRepository.findAll(pageable);
        enrichOrders(page.getContent());
        return page;
    }

    public List<Order> findActiveOrders(Long canteenId) {
        List<Order.OrderStatus> activeStatuses = List.of(
                Order.OrderStatus.RELEASED,
                Order.OrderStatus.PENDING,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PREPARING,
                Order.OrderStatus.READY);
        return enrichOrders(orderRepository.findByCanteenIdAndStatusIn(canteenId, activeStatuses));
    }

    public List<Order> findScheduledOrders(Long canteenId) {
        return enrichOrders(orderRepository.findScheduledOrdersByCanteen(canteenId));
    }

    public List<Order> findRecentOrders(Long canteenId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return enrichOrders(orderRepository.findRecentOrdersByCanteen(canteenId, since));
    }

    @Transactional
    public Order createOrder(User customer, Canteen canteen, List<Long> menuItemIds,
            List<Integer> quantities, String paymentMethod, String instructions, String couponCode,
            String orderType, LocalDateTime scheduledFor) {

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        boolean isScheduled = "SCHEDULED".equalsIgnoreCase(orderType) && scheduledFor != null;
        LocalDateTime releaseAt = null;
        Order.OrderStatus initialStatus = Order.OrderStatus.PENDING;

        if (isScheduled) {
            LocalDateTime now = LocalDateTime.now();
            if (scheduledFor.isBefore(now.plusMinutes(10))) {
                throw new IllegalArgumentException("Scheduled order time must be at least 10 minutes in the future.");
            }
            // Release to vendor kitchen 15 minutes before scheduled pickup time
            releaseAt = scheduledFor.minusMinutes(15);
            if (releaseAt.isBefore(now)) {
                releaseAt = now;
            }
            initialStatus = Order.OrderStatus.SCHEDULED;
        }

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .customerId(customer.getId())
                .canteen(canteen)
                .canteenId(canteen.getId())
                .paymentMethod(paymentMethod)
                .specialInstructions(instructions)
                .status(initialStatus)
                .orderType(isScheduled ? "SCHEDULED" : "INSTANT")
                .scheduledFor(scheduledFor)
                .releaseAt(releaseAt)
                .items(new ArrayList<>())
                .build();

        BigDecimal subTotal = BigDecimal.ZERO;
        List<com.charusat.canteen.dto.CouponDTOs.CartItemInfo> cartItemInfos = new ArrayList<>();

        for (int i = 0; i < menuItemIds.size(); i++) {
            Long itemId = menuItemIds.get(i);
            Integer qty = quantities.get(i);

            MenuItem menuItem = menuItemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemId));

            BigDecimal itemTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(qty));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .menuItemId(menuItem.getId())
                    .quantity(qty)
                    .unitPrice(menuItem.getPrice())
                    .totalPrice(itemTotal)
                    .build();

            order.getItems().add(orderItem);
            subTotal = subTotal.add(itemTotal);

            // Build info for coupon validation
            cartItemInfos.add(new com.charusat.canteen.dto.CouponDTOs.CartItemInfo(
                    menuItem.getId(), menuItem.getName(), qty, menuItem.getPrice()));
        }

        BigDecimal discount = BigDecimal.ZERO;
        Coupon appliedCoupon = null;

        if (couponCode != null && !couponCode.trim().isEmpty()) {
            com.charusat.canteen.dto.CouponDTOs.ValidateCouponRequest valReq = com.charusat.canteen.dto.CouponDTOs.ValidateCouponRequest
                    .builder()
                    .couponCode(couponCode)
                    .userId(customer.getId())
                    .orderTotal(subTotal)
                    .cartItems(cartItemInfos)
                    .build();

            com.charusat.canteen.dto.CouponDTOs.ValidationResult valRes = couponService.validateCoupon(valReq);

            if (valRes.isValid()) {
                discount = valRes.getDiscountAmount();
                // We need the entity to set the relation
                appliedCoupon = couponRepository.findByCouponCode(couponCode).orElse(null);
            } else {
                throw new RuntimeException("Invalid Coupon: " + valRes.getMessage());
            }
        }

        BigDecimal finalTotal = subTotal.subtract(discount).max(BigDecimal.ZERO);

        order.setSubTotal(subTotal);
        order.setDiscountAmount(discount);
        order.setTotalAmount(finalTotal);
        order.setAppliedCoupon(appliedCoupon);

        Order savedOrder = orderRepository.save(order);

        // Persist each OrderItem to the DB with the correct orderId
        for (OrderItem item : savedOrder.getItems()) {
            item.setOrderId(savedOrder.getId());
            orderItemRepository.save(item);
        }

        if (appliedCoupon != null) {
            couponService.recordUsage(appliedCoupon.getId(), customer.getId(), savedOrder.getId(), discount, subTotal);
        }

        // Notify Vendors via WebSocket immediately ONLY for INSTANT orders.
        // SCHEDULED orders are held in isolation and released when release_at arrives.
        if (!isScheduled) {
            webSocketService.notifyNewOrder(savedOrder);
        } else {
            log.info("Scheduled order {} created; held in isolation until release at {}", savedOrder.getOrderNumber(), releaseAt);
        }

        return savedOrder;
    }

    @Transactional
    public Order createOrder(User customer, Canteen canteen, List<Long> menuItemIds,
            List<Integer> quantities, String paymentMethod, String instructions, String couponCode) {
        return createOrder(customer, canteen, menuItemIds, quantities, paymentMethod, instructions, couponCode, "INSTANT", null);
    }

    @Transactional
    public Order releaseScheduledOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != Order.OrderStatus.SCHEDULED) {
            log.warn("Order {} is not in SCHEDULED status (current: {}), skipping release", orderId, order.getStatus());
            return order;
        }

        order.setStatus(Order.OrderStatus.RELEASED);
        order.setReleasedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);
        enrichOrder(savedOrder);

        // Transition order into active vendor workflow in real time
        webSocketService.notifyNewOrder(savedOrder);
        webSocketService.notifyStatusUpdate(savedOrder);

        log.info("Released scheduled order {} to canteen {} kitchen", savedOrder.getOrderNumber(), savedOrder.getCanteenId());
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

    @Transactional
    public void updateOrderLocation(Long orderId, Double lat, Double lng) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setCurrentLat(lat);
        order.setCurrentLng(lng);
        order.setLocationUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        webSocketService.notifyStatusUpdate(order);
    }
}
