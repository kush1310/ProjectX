package com.charusat.canteen.controller;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.repository.ReviewRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.service.CanteenService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Analytics Controller - Dashboard statistics and insights
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnalyticsController {
    
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final CanteenService canteenService;
    private final UserService userService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userService.findByEmail(principal.getName()).orElse(null);
        if (user == null || (user.getRole() != User.UserRole.CANTEEN_OWNER && user.getRole() != User.UserRole.ADMIN)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        
        Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
        Long canteenId = canteen != null ? canteen.getId() : null;
        
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        
        // Get orders
        List<Order> allOrders = canteenId != null 
            ? orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId)
            : orderRepository.findAll();
        
        List<Order> todayOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(todayStart))
                .collect(Collectors.toList());
        
        List<Order> monthOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(monthStart))
                .collect(Collectors.toList());
        
        // Calculate stats
        long totalOrders = allOrders.size();
        long todayOrderCount = todayOrders.size();
        
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal todayRevenue = todayOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal monthRevenue = monthOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Unique customers
        long uniqueCustomers = allOrders.stream()
                .map(o -> o.getCustomer().getId())
                .distinct()
                .count();
        
        // Pending orders
        long pendingOrders = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.PENDING)
                .count();
        
        long preparingOrders = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.PREPARING)
                .count();
        
        // Average rating - default to 4.4 if no reviews (as per requirement)
        Double avgRating = canteenId != null 
            ? reviewRepository.getAverageRatingByCanteenId(canteenId)
            : null;
        double rating = (avgRating != null) ? avgRating : 4.4;
        
        // Completion rate
        long completedOrders = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .count();
        double completionRate = totalOrders > 0 ? (completedOrders * 100.0 / totalOrders) : 0;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", totalOrders);
        stats.put("todayOrders", todayOrderCount);
        stats.put("pendingOrders", pendingOrders);
        stats.put("preparingOrders", preparingOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("todayRevenue", todayRevenue);
        stats.put("monthRevenue", monthRevenue);
        stats.put("uniqueCustomers", uniqueCustomers);
        stats.put("averageRating", rating);
        stats.put("completionRate", Math.round(completionRate));
        stats.put("inProgress", pendingOrders + preparingOrders);
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/sales")
    public ResponseEntity<?> getSalesData(
            Principal principal,
            @RequestParam(defaultValue = "week") String period) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userService.findByEmail(principal.getName()).orElse(null);
        Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
        Long canteenId = canteen != null ? canteen.getId() : null;
        
        List<Order> orders = canteenId != null 
            ? orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId)
            : orderRepository.findAll();
        
        // Group by date
        LocalDate startDate = switch (period) {
            case "month" -> LocalDate.now().minusMonths(1);
            case "year" -> LocalDate.now().minusYears(1);
            default -> LocalDate.now().minusWeeks(1);
        };
        
        Map<LocalDate, BigDecimal> salesByDate = orders.stream()
                .filter(o -> o.getCreatedAt().toLocalDate().isAfter(startDate))
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        
        List<Map<String, Object>> chartData = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(LocalDate.now())) {
            chartData.add(Map.of(
                    "date", current.toString(),
                    "sales", salesByDate.getOrDefault(current, BigDecimal.ZERO)
            ));
            current = current.plusDays(1);
        }
        
        return ResponseEntity.ok(Map.of("data", chartData, "period", period));
    }
    
    @GetMapping("/top-selling")
    public ResponseEntity<?> getTopSellingItems(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userService.findByEmail(principal.getName()).orElse(null);
        Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
        Long canteenId = canteen != null ? canteen.getId() : null;
        
        List<Order> orders = canteenId != null 
            ? orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId)
            : orderRepository.findAll();
        
        // Count items
        Map<String, Long> itemCounts = new HashMap<>();
        Map<String, BigDecimal> itemRevenue = new HashMap<>();
        
        orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED)
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    String name = item.getMenuItem().getName();
                    itemCounts.merge(name, (long) item.getQuantity(), Long::sum);
                    itemRevenue.merge(name, item.getTotalPrice(), BigDecimal::add);
                });
        
        List<Map<String, Object>> topItems = itemCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> Map.of(
                        "name", (Object) e.getKey(),
                        "orders", e.getValue(),
                        "revenue", itemRevenue.get(e.getKey())
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of("items", topItems));
    }
    
    @GetMapping("/reviews/latest")
    public ResponseEntity<?> getLatestReviews(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userService.findByEmail(principal.getName()).orElse(null);
        Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
        
        if (canteen == null) {
            return ResponseEntity.ok(Map.of("reviews", List.of()));
        }
        
        List<Review> reviews = reviewRepository.findTop5ByCanteenIdOrderByCreatedAtDesc(canteen.getId());
        
        List<Map<String, Object>> reviewData = reviews.stream()
                .map(r -> Map.of(
                        "id", (Object) r.getId(),
                        "customerName", r.getIsAnonymous() ? "Anonymous" : r.getCustomer().getFullName(),
                        "rating", r.getRating(),
                        "comment", r.getComment() != null ? r.getComment() : "",
                        "createdAt", r.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of("reviews", reviewData));
    }
    
    @GetMapping("/mealtime")
    public ResponseEntity<?> getMealtimeDistribution(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userService.findByEmail(principal.getName()).orElse(null);
        Canteen canteen = canteenService.getCanteenByOwnerId(user.getId());
        Long canteenId = canteen != null ? canteen.getId() : null;
        
        List<Order> orders = canteenId != null 
            ? orderRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId)
            : orderRepository.findAll();
        
        long breakfast = orders.stream()
                .filter(o -> {
                    int hour = o.getCreatedAt().getHour();
                    return hour >= 6 && hour < 11;
                }).count();
        
        long lunch = orders.stream()
                .filter(o -> {
                    int hour = o.getCreatedAt().getHour();
                    return hour >= 11 && hour < 16;
                }).count();
        
        long snacks = orders.stream()
                .filter(o -> {
                    int hour = o.getCreatedAt().getHour();
                    return hour >= 16 && hour < 20;
                }).count();
        
        long dinner = orders.stream()
                .filter(o -> {
                    int hour = o.getCreatedAt().getHour();
                    return hour >= 20 || hour < 6;
                }).count();
        
        return ResponseEntity.ok(Map.of(
                "breakfast", breakfast,
                "lunch", lunch,
                "snacks", snacks,
                "dinner", dinner
        ));
    }
}
