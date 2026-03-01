package com.charusat.canteen.service;

import com.charusat.canteen.dto.CouponDTOs.*;
import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * CouponValidationService — Complete coupon validation engine.
 * 
 * Validation sequence:
 * 1. Coupon exists
 * 2. Coupon is active
 * 3. Coupon not expired (start/end time)
 * 4. Global usage limit not exceeded
 * 5. Per-user usage limit not exceeded
 * 6. Minimum order value met
 * 7. Item applicability (ITEM_SPECIFIC, COMBO)
 * 8. Rush hour time window (RUSH_HOUR)
 * 9. New customer eligibility
 * 10. Calculate discount with max cap
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CouponValidationService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository usageRepository;
    private final CouponApplicabilityRepository applicabilityRepository;
    private final OrderRepository orderRepository;

    /**
     * Validate a coupon and calculate the discount amount.
     */
    public ValidationResult validateCoupon(ValidateCouponRequest request) {
        String code = request.getCouponCode().toUpperCase().trim();
        log.info("Validating coupon: {} for user: {}, orderTotal: {}", code, request.getUserId(),
                request.getOrderTotal());

        // 1. Coupon exists
        Coupon coupon = couponRepository.findByCouponCode(code).orElse(null);
        if (coupon == null) {
            log.warn("Validation failed: Coupon code '{}' not found", code);
            return fail("Invalid coupon code");
        }

        // 2. Coupon is active
        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            log.warn("Validation failed: Coupon '{}' is inactive", code);
            return fail("This coupon is no longer active");
        }

        // 3. Expiry check
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartTime() != null && now.isBefore(coupon.getStartTime())) {
            log.warn("Validation failed: Coupon '{}' hasn't started yet", code);
            return fail("This coupon is not yet active. Starts at " + coupon.getStartTime());
        }
        if (coupon.getEndTime() != null && now.isAfter(coupon.getEndTime())) {
            log.warn("Validation failed: Coupon '{}' has expired", code);
            return fail("This coupon has expired");
        }

        // 4. Global usage limit
        if (coupon.getUsageLimitTotal() != null && coupon.getCurrentUsageCount() >= coupon.getUsageLimitTotal()) {
            log.warn("Validation failed: Coupon '{}' global usage limit reached", code);
            return fail("This coupon has reached its maximum usage limit");
        }

        // 5. Per-user usage limit
        if (coupon.getUsageLimitPerUser() != null && request.getUserId() != null) {
            long userUsage = usageRepository.countByCouponIdAndUserId(coupon.getId(), request.getUserId());
            if (userUsage >= coupon.getUsageLimitPerUser()) {
                log.warn("Validation failed: Coupon '{}' per-user limit reached for user {}", code,
                        request.getUserId());
                return fail("You have already used this coupon the maximum number of times");
            }
        }

        // 6. Minimum order value
        if (coupon.getMinOrderValue() != null && request.getOrderTotal() != null) {
            if (request.getOrderTotal().compareTo(coupon.getMinOrderValue()) < 0) {
                log.warn("Validation failed: Order total {} below min {} for coupon '{}'",
                        request.getOrderTotal(), coupon.getMinOrderValue(), code);
                return fail("Minimum order value of ₹" + coupon.getMinOrderValue().toPlainString() + " required");
            }
        }

        // 7. Item applicability (for ITEM_SPECIFIC and COMBO)
        if (coupon.getCouponType() == Coupon.CouponType.ITEM_SPECIFIC) {
            if (!validateItemApplicability(coupon, request.getCartItems())) {
                log.warn("Validation failed: Cart items don't match coupon '{}'  applicable items", code);
                return fail("This coupon is only valid for specific items not in your cart");
            }
        }

        if (coupon.getCouponType() == Coupon.CouponType.COMBO) {
            if (!validateComboItems(coupon, request.getCartItems())) {
                log.warn("Validation failed: Combo items not all present for coupon '{}'", code);
                return fail("All combo items must be present in your cart to use this coupon");
            }
        }

        // 8. Rush hour check
        if (Boolean.TRUE.equals(coupon.getRushHourFlag())) {
            LocalTime nowTime = LocalTime.now();
            if (coupon.getRushHourStart() != null && coupon.getRushHourEnd() != null) {
                if (nowTime.isBefore(coupon.getRushHourStart()) || nowTime.isAfter(coupon.getRushHourEnd())) {
                    log.warn("Validation failed: Outside rush hour window for coupon '{}'", code);
                    return fail("This coupon is only valid during " + coupon.getRushHourStart() + " - "
                            + coupon.getRushHourEnd());
                }
            }
        }

        // 9. New customer check
        if (Boolean.TRUE.equals(coupon.getNewCustomerOnly()) && request.getUserId() != null) {
            long previousOrders = orderRepository.countByCustomerId(request.getUserId());
            if (previousOrders > 0) {
                log.warn("Validation failed: Coupon '{}' is for new customers only, user {} has {} orders",
                        code, request.getUserId(), previousOrders);
                return fail("This coupon is available for new customers only");
            }
        }

        // 10. Calculate discount
        BigDecimal discountAmount = calculateDiscount(coupon, request.getOrderTotal());

        BigDecimal finalTotal = request.getOrderTotal().subtract(discountAmount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        log.info("Coupon '{}' validated successfully. Discount: {}, Final: {}", code, discountAmount, finalTotal);

        return ValidationResult.builder()
                .valid(true)
                .message("Coupon applied successfully! You save ₹" + discountAmount.toPlainString())
                .discountAmount(discountAmount)
                .finalTotal(finalTotal)
                .couponCode(coupon.getCouponCode())
                .couponTitle(coupon.getTitle())
                .couponType(coupon.getCouponType())
                .discountType(coupon.getDiscountType())
                .build();
    }

    // ===== ITEM APPLICABILITY =====

    private boolean validateItemApplicability(Coupon coupon, List<CartItemInfo> cartItems) {
        if (cartItems == null || cartItems.isEmpty())
            return false;

        List<CouponApplicability> applicable = applicabilityRepository.findByCouponId(coupon.getId());
        if (applicable.isEmpty())
            return true; // No restrictions = applies to all

        List<Long> applicableItemIds = applicable.stream()
                .map(a -> a.getMenuItem().getId())
                .toList();

        // At least one cart item must be in the applicable list
        return cartItems.stream()
                .anyMatch(ci -> applicableItemIds.contains(ci.getMenuItemId()));
    }

    // ===== COMBO VALIDATION =====

    private boolean validateComboItems(Coupon coupon, List<CartItemInfo> cartItems) {
        if (cartItems == null || cartItems.isEmpty())
            return false;

        List<CouponApplicability> comboRequired = applicabilityRepository.findByCouponId(coupon.getId());
        if (comboRequired.isEmpty())
            return true;

        // All combo items must be present with required quantity
        for (CouponApplicability req : comboRequired) {
            Long requiredItemId = req.getMenuItem().getId();
            int requiredQty = req.getRequiredQty() != null ? req.getRequiredQty() : 1;

            boolean found = cartItems.stream()
                    .anyMatch(ci -> ci.getMenuItemId().equals(requiredItemId)
                            && ci.getQuantity() >= requiredQty);
            if (!found)
                return false;
        }
        return true;
    }

    // ===== DISCOUNT CALCULATION =====

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderTotal) {
        if (orderTotal == null)
            return BigDecimal.ZERO;

        BigDecimal discount;
        switch (coupon.getDiscountType()) {
            case PERCENTAGE:
                if (coupon.getDiscountValue() == null)
                    return BigDecimal.ZERO;
                discount = orderTotal.multiply(coupon.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                // Apply max cap
                if (coupon.getMaxDiscountCap() != null && discount.compareTo(coupon.getMaxDiscountCap()) > 0) {
                    discount = coupon.getMaxDiscountCap();
                }
                break;
            case FLAT:
                discount = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : BigDecimal.ZERO;
                if (discount.compareTo(orderTotal) > 0) {
                    discount = orderTotal;
                }
                break;
            case BOGO:
                // For BOGO, the discount is the price of the free item(s)
                // This is a simplified calculation
                discount = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : BigDecimal.ZERO;
                break;
            default:
                discount = BigDecimal.ZERO;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    // ===== HELPERS =====

    private ValidationResult fail(String message) {
        return ValidationResult.builder()
                .valid(false)
                .message(message)
                .discountAmount(BigDecimal.ZERO)
                .finalTotal(BigDecimal.ZERO)
                .build();
    }
}
