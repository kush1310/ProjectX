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
        private final OrderRepository orderRepository;
        private final OrderItemRepository orderItemRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                log.info("🚀 Starting Data Initialization...");

                // 1. Create Users if none exist
                if (userRepository.count() == 0) {
                        log.info("👤 Seeding Users...");
                        createUser("admin@charusat.edu.in", "Admin User", User.UserRole.ADMIN);
                        createUser("owner@charusat.edu.in", "Canteen Owner", User.UserRole.CANTEEN_OWNER);
                        createUser("kush@charusat.edu.in", "Kush Shah", User.UserRole.USER);
                }

                // 2. Create Canteen if none exist
                Canteen canteen;
                if (canteenRepository.count() == 0) {
                        log.info("🏪 Seeding Canteen...");
                        User owner = userRepository.findByEmail("owner@charusat.edu.in").orElse(null);
                        canteen = Canteen.builder()
                                        .name("Honest Restaurant")
                                        .location("CSPIT Building, Ground Floor")
                                        .description("Authentic Gujarati & Multi-cuisine Restaurant")
                                        .isOpen(true)
                                        .owner(owner)
                                        .ownerId(owner != null ? owner.getId() : null)
                                        .openingTime("08:00")
                                        .closingTime("22:00")
                                        .accountHolderName("Charusat Canteen Services")
                                        .bankName("HDFC Bank")
                                        .accountNumber("HDFC0001234567")
                                        .ifscCode("HDFC0001234")
                                        .fssaiNumber("12345678901234")
                                        .build();
                        canteen = canteenRepository.save(canteen);
                } else {
                        canteen = canteenRepository.findAll().get(0);
                }

                // 3. Seed Complete Menu from Reference Images
                if (menuItemRepository.count() == 0) {
                        log.info("🍽️ Seeding 70+ Menu Items from Reference...");
                        seedCompleteMenu(canteen);
                }

                // 4. Create Coupons if empty
                if (couponRepository.count() == 0) {
                        log.info("🎟️ Seeding Coupons...");
                        seedCoupons(canteen);
                }

                // 5. Seed Orders (Trial Data)
                if (orderRepository.count() == 0) {
                        log.info("🛍️ Seeding Trial Orders...");
                        seedOrders(canteen);
                }

                log.info("✅ Database seeding complete!");
        }

        private User createUser(String email, String name, User.UserRole role) {
                return userRepository.save(User.builder()
                                .email(email)
                                .password(passwordEncoder.encode("CyberKush"))
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
