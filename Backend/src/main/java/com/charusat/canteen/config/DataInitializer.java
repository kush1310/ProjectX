package com.charusat.canteen.config;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.MenuItemRepository;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data Initializer - Seeds database with sample data for testing
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final CanteenRepository canteenRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        // Always reset test user password to ensure login works
        userRepository.findByEmail("d25ce145@charusat.edu.in").ifPresent(user -> {
            user.setPassword(passwordEncoder.encode("kush"));
            userRepository.save(user);
            log.info("Forced password reset for test user: d25ce145@charusat.edu.in");
        });

        // Only seed if database is empty
        if (userRepository.count() > 0) {
            log.info("Database already has data, skipping initialization");
            return;
        }
        
        log.info("Initializing database with sample data...");
        
        // Create test user
        User testUser = User.builder()
                .email("d25ce145@charusat.edu.in")
                .password(passwordEncoder.encode("kush"))
                .fullName("Kush Shah")
                .mobile("9999999999")
                .role(User.UserRole.USER)
                .build();
        userRepository.save(testUser);
        
        // Create admin user
        User admin = User.builder()
                .email("admin@charusat.edu.in")
                .password(passwordEncoder.encode("Admin@1234"))
                .fullName("Admin User")
                .mobile("8888888888")
                .role(User.UserRole.ADMIN)
                .build();
        userRepository.save(admin);
        
        // Create canteen owner
        User owner = User.builder()
                .email("owner@charusat.edu.in")
                .password(passwordEncoder.encode("Owner@1234"))
                .fullName("Canteen Owner")
                .mobile("7777777777")
                .role(User.UserRole.CANTEEN_OWNER)
                .build();
        userRepository.save(owner);
        
        log.info("Created {} users", 3);
        
        // Create canteens
        Canteen mainCanteen = Canteen.builder()
                .name("CSPIT Main Canteen")
                .location("CSPIT Building, Ground Floor")
                .description("Main food court serving a variety of cuisines")
                .isOpen(true)
                .owner(owner)
                .openingTime("08:00")
                .closingTime("20:00")
                .build();
        canteenRepository.save(mainCanteen);
        
        Canteen coffeeShop = Canteen.builder()
                .name("Coffee Corner")
                .location("Library Building")
                .description("Premium coffee and snacks")
                .isOpen(true)
                .owner(owner)
                .openingTime("09:00")
                .closingTime("18:00")
                .build();
        canteenRepository.save(coffeeShop);
        
        log.info("Created {} canteens", 2);
        
        // Create menu items for Main Canteen
        createMenuItem(mainCanteen, "Masala Dosa", "Crispy dosa with potato filling", new BigDecimal("60"), "South Indian", true, 10, 1);
        createMenuItem(mainCanteen, "Paneer Butter Masala", "Creamy paneer curry", new BigDecimal("120"), "North Indian", true, 15, 2);
        createMenuItem(mainCanteen, "Veg Biryani", "Aromatic basmati rice with vegetables", new BigDecimal("100"), "Rice", true, 20, 2);
        createMenuItem(mainCanteen, "Chicken Biryani", "Hyderabadi style chicken biryani", new BigDecimal("150"), "Rice", false, 25, 3);
        createMenuItem(mainCanteen, "Samosa (2 pcs)", "Crispy potato filled pastry", new BigDecimal("30"), "Snacks", true, 5, 1);
        createMenuItem(mainCanteen, "Vada Pav", "Mumbai style spicy potato burger", new BigDecimal("25"), "Snacks", true, 5, 2);
        createMenuItem(mainCanteen, "Thali (Veg)", "Complete meal with roti, sabzi, dal, rice", new BigDecimal("90"), "Thali", true, 15, 1);
        createMenuItem(mainCanteen, "Pav Bhaji", "Spicy mixed vegetable curry with butter pav", new BigDecimal("70"), "Snacks", true, 12, 2);
        createMenuItem(mainCanteen, "Chole Bhature", "Spicy chickpeas with fried bread", new BigDecimal("80"), "North Indian", true, 15, 2);
        createMenuItem(mainCanteen, "Pasta (White Sauce)", "Italian pasta in creamy sauce", new BigDecimal("90"), "Italian", true, 15, 0);
        
        // Create menu items for Coffee Shop
        createMenuItem(coffeeShop, "Cappuccino", "Italian coffee with steamed milk foam", new BigDecimal("80"), "Coffee", true, 5, 0);
        createMenuItem(coffeeShop, "Cold Coffee", "Chilled coffee with ice cream", new BigDecimal("70"), "Coffee", true, 5, 0);
        createMenuItem(coffeeShop, "Masala Chai", "Traditional Indian spiced tea", new BigDecimal("30"), "Tea", true, 5, 0);
        createMenuItem(coffeeShop, "Sandwich (Veg)", "Grilled vegetable sandwich", new BigDecimal("50"), "Snacks", true, 8, 0);
        createMenuItem(coffeeShop, "Maggi", "Instant noodles with vegetables", new BigDecimal("40"), "Snacks", true, 10, 1);
        createMenuItem(coffeeShop, "Brownie", "Chocolate brownie with walnuts", new BigDecimal("60"), "Dessert", true, 2, 0);
        
        log.info("Created {} menu items", 16);
        log.info("Database initialization complete!");
    }
    
    private void createMenuItem(Canteen canteen, String name, String description, BigDecimal price, 
                                 String category, boolean isVeg, int prepTime, int spicyLevel) {
        MenuItem item = MenuItem.builder()
                .canteen(canteen)
                .name(name)
                .description(description)
                .price(price)
                .category(category)
                .isVeg(isVeg)
                .preparationTime(prepTime)
                .spicyLevel(spicyLevel)
                .isAvailable(true)
                .build();
        menuItemRepository.save(item);
    }
}
