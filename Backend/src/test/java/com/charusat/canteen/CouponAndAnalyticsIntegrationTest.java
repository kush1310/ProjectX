package com.charusat.canteen;

import com.charusat.canteen.dto.CouponDTOs.*;
import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.repository.CouponRepository;
import com.charusat.canteen.controller.AnalyticsController;
import com.charusat.canteen.service.CouponValidationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CouponAndAnalyticsIntegrationTest {

    @Autowired
    private CouponValidationService couponValidationService;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private com.charusat.canteen.controller.AnalyticsController analyticsController;

    @Test
    public void expiredCoupon_returnsInvalid() {
        Coupon coupon = new Coupon();
        coupon.setId(UUID.randomUUID());
        coupon.setCouponCode("EXPIRED50");
        coupon.setTitle("Expired 50%");
        coupon.setCouponType(Coupon.CouponType.GENERAL);
        coupon.setDiscountType(Coupon.DiscountType.PERCENTAGE);
        coupon.setDiscountValue(new BigDecimal("50"));
        coupon.setIsActive(true);
        coupon.setStartTime(LocalDateTime.now().minusDays(10));
        coupon.setEndTime(LocalDateTime.now().minusDays(1)); // Expired yesterday
        couponRepository.save(coupon);

        ValidateCouponRequest req = ValidateCouponRequest.builder()
                .couponCode("EXPIRED50")
                .userId(1L)
                .orderTotal(new BigDecimal("200"))
                .cartItems(List.of())
                .build();

        ValidationResult result = couponValidationService.validateCoupon(req);
        assertFalse(result.isValid());
        assertTrue(result.getMessage().toLowerCase().contains("expired"));
    }

    @Test
    public void outOfScopeItemCoupon_returnsInvalidOrZeroDiscount() {
        Coupon coupon = new Coupon();
        coupon.setId(UUID.randomUUID());
        coupon.setCouponCode("BURGERONLY");
        coupon.setTitle("Burger Special");
        coupon.setCouponType(Coupon.CouponType.ITEM_SPECIFIC);
        coupon.setDiscountType(Coupon.DiscountType.FLAT);
        coupon.setDiscountValue(new BigDecimal("30"));
        coupon.setIsActive(true);
        coupon.setMinOrderValue(new BigDecimal("50"));
        couponRepository.save(coupon);

        // Cart items containing non-matching item ID 9999L
        ValidateCouponRequest req = ValidateCouponRequest.builder()
                .couponCode("BURGERONLY")
                .userId(1L)
                .orderTotal(new BigDecimal("100"))
                .cartItems(List.of(new CartItemInfo(9999L, "Fries", 1, new BigDecimal("100"))))
                .build();

        ValidationResult result = couponValidationService.validateCoupon(req);
        assertFalse(result.isValid());
    }

    @Test
    public void zeroOrderPeriodAnalytics_returnsGracefulZeroes() {
        ResponseEntity<?> response = analyticsController.getDashboardStats(() -> "admin@charusat.edu.in");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }
}
