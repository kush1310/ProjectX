package com.charusat.canteen.config;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.MenuItemRepository;
import com.charusat.canteen.repository.MenuItemVariantRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Initializer - Seeds database with complete menu from reference images
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final CanteenRepository canteenRepository;
        private final MenuItemRepository menuItemRepository;
        private final MenuItemVariantRepository menuItemVariantRepository;
        private final com.charusat.canteen.repository.CouponRepository couponRepository;
        private final com.charusat.canteen.repository.CategoryRepository categoryRepository;
        private final OrderRepository orderRepository;
        private final OrderItemRepository orderItemRepository;
        private final PasswordEncoder passwordEncoder;
        private final org.springframework.jdbc.core.JdbcTemplate jdbc;

        @Override
        public void run(String... args) {
                log.info("🚀 Starting Data Initialization...");

                // ── Step 0: Clean all user-entered/transactional data for a fresh start ──
                log.info("🧹 Cleaning transactional data for fresh seed...");
                cleanTransactionalData();

                // ── Step 1: Seed Users ──
                if (userRepository.count() == 0) {
                        log.info("👤 Seeding Users...");
                        createUser("admin@charusat.edu.in", "Admin User", User.UserRole.ADMIN, "CyberKush");
                        // Dedicated vendor accounts with easy-to-remember credentials
                        createUser("honest@charusat.edu.in", "Honest Restaurant", User.UserRole.CANTEEN_OWNER, "charusat123");
                        createUser("depstar@charusat.edu.in", "Campus Bites (DEPSTAR)", User.UserRole.CANTEEN_OWNER, "charusat123");
                        createUser("owner3@charusat.edu.in", "Spice Junction Owner", User.UserRole.CANTEEN_OWNER, "charusat123");
                        createUser("patelpuff@charusat.edu.in", "Patel Puff Vendor", User.UserRole.CANTEEN_OWNER, "charusat123");
                        createUser("gohunger@charusat.edu.in", "Dhruv Patel", User.UserRole.CANTEEN_OWNER, "charusat123");
                        createUser("kush@charusat.edu.in", "Kush Shah", User.UserRole.USER, "charusat123");
                }

                // ── Step 2: Seed Canteens + Menus + Coupons ──
                if (canteenRepository.count() == 0) {
                        log.info("🏪 Seeding 3 Canteens...");

                        // ── Restaurant 1: Honest Restaurant ──
                        User honestOwner = userRepository.findByEmail("honest@charusat.edu.in").orElse(null);
                        Canteen honest = canteenRepository.save(Canteen.builder()
                                        .name("Honest Restaurant")
                                        .location("CSPIT Building, Ground Floor")
                                        .description("Authentic Gujarati, South Indian & Multi-cuisine Restaurant")
                                        .imageUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80")
                                        .logoUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80")
                                        .isOpen(true)
                                        .owner(honestOwner).ownerId(honestOwner != null ? honestOwner.getId() : null)
                                        .openingTime("08:00").closingTime("22:00")
                                        .accountHolderName("Charusat Canteen Services").bankName("HDFC Bank")
                                        .accountNumber("HDFC0001234567").ifscCode("HDFC0001234")
                                        .fssaiNumber("12345678901234")
                                        .build());

                        // ── Restaurant 2: Campus Bites (DEPSTAR) ──
                        User depstarOwner = userRepository.findByEmail("depstar@charusat.edu.in").orElse(null);
                        Canteen campusBites = canteenRepository.save(Canteen.builder()
                                        .name("Campus Bites")
                                        .location("DEPSTAR Building, First Floor")
                                        .description("Quick Bites, Burgers, Wraps & Shakes — Campus Favourite")
                                        .imageUrl("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80")
                                        .logoUrl("https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200&auto=format&fit=crop&q=80")
                                        .isOpen(true)
                                        .owner(depstarOwner).ownerId(depstarOwner != null ? depstarOwner.getId() : null)
                                        .openingTime("09:00").closingTime("21:00")
                                        .accountHolderName("Campus Bites LLP").bankName("SBI")
                                        .accountNumber("SBI00098765432").ifscCode("SBIN0005678")
                                        .fssaiNumber("98765432109876")
                                        .build());

                        // ── Restaurant 3: Spice Junction ──
                        User owner3 = userRepository.findByEmail("owner3@charusat.edu.in").orElse(null);
                        Canteen spiceJunction = canteenRepository.save(Canteen.builder()
                                        .name("Spice Junction")
                                        .location("PDPIAS Building, Ground Floor")
                                        .description("Premium North & South Indian Thalis, Biryanis & Street Food")
                                        .imageUrl("https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80")
                                        .logoUrl("https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=200&auto=format&fit=crop&q=80")
                                        .isOpen(true)
                                        .owner(owner3).ownerId(owner3 != null ? owner3.getId() : null)
                                        .openingTime("10:00").closingTime("22:30")
                                        .accountHolderName("Spice Junction Pvt Ltd").bankName("ICICI Bank")
                                        .accountNumber("ICICI087654321").ifscCode("ICIC0009876")
                                        .fssaiNumber("56789012345678")
                                        .build());

                        // ── Restaurant 4: Patel Puff ──
                        User patelOwner = userRepository.findByEmail("patelpuff@charusat.edu.in").orElse(null);
                        Canteen patelPuff = canteenRepository.save(Canteen.builder()
                                        .name("Patel Puff")
                                        .location("Campus Food Zone, Block B")
                                        .description("Crispy Outside, Delicious Inside — 100% Veg Freshly Baked Puffs & Specialities")
                                        .imageUrl("https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80")
                                        .logoUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80")
                                        .isOpen(true)
                                        .owner(patelOwner).ownerId(patelOwner != null ? patelOwner.getId() : null)
                                        .openingTime("08:30").closingTime("20:30")
                                        .accountHolderName("Patel Puff Canteen").bankName("HDFC Bank")
                                        .accountNumber("HDFC0008877665").ifscCode("HDFC0001234")
                                        .fssaiNumber("20987654321098")
                                        .build());

                        // ── Restaurant 5: Go Hunger Cafe ──
                        User goHungerOwner = userRepository.findByEmail("gohunger@charusat.edu.in").orElse(null);
                        Canteen goHunger = canteenRepository.save(Canteen.builder()
                                        .name("Go Hunger Cafe")
                                        .location("CHARUSAT Central Plaza, Ground Floor")
                                        .description("Good Food Good Mood — Sandwiches, Burgers, Frankies, Fries, Drinks & Pizzas")
                                        .imageUrl("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80")
                                        .logoUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80")
                                        .isOpen(true)
                                        .owner(goHungerOwner).ownerId(goHungerOwner != null ? goHungerOwner.getId() : null)
                                        .openingTime("09:00").closingTime("21:30")
                                        .accountHolderName("Go Hunger Cafe").bankName("ICICI Bank")
                                        .accountNumber("ICICI0009988776").ifscCode("ICIC0001234")
                                        .fssaiNumber("21234567890123")
                                        .build());

                        // 3. Seed Menus
                        log.info("🍽️ Seeding Honest Restaurant Menu...");
                        seedCompleteMenu(honest);
                        log.info("🍔 Seeding Campus Bites Menu...");
                        seedCampusBitesMenu(campusBites);
                        log.info("🌶️ Seeding Spice Junction Menu...");
                        seedSpiceJunctionMenu(spiceJunction);
                        log.info("🥐 Seeding Patel Puff Menu...");
                        seedPatelPuffMenu(patelPuff);
                        log.info("🍕 Seeding Go Hunger Cafe Menu...");
                        seedGoHungerMenu(goHunger);

                        // 4. Coupons
                        log.info("🎟️ Seeding Coupons...");
                        seedCoupons(honest);
                        seedCampusBitesCoupons(campusBites);
                        seedSpiceJunctionCoupons(spiceJunction);
                        seedPatelPuffCoupons(patelPuff);
                        seedGoHungerCoupons(goHunger);

                        // 5. Seed a few demo orders for the dashboard
                        log.info("🛍️ Seeding Trial Orders...");
                        seedOrders(honest);
                } else {
                        log.info("📦 Canteen data already exists, skipping seed.");
                }

                log.info("✅ Database seeding complete!");
        }

        /**
         * Wipe ALL transactional/user-entered data so the DB is fresh.
         * Static seed data (users, canteens, menus, coupons) is re-created by the seeder.
         */
        private void cleanTransactionalData() {
                try {
                        // Auto-migrate schema: ensure all required canteens table columns exist
                        try {
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(50);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS gst_no VARCHAR(50);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500);");
                                jdbc.execute("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS rush_hour_enabled BOOLEAN DEFAULT FALSE;");
                                jdbc.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;");
                        } catch (Exception ex) {
                                log.warn("Schema migration warning: {}", ex.getMessage());
                        }

                        // Order matters: child tables first, then parents
                        jdbc.execute("TRUNCATE TABLE reviews, order_items, orders, cart_items, carts, " +
                                     "coupon_usage, coupon_analytics, coupon_applicability, coupons, " +
                                     "favorites, login_attempts, password_history, password_reset_tokens, " +
                                     "refresh_tokens, mfa_events, " +
                                     "addon_options, addon_groups, addons, menu_item_variants, menu_item_tags, menu_items, " +
                                     "canteen_bank_details, user_profiles, " +
                                     "categories, canteens, users CASCADE");
                        log.info("🗑️ All tables truncated for fresh seed.");
                } catch (Exception e) {
                        log.warn("⚠️ Truncation warning (some tables may not exist yet): {}", e.getMessage());
                }
        }

        private User createUser(String email, String name, User.UserRole role, String password) {
                return userRepository.save(User.builder()
                                .email(email)
                                .password(passwordEncoder.encode(password))
                                .fullName(name)
                                .mobile("9999999999")
                                .role(role)
                                .authProvider(User.AuthProvider.LOCAL)
                                .isEmailVerified(true)
                                .build());
        }

        private void seedCompleteMenu(Canteen canteen) {
                int order = 1;

                // ═══════════════════════════════════════════════════════════════
                // GUJARATI THALI SECTION
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Gujarati Thali...");

                save(canteen, "Gujarati Thali (Lunch)",
                                "Weekdays 12:00-3:30 PM. 1 Farsan, 3 Vegetables, Dal/Kadhi, Puries, Rice, Pullao, Papad, Buttermilk, 1 Sweet",
                                "550", "Gujarati Thali", "Lunch", true, order++, "12:00", "15:30", false);

                save(canteen, "Child Thali (Lunch)",
                                "For children up to 8 years",
                                "350", "Gujarati Thali", "Lunch", true, order++, "12:00", "15:30", false);

                save(canteen, "Gujarati Thali (Dinner)",
                                "7:00-10:30 PM & Holidays. 2 Farsan, 3 Vegetables, Dal/Kadhi, Puries, Rice, Pullao, Papad, Buttermilk, 2 Sweets",
                                "650", "Gujarati Thali", "Dinner", true, order++, "19:00", "22:30", false);

                save(canteen, "Child Thali (Dinner)",
                                "For children up to 8 years",
                                "450", "Gujarati Thali", "Dinner", true, order++, "19:00", "22:30", false);

                // ═══════════════════════════════════════════════════════════════
                // COMBO MEALS SECTION
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Combo Meals...");

                save(canteen, "Pulao with Kadhi & Papad", null, "350", "Combo Meals", "Rice", true, order++, null, null,
                                false);
                save(canteen, "Tawa Biryani (Dal Makhani, Raita & Papad)", null, "350", "Combo Meals", "Rice", true,
                                order++,
                                null, null, false);
                save(canteen, "Puran Poli with Osaman", "Jain Available", "350", "Combo Meals", "Sweet", true, order++,
                                null,
                                null, true);
                save(canteen, "Chole Bhature", null, "450", "Combo Meals", "North Indian", true, order++, null, null,
                                false);
                save(canteen, "Pav Bhaji", null, "350", "Combo Meals", "Fast Food", true, order++, null, null, false);
                save(canteen, "Cheese Pav Bhaji", null, "400", "Combo Meals", "Fast Food", true, order++, null, null,
                                false);
                save(canteen, "Paneer Paratha (Raita & Dal Makhani)", null, "350", "Combo Meals", "Paratha", true,
                                order++,
                                null, null, false);
                save(canteen, "Alu Paratha (Raita & Dal Makhani)", null, "350", "Combo Meals", "Paratha", true, order++,
                                null,
                                null, false);
                save(canteen, "Gobhi Paratha (Raita & Dal Makhani)", null, "350", "Combo Meals", "Paratha", true,
                                order++, null,
                                null, false);
                save(canteen, "Poori Bhaji", null, "350", "Combo Meals", "North Indian", true, order++, null, null,
                                false);
                save(canteen, "Shrikhand Puri", "Jain Available", "350", "Combo Meals", "Sweet", true, order++, null,
                                null,
                                true);
                save(canteen, "Dal Dhokli", null, "300", "Combo Meals", "Gujarati", true, order++, null, null, false);
                save(canteen, "Palak Garlic Rice (Raita & Papad)", null, "350", "Combo Meals", "Rice", true, order++,
                                null,
                                null, false);
                save(canteen, "Masala Khichdi with Kadhi & Papad", null, "350", "Combo Meals", "Rice", true, order++,
                                null,
                                null, false);
                save(canteen, "Baked Veg Khichdi with Kadhi & Raita", null, "400", "Combo Meals", "Rice", true, order++,
                                null,
                                null, false);
                save(canteen, "Dal Khichdi with Raita & Papad", null, "350", "Combo Meals", "Rice", true, order++, null,
                                null,
                                false);
                save(canteen, "Khichdi with Kadhi & Papad", "Jain Available", "350", "Combo Meals", "Rice", true,
                                order++, null,
                                null, true);
                save(canteen, "Jeera Rice with Dal Makhani & Papad", null, "450", "Combo Meals", "Rice", true, order++,
                                null,
                                null, false);
                save(canteen, "Plain Rice with Surti Dal & Papad", "Jain Available", "350", "Combo Meals", "Rice", true,
                                order++, null, null, true);
                save(canteen, "Aamras Poori (Seasonal)", "Jain Available", "400", "Combo Meals", "Sweet", true, order++,
                                null,
                                null, true);

                // ═══════════════════════════════════════════════════════════════
                // SOUTH INDIAN PLATTERS
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding South Indian...");

                save(canteen, "Idli (3 Pcs)", null, "185", "South Indian", "Breakfast", true, order++, null, null,
                                false);
                save(canteen, "Dosa (3 Pcs)", "Plain, Mysore & Cheese", "250", "South Indian", "Dosa", true, order++,
                                null,
                                null, false);
                save(canteen, "Uttapam (3 Pcs)", "Plain, Onion Chilly & Cheese", "250", "South Indian", "Breakfast",
                                true,
                                order++, null, null, false);
                save(canteen, "Curd Rice (Dahi Bhaat)", "Jain Available", "325", "South Indian", "Rice", true, order++,
                                null,
                                null, true);
                save(canteen, "Rice with Sambhar", null, "325", "South Indian", "Rice", true, order++, null, null,
                                false);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - CHAAT
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Chaat...");

                save(canteen, "Alu Chaat", null, "250", "Starters", "Chaat", true, order++, null, null, false);
                save(canteen, "Chana Chaat", null, "250", "Starters", "Chaat", true, order++, null, null, false);
                save(canteen, "Samosa Ki Chaat", null, "300", "Starters", "Chaat", true, order++, null, null, false);
                save(canteen, "Corn Bhel", null, "300", "Starters", "Chaat", true, order++, null, null, false);
                save(canteen, "Papdi Chaat (6 Pcs)", null, "250", "Starters", "Chaat", true, order++, null, null,
                                false);
                save(canteen, "Dahi Batata Puri (8 Pcs)", null, "300", "Starters", "Chaat", true, order++, null, null,
                                false);
                save(canteen, "Alu Tikki (6 Pcs) with Chole", null, "350", "Starters", "Chaat", true, order++, null,
                                null,
                                false);
                save(canteen, "Paani Poori (10 Pcs)", null, "250", "Starters", "Chaat", true, order++, null, null,
                                false);
                save(canteen, "Hot Chana Chaat", null, "350", "Starters", "Chaat", true, order++, null, null, false);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - KABAB & PAKODA
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Kabab & Pakoda...");

                save(canteen, "Hara Bhara Kabab (6 Pcs)", null, "350", "Starters", "Kabab", true, order++, null, null,
                                false);
                save(canteen, "Hara Bhara Kabab in Cheese Sauce (6 Pcs)", null, "350", "Starters", "Kabab", true,
                                order++, null,
                                null, false);
                save(canteen, "Mini Punjabi Samosa (6 Pcs)", null, "240", "Starters", "Fried", true, order++, null,
                                null,
                                false);
                save(canteen, "Paneer Pakodas / Cheese Pakodas (10 Pcs)", "Jain Available", "300", "Starters", "Fried",
                                true,
                                order++, null, null, true);
                save(canteen, "Mini Vada Pav (6 Pcs)", null, "250", "Starters", "Fried", true, order++, null, null,
                                false);
                save(canteen, "Mini Pav Bhaji (6 Pcs)", null, "250", "Starters", "Fried", true, order++, null, null,
                                false);
                save(canteen, "Tawa Alu / Mushroom", null, "400", "Starters", "Tawa", true, order++, null, null, false);
                save(canteen, "Mix Kabab (12 Pcs)", null, "575", "Starters", "Kabab", true, order++, null, null, false);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - TANDOOR
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Tandoor...");

                save(canteen, "Paneer Tikka (6 Pcs)", null, "400", "Starters", "Tandoor", true, order++, null, null,
                                false);
                save(canteen, "Schezwan Paneer Tikka (6 Pcs)", null, "450", "Starters", "Tandoor", true, order++, null,
                                null,
                                false);
                save(canteen, "Mini Chilly Cheese Kulcha (6 Pcs)", "Jain Available", "325", "Starters", "Tandoor", true,
                                order++, null, null, true);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - CONTINENTAL
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Continental...");

                save(canteen, "Corn on Toast (6 Pcs)", "Jain Available", "325", "Starters", "Continental", true,
                                order++, null,
                                null, true);
                save(canteen, "Cheese Balls (6 Pcs)", null, "325", "Starters", "Continental", true, order++, null, null,
                                false);
                save(canteen, "Cheese Balls in Chilly Garlic Sauce (6 Pcs)", null, "400", "Starters", "Continental",
                                true,
                                order++, null, null, false);
                save(canteen, "Chilly Cheese Toast (6 Pcs)", null, "325", "Starters", "Continental", true, order++,
                                null, null,
                                false);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - CHINESE
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Chinese...");

                save(canteen, "Paneer Chilli", null, "450", "Starters", "Chinese", true, order++, null, null, false);
                save(canteen, "Idli Chilli", null, "350", "Starters", "Chinese", true, order++, null, null, false);
                save(canteen, "Schezwan Potato", null, "350", "Starters", "Chinese", true, order++, null, null, false);
                save(canteen, "Schezwan Paneer", null, "400", "Starters", "Chinese", true, order++, null, null, false);

                // ═══════════════════════════════════════════════════════════════
                // STARTERS - GUJARATI
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Starters - Gujarati...");

                save(canteen, "Cocktail Samosa (8 Pcs)", "Jain Available", "250", "Starters", "Gujarati", true, order++,
                                null,
                                null, true);
                save(canteen, "Mini Batata Vada (6 Pcs)", null, "230", "Starters", "Gujarati", true, order++, null,
                                null,
                                false);
                save(canteen, "Khandvi (10 Pcs)", "Jain Available", "250", "Starters", "Gujarati", true, order++, null,
                                null,
                                true);
                save(canteen, "Patra (6 Pcs)", null, "250", "Starters", "Gujarati", true, order++, null, null, false);
                save(canteen, "Khichu", "Jain Available", "250", "Starters", "Gujarati", true, order++, null, null,
                                true);
                save(canteen, "Moongdal Kachori (6 Pcs)", null, "250", "Starters", "Gujarati", true, order++, null,
                                null,
                                false);
                save(canteen, "Peas Gughra (6 Pcs)", "Jain Available", "250", "Starters", "Gujarati", true, order++,
                                null, null,
                                true);
                save(canteen, "Mix Farsan (12 Pcs)", "Jain Available", "425", "Starters", "Gujarati", true, order++,
                                null, null,
                                true);

                // ═══════════════════════════════════════════════════════════════
                // BEVERAGES
                // ═══════════════════════════════════════════════════════════════
                // ═══════════════════════════════════════════════════════════════
                // BEVERAGES (DETAILED)
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Detailed Beverages...");

                // Juices
                save(canteen, "Watermelon Juice", "Fresh Watermelon Juice", "250", "Beverages", "Juices", true, order++,
                                null,
                                null, false);
                save(canteen, "Pineapple Juice", "Fresh Pineapple Juice", "250", "Beverages", "Juices", true, order++,
                                null,
                                null, false);
                save(canteen, "Sweet Lime Juice", "Fresh Sweet Lime Juice", "250", "Beverages", "Juices", true, order++,
                                null,
                                null, false);
                save(canteen, "Mango Juice (In Season)", "Fresh Mango Juice", "250", "Beverages", "Juices", true,
                                order++, null,
                                null, false);

                // Mocktails & Shakes
                save(canteen, "Kala Katta", "Refreshing Kala Katta", "275", "Beverages", "Mocktails & Shakes", true,
                                order++,
                                null, null, false);
                save(canteen, "Fruit Punch", "Mixed Fruit Punch", "300", "Beverages", "Mocktails & Shakes", true,
                                order++, null,
                                null, false);
                save(canteen, "Orange Blossom", "Orange flavored refresher", "300", "Beverages", "Mocktails & Shakes",
                                true,
                                order++, null, null, false);
                save(canteen, "Twisted Pinacolada", "Pinacolada with a twist", "300", "Beverages", "Mocktails & Shakes",
                                true,
                                order++, null, null, false);
                save(canteen, "Milk Shakes", "Vanilla / Strawberry / Chocolate / Mango / Kesar Pista", "300",
                                "Beverages",
                                "Mocktails & Shakes", true, order++, null, null, false);
                save(canteen, "Milk Shakes with Ice Cream", "With Scoop", "360", "Beverages", "Mocktails & Shakes",
                                true,
                                order++, null, null, false);

                // Iced Teas
                save(canteen, "Peach Iced Tea", "Chilled Peach Tea", "200", "Beverages", "Iced Teas", true, order++,
                                null, null,
                                false);
                save(canteen, "Lemon Iced Tea", "Chilled Lemon Tea", "200", "Beverages", "Iced Teas", true, order++,
                                null, null,
                                false);

                // Cold Coffee
                save(canteen, "Classic Cold Coffee", "Classic Blend", "275", "Beverages", "Cold Coffee", true, order++,
                                null,
                                null, false);
                save(canteen, "Cold Coffee with Ice Cream", "Served with Vanilla Scoop", "350", "Beverages",
                                "Cold Coffee",
                                true, order++, null, null, false);

                // All Time Favourites
                save(canteen, "Bottle Drinking Water", "Mineral Water", "50", "Beverages", "All Time Favourites", true,
                                order++,
                                null, null, false);
                save(canteen, "Aerated Water", "Thums Up / Coke / Fanta / Sprite (Glass)", "125", "Beverages",
                                "All Time Favourites", true, order++, null, null, false);
                save(canteen, "Diet Coke", "Glass", "150", "Beverages", "All Time Favourites", true, order++, null,
                                null,
                                false);
                save(canteen, "Fresh Lime with Water", "Classic Nimbu Pani", "125", "Beverages", "All Time Favourites",
                                true,
                                order++, null, null, false);
                save(canteen, "Fresh Lime with Soda", "Fresh Lime Soda", "150", "Beverages", "All Time Favourites",
                                true,
                                order++, null, null, false);
                save(canteen, "Butter Milk (Chaas)", "Spiced Chaas", "150", "Beverages", "All Time Favourites", true,
                                order++,
                                null, null, false);
                save(canteen, "Lassi", "Sweet / Salty", "225", "Beverages", "All Time Favourites", true, order++, null,
                                null,
                                false);
                save(canteen, "Jaljeera", "Spiced Water", "130", "Beverages", "All Time Favourites", true, order++,
                                null, null,
                                false);
                save(canteen, "Mango Lassi", "Mango flavored Yogurt Drink", "250", "Beverages", "All Time Favourites",
                                true,
                                order++, null, null, false);

                // Hot Drinks
                save(canteen, "Tea", "Hot Chai", "125", "Beverages", "Hot Drink", true, order++, null, null, false);
                save(canteen, "Masala Tea", "Spiced Chai", "150", "Beverages", "Hot Drink", true, order++, null, null,
                                false);
                save(canteen, "Coffee", "Hot Coffee", "150", "Beverages", "Hot Drink", true, order++, null, null,
                                false);
                save(canteen, "Hot Chocolate", "Rich Hot Chocolate", "200", "Beverages", "Hot Drink", true, order++,
                                null, null,
                                false);

                // ═══════════════════════════════════════════════════════════════
                // ROTIS
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Rotis...");

                saveWithVariants(canteen, "Tandoori Roti", "Fresh Tandoori Roti", "Rotis", "Breads", true, order++,
                                new Variant("Plain", 80), new Variant("Butter", 100));

                saveWithVariants(canteen, "Nan / Kulcha", "Tandoor Baked Soft Bread", "Rotis", "Breads", true, order++,
                                new Variant("Plain", 100), new Variant("Butter", 125));

                save(canteen, "Onion Kulcha / Masala Kulcha", "Stuffed Kulcha", "160", "Rotis", "Breads", true, order++,
                                null,
                                null, false);
                save(canteen, "Chilly Garlic Nan / Cheese Nan", "Special Nan", "160", "Rotis", "Breads", true, order++,
                                null,
                                null, false);
                save(canteen, "Garlic Nan / Cheese Garlic Nan", "Flavorful Nan", "160", "Rotis", "Breads", true,
                                order++, null,
                                null, false);
                save(canteen, "Paratha", "Layered Paratha", "110", "Rotis", "Breads", true, order++, null, null, false);
                save(canteen, "Butter Paratha / Tandoori Butter Laccha", "Butter Paratha", "140", "Rotis", "Breads",
                                true,
                                order++, null, null, false);
                save(canteen, "Reshmi Paratha", "Soft Paratha", "130", "Rotis", "Breads", true, order++, null, null,
                                false);
                save(canteen, "Roomali Roti", "Thin Bread", "125", "Rotis", "Breads", true, order++, null, null, false);
                save(canteen, "Puries", "(Six Pieces)", "100", "Rotis", "Breads", true, order++, null, null, false);
                save(canteen, "Bhatura", "(2 Pcs)", "100", "Rotis", "Breads", true, order++, null, null, false);
                save(canteen, "Pudina Paratha / Methi Paratha", "Mint/Fenugreek Paratha", "130", "Rotis", "Breads",
                                true,
                                order++, null, null, false);
                save(canteen, "Tava Chapati", "(2 Pcs)", "55", "Rotis", "Breads", true, order++, null, null, false);
                save(canteen, "Masala Papad", "Fried / Roasted", "90", "Rotis", "Sides", true, order++, null, null,
                                false);
                save(canteen, "Papad", "Fried / Roasted", "65", "Rotis", "Sides", true, order++, null, null, false);
                save(canteen, "Papad Chura", "Crushed Spiced Papad", "130", "Rotis", "Sides", true, order++, null, null,
                                false);
                save(canteen, "Masala Khichia", "Roasted", "130", "Rotis", "Sides", true, order++, null, null, false);
                save(canteen, "Thepla", "(2 Pcs)", "65", "Rotis", "Breads", true, order++, null, null, false);

                // ═══════════════════════════════════════════════════════════════
                // RICE PREPARATION
                // ═══════════════════════════════════════════════════════════════
                log.info("📦 Adding Rice Preparations...");

                save(canteen, "Vegetable Pullao with Kadhi", "Classic Pullao", "350", "Rice Preparation", "Rice", true,
                                order++,
                                null, null, false);
                save(canteen, "Peas Pullao / Jeera Rice", "Aromatic Rice", "300", "Rice Preparation", "Rice", true,
                                order++,
                                null, null, false);
                save(canteen, "Samrat Pullao", "Special Pullao", "350", "Rice Preparation", "Rice", true, order++, null,
                                null,
                                false);
                save(canteen, "Vegetable Dum Biryani", "Served with Raita", "450", "Rice Preparation", "Rice", true,
                                order++,
                                null, null, false);
                save(canteen, "Palak Garlic Rice with Raita & Papad", "Spinach Garlic Rice", "350", "Rice Preparation",
                                "Rice",
                                true, order++, null, null, false);
                save(canteen, "Rice (Plain)", "Steamed Rice", "250", "Rice Preparation", "Rice", true, order++, null,
                                null,
                                false);
                save(canteen, "Khichdi with Kadhi & Papad", "Comfort Food", "350", "Rice Preparation", "Rice", true,
                                order++,
                                null, null, false);
                save(canteen, "Dal Khichdi with Raita & Papad", "Lentil Rice Mix", "350", "Rice Preparation", "Rice",
                                true,
                                order++, null, null, false);
                save(canteen, "Masala Khichdi with Kadhi & Papad", "Spiced Khichdi", "350", "Rice Preparation", "Rice",
                                true,
                                order++, null, null, false);
                save(canteen, "Baked Vegetable Khichdi", "Signature Dish", "400", "Rice Preparation", "Rice", true,
                                order++,
                                null, null, false);

                log.info("✅ Added {} menu items!", order - 1);
        }

        // ═══════════════════════════════════════════════════════════════
        // CAMPUS BITES — Fast Food & Cafe Menu
        // ═══════════════════════════════════════════════════════════════
        private void seedCampusBitesMenu(Canteen canteen) {
                int order = 1;

                // BURGERS
                log.info("📦 CB: Adding Burgers...");
                save(canteen, "Classic Veg Burger", "Crispy patty, lettuce, tomato & our secret sauce", "149",
                                "Burgers", "Classic", true, order++, null, null, false);
                save(canteen, "Cheese Burst Burger", "Double cheese with caramelized onions", "189", "Burgers",
                                "Classic", true, order++, null, null, false);
                save(canteen, "Paneer Tikka Burger", "Grilled paneer tikka with mint mayo", "219", "Burgers", "Premium",
                                true, order++, null, null, false);
                save(canteen, "Spicy Mexican Burger", "Jalapeños, salsa & chipotle sauce", "229", "Burgers", "Premium",
                                true, order++, null, null, false);
                save(canteen, "Double Patty Burger", "Two crispy patties with double cheese", "269", "Burgers",
                                "Premium", true, order++, null, null, false);
                save(canteen, "BBQ Mushroom Burger", "Grilled mushroom with smoky BBQ glaze", "239", "Burgers",
                                "Premium", true, order++, null, null, false);

                // WRAPS & ROLLS
                log.info("📦 CB: Adding Wraps & Rolls...");
                save(canteen, "Paneer Tikka Wrap", "Tandoori paneer with fresh veggies in tortilla", "179",
                                "Wraps & Rolls", "Wraps", true, order++, null, null, false);
                save(canteen, "Falafel Wrap", "Crispy falafel balls with hummus & tahini", "199", "Wraps & Rolls",
                                "Wraps", true, order++, null, null, false);
                save(canteen, "Cheese Corn Wrap", "Creamy cheese corn filling", "169", "Wraps & Rolls", "Wraps", true,
                                order++, null, null, false);
                save(canteen, "Veg Spring Rolls (6 Pcs)", "Crispy rolls with sweet chilli dip", "149", "Wraps & Rolls",
                                "Rolls", true, order++, null, null, false);
                save(canteen, "Schezwan Paneer Roll", "Spicy Schezwan paneer wrap", "189", "Wraps & Rolls", "Rolls",
                                true, order++, null, null, false);

                // PIZZAS
                log.info("📦 CB: Adding Pizzas...");
                saveWithVariants(canteen, "Margherita Pizza", "Classic tomato & mozzarella", "Pizzas", "Classic", true,
                                order++,
                                new Variant("Regular 7\"", 199), new Variant("Medium 10\"", 349),
                                new Variant("Large 12\"", 499));
                saveWithVariants(canteen, "Farm Fresh Pizza", "Capsicum, onion, tomato, corn & olives", "Pizzas",
                                "Classic", true, order++,
                                new Variant("Regular 7\"", 249), new Variant("Medium 10\"", 399),
                                new Variant("Large 12\"", 549));
                saveWithVariants(canteen, "Paneer Overload Pizza", "Double paneer with tikka seasoning", "Pizzas",
                                "Premium", true, order++,
                                new Variant("Regular 7\"", 299), new Variant("Medium 10\"", 449),
                                new Variant("Large 12\"", 599));
                saveWithVariants(canteen, "Mexican Wave Pizza", "Jalapeños, nachos & spicy salsa base", "Pizzas",
                                "Premium", true, order++,
                                new Variant("Regular 7\"", 299), new Variant("Medium 10\"", 449),
                                new Variant("Large 12\"", 599));

                // PASTA & NOODLES
                log.info("📦 CB: Adding Pasta & Noodles...");
                save(canteen, "Penne Arrabiata", "Spicy tomato sauce pasta", "229", "Pasta & Noodles", "Pasta", true,
                                order++, null, null, false);
                save(canteen, "Alfredo Pasta", "Creamy white sauce penne", "249", "Pasta & Noodles", "Pasta", true,
                                order++, null, null, false);
                save(canteen, "Mac & Cheese", "Classic American comfort food", "269", "Pasta & Noodles", "Pasta", true,
                                order++, null, null, false);
                save(canteen, "Hakka Noodles", "Stir-fried veg noodles", "189", "Pasta & Noodles", "Noodles", true,
                                order++, null, null, false);
                save(canteen, "Schezwan Noodles", "Spicy Sichuan style noodles", "209", "Pasta & Noodles", "Noodles",
                                true, order++, null, null, false);

                // FRIES & SIDES
                log.info("📦 CB: Adding Fries & Sides...");
                save(canteen, "Classic French Fries", "Salted & crispy", "99", "Fries & Sides", "Fries", true, order++,
                                null, null, false);
                save(canteen, "Peri Peri Fries", "With spicy peri peri seasoning", "129", "Fries & Sides", "Fries",
                                true, order++, null, null, false);
                save(canteen, "Loaded Cheese Fries", "Topped with cheddar & jalapeños", "179", "Fries & Sides", "Fries",
                                true, order++, null, null, false);
                save(canteen, "Garlic Bread (4 Pcs)", "With cheese dip", "149", "Fries & Sides", "Sides", true, order++,
                                null, null, false);
                save(canteen, "Cheese Garlic Bread (4 Pcs)", "Extra cheese loaded", "179", "Fries & Sides", "Sides",
                                true, order++, null, null, false);
                save(canteen, "Nachos with Salsa", "Tortilla chips with salsa & cheese", "169", "Fries & Sides",
                                "Sides", true, order++, null, null, false);
                save(canteen, "Onion Rings (8 Pcs)", "Crispy beer-battered rings", "149", "Fries & Sides", "Sides",
                                true, order++, null, null, false);

                // SHAKES & SMOOTHIES
                log.info("📦 CB: Adding Shakes & Smoothies...");
                save(canteen, "Oreo Shake", "Crushed Oreo milkshake", "199", "Shakes & Smoothies", "Shakes", true,
                                order++, null, null, false);
                save(canteen, "Brownie Shake", "Chocolate brownie blended shake", "229", "Shakes & Smoothies", "Shakes",
                                true, order++, null, null, false);
                save(canteen, "Nutella Shake", "Rich Nutella milkshake", "249", "Shakes & Smoothies", "Shakes", true,
                                order++, null, null, false);
                save(canteen, "Mango Smoothie", "Fresh mango & yogurt blend", "179", "Shakes & Smoothies", "Smoothies",
                                true, order++, null, null, false);
                save(canteen, "Berry Blast Smoothie", "Mixed berries with banana", "199", "Shakes & Smoothies",
                                "Smoothies", true, order++, null, null, false);
                save(canteen, "Peanut Butter Shake", "Protein-packed PB shake", "229", "Shakes & Smoothies", "Shakes",
                                true, order++, null, null, false);

                // COFFEE & BEVERAGES
                log.info("📦 CB: Adding Coffee & Beverages...");
                save(canteen, "Espresso", "Single shot", "99", "Coffee & Beverages", "Coffee", true, order++, null,
                                null, false);
                save(canteen, "Cappuccino", "Frothy espresso with steamed milk", "149", "Coffee & Beverages", "Coffee",
                                true, order++, null, null, false);
                save(canteen, "Caramel Latte", "Caramel-infused latte", "179", "Coffee & Beverages", "Coffee", true,
                                order++, null, null, false);
                save(canteen, "Iced Americano", "Chilled double-shot americano", "149", "Coffee & Beverages", "Coffee",
                                true, order++, null, null, false);
                save(canteen, "Hot Chocolate", "Premium Belgian cocoa", "169", "Coffee & Beverages", "Hot", true,
                                order++, null, null, false);
                save(canteen, "Lemon Mint Cooler", "Refreshing lemon & mint soda", "129", "Coffee & Beverages", "Cold",
                                true, order++, null, null, false);

                log.info("✅ Campus Bites: Added {} menu items!", order - 1);
        }

        // ═══════════════════════════════════════════════════════════════
        // SPICE JUNCTION — North & South Indian Menu
        // ═══════════════════════════════════════════════════════════════
        private void seedSpiceJunctionMenu(Canteen canteen) {
                int order = 1;

                // THALI MEALS
                log.info("📦 SJ: Adding Thali Meals...");
                save(canteen, "North Indian Thali", "2 Sabzi, Dal, Rice, 4 Roti, Raita, Salad, Sweet", "349",
                                "Thali Meals", "North Indian", true, order++, "11:30", "15:30", false);
                save(canteen, "South Indian Thali", "Sambhar, Rasam, 2 Sabzi, Rice, Appam, Poriyal, Payasam", "329",
                                "Thali Meals", "South Indian", true, order++, "11:30", "15:30", false);
                save(canteen, "Rajasthani Thali", "Dal Baati Churma, Gatte Ki Sabzi, Rice, Papad, Churma", "399",
                                "Thali Meals", "Special", true, order++, "11:30", "15:30", false);
                save(canteen, "Mini Thali", "1 Sabzi, Dal, Rice, 2 Roti, Papad", "199", "Thali Meals", "Budget", true,
                                order++, "11:30", "15:30", false);

                // BIRYANIS
                log.info("📦 SJ: Adding Biryanis...");
                save(canteen, "Hyderabadi Veg Biryani", "Dum-cooked aromatic rice with vegetables", "299", "Biryanis",
                                "Veg", true, order++, null, null, false);
                save(canteen, "Paneer Biryani", "Paneer cubes in aromatic basmati rice", "349", "Biryanis", "Veg", true,
                                order++, null, null, false);
                save(canteen, "Mushroom Biryani", "Mushrooms layered with fragrant rice", "329", "Biryanis", "Veg",
                                true, order++, null, null, false);
                save(canteen, "Schezwan Fried Rice", "Spicy Indo-Chinese fried rice", "249", "Biryanis", "Indo-Chinese",
                                true, order++, null, null, false);
                save(canteen, "Veg Pulao", "Lightly spiced vegetable rice", "199", "Biryanis", "Light", true, order++,
                                null, null, false);

                // NORTH INDIAN CURRIES
                log.info("📦 SJ: Adding North Indian Curries...");
                save(canteen, "Paneer Butter Masala", "Rich tomato-cream gravy with paneer cubes", "299",
                                "North Indian Curries", "Paneer", true, order++, null, null, false);
                save(canteen, "Shahi Paneer", "Cashew & cream based royal paneer", "319", "North Indian Curries",
                                "Paneer", true, order++, null, null, false);
                save(canteen, "Kadai Paneer", "Paneer in spiced capsicum & onion gravy", "289", "North Indian Curries",
                                "Paneer", true, order++, null, null, false);
                save(canteen, "Palak Paneer", "Creamy spinach with paneer cubes", "279", "North Indian Curries",
                                "Paneer", true, order++, null, null, false);
                save(canteen, "Dal Makhani", "Slow-cooked black lentils in butter & cream", "249",
                                "North Indian Curries", "Dal", true, order++, null, null, false);
                save(canteen, "Dal Tadka", "Yellow dal tempered with ghee & spices", "199", "North Indian Curries",
                                "Dal", true, order++, null, null, false);
                save(canteen, "Chole Masala", "Spiced chickpea curry", "229", "North Indian Curries", "Dry", true,
                                order++, null, null, false);
                save(canteen, "Mix Veg Curry", "Seasonal vegetables in rich gravy", "249", "North Indian Curries",
                                "Veg", true, order++, null, null, false);
                save(canteen, "Malai Kofta", "Cottage cheese dumplings in creamy sauce", "299", "North Indian Curries",
                                "Premium", true, order++, null, null, false);

                // SOUTH INDIAN
                log.info("📦 SJ: Adding South Indian...");
                save(canteen, "Masala Dosa", "Crispy dosa with potato filling", "149", "South Indian", "Dosa", true,
                                order++, null, null, false);
                save(canteen, "Mysore Masala Dosa", "Spicy red chutney dosa with masala", "179", "South Indian", "Dosa",
                                true, order++, null, null, false);
                save(canteen, "Cheese Dosa", "Loaded with grated cheese", "189", "South Indian", "Dosa", true, order++,
                                null, null, false);
                save(canteen, "Rava Dosa", "Semolina-based crispy dosa", "169", "South Indian", "Dosa", true, order++,
                                null, null, false);
                save(canteen, "Idli (4 Pcs)", "Steamed rice cakes with sambhar & chutney", "129", "South Indian",
                                "Breakfast", true, order++, null, null, false);
                save(canteen, "Medu Vada (3 Pcs)", "Crispy urad dal fritters", "139", "South Indian", "Breakfast", true,
                                order++, null, null, false);
                save(canteen, "Pongal", "South Indian rice & lentil comfort dish", "149", "South Indian", "Breakfast",
                                true, order++, "08:00", "11:00", false);
                save(canteen, "Uttapam (Onion/Tomato)", "Thick dosa topped with veggies", "159", "South Indian",
                                "Breakfast", true, order++, null, null, false);

                // TANDOOR
                log.info("📦 SJ: Adding Tandoor & Breads...");
                saveWithVariants(canteen, "Tandoori Roti", "Fresh from tandoor", "Tandoor & Breads", "Breads", true,
                                order++,
                                new Variant("Plain", 40), new Variant("Butter", 55));
                saveWithVariants(canteen, "Naan", "Soft tandoor-baked bread", "Tandoor & Breads", "Breads", true,
                                order++,
                                new Variant("Plain", 50), new Variant("Butter", 70), new Variant("Garlic", 80));
                save(canteen, "Cheese Naan", "Stuffed with mozzarella", "99", "Tandoor & Breads", "Breads", true,
                                order++, null, null, false);
                save(canteen, "Laccha Paratha", "Layered flaky bread", "79", "Tandoor & Breads", "Breads", true,
                                order++, null, null, false);
                save(canteen, "Stuffed Kulcha", "Onion / Paneer / Aloo options", "89", "Tandoor & Breads", "Breads",
                                true, order++, null, null, false);

                // STREET FOOD
                log.info("📦 SJ: Adding Street Food...");
                save(canteen, "Pav Bhaji", "Mumbai-style buttery bhaji with pav", "179", "Street Food", "Mumbai", true,
                                order++, null, null, false);
                save(canteen, "Vada Pav", "Spicy potato fritter in pav bun", "49", "Street Food", "Mumbai", true,
                                order++, null, null, false);
                save(canteen, "Dabeli", "Sweet & spicy Kutchi dabeli", "59", "Street Food", "Gujarat", true, order++,
                                null, null, false);
                save(canteen, "Bhel Puri", "Puffed rice with tangy tamarind", "99", "Street Food", "Chaat", true,
                                order++, null, null, false);
                save(canteen, "Sev Puri (8 Pcs)", "Crispy puris topped with chutneys", "119", "Street Food", "Chaat",
                                true, order++, null, null, false);
                save(canteen, "Samosa (2 Pcs)", "Classic crispy potato samosa", "69", "Street Food", "Snack", true,
                                order++, null, null, false);

                // DESSERTS
                log.info("📦 SJ: Adding Desserts...");
                save(canteen, "Gulab Jamun (2 Pcs)", "Warm milk dumplings in sugar syrup", "99", "Desserts", "Indian",
                                true, order++, null, null, false);
                save(canteen, "Rasmalai (2 Pcs)", "Soft paneer balls in saffron milk", "129", "Desserts", "Indian",
                                true, order++, null, null, false);
                save(canteen, "Jalebi (4 Pcs)", "Crispy saffron jalebis", "89", "Desserts", "Indian", true, order++,
                                null, null, false);
                save(canteen, "Kheer", "Creamy rice pudding with nuts", "119", "Desserts", "Indian", true, order++,
                                null, null, false);

                log.info("✅ Spice Junction: Added {} menu items!", order - 1);
        }

        private void seedCampusBitesCoupons(Canteen canteen) {
                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("BITE30")
                                .title("Campus Special")
                                .description("30% OFF up to ₹80 on first Campus Bites order")
                                .color("#f59e0b")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("30"))
                                .maxDiscountCap(new BigDecimal("80"))
                                .minOrderValue(new BigDecimal("150"))
                                .usageLimitTotal(300)
                                .newCustomerOnly(true)
                                .isActive(true).isCustom(false)
                                .build());

                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("PIZZA99")
                                .title("Pizza Deal")
                                .description("Flat ₹99 off on any Pizza order above ₹300")
                                .color("#ef4444")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("99"))
                                .minOrderValue(new BigDecimal("300"))
                                .usageLimitTotal(150)
                                .isActive(true).isCustom(false)
                                .build());

                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("COMBO150")
                                .title("Combo Saver")
                                .description("₹150 off on orders above ₹600 — Burger + Shake combo!")
                                .color("#8b5cf6")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("150"))
                                .minOrderValue(new BigDecimal("600"))
                                .usageLimitTotal(100)
                                .isActive(true).isCustom(false)
                                .build());
        }

        private void seedSpiceJunctionCoupons(Canteen canteen) {
                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("SPICE25")
                                .title("Spice Starter")
                                .description("25% OFF up to ₹75 on your first Spice Junction order")
                                .color("#10b981")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("25"))
                                .maxDiscountCap(new BigDecimal("75"))
                                .minOrderValue(new BigDecimal("200"))
                                .usageLimitTotal(400)
                                .newCustomerOnly(true)
                                .isActive(true).isCustom(false)
                                .build());

                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("THALI50")
                                .title("Thali Tuesday")
                                .description("Flat ₹50 off on any Thali order")
                                .color("#f59e0b")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("50"))
                                .minOrderValue(new BigDecimal("250"))
                                .usageLimitTotal(200)
                                .isActive(true).isCustom(false)
                                .build());

                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("BIRYANI75")
                                .title("Biryani Bonanza")
                                .description("₹75 off on Biryani orders above ₹250")
                                .color("#e23744")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("75"))
                                .minOrderValue(new BigDecimal("250"))
                                .usageLimitTotal(150)
                                .isActive(true).isCustom(false)
                                .build());
        }

        private void saveCategory(Canteen canteen, String name) {
                if (!categoryRepository.existsByNameAndCanteenId(name, canteen.getId())) {
                        categoryRepository.save(com.charusat.canteen.model.Category.builder()
                                        .name(name)
                                        .canteen(canteen)
                                        .canteenId(canteen.getId())
                                        .isAvailable(true)
                                        .build());
                }
        }

        private void seedPatelPuffMenu(Canteen canteen) {
                int order = 1;

                saveCategory(canteen, "Classic Puffs");
                saveCategory(canteen, "Special Puffs");

                // Classic Puffs
                save(canteen, "Puff", "Classic crispy veg puff baked to golden perfection", "20", "Classic Puffs", "Regular Puff", true, order++, null, null, true);
                save(canteen, "Cheese Puff", "Loaded with melted processed cheese", "35", "Classic Puffs", "Cheese Puff", true, order++, null, null, true);
                save(canteen, "Double Cheese Puff", "Extra layer of rich gooey melted cheese", "45", "Classic Puffs", "Cheese Puff", true, order++, null, null, true);
                save(canteen, "Sev Onion Puff", "Crispy puff filled with spiced onions and crunchy sev", "30", "Classic Puffs", "Crispy Puff", true, order++, null, null, true);
                save(canteen, "Sev Onion Cheese Puff", "Spiced onions, crunchy sev and melted cheese", "45", "Classic Puffs", "Cheese Puff", true, order++, null, null, true);
                save(canteen, "Mayonnaise Puff", "Stuffed with rich creamy garlic mayonnaise blend", "30", "Classic Puffs", "Creamy Puff", true, order++, null, null, true);
                save(canteen, "Garlic Puff", "Infused with aromatic roasted garlic butter", "30", "Classic Puffs", "Garlic Puff", true, order++, null, null, true);
                save(canteen, "Garlic Sev Puff", "Roasted garlic masala with crunchy sev", "35", "Classic Puffs", "Crispy Puff", true, order++, null, null, true);
                save(canteen, "Garlic Sev Cheese Puff", "Garlic butter, sev, and melted cheese", "45", "Classic Puffs", "Cheese Puff", true, order++, null, null, true);
                save(canteen, "Malai Puff", "Rich malai cream filling with subtle spices", "40", "Classic Puffs", "Creamy Puff", true, order++, null, null, true);
                save(canteen, "Malai Cheese Puff", "Creamy malai combined with melted cheese", "50", "Classic Puffs", "Cheese Puff", true, order++, null, null, true);

                // Special Puffs
                save(canteen, "Paneer Makhani Puff", "Rich Punjabi paneer makhani gravy inside a flaky crust", "70", "Special Puffs", "Paneer Special", true, order++, null, null, true);
                save(canteen, "Tandoori Paneer Puff", "Smoky tandoori paneer cubes with spicy tandoori mayo", "70", "Special Puffs", "Paneer Special", true, order++, null, null, true);
                save(canteen, "Pizza Puff", "Stuffed with pizza sauce, mozzarella cheese, corn & capsicum", "80", "Special Puffs", "Italian Special", true, order++, null, null, true);
        }

        private void seedGoHungerMenu(Canteen canteen) {
                int order = 1;

                saveCategory(canteen, "Sandwich");
                saveCategory(canteen, "Burger");
                saveCategory(canteen, "Frankie");
                saveCategory(canteen, "Fries & Nachos");
                saveCategory(canteen, "Hot Drinks");
                saveCategory(canteen, "Mocktail");
                saveCategory(canteen, "Shake");
                saveCategory(canteen, "Pizza Menu");
                saveCategory(canteen, "Garlic Bread & Calzone");

                // Sandwich
                save(canteen, "Bombay Sandwich", "Classic Mumbai street style veg sandwich with green chutney", "70", "Sandwich", "Veg Sandwich", true, order++, null, null, false);
                save(canteen, "Cheese Chutney Sandwich", "Loaded with grated cheese and fresh mint coriander chutney", "80", "Sandwich", "Cheese Sandwich", true, order++, null, null, false);
                save(canteen, "Hub Roasted Sandwich", "Special slow roasted vegetable and cheese grilled sandwich", "130", "Sandwich", "Grilled Sandwich", true, order++, null, null, false);
                save(canteen, "Cheese Pizza Sandwich", "Pizza sauce, bell peppers, sweet corn, and mozzarella cheese", "150", "Sandwich", "Pizza Sandwich", true, order++, null, null, false);
                save(canteen, "Tandoori Paneer Sandwich", "Marinated paneer tikka cubes with spicy tandoori spread", "160", "Sandwich", "Paneer Sandwich", true, order++, null, null, false);
                save(canteen, "Veg Club Sandwich", "Triple layer club sandwich with fresh veggies, cheese & mayo", "170", "Sandwich", "Club Sandwich", true, order++, null, null, false);

                // Burger
                save(canteen, "Surti Famous Time Pass", "Local favorite crispy veggie slider burger", "50", "Burger", "Regular Burger", true, order++, null, null, false);
                save(canteen, "Aalu Tikki Burger", "Crispy potato tikki with spicy mayo & onion rings", "60", "Burger", "Veg Burger", true, order++, null, null, false);
                save(canteen, "Cheese Pizza Burger", "Juicy veg patty topped with pizza sauce & melted cheese", "80", "Burger", "Cheese Burger", true, order++, null, null, false);
                save(canteen, "Mexican Burger", "Spiced Mexican patty with salsa spread & jalapeños", "90", "Burger", "Mexican Burger", true, order++, null, null, false);
                save(canteen, "Peri Peri Paneer Burger", "Grilled paneer patty tossed in fiery peri-peri seasoning", "100", "Burger", "Paneer Burger", true, order++, null, null, false);

                // Frankie
                save(canteen, "Veg Cheese Frankie", "Soft roti wrap filled with spiced potato & melted cheese", "80", "Frankie", "Veg Frankie", true, order++, null, null, false);
                save(canteen, "Aalu Tikki Frankie", "Golden crispy potato tikki wrap with onion & chaat masala", "100", "Frankie", "Tikky Frankie", true, order++, null, null, false);
                save(canteen, "Mexican Frankie", "Mexican bean patty wrap with salsa & Chipotle mayo", "120", "Frankie", "Mexican Frankie", true, order++, null, null, false);
                save(canteen, "Tandoori Paneer Frankie", "Spicy tandoori paneer tikka wrap with mint chutney", "130", "Frankie", "Paneer Frankie", true, order++, null, null, false);

                // Fries & Nachos
                save(canteen, "Salted Fries", "Classic golden crispy French fries lightly salted", "60", "Fries & Nachos", "French Fries", true, order++, null, null, false);
                save(canteen, "Peri Peri Fries", "Crispy fries tossed in hot spicy Peri Peri seasoning", "80", "Fries & Nachos", "Spicy Fries", true, order++, null, null, false);
                save(canteen, "Cheese Fries", "Golden fries smothered in rich warm cheese sauce", "100", "Fries & Nachos", "Cheese Fries", true, order++, null, null, false);
                save(canteen, "Cheese Peri Peri Spicy", "Peri-peri seasoned fries topped with melted cheese sauce", "110", "Fries & Nachos", "Spicy Cheese", true, order++, null, null, false);
                save(canteen, "Mexican Nacho", "Crispy tortilla chips topped with cheese sauce, salsa & jalapeños", "110", "Fries & Nachos", "Nachos", true, order++, null, null, false);

                // Hot Drinks
                save(canteen, "Hot Coffee", "Freshly brewed hot milk coffee", "30", "Hot Drinks", "Coffee", true, order++, null, null, false);
                save(canteen, "Hot Chocolate", "Rich creamy hot chocolate drink", "50", "Hot Drinks", "Chocolate", true, order++, null, null, false);

                // Mocktail
                save(canteen, "Mint Mojito", "Classic refreshing lime, mint and soda mocktail", "70", "Mocktail", "Mojito", true, order++, null, null, false);
                save(canteen, "Water Melon", "Chilled watermelon refresher with mint", "90", "Mocktail", "Fruit Cooler", true, order++, null, null, false);
                save(canteen, "Strawberry Mint", "Fresh strawberry puree blended with mint and soda", "90", "Mocktail", "Fruit Cooler", true, order++, null, null, false);
                save(canteen, "Guava Punch", "Spiced guava nectar with a hint of chili & lemon", "90", "Mocktail", "Fruit Cooler", true, order++, null, null, false);
                save(canteen, "Love in the Sky", "Signature layered blue curacao and berry mocktail", "110", "Mocktail", "Special Cooler", true, order++, null, null, false);
                save(canteen, "Special Cloud Heaven", "Exotic tropical fruit blend topped with soda foam", "150", "Mocktail", "Special Cooler", true, order++, null, null, false);
                save(canteen, "Red Bull Mojito", "Energizing Red Bull mocktail infused with fresh mint & lime", "180", "Mocktail", "Energy Drink", true, order++, null, null, false);

                // Shake
                save(canteen, "Cold Coffee", "Chilled thick cold coffee blend", "100", "Shake", "Coffee Shake", true, order++, null, null, false);
                save(canteen, "Oreo Shake", "Rich chocolate shake blended with crunchy Oreo cookies", "120", "Shake", "Chocolate Shake", true, order++, null, null, false);
                save(canteen, "Cold Coco", "Traditional thick Surat style chilled chocolate beverage", "120", "Shake", "Chocolate Shake", true, order++, null, null, false);
                save(canteen, "Chocolate Shake", "Classic thick Belgian chocolate milkshake", "120", "Shake", "Chocolate Shake", true, order++, null, null, false);
                save(canteen, "Strawberry Shake", "Creamy strawberry milkshake made with real fruit syrup", "110", "Shake", "Fruit Shake", true, order++, null, null, false);

                // Pizza Menu (with 8 inch and 10 inch variants)
                saveWithVariants(canteen, "Margarita Pizza", "Classic Italian pizza with rich tomato sauce & mozzarella cheese", "Pizza Menu", "Veg Pizza", true, order++,
                                new Variant("8 inch", 120), new Variant("10 inch", 220));
                saveWithVariants(canteen, "Red Paprika Pizza", "Topped with red paprika, sweet corn & mozzarella cheese", "Pizza Menu", "Spicy Pizza", true, order++,
                                new Variant("8 inch", 130), new Variant("10 inch", 230));
                saveWithVariants(canteen, "Gourmet Pizza", "Loaded with onions, capsicum, tomatoes, mushrooms & olives", "Pizza Menu", "Special Pizza", true, order++,
                                new Variant("8 inch", 150), new Variant("10 inch", 260));
                saveWithVariants(canteen, "Paneer Makhani Pizza", "Spiced paneer tikka cubes in rich makhani gravy sauce", "Pizza Menu", "Paneer Pizza", true, order++,
                                new Variant("8 inch", 160), new Variant("10 inch", 270));
                saveWithVariants(canteen, "Pesto Paneer Pizza", "Fresh basil pesto sauce topped with paneer cubes & cheese", "Pizza Menu", "Special Pizza", true, order++,
                                new Variant("8 inch", 160), new Variant("10 inch", 280));
                saveWithVariants(canteen, "Mushrooms Pizza", "Sliced fresh mushrooms, herbs and melted mozzarella", "Pizza Menu", "Veg Pizza", true, order++,
                                new Variant("8 inch", 160), new Variant("10 inch", 280));
                saveWithVariants(canteen, "Five Cheese Pizza", "Ultimate blend of Mozzarella, Cheddar, Processed, Gouda & Cream Cheese", "Pizza Menu", "Cheese Pizza", true, order++,
                                new Variant("8 inch", 170), new Variant("10 inch", 300));

                // Garlic Bread & Calzone
                save(canteen, "Stick Garlic Bread", "Crispy freshly baked garlic breadsticks served with dip", "150", "Garlic Bread & Calzone", "Sides", true, order++, null, null, false);
                save(canteen, "Stuffed Garlic Bread", "Garlic bread stuffed with melted mozzarella, sweet corn & jalapeños", "170", "Garlic Bread & Calzone", "Sides", true, order++, null, null, false);
                save(canteen, "Classic Calzone", "Folded Italian pizza pocket stuffed with veg filling & cheese", "160", "Garlic Bread & Calzone", "Sides", true, order++, null, null, false);
        }

        private void seedPatelPuffCoupons(Canteen canteen) {
                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("PUFF20")
                                .title("Special Puff Discount")
                                .description("Flat ₹20 OFF on Special Paneer & Pizza Puffs")
                                .color("#f59e0b")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("20"))
                                .minOrderValue(new BigDecimal("100"))
                                .usageLimitTotal(300)
                                .isActive(true).isCustom(false)
                                .build());
        }

        private void seedGoHungerCoupons(Canteen canteen) {
                couponRepository.save(Coupon.builder()
                                .canteen(canteen).canteenId(canteen.getId())
                                .couponCode("GOHUNGER50")
                                .title("Go Hunger Feast")
                                .description("50% OFF up to ₹100 on Pizza & Combo Orders")
                                .color("#e23744")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("50"))
                                .maxDiscountCap(new BigDecimal("100"))
                                .minOrderValue(new BigDecimal("250"))
                                .usageLimitTotal(500)
                                .isActive(true).isCustom(false)
                                .build());
        }

        record Variant(String name, double price) {
        }

        private void saveWithVariants(Canteen canteen, String name, String desc, String cat, String subCat,
                        boolean isVeg, int order, Variant... variants) {

                // Base price is first variant
                BigDecimal basePrice = BigDecimal.valueOf(variants.length > 0 ? variants[0].price : 0);

                MenuItem item = MenuItem.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .name(name)
                                .description(desc != null ? desc : "")
                                .price(basePrice)
                                .category(cat)
                                .subCategory(subCat)
                                .isVeg(isVeg)
                                .displayOrder(order)
                                .preparationTime(15)
                                .isAvailable(true)
                                .hasVariants(true)
                                .hasAddons(false)
                                .build();

                MenuItem savedItem = menuItemRepository.save(item); // Save item first to get ID

                List<MenuItemVariant> variantEntities = new ArrayList<>();
                for (Variant v : variants) {
                        MenuItemVariant variant = new MenuItemVariant();
                        variant.setName(v.name);
                        variant.setPrice(BigDecimal.valueOf(v.price));
                        variant.setMenuItem(savedItem); // Link to the saved item
                        variant.setMenuItemId(savedItem.getId()); // Set ID for JDBC
                        variantEntities.add(variant);
                }
                menuItemVariantRepository.saveAll(variantEntities); // Save variants separately
        }

        private void save(Canteen canteen, String name, String desc, String price,
                        String cat, String subCat, boolean isVeg, int order,
                        String availFrom, String availTo, boolean jainAvailable) {
                MenuItem item = MenuItem.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .name(name)
                                .description(desc != null ? desc : "")
                                .price(new BigDecimal(price))
                                .category(cat)
                                .subCategory(subCat)
                                .isVeg(isVeg)
                                .displayOrder(order)
                                .preparationTime(15)
                                .isRecommended(order <= 10)
                                .isAvailable(true)
                                .availableFrom(availFrom)
                                .availableTo(availTo)
                                .hasVariants(false)
                                .hasAddons(false)
                                .build();

                // Add Jain tag if applicable
                if (jainAvailable) {
                        item.setTags(List.of("Jain Available"));
                }

                menuItemRepository.save(item);
        }

        private void seedCoupons(Canteen canteen) {
                // GENERAL PERCENTAGE DISCOUNT
                couponRepository.save(Coupon.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .couponCode("WELCOME50")
                                .title("First Order Special")
                                .description("50% OFF up to ₹100 on your first order")
                                .color("#e23744")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.PERCENTAGE)
                                .discountValue(new BigDecimal("50"))
                                .maxDiscountCap(new BigDecimal("100"))
                                .minOrderValue(new BigDecimal("200"))
                                .usageLimitTotal(500)
                                .newCustomerOnly(true)
                                .isActive(true)
                                .isCustom(false)
                                .build());

                // FLAT DISCOUNT
                couponRepository.save(Coupon.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .couponCode("THALI100")
                                .title("Thali Lover")
                                .description("Flat ₹100 off on any Thali")
                                .color("#10b981")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("100"))
                                .minOrderValue(new BigDecimal("400"))
                                .usageLimitTotal(200)
                                .isActive(true)
                                .isCustom(false)
                                .build());

                // BIG ORDER
                couponRepository.save(Coupon.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .couponCode("FEAST200")
                                .title("Family Feast")
                                .description("Flat ₹200 off on orders above ₹1000")
                                .color("#8b5cf6")
                                .couponType(Coupon.CouponType.GENERAL)
                                .discountType(Coupon.DiscountType.FLAT)
                                .discountValue(new BigDecimal("200"))
                                .minOrderValue(new BigDecimal("1000"))
                                .usageLimitTotal(100)
                                .isActive(true)
                                .isCustom(false)
                                .build());
        }

        private void seedOrders(Canteen canteen) {
                User customer = userRepository.findByEmail("kush@charusat.edu.in").orElseThrow();
                List<MenuItem> items = menuItemRepository.findAll();

                if (items.isEmpty())
                        return;

                // 1. Pending Order
                createOrder(canteen, customer, "ORD-1001", Order.OrderStatus.PENDING, new BigDecimal("450.00"),
                                LocalDateTime.now().minusMinutes(5), items.get(0), 1, items.get(1), 2);

                // 2. Preparing Order
                createOrder(canteen, customer, "ORD-1002", Order.OrderStatus.PREPARING, new BigDecimal("350.00"),
                                LocalDateTime.now().minusMinutes(15), items.get(2), 1);

                // 3. Ready Order
                createOrder(canteen, customer, "ORD-1003", Order.OrderStatus.READY, new BigDecimal("120.00"),
                                LocalDateTime.now().minusMinutes(25), items.get(5), 2);

                // 4. Completed Order
                createOrder(canteen, customer, "ORD-0990", Order.OrderStatus.COMPLETED, new BigDecimal("550.00"),
                                LocalDateTime.now().minusHours(2), items.get(3), 1);
        }

        private void createOrder(Canteen canteen, User customer, String orderNo, Order.OrderStatus status,
                        BigDecimal total, LocalDateTime time, Object... itemArgs) {

                Order order = Order.builder()
                                .canteen(canteen)
                                .canteenId(canteen.getId())
                                .customer(customer)
                                .customerId(customer.getId())
                                .orderNumber(orderNo)
                                .status(status)
                                .totalAmount(total)
                                .paymentMethod("UPI")
                                .paymentStatus(Order.PaymentStatus.PAID)
                                .createdAt(time)
                                .updatedAt(time)
                                .build();

                List<OrderItem> orderItems = new ArrayList<>();

                for (int i = 0; i < itemArgs.length; i += 2) {
                        MenuItem mi = (MenuItem) itemArgs[i];
                        int qty = (Integer) itemArgs[i + 1];

                        OrderItem oi = OrderItem.builder()
                                        .order(order)
                                        .menuItem(mi)
                                        .menuItemId(mi.getId())
                                        .quantity(qty)
                                        .unitPrice(mi.getPrice())
                                        .totalPrice(mi.getPrice().multiply(BigDecimal.valueOf(qty)))
                                        .build();
                        orderItems.add(oi);
                }

                order.setItems(orderItems);
                orderRepository.save(order);

                // Save order items separately (no JPA cascade in JDBC)
                for (OrderItem oi : orderItems) {
                        oi.setOrderId(order.getId());
                        orderItemRepository.save(oi);
                }
        }
}
