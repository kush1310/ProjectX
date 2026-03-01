package com.charusat.canteen.config;

import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.repository.CouponRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Seeds static system offers on application startup.
 * These are platform-recommended offers that are always available.
 * Idempotent — checks existence by coupon code before inserting.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CouponDataSeeder {

    private final CouponRepository couponRepository;

    @PostConstruct
    public void seedSystemOffers() {
        log.info("Checking system offers...");
        int seeded = 0;

        // 1. WELCOME10 — 10% off for new customers
        if (!couponRepository.existsByCouponCode("WELCOME10")) {
            couponRepository.save(Coupon.builder()
                    .couponCode("WELCOME10")
                    .title("Welcome 10% Off")
                    .description("Get 10% off on your first order! Exclusively for new customers.")
                    .color("#6366f1")
                    .couponType(Coupon.CouponType.GENERAL)
                    .discountType(Coupon.DiscountType.PERCENTAGE)
                    .discountValue(BigDecimal.valueOf(10))
                    .maxDiscountCap(BigDecimal.valueOf(50))
                    .minOrderValue(BigDecimal.valueOf(100))
                    .newCustomerOnly(true)
                    .isActive(true)
                    .isCustom(false)
                    .offerCategory(Coupon.OfferCategory.OFFER)
                    .isArchived(false)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusYears(1))
                    .build());
            seeded++;
        }

        // 2. SAVE20 — 20% off up to ₹50
        if (!couponRepository.existsByCouponCode("SAVE20")) {
            couponRepository.save(Coupon.builder()
                    .couponCode("SAVE20")
                    .title("Save 20% Today")
                    .description("Flat 20% off on orders above ₹200. Maximum discount ₹50.")
                    .color("#10b981")
                    .couponType(Coupon.CouponType.GENERAL)
                    .discountType(Coupon.DiscountType.PERCENTAGE)
                    .discountValue(BigDecimal.valueOf(20))
                    .maxDiscountCap(BigDecimal.valueOf(50))
                    .minOrderValue(BigDecimal.valueOf(200))
                    .isActive(true)
                    .isCustom(false)
                    .offerCategory(Coupon.OfferCategory.OFFER)
                    .isArchived(false)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusYears(1))
                    .build());
            seeded++;
        }

        // 3. BOGO_SPECIAL — Buy 1 Get 1 Free
        if (!couponRepository.existsByCouponCode("BOGO_SPECIAL")) {
            couponRepository.save(Coupon.builder()
                    .couponCode("BOGO_SPECIAL")
                    .title("Buy 1 Get 1 Free")
                    .description("Order any item and get another one absolutely free!")
                    .color("#f59e0b")
                    .couponType(Coupon.CouponType.BOGO)
                    .discountType(Coupon.DiscountType.BOGO)
                    .bogoBuyQty(1)
                    .bogoGetQty(1)
                    .isActive(true)
                    .isCustom(false)
                    .offerCategory(Coupon.OfferCategory.OFFER)
                    .isArchived(false)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusYears(1))
                    .build());
            seeded++;
        }

        // 4. COMBO25 — 25% off combo orders
        if (!couponRepository.existsByCouponCode("COMBO25")) {
            couponRepository.save(Coupon.builder()
                    .couponCode("COMBO25")
                    .title("Combo Saver 25%")
                    .description("Get 25% off when you order any combo meal. Mix and match!")
                    .color("#8b5cf6")
                    .couponType(Coupon.CouponType.COMBO)
                    .discountType(Coupon.DiscountType.PERCENTAGE)
                    .discountValue(BigDecimal.valueOf(25))
                    .maxDiscountCap(BigDecimal.valueOf(75))
                    .minOrderValue(BigDecimal.valueOf(150))
                    .isActive(true)
                    .isCustom(false)
                    .offerCategory(Coupon.OfferCategory.OFFER)
                    .isArchived(false)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusYears(1))
                    .build());
            seeded++;
        }

        // 5. RUSH15 — 15% off during 6-9pm
        if (!couponRepository.existsByCouponCode("RUSH15")) {
            couponRepository.save(Coupon.builder()
                    .couponCode("RUSH15")
                    .title("Rush Hour 15% Off")
                    .description("Get 15% off on orders placed between 6 PM and 9 PM!")
                    .color("#ef4444")
                    .couponType(Coupon.CouponType.RUSH_HOUR)
                    .discountType(Coupon.DiscountType.PERCENTAGE)
                    .discountValue(BigDecimal.valueOf(15))
                    .maxDiscountCap(BigDecimal.valueOf(40))
                    .rushHourFlag(true)
                    .rushHourStart(LocalTime.of(18, 0))
                    .rushHourEnd(LocalTime.of(21, 0))
                    .isActive(true)
                    .isCustom(false)
                    .offerCategory(Coupon.OfferCategory.OFFER)
                    .isArchived(false)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusYears(1))
                    .build());
            seeded++;
        }

        log.info("System offers seeding complete. Seeded {} new offers.", seeded);
    }
}
