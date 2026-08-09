package com.charusat.canteen.config;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * ProdDataSeeder — Seeds production-like data when running with `--spring.profiles.active=seed-prod-like`.
 */
@Component
@Profile("seed-prod-like")
@RequiredArgsConstructor
@Slf4j
public class ProdDataSeeder implements CommandLineRunner {

    private final CanteenRepository canteenRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting production-like database seeding [profile: seed-prod-like]...");

        if (canteenRepository.count() > 0) {
            log.info("Database already contains data. Skipping seeding.");
            return;
        }

        // 1. Seed Users
        String encPass = passwordEncoder.encode("Password123!");
        User admin = userRepository.save(User.builder().email("admin@charusat.edu.in").fullName("System Administrator").password(encPass).role(User.UserRole.ADMIN).isActive(true).isEmailVerified(true).build());
        User vendor1 = userRepository.save(User.builder().email("grizzly@charusat.edu.in").fullName("Grizzly Manager").password(encPass).role(User.UserRole.CANTEEN_OWNER).isActive(true).isEmailVerified(true).build());
        User vendor2 = userRepository.save(User.builder().email("havmor@charusat.edu.in").fullName("Havmor Manager").password(encPass).role(User.UserRole.CANTEEN_OWNER).isActive(true).isEmailVerified(true).build());
        User student1 = userRepository.save(User.builder().email("21CE001@charusat.edu.in").fullName("Aarav Patel").password(encPass).role(User.UserRole.USER).isActive(true).isEmailVerified(true).build());

        // 2. Seed Canteens
        Canteen c1 = canteenRepository.save(Canteen.builder().name("Grizzly Diner").location("Central Lawn").description("Burgers, Shakes & Fast Food").isOpen(true).ownerId(vendor1.getId()).build());
        Canteen c2 = canteenRepository.save(Canteen.builder().name("Havmor Eatery").location("IT Building Annex").description("Ice Creams & Continental Snacks").isOpen(true).ownerId(vendor2.getId()).build());

        // 3. Seed Menu Items
        for (int i = 1; i <= 20; i++) {
            menuItemRepository.save(MenuItem.builder().canteenId(c1.getId()).name("Grizzly Special Burger #" + i).description("Delicious handcrafted burger with fresh veggies").price(new BigDecimal(50 + i * 5)).category("Fast Food").isAvailable(true).isVeg(i % 2 == 0).build());
            menuItemRepository.save(MenuItem.builder().canteenId(c2.getId()).name("Havmor Scoop #" + i).description("Premium rich cream scoop").price(new BigDecimal(30 + i * 4)).category("Desserts").isAvailable(true).isVeg(true).build());
        }

        // 4. Seed Coupons
        couponRepository.save(Coupon.builder().id(UUID.randomUUID()).canteenId(c1.getId()).couponCode("GRIZZLY10").title("10% Off Burgers").couponType(Coupon.CouponType.GENERAL).discountType(Coupon.DiscountType.PERCENTAGE).discountValue(new BigDecimal("10")).isActive(true).minOrderValue(new BigDecimal("100")).build());

        // 5. Seed Historical Orders
        for (int i = 1; i <= 25; i++) {
            orderRepository.save(Order.builder().orderNumber("ORD-SEED-" + i).customerId(student1.getId()).canteenId(c1.getId()).status(Order.OrderStatus.COMPLETED).totalAmount(new BigDecimal("150.00")).paymentMethod("UPI").paymentStatus(Order.PaymentStatus.PAID).createdAt(LocalDateTime.now().minusDays(i)).completedAt(LocalDateTime.now().minusDays(i)).build());
        }

        log.info("Production-like database seeding completed successfully.");
    }
}
