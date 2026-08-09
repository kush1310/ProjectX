package com.charusat.canteen.service;

import com.charusat.canteen.dto.CouponDTOs.*;
import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.model.CouponUsage;
import com.charusat.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CouponAnalyticsService — Analytics computations for the dashboard.
 * Supports: Sales vs Discount, Vendor Impact, Type Performance,
 * Customer Analytics, Item-Based Analytics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponAnalyticsService {

    private final CouponUsageRepository usageRepository;
    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final CanteenRepository canteenRepository;

    /**
     * Get comprehensive analytics with filters.
     * 
     * @param period    WEEKLY, MONTHLY, YEARLY
     * @param startDate optional start
     * @param endDate   optional end
     */
    public AnalyticsResponse getAnalytics(String period, LocalDate startDate, LocalDate endDate) {
        // Determine date range
        if (endDate == null)
            endDate = LocalDate.now();
        if (startDate == null) {
            switch (period != null ? period.toUpperCase() : "MONTHLY") {
                case "WEEKLY":
                    startDate = endDate.minusWeeks(12);
                    break;
                case "YEARLY":
                    startDate = endDate.minusYears(3);
                    break;
                default:
                    startDate = endDate.minusMonths(6);
                    break;
            }
        }

        List<CouponUsage> usages = usageRepository.findByUsedAtBetween(
                startDate.atStartOfDay(), endDate.atTime(23, 59, 59));

        return AnalyticsResponse.builder()
                .salesVsDiscount(calculateSalesVsDiscount(usages, period, startDate, endDate))
                .vendorImpact(calculateVendorImpact(usages))
                .typePerformance(calculateTypePerformance(usages))
                .customerAnalytics(calculateCustomerAnalytics(usages))
                .itemAnalytics(calculateItemAnalytics())
                .build();
    }

    // ===== SALES VS DISCOUNT =====

    private List<SalesVsDiscountPoint> calculateSalesVsDiscount(
            List<CouponUsage> usages, String period, LocalDate startDate, LocalDate endDate) {

        Map<String, BigDecimal[]> periodMap = new TreeMap<>();

        for (CouponUsage usage : usages) {
            String key = getPeriodKey(usage.getUsedAt().toLocalDate(), period);
            periodMap.computeIfAbsent(key, k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
            BigDecimal[] values = periodMap.get(key);
            values[0] = values[0].add(usage.getOrderTotal() != null ? usage.getOrderTotal() : BigDecimal.ZERO);
            values[1] = values[1].add(usage.getDiscountApplied());
        }

        return periodMap.entrySet().stream()
                .map(e -> SalesVsDiscountPoint.builder()
                        .period(e.getKey())
                        .totalSales(e.getValue()[0])
                        .totalDiscount(e.getValue()[1])
                        .netRevenue(e.getValue()[0].subtract(e.getValue()[1]))
                        .build())
                .collect(Collectors.toList());
    }

    private String getPeriodKey(LocalDate date, String period) {
        if (period == null)
            period = "MONTHLY";
        switch (period.toUpperCase()) {
            case "WEEKLY":
                int weekOfYear = date.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
                return date.getYear() + "-W" + String.format("%02d", weekOfYear);
            case "YEARLY":
                return String.valueOf(date.getYear());
            default:
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
        }
    }

    // ===== VENDOR IMPACT =====
    // JDBC-safe: CouponUsage only has orderId/userId — no full Order/Canteen objects

    private List<VendorImpact> calculateVendorImpact(List<CouponUsage> usages) {
        Map<Long, BigDecimal[]> vendorMap = new HashMap<>();

        for (CouponUsage usage : usages) {
            if (usage.getOrderId() != null) {
                var orderOpt = orderRepository.findById(usage.getOrderId());
                if (orderOpt.isPresent() && orderOpt.get().getCanteenId() != null) {
                    Long canteenId = orderOpt.get().getCanteenId();
                    vendorMap.computeIfAbsent(canteenId, k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
                    BigDecimal[] values = vendorMap.get(canteenId);
                    values[0] = values[0].add(usage.getOrderTotal() != null ? usage.getOrderTotal() : BigDecimal.ZERO);
                    values[1] = values[1].add(usage.getDiscountApplied());
                }
            }
        }

        return vendorMap.entrySet().stream()
                .map(e -> {
                    String canteenName = canteenRepository.findById(e.getKey())
                            .map(c -> c.getName())
                            .orElse("Unknown");
                    return VendorImpact.builder()
                            .canteenId(e.getKey())
                            .canteenName(canteenName)
                            .totalRevenue(e.getValue()[0])
                            .totalDiscount(e.getValue()[1])
                            .netIncome(e.getValue()[0].subtract(e.getValue()[1]))
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ===== TYPE PERFORMANCE =====

    private List<TypePerformance> calculateTypePerformance(List<CouponUsage> usages) {
        Map<Coupon.CouponType, long[]> typeStats = new EnumMap<>(Coupon.CouponType.class);
        Map<Coupon.CouponType, BigDecimal[]> typeAmounts = new EnumMap<>(Coupon.CouponType.class);

        // Pre-load coupon types
        Map<UUID, Coupon.CouponType> couponTypes = couponRepository.findAll().stream()
                .collect(Collectors.toMap(Coupon::getId, Coupon::getCouponType));

        for (CouponUsage usage : usages) {
            Coupon.CouponType type = couponTypes.get(usage.getCouponId());
            if (type == null)
                type = Coupon.CouponType.GENERAL;

            typeStats.computeIfAbsent(type, k -> new long[] { 0 });
            typeStats.get(type)[0]++;

            typeAmounts.computeIfAbsent(type, k -> new BigDecimal[] { BigDecimal.ZERO, BigDecimal.ZERO });
            typeAmounts.get(type)[0] = typeAmounts.get(type)[0].add(usage.getDiscountApplied());
            typeAmounts.get(type)[1] = typeAmounts.get(type)[1].add(
                    usage.getOrderTotal() != null ? usage.getOrderTotal() : BigDecimal.ZERO);
        }

        return Arrays.stream(Coupon.CouponType.values())
                .map(type -> {
                    long count = typeStats.containsKey(type) ? typeStats.get(type)[0] : 0;
                    BigDecimal discount = typeAmounts.containsKey(type) ? typeAmounts.get(type)[0] : BigDecimal.ZERO;
                    BigDecimal totalOrder = typeAmounts.containsKey(type) ? typeAmounts.get(type)[1] : BigDecimal.ZERO;
                    BigDecimal avgOrder = count > 0
                            ? totalOrder.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return TypePerformance.builder()
                            .couponType(type)
                            .timesUsed(count)
                            .totalDiscount(discount)
                            .avgOrderValue(avgOrder)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ===== CUSTOMER ANALYTICS =====
    // JDBC-safe: use getUserId() instead of getUser().getId()

    private CustomerAnalytics calculateCustomerAnalytics(List<CouponUsage> usages) {
        Set<Long> allUsersWithCoupons = usages.stream()
                .map(CouponUsage::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Users who only have 1 order (new via coupon)
        long newCustomers = 0;
        long repeatCustomers = 0;
        for (Long userId : allUsersWithCoupons) {
            long orderCount = orderRepository.countByCustomerId(userId);
            if (orderCount <= 1) {
                newCustomers++;
            } else {
                repeatCustomers++;
            }
        }

        long totalCustomers = allUsersWithCoupons.size();
        double retentionRate = totalCustomers > 0 ? (double) repeatCustomers / totalCustomers * 100 : 0;

        return CustomerAnalytics.builder()
                .newCustomersViaCoupon(newCustomers)
                .repeatCustomers(repeatCustomers)
                .retentionRate(Math.round(retentionRate * 100.0) / 100.0)
                .totalCustomerGrowth(totalCustomers)
                .build();
    }

    // ===== ITEM-BASED ANALYTICS =====

    private List<ItemCouponAnalytics> calculateItemAnalytics() {
        // Placeholder — requires deep analysis of order items before/after coupon
        // application
        // Returns empty list; will be populated when real data is available
        return Collections.emptyList();
    }
}
