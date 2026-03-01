package com.charusat.canteen.service;

import com.charusat.canteen.dto.CouponDTOs.*;
import com.charusat.canteen.exception.BadRequestException;
import com.charusat.canteen.exception.ResourceNotFoundException;
import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CouponService — CRUD operations, dashboard stats, calendar view, auto-expiry.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponApplicabilityRepository applicabilityRepository;
    private final CouponUsageRepository usageRepository;
    private final CanteenRepository canteenRepository;
    private final MenuItemRepository menuItemRepository;

    // ===== CREATE =====

    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request) {
        // Prevent duplicate codes
        if (couponRepository.existsByCouponCode(request.getCouponCode())) {
            throw new BadRequestException("Coupon code '" + request.getCouponCode() + "' already exists");
        }

        // Build entity
        Coupon coupon = Coupon.builder()
                .couponCode(request.getCouponCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .color(request.getColor())
                .couponType(request.getCouponType())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maxDiscountCap(request.getMaxDiscountCap())
                .minOrderValue(request.getMinOrderValue())
                .usageLimitTotal(request.getUsageLimitTotal())
                .usageLimitPerUser(request.getUsageLimitPerUser())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .rushHourFlag(request.getRushHourFlag() != null ? request.getRushHourFlag() : false)
                .rushHourStart(request.getRushHourStart())
                .rushHourEnd(request.getRushHourEnd())
                .bogoBuyQty(request.getBogoBuyQty())
                .bogoGetQty(request.getBogoGetQty())
                .bogoFreeItemId(request.getBogoFreeItemId())
                .comboItems(request.getComboItems())
                .newCustomerOnly(request.getNewCustomerOnly() != null ? request.getNewCustomerOnly() : false)
                .newDishFlag(request.getNewDishFlag() != null ? request.getNewDishFlag() : false)
                .isActive(true)
                .isCustom(true)
                .offerCategory(
                        request.getOfferCategory() != null ? request.getOfferCategory() : Coupon.OfferCategory.COUPON)
                .isArchived(false)
                .build();

        // Set canteen
        if (request.getCanteenId() != null) {
            Canteen canteen = canteenRepository.findById(request.getCanteenId())
                    .orElseThrow(() -> new ResourceNotFoundException("Canteen not found"));
            coupon.setCanteen(canteen);
            coupon.setCanteenId(canteen.getId()); // Ensure JDBC canteen_id column is populated
        }

        coupon = couponRepository.save(coupon);

        // Save applicability items
        if (request.getApplicableItemIds() != null && !request.getApplicableItemIds().isEmpty()) {
            Coupon finalCoupon = coupon;
            List<CouponApplicability> items = request.getApplicableItemIds().stream()
                    .map(itemId -> {
                        MenuItem menuItem = menuItemRepository.findById(itemId)
                                .orElseThrow(() -> new ResourceNotFoundException("Menu item " + itemId + " not found"));
                        return CouponApplicability.builder()
                                .coupon(finalCoupon)
                                .menuItem(menuItem)
                                .requiredQty(1)
                                .build();
                    })
                    .collect(Collectors.toList());
            applicabilityRepository.saveAll(items);
        }

        log.info("Created coupon: {} (type: {})", coupon.getCouponCode(), coupon.getCouponType());
        return mapToResponse(coupon);
    }

    // ===== UPDATE =====

    @Transactional
    public CouponResponse updateCoupon(UUID couponId, UpdateCouponRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        if (request.getTitle() != null)
            coupon.setTitle(request.getTitle());
        if (request.getDescription() != null)
            coupon.setDescription(request.getDescription());
        if (request.getColor() != null)
            coupon.setColor(request.getColor());
        if (request.getDiscountType() != null)
            coupon.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null)
            coupon.setDiscountValue(request.getDiscountValue());
        if (request.getMaxDiscountCap() != null)
            coupon.setMaxDiscountCap(request.getMaxDiscountCap());
        if (request.getMinOrderValue() != null)
            coupon.setMinOrderValue(request.getMinOrderValue());
        if (request.getUsageLimitTotal() != null)
            coupon.setUsageLimitTotal(request.getUsageLimitTotal());
        if (request.getUsageLimitPerUser() != null)
            coupon.setUsageLimitPerUser(request.getUsageLimitPerUser());
        if (request.getStartTime() != null)
            coupon.setStartTime(request.getStartTime());
        if (request.getEndTime() != null)
            coupon.setEndTime(request.getEndTime());
        if (request.getRushHourFlag() != null)
            coupon.setRushHourFlag(request.getRushHourFlag());
        if (request.getRushHourStart() != null)
            coupon.setRushHourStart(request.getRushHourStart());
        if (request.getRushHourEnd() != null)
            coupon.setRushHourEnd(request.getRushHourEnd());
        if (request.getBogoBuyQty() != null)
            coupon.setBogoBuyQty(request.getBogoBuyQty());
        if (request.getBogoGetQty() != null)
            coupon.setBogoGetQty(request.getBogoGetQty());
        if (request.getBogoFreeItemId() != null)
            coupon.setBogoFreeItemId(request.getBogoFreeItemId());
        if (request.getComboItems() != null)
            coupon.setComboItems(request.getComboItems());
        if (request.getNewCustomerOnly() != null)
            coupon.setNewCustomerOnly(request.getNewCustomerOnly());
        if (request.getNewDishFlag() != null)
            coupon.setNewDishFlag(request.getNewDishFlag());
        if (request.getOfferCategory() != null)
            coupon.setOfferCategory(request.getOfferCategory());
        if (request.getIsActive() != null)
            coupon.setIsActive(request.getIsActive());

        Coupon savedCoupon = couponRepository.save(coupon);

        // Update applicable items if provided
        if (request.getApplicableItemIds() != null) {
            applicabilityRepository.deleteByCouponId(couponId);
            List<CouponApplicability> items = request.getApplicableItemIds().stream()
                    .map(itemId -> {
                        MenuItem menuItem = menuItemRepository.findById(itemId)
                                .orElseThrow(() -> new ResourceNotFoundException("Menu item " + itemId + " not found"));
                        return CouponApplicability.builder()
                                .coupon(savedCoupon)
                                .menuItem(menuItem)
                                .requiredQty(1)
                                .build();
                    })
                    .collect(Collectors.toList());
            applicabilityRepository.saveAll(items);
        }
        log.info("Updated coupon: {}", coupon.getCouponCode());
        return mapToResponse(coupon);
    }

    // ===== GET ACTIVE =====

    public List<CouponResponse> getActiveCoupons(Long canteenId) {
        List<Coupon> coupons;
        if (canteenId != null) {
            coupons = couponRepository.findByCanteenIdAndIsActiveTrue(canteenId);
        } else {
            coupons = couponRepository.findByIsActiveTrue();
        }
        return coupons.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<CouponResponse> getAllCoupons(Long canteenId) {
        List<Coupon> coupons;
        if (canteenId != null) {
            coupons = couponRepository.findByCanteenId(canteenId);
        } else {
            coupons = couponRepository.findAll();
        }
        return coupons.stream()
                .sorted(Comparator.comparing(Coupon::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CouponResponse> getTrackCoupons(
            Long canteenId,
            String status,
            Coupon.CouponType couponType,
            Coupon.OfferCategory offerCategory) {
        List<Coupon> coupons;
        if (canteenId != null) {
            coupons = couponRepository.findByCanteenIdAndIsArchivedFalse(canteenId);
        } else {
            coupons = couponRepository.findByIsArchivedFalse();
        }

        LocalDateTime now = LocalDateTime.now();
        String normalizedStatus = status != null ? status.trim().toUpperCase() : "ALL";

        return coupons.stream()
                .filter(coupon -> matchesTrackStatus(coupon, normalizedStatus, now))
                .filter(coupon -> couponType == null || coupon.getCouponType() == couponType)
                .filter(coupon -> offerCategory == null || coupon.getOfferCategory() == offerCategory)
                .sorted(Comparator.comparing(Coupon::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private boolean matchesTrackStatus(Coupon coupon, String normalizedStatus, LocalDateTime now) {
        switch (normalizedStatus) {
            case "ACTIVE":
                return Boolean.TRUE.equals(coupon.getIsActive())
                        && (coupon.getStartTime() == null || !coupon.getStartTime().isAfter(now))
                        && (coupon.getEndTime() == null || !coupon.getEndTime().isBefore(now));
            case "INACTIVE":
                return Boolean.FALSE.equals(coupon.getIsActive());
            case "SCHEDULED":
                return coupon.getStartTime() != null && coupon.getStartTime().isAfter(now);
            case "ALL":
            default:
                return true;
        }
    }

    // ===== TOGGLE =====

    @Transactional
    public CouponResponse toggleCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setIsActive(!coupon.getIsActive());
        coupon = couponRepository.save(coupon);
        return mapToResponse(coupon);
    }

    // ===== DELETE =====

    @Transactional
    public void deleteCoupon(UUID couponId) {
        if (!couponRepository.existsById(couponId)) {
            throw new ResourceNotFoundException("Coupon not found");
        }
        applicabilityRepository.deleteByCouponId(couponId);
        couponRepository.deleteById(couponId);
        log.info("Deleted coupon: {}", couponId);
    }

    // ===== DASHBOARD =====

    public DashboardResponse getDashboard() {
        LocalDateTime now = LocalDateTime.now();
        long total = couponRepository.count();
        long active = couponRepository.countByIsActiveTrue();
        long expired = couponRepository.countExpiredInactive(now);
        long rushHour = couponRepository.countByRushHourFlagTrueAndIsActiveTrue();

        // Sum usage
        long totalUsage = couponRepository.findAll().stream()
                .mapToInt(c -> c.getCurrentUsageCount() != null ? c.getCurrentUsageCount() : 0)
                .sum();

        // Sum discount given
        BigDecimal totalDiscount = usageRepository.findAll().stream()
                .map(CouponUsage::getDiscountApplied)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Live rush hour timers
        List<Coupon> rushHourCoupons = couponRepository.findByRushHourFlagTrueAndIsActiveTrue();
        List<RushHourTimerInfo> timers = rushHourCoupons.stream().map(c -> {
            LocalTime nowTime = LocalTime.now();
            boolean isActive = c.getRushHourStart() != null && c.getRushHourEnd() != null
                    && !nowTime.isBefore(c.getRushHourStart()) && !nowTime.isAfter(c.getRushHourEnd());
            long remaining = 0;
            if (isActive && c.getRushHourEnd() != null) {
                remaining = Duration.between(nowTime, c.getRushHourEnd()).getSeconds();
                if (remaining < 0)
                    remaining = 0;
            }
            return RushHourTimerInfo.builder()
                    .couponId(c.getId())
                    .couponCode(c.getCouponCode())
                    .title(c.getTitle())
                    .rushHourStart(c.getRushHourStart())
                    .rushHourEnd(c.getRushHourEnd())
                    .remainingSeconds(remaining)
                    .isCurrentlyActive(isActive)
                    .build();
        }).collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalCoupons(total)
                .activeCoupons(active)
                .expiredCoupons(expired)
                .rushHourRunning(rushHour)
                .totalUsageCount(totalUsage)
                .totalDiscountGiven(totalDiscount)
                .liveTimers(timers)
                .build();
    }

    // ===== CALENDAR =====

    public CalendarResponse getCalendar(LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null)
            endDate = startDate.plusMonths(1).minusDays(1);

        List<Coupon> coupons = couponRepository.findActiveBetweenDates(
                startDate.atStartOfDay(), endDate.atTime(23, 59, 59));

        // Group by date
        Map<LocalDate, List<CalendarCouponInfo>> dateMap = new TreeMap<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDate finalDate = date;
            List<CalendarCouponInfo> dayCoupons = coupons.stream()
                    .filter(c -> {
                        LocalDate cStart = c.getStartTime() != null ? c.getStartTime().toLocalDate() : LocalDate.MIN;
                        LocalDate cEnd = c.getEndTime() != null ? c.getEndTime().toLocalDate() : LocalDate.MAX;
                        return !finalDate.isBefore(cStart) && !finalDate.isAfter(cEnd);
                    })
                    .map(c -> CalendarCouponInfo.builder()
                            .couponId(c.getId())
                            .couponCode(c.getCouponCode())
                            .title(c.getTitle())
                            .couponType(c.getCouponType())
                            .color(c.getColor())
                            .startTime(c.getStartTime())
                            .endTime(c.getEndTime())
                            .isActive(c.getIsActive())
                            .build())
                    .collect(Collectors.toList());
            if (!dayCoupons.isEmpty()) {
                dateMap.put(finalDate, dayCoupons);
            }
        }

        List<CalendarEntry> entries = dateMap.entrySet().stream()
                .map(e -> CalendarEntry.builder().date(e.getKey()).coupons(e.getValue()).build())
                .collect(Collectors.toList());

        return CalendarResponse.builder().entries(entries).build();
    }

    // ===== AUTO EXPIRY (runs every minute) =====

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoExpireCoupons() {
        int expired = couponRepository.deactivateExpiredCoupons(LocalDateTime.now());
        if (expired > 0) {
            log.info("Auto-expired {} coupons", expired);
        }
    }

    // ===== MAPPER =====

    public CouponResponse mapToResponse(Coupon coupon) {
        List<CouponApplicability> appItems = applicabilityRepository.findByCouponId(coupon.getId());
        List<ApplicableItemInfo> itemInfos = appItems.stream()
                .map(a -> ApplicableItemInfo.builder()
                        .menuItemId(a.getMenuItem().getId())
                        .itemName(a.getMenuItem().getName())
                        .itemPrice(a.getMenuItem().getPrice())
                        .requiredQty(a.getRequiredQty())
                        .build())
                .collect(Collectors.toList());

        // Calculate remaining seconds for rush hour or timer
        Long remainingSeconds = null;
        Boolean isInRushHour = false;
        if (Boolean.TRUE.equals(coupon.getRushHourFlag())
                && coupon.getRushHourStart() != null && coupon.getRushHourEnd() != null) {
            LocalTime nowTime = LocalTime.now();
            isInRushHour = !nowTime.isBefore(coupon.getRushHourStart()) && !nowTime.isAfter(coupon.getRushHourEnd());
            if (isInRushHour) {
                remainingSeconds = Duration.between(nowTime, coupon.getRushHourEnd()).getSeconds();
                if (remainingSeconds < 0)
                    remainingSeconds = 0L;
            }
        }
        if (coupon.getEndTime() != null && !coupon.isExpired()) {
            long totalRemaining = Duration.between(LocalDateTime.now(), coupon.getEndTime()).getSeconds();
            if (remainingSeconds == null || totalRemaining < remainingSeconds) {
                remainingSeconds = Math.max(totalRemaining, 0);
            }
        }

        return CouponResponse.builder()
                .id(coupon.getId())
                .couponCode(coupon.getCouponCode())
                .title(coupon.getTitle())
                .description(coupon.getDescription())
                .color(coupon.getColor())
                .couponType(coupon.getCouponType())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountCap(coupon.getMaxDiscountCap())
                .minOrderValue(coupon.getMinOrderValue())
                .usageLimitTotal(coupon.getUsageLimitTotal())
                .usageLimitPerUser(coupon.getUsageLimitPerUser())
                .currentUsageCount(coupon.getCurrentUsageCount())
                .startTime(coupon.getStartTime())
                .endTime(coupon.getEndTime())
                .rushHourFlag(coupon.getRushHourFlag())
                .rushHourStart(coupon.getRushHourStart())
                .rushHourEnd(coupon.getRushHourEnd())
                .bogoBuyQty(coupon.getBogoBuyQty())
                .bogoGetQty(coupon.getBogoGetQty())
                .bogoFreeItemId(coupon.getBogoFreeItemId())
                .comboItems(coupon.getComboItems())
                .newCustomerOnly(coupon.getNewCustomerOnly())
                .newDishFlag(coupon.getNewDishFlag())
                .isActive(coupon.getIsActive())
                .isCustom(coupon.getIsCustom())
                .offerCategory(coupon.getOfferCategory())
                .isArchived(coupon.getIsArchived())
                .archivedAt(coupon.getArchivedAt())
                .originalEndTime(coupon.getOriginalEndTime())
                .canteenId(coupon.getCanteen() != null ? coupon.getCanteen().getId() : null)
                .canteenName(coupon.getCanteen() != null ? coupon.getCanteen().getName() : null)
                .applicableItems(itemInfos)
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .isExpired(coupon.isExpired())
                .isCurrentlyInRushHour(isInRushHour)
                .remainingSeconds(remainingSeconds)
                .build();
    }

    // ===== VALIDATION & CALCULATION =====

    public ValidationResult validateCoupon(String code, Cart cart) {
        Optional<Coupon> couponOpt = couponRepository.findByCouponCode(code);
        if (couponOpt.isEmpty()) {
            return ValidationResult.builder().valid(false).message("Invalid coupon code").build();
        }
        Coupon coupon = couponOpt.get();

        // Basic Checks
        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return ValidationResult.builder().valid(false).message("Coupon is inactive").build();
        }
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartTime() != null && now.isBefore(coupon.getStartTime())) {
            return ValidationResult.builder().valid(false).message("Coupon is not yet active").build();
        }
        if (coupon.getEndTime() != null && now.isAfter(coupon.getEndTime())) {
            return ValidationResult.builder().valid(false).message("Coupon has expired").build();
        }

        // Usage Limits
        if (coupon.getUsageLimitTotal() != null && coupon.getCurrentUsageCount() != null
                && coupon.getCurrentUsageCount() >= coupon.getUsageLimitTotal()) {
            return ValidationResult.builder().valid(false).message("Coupon usage limit reached").build();
        }
        // Per User Limit (requires User ID from Cart, assuming Cart has User)
        if (coupon.getUsageLimitPerUser() != null && cart.getUser() != null) {
            long userUsage = usageRepository.countByCouponIdAndUserId(coupon.getId(), cart.getUser().getId());
            if (userUsage >= coupon.getUsageLimitPerUser()) {
                return ValidationResult.builder().valid(false).message("You have already used this coupon").build();
            }
        }

        // Rush Hour Check
        if (Boolean.TRUE.equals(coupon.getRushHourFlag())) {
            LocalTime nowTime = LocalTime.now();
            if (coupon.getRushHourStart() != null && coupon.getRushHourEnd() != null) {
                if (nowTime.isBefore(coupon.getRushHourStart()) || nowTime.isAfter(coupon.getRushHourEnd())) {
                    return ValidationResult.builder().valid(false).message("Coupon valid only during rush hours")
                            .build();
                }
            }
        }

        // Min Order Value
        BigDecimal cartTotal = cart.getTotalAmount(); // Assuming this is subtotal
        if (coupon.getMinOrderValue() != null && cartTotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return ValidationResult.builder().valid(false)
                    .message("Minimum order value of ₹" + coupon.getMinOrderValue() + " required").build();
        }

        // Calculate Discount
        BigDecimal discount = calculateDiscount(coupon, cart);
        if (discount.compareTo(BigDecimal.ZERO) == 0) {
            return ValidationResult.builder().valid(false).message("Coupon conditions not met for items in cart")
                    .build();
        }

        return ValidationResult.builder()
                .valid(true)
                .message("Coupon applied successfully")
                .discountAmount(discount)
                .finalTotal(cartTotal.subtract(discount).max(BigDecimal.ZERO))
                .couponCode(coupon.getCouponCode())
                .couponTitle(coupon.getTitle())
                .couponType(coupon.getCouponType())
                .discountType(coupon.getDiscountType())
                .build();
    }

    private BigDecimal calculateDiscount(Coupon coupon, Cart cart) {
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal cartTotal = cart.getTotalAmount();

        switch (coupon.getCouponType()) {
            case GENERAL:
            case NEW_DISH: // Treated similar to general or specific based on implementation, assuming
                           // general for now or specific logic
            case RUSH_HOUR:
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discount = cartTotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                } else if (coupon.getDiscountType() == Coupon.DiscountType.FLAT) {
                    discount = coupon.getDiscountValue();
                }
                break;

            case ITEM_SPECIFIC:
                // Find applicable items in cart
                List<Long> applicableIds = applicabilityRepository.findByCouponId(coupon.getId()).stream()
                        .map(ca -> ca.getMenuItem().getId())
                        .collect(Collectors.toList());

                BigDecimal eligibleAmount = BigDecimal.ZERO;
                for (CartItem item : cart.getItems()) {
                    if (applicableIds.contains(item.getMenuItem().getId())) {
                        eligibleAmount = eligibleAmount.add(item.getSubtotal());
                    }
                }

                if (eligibleAmount.compareTo(BigDecimal.ZERO) > 0) {
                    if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                        discount = eligibleAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                    } else if (coupon.getDiscountType() == Coupon.DiscountType.FLAT) {
                        // Flat discount on the eligible items total, or per item? usually total for the
                        // set
                        discount = coupon.getDiscountValue();
                        // If discount > eligible amount?
                        if (discount.compareTo(eligibleAmount) > 0)
                            discount = eligibleAmount;
                    }
                }
                break;

            case BOGO:
                // Logic: Buy X Get Y. Find item items.
                // Assuming applicability has the target item.
                List<CouponApplicability> bogoItems = applicabilityRepository.findByCouponId(coupon.getId());
                if (!bogoItems.isEmpty()) {
                    Long targetItemId = bogoItems.get(0).getMenuItem().getId(); // Assuming single item BOGO for
                                                                                // simplicity
                    int buyQty = coupon.getBogoBuyQty();
                    int getQty = coupon.getBogoGetQty();

                    for (CartItem item : cart.getItems()) {
                        if (item.getMenuItem().getId().equals(targetItemId)) {
                            int totalQty = item.getQuantity();
                            // Sets of (Buy+Get)
                            int sets = totalQty / (buyQty + getQty);
                            // Or is it Buy X, and Get Y *added*?
                            // Usually in cart, user adds X+Y items, and Y are free.
                            // Let's assume user has (Buy+Get) items in cart, and we discount the Get
                            // portion.
                            if (totalQty >= (buyQty + getQty)) {
                                BigDecimal itemPrice = item.getUnitPrice();
                                discount = itemPrice.multiply(BigDecimal.valueOf(sets * getQty));
                            }
                        }
                    }
                }
                break;

            case COMBO:
                // Simplified Combo: If all items present, apply flat/percent discount
                // Implementation requires checking all items.
                break;
        }

        // Cap Check
        if (coupon.getMaxDiscountCap() != null && discount.compareTo(coupon.getMaxDiscountCap()) > 0) {
            discount = coupon.getMaxDiscountCap();
        }

        return discount;
    }

    public ValidationResult suggestBestCoupon(Cart cart) {
        List<Coupon> activeCoupons;
        if (cart.getCanteen() != null) {
            activeCoupons = couponRepository.findByCanteenIdAndIsActiveTrue(cart.getCanteen().getId());
        } else {
            activeCoupons = couponRepository.findByIsActiveTrue();
        }

        ValidationResult bestResult = null;
        BigDecimal maxDiscount = BigDecimal.ZERO;

        for (Coupon coupon : activeCoupons) {
            ValidationResult result = validateCoupon(coupon.getCouponCode(), cart);
            if (result.isValid() && result.getDiscountAmount().compareTo(maxDiscount) > 0) {
                maxDiscount = result.getDiscountAmount();
                bestResult = result;
            }
        }
        return bestResult;
    }

    /**
     * Record a coupon usage (called by validation service after successful
     * validation).
     */
    @Transactional
    public void recordUsage(UUID couponId, Long userId, Long orderId, BigDecimal discountApplied,
            BigDecimal orderTotal) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        coupon.setCurrentUsageCount(coupon.getCurrentUsageCount() + 1);
        couponRepository.save(coupon);

        CouponUsage usage = CouponUsage.builder()
                .couponId(couponId)
                .user(User.builder().id(userId).build())
                .order(orderId != null ? Order.builder().id(orderId).build() : null)
                .discountApplied(discountApplied)
                .orderTotal(orderTotal)
                .build();
        usageRepository.save(usage);

        log.info("Recorded usage: coupon={}, user={}, discount={}", coupon.getCouponCode(), userId, discountApplied);
    }

    public ValidationResult validateCoupon(ValidateCouponRequest request) {
        String code = request.getCouponCode();
        Optional<Coupon> couponOpt = couponRepository.findByCouponCode(code);
        if (couponOpt.isEmpty()) {
            return ValidationResult.builder().valid(false).message("Invalid coupon code").build();
        }
        Coupon coupon = couponOpt.get();

        // Basic Checks
        if (!Boolean.TRUE.equals(coupon.getIsActive()))
            return ValidationResult.builder().valid(false).message("Coupon is inactive").build();
        if (coupon.getStartTime() != null && LocalDateTime.now().isBefore(coupon.getStartTime()))
            return ValidationResult.builder().valid(false).message("Coupon is not yet active").build();
        if (coupon.getEndTime() != null && LocalDateTime.now().isAfter(coupon.getEndTime()))
            return ValidationResult.builder().valid(false).message("Coupon has expired").build();
        if (coupon.getUsageLimitTotal() != null && coupon.getCurrentUsageCount() != null
                && coupon.getCurrentUsageCount() >= coupon.getUsageLimitTotal())
            return ValidationResult.builder().valid(false).message("Coupon usage limit reached").build();

        if (coupon.getUsageLimitPerUser() != null && request.getUserId() != null) {
            long usage = usageRepository.countByCouponIdAndUserId(coupon.getId(), request.getUserId());
            if (usage >= coupon.getUsageLimitPerUser()) {
                return ValidationResult.builder().valid(false).message("You have already used this coupon").build();
            }
        }

        // Min Order
        BigDecimal orderTotal = request.getOrderTotal();
        if (coupon.getMinOrderValue() != null && orderTotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return ValidationResult.builder().valid(false)
                    .message("Minimum order value of ₹" + coupon.getMinOrderValue() + " required").build();
        }

        // Rush Hour Check
        if (Boolean.TRUE.equals(coupon.getRushHourFlag())) {
            LocalTime nowTime = LocalTime.now();
            if (coupon.getRushHourStart() != null && coupon.getRushHourEnd() != null) {
                if (nowTime.isBefore(coupon.getRushHourStart()) || nowTime.isAfter(coupon.getRushHourEnd())) {
                    return ValidationResult.builder().valid(false).message("Coupon valid only during rush hours")
                            .build();
                }
            }
        }

        // Calculate Discount using DTO items
        BigDecimal discount = calculateDiscountDTO(coupon, request.getOrderTotal(), request.getCartItems());

        if (discount.compareTo(BigDecimal.ZERO) == 0) {
            return ValidationResult.builder().valid(false).message("Coupon conditions not met for items in cart")
                    .build();
        }

        return ValidationResult.builder()
                .valid(true)
                .message("Coupon applied successfully")
                .discountAmount(discount)
                .finalTotal(orderTotal.subtract(discount).max(BigDecimal.ZERO))
                .couponCode(coupon.getCouponCode())
                .couponTitle(coupon.getTitle())
                .couponType(coupon.getCouponType())
                .discountType(coupon.getDiscountType())
                .build();
    }

    private BigDecimal calculateDiscountDTO(Coupon coupon, BigDecimal orderTotal, List<CartItemInfo> items) {
        BigDecimal discount = BigDecimal.ZERO;

        switch (coupon.getCouponType()) {
            case GENERAL:
            case RUSH_HOUR:
            case NEW_DISH:
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    discount = orderTotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                } else {
                    discount = coupon.getDiscountValue();
                }
                break;
            case ITEM_SPECIFIC:
                if (items == null)
                    break;
                List<Long> appIds = applicabilityRepository.findByCouponId(coupon.getId()).stream()
                        .map(c -> c.getMenuItem().getId()).collect(Collectors.toList());
                BigDecimal eligible = BigDecimal.ZERO;
                for (CartItemInfo i : items) {
                    if (appIds.contains(i.getMenuItemId())) {
                        eligible = eligible.add(i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())));
                    }
                }
                if (eligible.compareTo(BigDecimal.ZERO) > 0) {
                    if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                        discount = eligible.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                    } else {
                        discount = coupon.getDiscountValue();
                        if (discount.compareTo(eligible) > 0)
                            discount = eligible;
                    }
                }
                break;
            case BOGO:
                if (items == null)
                    break;
                List<CouponApplicability> bogoItems = applicabilityRepository.findByCouponId(coupon.getId());
                if (!bogoItems.isEmpty()) {
                    Long targetId = bogoItems.get(0).getMenuItem().getId();
                    int buy = coupon.getBogoBuyQty();
                    int get = coupon.getBogoGetQty();
                    for (CartItemInfo i : items) {
                        if (i.getMenuItemId().equals(targetId)) {
                            int sets = i.getQuantity() / (buy + get);
                            if (i.getQuantity() >= (buy + get)) {
                                discount = i.getPrice().multiply(BigDecimal.valueOf(sets * get));
                            }
                        }
                    }
                }
                break;
            default:
                break;
        }

        if (coupon.getMaxDiscountCap() != null && discount.compareTo(coupon.getMaxDiscountCap()) > 0) {
            discount = coupon.getMaxDiscountCap();
        }
        return discount;
    }

    public ValidationResult suggestBestCoupon(ValidateCouponRequest request) {
        // Need canteenId - assuming it's passed in request or we fetch active for all?
        // ValidateCouponRequest doesn't have canteenId. We should add it or pass it.
        // For now, let's assume we iterate all active coupons (or filtered by context
        // if we had it).
        // A better approach: Add canteenId to ValidateCouponRequest or pass separately.
        // Assuming we check all active coupons for now.
        List<Coupon> activeCoupons = couponRepository.findByIsActiveTrue();

        ValidationResult bestResult = null;
        BigDecimal maxDiscount = BigDecimal.ZERO;

        for (Coupon coupon : activeCoupons) {
            // Need to create a request with this coupon code to reuse validateCoupon
            // OR - refactor validateCoupon to take Coupon entity + validationCtx
            // Reusing validateCoupon(ValidateCouponRequest) is easiest but inefficient
            // (fetches coupon again).
            // Let's refactor validateCoupon to take Coupon entity.
            // For now, just constructing request:
            ValidateCouponRequest checkReq = ValidateCouponRequest.builder()
                    .couponCode(coupon.getCouponCode())
                    .userId(request.getUserId())
                    .orderTotal(request.getOrderTotal())
                    .cartItems(request.getCartItems())
                    .build();

            ValidationResult result = validateCoupon(checkReq);

            if (result.isValid() && result.getDiscountAmount().compareTo(maxDiscount) > 0) {
                maxDiscount = result.getDiscountAmount();
                bestResult = result;
            }
        }
        return bestResult;
    }

    // ===== SYSTEM OFFERS =====

    public List<CouponResponse> getSystemOffers() {
        return couponRepository.findByIsCustomFalse().stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsArchived()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ===== HISTORY (archived / expired) =====

    public List<CouponResponse> getHistory() {
        List<Coupon> archived = couponRepository.findByIsArchivedTrue();
        // Also include expired but not archived coupons
        List<Coupon> expired = couponRepository.findExpiredButActive(LocalDateTime.now());
        Set<UUID> ids = new HashSet<>();
        List<Coupon> combined = new ArrayList<>();
        for (Coupon c : archived) {
            ids.add(c.getId());
            combined.add(c);
        }
        for (Coupon c : expired) {
            if (!ids.contains(c.getId()))
                combined.add(c);
        }
        return combined.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ===== RESTORE =====

    @Transactional
    public CouponResponse restoreCoupon(UUID couponId, RestoreCouponRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        // Save original end time if not already saved
        if (coupon.getOriginalEndTime() == null && coupon.getEndTime() != null) {
            coupon.setOriginalEndTime(coupon.getEndTime());
        }

        coupon.setStartTime(request.getNewStartTime());
        coupon.setEndTime(request.getNewEndTime());
        coupon.setIsActive(true);
        coupon.setIsArchived(false);
        coupon.setArchivedAt(null);
        coupon.setCurrentUsageCount(0);

        coupon = couponRepository.save(coupon);
        log.info("Restored coupon: {} with new dates: {} to {}", coupon.getCouponCode(),
                request.getNewStartTime(), request.getNewEndTime());
        return mapToResponse(coupon);
    }

    // ===== ARCHIVE =====

    @Transactional
    public void archiveCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        coupon.setIsArchived(true);
        coupon.setIsActive(false);
        coupon.setArchivedAt(LocalDateTime.now());
        couponRepository.save(coupon);
        log.info("Archived coupon: {}", coupon.getCouponCode());
    }
}
