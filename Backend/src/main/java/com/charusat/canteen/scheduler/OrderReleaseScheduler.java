package com.charusat.canteen.scheduler;

import com.charusat.canteen.model.Order;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * OrderReleaseScheduler
 *
 * Background scheduler that periodically inspects scheduled orders.
 * When release_at <= current time, executes transactional transition from
 * SCHEDULED to RELEASED, notifying vendors and customers in real-time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderReleaseScheduler {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Scheduled(fixedDelay = 15000)
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void processPendingScheduledOrders() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> pendingReleases = orderRepository.findPendingReleaseOrders(now);

        if (!pendingReleases.isEmpty()) {
            log.info("Found {} scheduled orders eligible for release to kitchen queue", pendingReleases.size());
            for (Order order : pendingReleases) {
                try {
                    orderService.releaseScheduledOrder(order.getId());
                } catch (Exception ex) {
                    log.error("Failed to release scheduled order id {}: {}", order.getId(), ex.getMessage(), ex);
                }
            }
        }
    }
}
