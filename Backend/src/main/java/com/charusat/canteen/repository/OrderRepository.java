package com.charusat.canteen.repository;

import com.charusat.canteen.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Order Repository - Database operations for orders
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    List<Order> findByCustomerId(Long customerId);
    
    List<Order> findByCanteenId(Long canteenId);
    
    List<Order> findByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status);
    
    List<Order> findByCanteenIdAndStatusIn(Long canteenId, List<Order.OrderStatus> statuses);
    
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    List<Order> findByCanteenIdOrderByCreatedAtDesc(Long canteenId);
    
    @Query("SELECT o FROM Order o WHERE o.canteen.id = :canteenId AND o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByCanteen(Long canteenId, LocalDateTime since);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.canteen.id = :canteenId AND o.status = :status")
    Long countByCanteenIdAndStatus(Long canteenId, Order.OrderStatus status);
}
