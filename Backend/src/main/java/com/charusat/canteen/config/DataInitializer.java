package com.charusat.canteen.config;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.*;
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
 * Data Initializer - Seeds 3 canteens with comprehensive menus, variants, addons, coupons, orders
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final CanteenRepository canteenRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuItemVariantRepository menuItemVariantRepository;
    private final AddonGroupRepository addonGroupRepository;
    private final AddonOptionRepository addonOptionRepository;
    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        log.info("Starting Data Initialization...");

        // 1. Create Users
        if (userRepository.count() == 0) {
            log.info("Seeding Users...");
            createUser("admin@charusat.edu.in", "Admin User", User.UserRole.ADMIN);
            createUser("honest.owner@charusat.edu.in", "Rajesh Patel", User.UserRole.CANTEEN_OWNER);
            createUser("madras.owner@charusat.edu.in", "Suresh Iyer", User.UserRole.CANTEEN_OWNER);
            createUser("freshbites.owner@charusat.edu.in", "Amit Sharma", User.UserRole.CANTEEN_OWNER);
            createUser("kush@charusat.edu.in", "Kush Shah", User.UserRole.USER);
            createUser("d25ce145@charusat.edu.in", "Kush Shah Jr", User.UserRole.USER);
            // Legacy owner alias
            createUser("owner@charusat.edu.in", "Canteen Owner", User.UserRole.CANTEEN_OWNER);
        }
        
        if (canteenRepository.count() == 0) {
            log.info("Seeding 3 Canteens with full menus...");
            
            // ======== CANTEEN 1: Honest Restaurant ========
            Canteen honest = createCanteen("honest.owner@charusat.edu.in",
                "Honest Restaurant", "CSPIT Building, Ground Floor",
                "Authentic Gujarati & Multi-cuisine Restaurant serving wholesome meals since 2010",
                "08:00", "22:00", 4.4);
            seedHonestMenu(honest);
            seedCoupons(honest, "HONEST");
            
            // ======== CANTEEN 2: Madras Cafe ========
            Canteen madras = createCanteen("madras.owner@charusat.edu.in",
                "Madras Cafe", "DEPSTAR Canteen Block",
                "South Indian specialties with authentic filter coffee & crispy dosas",
                "07:30", "21:00", 4.6);
            seedMadrasMenu(madras);
            seedCoupons(madras, "MADRAS");
            
            // ======== CANTEEN 3: Fresh Bites ========
            Canteen freshBites = createCanteen("freshbites.owner@charusat.edu.in",
                "Fresh Bites", "APEX Food Court",
                "Modern fast food - burgers, wraps, shakes & fresh juices for the campus crowd",
                "09:00", "22:30", 4.2);
            seedFreshBitesMenu(freshBites);
            seedCoupons(freshBites, "FRESH");
        }
        
        // Seed Orders
        if (orderRepository.count() == 0) {
            log.info("Seeding Trial Orders...");
            List<Canteen> canteens = canteenRepository.findAll();
            for (Canteen c : canteens) {
                seedOrders(c);
            }
        }
        
        log.info("Database seeding complete! {} canteens, {} menu items, {} coupons",
            canteenRepository.count(), menuItemRepository.count(), couponRepository.count());
    }

    // ===== USER & CANTEEN CREATION =====

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
    
    private Canteen createCanteen(String ownerEmail, String name, String location, String desc,
                                   String openTime, String closeTime, double rating) {
        User owner = userRepository.findByEmail(ownerEmail).orElse(null);
        Canteen canteen = Canteen.builder()
                .name(name)
                .location(location)
                .description(desc)
                .isOpen(true)
                .ownerId(owner != null ? owner.getId() : null)
                .openingTime(openTime)
                .closingTime(closeTime)
                .accountHolderName("Charusat Canteen Services")
                .bankName("HDFC Bank")
                .accountNumber("HDFC000" + name.hashCode())
                .ifscCode("HDFC0001234")
                .fssaiNumber("12345678901234")
                .build();
        return canteenRepository.save(canteen);
    }

    // ===== HONEST RESTAURANT MENU (Multi-cuisine) =====
    
    private void seedHonestMenu(Canteen c) {
        int ord = 1;
        
        // --- BREAKFAST (08:00-11:00) ---
        saveItem(c, "Poha", "Light flattened rice with peanuts & curry leaves", "40", "Breakfast", "Light Bites", true, ord++, "08:00", "11:00", true, 1);
        saveItem(c, "Upma", "Semolina cooked with vegetables & mustard tempering", "45", "Breakfast", "Light Bites", true, ord++, "08:00", "11:00", true, 1);
        saveItem(c, "Medu Vada", "Crispy urad dal fritters served with chutney & sambar", "50", "Breakfast", "Light Bites", true, ord++, "08:00", "11:00", false, 1);
        saveItem(c, "Aloo Paratha", "Stuffed wheat bread with spiced potato filling", "60", "Breakfast", "Parathas", true, ord++, "08:00", "11:00", false, 2);
        
        // --- VEG STARTERS ---
        MenuItem paneerTikka = saveWithVariantsAndAddons(c, "Paneer Tikka", "Marinated cottage cheese grilled in tandoor", "Starters", "Veg Starters", true, ord++, 2,
            new V("Half", 160), new V("Full", 280));
        addAddonGroup(paneerTikka, "Extras", 0, 3,
            new AO("Extra Chutney", 20), new AO("Butter Naan", 40), new AO("Rumali Roti", 30));
        
        saveWithVariants(c, "Veg Manchurian", "Crispy veg balls in spicy Manchurian sauce", "Starters", "Veg Starters", true, ord++,
            new V("Dry", 140), new V("Gravy", 160));
        
        saveItem(c, "Hara Bhara Kebab", "Spinach & pea patties with mint chutney", "150", "Starters", "Veg Starters", true, ord++, null, null, true, 1);
        saveItem(c, "Crispy Corn", "Batter-fried corn kernels with spicy seasoning", "130", "Starters", "Veg Starters", true, ord++, null, null, false, 2);
        saveItem(c, "Spring Roll", "Crispy rolls stuffed with vegetables", "120", "Starters", "Veg Starters", true, ord++, null, null, true, 1);
        
        // --- NON-VEG STARTERS ---
        MenuItem chickenTikka = saveWithVariantsAndAddons(c, "Chicken Tikka", "Tandoori marinated chicken breast pieces", "Starters", "Non-Veg Starters", false, ord++, 3,
            new V("Half", 180), new V("Full", 320));
        addAddonGroup(chickenTikka, "Extra Dips", 0, 2,
            new AO("Mint Mayo", 25), new AO("Schezwan Sauce", 20), new AO("Garlic Aioli", 30));
        
        saveItem(c, "Fish Fingers", "Crispy battered fish fillets with tartar sauce", "220", "Starters", "Non-Veg Starters", false, ord++, null, null, false, 2);
        saveItem(c, "Chicken Lollipop", "Spicy deep-fried drumsticks", "200", "Starters", "Non-Veg Starters", false, ord++, null, null, false, 3);
        
        // --- MAIN COURSE: GUJARATI THALI ---
        MenuItem thali = saveWithVariantsAndAddons(c, "Gujarati Thali", "Complete meal with dal, sabzi, roti, rice, papad, sweet", "Main Course", "Gujarati Thali", true, ord++, 1,
            new V("Regular", 250), new V("Special", 350), new V("Royal", 450));
        addAddonGroup(thali, "Extra Items", 0, 4,
            new AO("Extra Roti (2)", 30), new AO("Extra Rice", 40), new AO("Extra Dal", 35), new AO("Buttermilk", 25));
        addAddonGroup(thali, "Sweet Choice", 1, 1,
            new AO("Gulab Jamun", 0), new AO("Jalebi", 0), new AO("Shrikhand", 20));
        
        saveItem(c, "Dal Fry", "Yellow lentils tempered with cumin & garlic", "120", "Main Course", "Dal", true, ord++, null, null, true, 1);
        saveItem(c, "Dal Makhani", "Black lentils slow-cooked with cream & butter", "160", "Main Course", "Dal", true, ord++, null, null, false, 1);
        
        // --- PANEER CURRIES ---
        saveItem(c, "Paneer Butter Masala", "Rich tomato-cream curry with cottage cheese", "200", "Main Course", "Paneer", true, ord++, null, null, false, 2);
        saveItem(c, "Kadai Paneer", "Paneer in spiced bell pepper & onion gravy", "190", "Main Course", "Paneer", true, ord++, null, null, false, 2);
        saveItem(c, "Palak Paneer", "Cottage cheese in creamy spinach sauce", "180", "Main Course", "Paneer", true, ord++, null, null, true, 1);
        saveItem(c, "Shahi Paneer", "Paneer in rich cashew & cream gravy", "210", "Main Course", "Paneer", true, ord++, null, null, false, 1);

        // --- BREADS ---
        saveItem(c, "Butter Naan", "Soft tandoor bread brushed with butter", "40", "Main Course", "Breads", true, ord++, null, null, true, 0);
        saveItem(c, "Garlic Naan", "Tandoor bread with garlic & coriander", "50", "Main Course", "Breads", true, ord++, null, null, true, 0);
        saveItem(c, "Laccha Paratha", "Layered flaky whole wheat bread", "45", "Main Course", "Breads", true, ord++, null, null, true, 0);
        saveItem(c, "Tandoori Roti", "Whole wheat bread baked in tandoor", "30", "Main Course", "Breads", true, ord++, null, null, true, 0);
        
        // --- RICE ---
        saveWithVariants(c, "Veg Biryani", "Aromatic basmati rice with mixed vegetables & saffron", "Main Course", "Rice", true, ord++,
            new V("Half", 130), new V("Full", 220));
        saveWithVariants(c, "Chicken Biryani", "Hyderabadi style dum biryani with tender chicken", "Main Course", "Rice", false, ord++,
            new V("Half", 160), new V("Full", 280));
        saveItem(c, "Jeera Rice", "Cumin-tempered basmati rice", "100", "Main Course", "Rice", true, ord++, null, null, true, 0);
        
        // --- CHINESE ---
        saveWithVariants(c, "Fried Rice", "Wok-tossed rice with vegetables", "Chinese", "Rice", true, ord++,
            new V("Veg", 120), new V("Egg", 140), new V("Chicken", 160));
        saveWithVariants(c, "Hakka Noodles", "Stir-fried noodles with crunchy vegetables", "Chinese", "Noodles", true, ord++,
            new V("Veg", 120), new V("Egg", 140), new V("Chicken", 160));
        saveItem(c, "Manchow Soup", "Spicy vegetable soup with crispy noodles", "90", "Chinese", "Soups", true, ord++, null, null, true, 2);
        
        // --- BEVERAGES ---
        MenuItem chai = saveWithVariantsAndAddons(c, "Masala Chai", "Authentic Indian spiced tea", "Beverages", "Hot", true, ord++, 0,
            new V("Regular", 20), new V("Special", 35));
        addAddonGroup(chai, "Add-ons", 0, 2,
            new AO("Extra Sugar", 0), new AO("Ginger Shot", 5), new AO("Elaichi", 5));
        
        saveItem(c, "Filter Coffee", "South Indian style filter coffee", "30", "Beverages", "Hot", true, ord++, null, null, false, 0);
        saveItem(c, "Cold Coffee", "Chilled coffee blended with ice cream", "80", "Beverages", "Cold", true, ord++, null, null, false, 0);
        saveItem(c, "Fresh Lime Soda", "Refreshing lime with soda", "40", "Beverages", "Cold", true, ord++, null, null, true, 0);
        saveItem(c, "Mango Lassi", "Thick mango yogurt smoothie", "60", "Beverages", "Cold", true, ord++, null, null, true, 0);
        
        // --- DESSERTS ---
        saveItem(c, "Gulab Jamun", "Deep-fried milk dumplings in sugar syrup", "60", "Desserts", "Indian Sweets", true, ord++, null, null, true, 0);
        saveItem(c, "Ras Malai", "Soft cheese dumplings in saffron milk", "80", "Desserts", "Indian Sweets", true, ord++, null, null, true, 0);
        saveItem(c, "Brownie with Ice Cream", "Warm chocolate brownie with vanilla scoop", "120", "Desserts", "Western", true, ord++, null, null, false, 0);
    }

    // ===== MADRAS CAFE MENU (South Indian) =====
    
    private void seedMadrasMenu(Canteen c) {
        int ord = 1;
        
        // --- DOSAS ---
        MenuItem masalaDosa = saveWithVariantsAndAddons(c, "Masala Dosa", "Crispy rice crepe with spiced potato filling", "Dosas", "Classic", true, ord++, 1,
            new V("Regular", 80), new V("Butter", 100), new V("Ghee Roast", 120));
        addAddonGroup(masalaDosa, "Sambar Choice", 1, 1,
            new AO("Regular Sambar", 0), new AO("Tomato Sambar", 15), new AO("Drumstick Sambar", 20));
        addAddonGroup(masalaDosa, "Extra Chutneys", 0, 3,
            new AO("Coconut Chutney", 15), new AO("Tomato Chutney", 15), new AO("Ginger Chutney", 15));

        saveWithVariants(c, "Plain Dosa", "Thin crispy rice crepe", "Dosas", "Classic", true, ord++,
            new V("Regular", 60), new V("Butter", 80), new V("Ghee Roast", 100));
        saveWithVariants(c, "Rava Dosa", "Semolina crepe with onion & curry leaves", "Dosas", "Special", true, ord++,
            new V("Plain", 90), new V("Masala", 110));
        saveWithVariants(c, "Mysore Dosa", "Dosa with spicy red chutney spread", "Dosas", "Special", true, ord++,
            new V("Regular", 100), new V("Masala", 130));
        saveItem(c, "Set Dosa", "Thick spongy dosa set of 3", "90", "Dosas", "Special", true, ord++, null, null, true, 0);
        saveItem(c, "Paper Dosa", "Extra thin & crispy 2-foot long dosa", "100", "Dosas", "Special", true, ord++, null, null, false, 0);
        saveItem(c, "Onion Uttapam", "Thick pancake topped with onions", "80", "Dosas", "Uttapam", true, ord++, null, null, true, 1);
        saveItem(c, "Mixed Veg Uttapam", "Thick pancake with mixed vegetables", "90", "Dosas", "Uttapam", true, ord++, null, null, true, 1);
        
        // --- IDLI & VADA ---
        MenuItem idliPlatter = saveWithVariantsAndAddons(c, "Idli", "Steamed rice & lentil cakes", "Idli & Vada", "Steamed", true, ord++, 0,
            new V("2 Piece", 40), new V("4 Piece", 70));
        addAddonGroup(idliPlatter, "Toppings", 0, 2,
            new AO("Ghee", 10), new AO("Gun Powder", 15), new AO("Cheese", 25));
        
        saveItem(c, "Medu Vada", "Crispy urad dal fritters pair with sambar & chutney", "50", "Idli & Vada", "Fried", true, ord++, null, null, false, 1);
        saveItem(c, "Idli Vada Combo", "2 Idli + 1 Vada with sambar & chutney", "80", "Idli & Vada", "Combos", true, ord++, null, null, false, 1);
        saveItem(c, "Dahi Vada", "Soft vadas soaked in curd with tamarind chutney", "70", "Idli & Vada", "Chaat Style", true, ord++, null, null, true, 0);
        
        // --- RICE ITEMS ---
        MenuItem mealPlate = saveWithVariantsAndAddons(c, "South Indian Meals", "Complete thali with rice, sambar, rasam, poriyal, papad", "Rice", "Thali", true, ord++, 1,
            new V("Regular Meals", 150), new V("Special Meals", 220), new V("Grand Meals", 300));
        addAddonGroup(mealPlate, "Extra Rice", 0, 1,
            new AO("Plain Rice", 30), new AO("Curd Rice", 40), new AO("Lemon Rice", 45));
        addAddonGroup(mealPlate, "Side Dish", 0, 2,
            new AO("Appalam", 10), new AO("Pickle", 15), new AO("Curd", 20));
        
        saveItem(c, "Curd Rice", "Yogurt rice tempered with mustard seeds & curry leaves", "80", "Rice", "Comfort Food", true, ord++, null, null, true, 0);
        saveItem(c, "Lemon Rice", "Tangy lemon-flavored rice with peanuts", "90", "Rice", "Comfort Food", true, ord++, null, null, true, 1);
        saveItem(c, "Tomato Rice", "Spiced rice cooked with tomatoes & aromatics", "90", "Rice", "Comfort Food", true, ord++, null, null, true, 1);
        saveItem(c, "Bisi Bele Bath", "Karnataka style spicy lentil rice", "110", "Rice", "Regional", true, ord++, null, null, false, 2);
        
        // --- TIFFIN / SNACKS ---
        saveItem(c, "Pongal", "Creamy rice & lentil comfort food with ghee", "70", "Tiffin", "Morning Special", true, ord++, "07:30", "11:00", true, 0);
        saveItem(c, "Upma", "Semolina cooked with vegetables & mustard", "50", "Tiffin", "Morning Special", true, ord++, "07:30", "11:00", true, 0);
        saveItem(c, "Kesari Bath", "Sweet semolina halwa with saffron & ghee", "60", "Tiffin", "Sweets", true, ord++, null, null, true, 0);
        
        // --- FILTER COFFEE & BEVERAGES ---
        MenuItem filterCoffee = saveWithVariantsAndAddons(c, "Filter Coffee", "Authentic South Indian filter kaapi", "Beverages", "Coffee", true, ord++, 0,
            new V("Small", 25), new V("Regular", 40), new V("Large", 55));
        addAddonGroup(filterCoffee, "Strength", 1, 1,
            new AO("Light", 0), new AO("Strong", 0), new AO("Extra Strong", 5));
        
        saveItem(c, "Masala Tea", "Spiced Indian tea", "20", "Beverages", "Tea", true, ord++, null, null, false, 0);
        saveItem(c, "Buttermilk", "Spiced yogurt drink with curry leaves", "30", "Beverages", "Cold", true, ord++, null, null, true, 0);
        saveItem(c, "Fresh Juice", "Seasonal fresh fruit juice", "60", "Beverages", "Cold", true, ord++, null, null, true, 0);
        
        // --- DESSERTS ---
        saveItem(c, "Mysore Pak", "Rich ghee-based gram flour sweet", "50", "Desserts", "Traditional", true, ord++, null, null, true, 0);
        saveItem(c, "Payasam", "Creamy vermicelli milk pudding", "60", "Desserts", "Traditional", true, ord++, null, null, true, 0);
        saveItem(c, "Badam Halwa", "Rich almond pudding with saffron", "80", "Desserts", "Premium", true, ord++, null, null, true, 0);
    }

    // ===== FRESH BITES MENU (Modern Fast Food) =====
    
    private void seedFreshBitesMenu(Canteen c) {
        int ord = 1;
        
        // --- BURGERS ---
        MenuItem classicBurger = saveWithVariantsAndAddons(c, "Classic Burger", "Juicy patty with fresh lettuce, tomato & special sauce", "Burgers", "Classic", true, ord++, 1,
            new V("Veg", 120), new V("Chicken", 160), new V("Double Patty", 220));
        addAddonGroup(classicBurger, "Cheese", 0, 2,
            new AO("Cheddar Slice", 30), new AO("Mozzarella", 35), new AO("Pepper Jack", 35));
        addAddonGroup(classicBurger, "Extra Toppings", 0, 4,
            new AO("Jalapenos", 20), new AO("Caramelized Onions", 25), new AO("Fried Egg", 30), new AO("Extra Patty", 60));
        
        MenuItem spicyBurger = saveWithVariantsAndAddons(c, "Spicy Peri Peri Burger", "Fiery peri peri marinated burger with chipotle mayo", "Burgers", "Spicy", true, ord++, 3,
            new V("Veg", 140), new V("Chicken", 180));
        addAddonGroup(spicyBurger, "Heat Level", 1, 1,
            new AO("Mild", 0), new AO("Hot", 0), new AO("Extra Hot", 0));
            
        saveItem(c, "Paneer Burger", "Grilled paneer patty with mint mayo", "150", "Burgers", "Premium", true, ord++, null, null, false, 1);
        saveItem(c, "BBQ Chicken Burger", "Smokey BBQ glazed chicken with coleslaw", "190", "Burgers", "Premium", false, ord++, null, null, false, 2);
        
        // --- WRAPS & ROLLS ---
        MenuItem wrap = saveWithVariantsAndAddons(c, "Signature Wrap", "Tortilla wrap stuffed with fresh veggies & sauces", "Wraps", "Classic", true, ord++, 1,
            new V("Paneer", 130), new V("Chicken Tikka", 170), new V("Falafel", 140));
        addAddonGroup(wrap, "Sauce", 1, 2,
            new AO("Ranch", 0), new AO("Chipotle", 0), new AO("Honey Mustard", 0), new AO("Sriracha", 0));
        
        saveItem(c, "Frankie Roll", "Mumbai-style frankie with spiced filling", "100", "Wraps", "Rolls", true, ord++, null, null, false, 2);
        saveItem(c, "Shawarma", "Middle eastern style chicken wrap with garlic sauce", "150", "Wraps", "Rolls", false, ord++, null, null, false, 2);

        // --- PIZZAS ---
        MenuItem pizza = saveWithVariantsAndAddons(c, "Margherita Pizza", "Classic tomato sauce, mozzarella & fresh basil", "Pizzas", "Classic", true, ord++, 0,
            new V("Regular (8\")", 180), new V("Medium (10\")", 280), new V("Large (12\")", 380));
        addAddonGroup(pizza, "Extra Toppings", 0, 5,
            new AO("Mushroom", 30), new AO("Olives", 25), new AO("Corn", 20), new AO("Onion", 15), new AO("Jalapeno", 25));
        addAddonGroup(pizza, "Crust Type", 1, 1,
            new AO("Thin Crust", 0), new AO("Classic Hand-Tossed", 0), new AO("Cheese Burst", 50));
        
        saveWithVariants(c, "Farm Fresh Pizza", "Loaded with capsicum, onion, tomato, corn & olives", "Pizzas", "Veg Special", true, ord++,
            new V("Regular (8\")", 220), new V("Medium (10\")", 320), new V("Large (12\")", 420));
        saveWithVariants(c, "Chicken Tikka Pizza", "Tandoori chicken, onion, peppers on pizza", "Pizzas", "Non-Veg", false, ord++,
            new V("Regular (8\")", 250), new V("Medium (10\")", 360), new V("Large (12\")", 470));
        
        // --- FRIES & SIDES ---
        MenuItem fries = saveWithVariantsAndAddons(c, "French Fries", "Crispy golden potato fries", "Sides", "Fries", true, ord++, 0,
            new V("Regular", 80), new V("Large", 120), new V("Loaded", 160));
        addAddonGroup(fries, "Dip", 0, 2,
            new AO("Ketchup", 0), new AO("Cheese Sauce", 25), new AO("Peri Peri Seasoning", 15), new AO("Truffle Mayo", 35));
        
        saveItem(c, "Peri Peri Fries", "Fries tossed in peri peri spice mix", "120", "Sides", "Fries", true, ord++, null, null, false, 2);
        saveItem(c, "Cheesy Nachos", "Tortilla chips with melted cheese & salsa", "140", "Sides", "Snacks", true, ord++, null, null, false, 1);
        saveItem(c, "Onion Rings", "Crispy battered onion rings", "100", "Sides", "Snacks", true, ord++, null, null, false, 0);
        saveItem(c, "Garlic Bread", "Buttery garlic bread with herbs", "90", "Sides", "Bread", true, ord++, null, null, false, 0);
        saveItem(c, "Coleslaw", "Fresh cabbage & carrot slaw with creamy dressing", "60", "Sides", "Salad", true, ord++, null, null, true, 0);
        
        // --- SHAKES & SMOOTHIES ---
        MenuItem shake = saveWithVariantsAndAddons(c, "Milkshake", "Thick creamy milkshake blended with real ice cream", "Beverages", "Shakes", true, ord++, 0,
            new V("Chocolate", 100), new V("Strawberry", 100), new V("Oreo", 120), new V("Butterscotch", 110));
        addAddonGroup(shake, "Add-ons", 0, 3,
            new AO("Whipped Cream", 20), new AO("Chocolate Chips", 25), new AO("Extra Scoop", 40), new AO("Protein Powder", 35));
        
        saveWithVariants(c, "Smoothie Bowl", "Thick blended fruit smoothie with granola toppings", "Beverages", "Healthy", true, ord++,
            new V("Mango", 150), new V("Berry Mix", 160), new V("Banana Peanut Butter", 140));
        saveItem(c, "Fresh Lime Soda", "Classic refreshing lime soda", "40", "Beverages", "Cold Drinks", true, ord++, null, null, true, 0);
        saveItem(c, "Iced Tea", "Chilled tea with lemon & mint", "60", "Beverages", "Cold Drinks", true, ord++, null, null, false, 0);
        saveItem(c, "Espresso", "Strong Italian-style espresso shot", "50", "Beverages", "Coffee", true, ord++, null, null, false, 0);
        saveItem(c, "Cappuccino", "Espresso with steamed milk foam", "80", "Beverages", "Coffee", true, ord++, null, null, false, 0);
        
        // --- DESSERTS ---
        MenuItem sundae = saveWithVariantsAndAddons(c, "Ice Cream Sundae", "Premium ice cream sundae with generous toppings", "Desserts", "Ice Cream", true, ord++, 0,
            new V("Chocolate Fudge", 120), new V("Caramel Crunch", 130), new V("Strawberry Dream", 120));
        addAddonGroup(sundae, "Extras", 0, 3,
            new AO("Sprinkles", 15), new AO("Brownie Chunks", 30), new AO("Hot Fudge", 25), new AO("Nuts", 20));
        
        saveItem(c, "Churros", "Cinnamon sugar churros with chocolate dip", "100", "Desserts", "Baked", true, ord++, null, null, false, 0);
        saveItem(c, "Molten Lava Cake", "Warm chocolate cake with gooey center", "150", "Desserts", "Baked", true, ord++, null, null, false, 0);
        saveItem(c, "Cheesecake", "New York style baked cheesecake", "160", "Desserts", "Baked", true, ord++, null, null, false, 0);
    }

    // ===== COUPONS (per canteen) =====
    
    private void seedCoupons(Canteen canteen, String prefix) {
        // WELCOME DISCOUNT
        couponRepository.save(Coupon.builder()
                .canteenId(canteen.getId())
                .code(prefix + "50")
                .title("First Order Special")
                .description("50% OFF up to ₹100 on your first order")
                .color("#e23744")
                .type(Coupon.CouponType.DISCOUNT)
                .scope(Coupon.Scope.GLOBAL)
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("50"))
                .maxDiscountAmount(new BigDecimal("100"))
                .minOrderValue(new BigDecimal("200"))
                .usageLimit(500)
                .isActive(true)
                .isCustom(false)
                .build());

        // FLAT DISCOUNT
        couponRepository.save(Coupon.builder()
                .canteenId(canteen.getId())
                .code(prefix + "FLAT75")
                .title("Flat ₹75 Off")
                .description("Flat ₹75 off on orders above ₹300")
                .color("#10b981")
                .type(Coupon.CouponType.DISCOUNT)
                .scope(Coupon.Scope.GLOBAL)
                .discountType(Coupon.DiscountType.FLAT)
                .discountValue(new BigDecimal("75"))
                .minOrderValue(new BigDecimal("300"))
                .usageLimit(300)
                .isActive(true)
                .isCustom(false)
                .build());

        // BIG ORDER
        couponRepository.save(Coupon.builder()
                .canteenId(canteen.getId())
                .code(prefix + "FEAST200")
                .title("Family Feast")
                .description("Flat ₹200 off on orders above ₹1000")
                .color("#8b5cf6")
                .type(Coupon.CouponType.DISCOUNT)
                .scope(Coupon.Scope.GLOBAL)
                .discountType(Coupon.DiscountType.FLAT)
                .discountValue(new BigDecimal("200"))
                .minOrderValue(new BigDecimal("1000"))
                .usageLimit(100)
                .isActive(true)
                .isCustom(false)
                .build());
    }

    // ===== ORDERS =====
    
    private void seedOrders(Canteen canteen) {
        User customer = userRepository.findByEmail("kush@charusat.edu.in").orElse(null);
        if (customer == null) return;
        
        List<MenuItem> items = menuItemRepository.findByCanteenId(canteen.getId());
        if (items.size() < 4) return;

        createOrder(canteen, customer, "ORD-" + canteen.getId() + "001", Order.OrderStatus.PENDING,
            new BigDecimal("450.00"), LocalDateTime.now().minusMinutes(5), items.get(0), 1, items.get(1), 2);
        createOrder(canteen, customer, "ORD-" + canteen.getId() + "002", Order.OrderStatus.PREPARING,
            new BigDecimal("350.00"), LocalDateTime.now().minusMinutes(15), items.get(2), 1);
        createOrder(canteen, customer, "ORD-" + canteen.getId() + "003", Order.OrderStatus.READY,
            new BigDecimal("120.00"), LocalDateTime.now().minusMinutes(25), items.get(3), 2);
        createOrder(canteen, customer, "ORD-" + canteen.getId() + "004", Order.OrderStatus.COMPLETED,
            new BigDecimal("550.00"), LocalDateTime.now().minusHours(2), items.get(0), 1, items.get(2), 1);
    }
    
    private void createOrder(Canteen canteen, User customer, String orderNo, Order.OrderStatus status, 
                            BigDecimal total, LocalDateTime time, Object... itemArgs) {
        Order order = Order.builder()
                .canteenId(canteen.getId())
                .customerId(customer.getId())
                .orderNumber(orderNo)
                .status(status)
                .totalAmount(total)
                .paymentMethod("UPI")
                .paymentStatus(Order.PaymentStatus.PAID)
                .createdAt(time)
                .updatedAt(time)
                .build();
        
        Order savedOrder = orderRepository.save(order);
        
        for (int i = 0; i < itemArgs.length; i += 2) {
            MenuItem mi = (MenuItem) itemArgs[i];
            int qty = (Integer) itemArgs[i+1];
            
            OrderItem oi = OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .menuItemId(mi.getId())
                    .quantity(qty)
                    .unitPrice(mi.getPrice())
                    .totalPrice(mi.getPrice().multiply(BigDecimal.valueOf(qty)))
                    .build();
            orderItemRepository.save(oi);
        }
    }

    // ===== HELPER METHODS =====
    
    record V(String name, double price) {}
    record AO(String name, double price) {}
    
    /** Save a simple menu item (no variants, no addons) */
    private MenuItem saveItem(Canteen canteen, String name, String desc, String price,
                     String cat, String subCat, boolean isVeg, int order,
                     String availFrom, String availTo, boolean jainAvailable, int spicyLevel) {
        MenuItem item = MenuItem.builder()
                .canteenId(canteen.getId())
                .name(name)
                .description(desc != null ? desc : "")
                .price(new BigDecimal(price))
                .category(cat)
                .subCategory(subCat)
                .isVeg(isVeg)
                .displayOrder(order)
                .preparationTime(15)
                .spicyLevel(spicyLevel)
                .isRecommended(order <= 5)
                .isAvailable(true)
                .availableFrom(availFrom)
                .availableTo(availTo)
                .hasVariants(false)
                .hasAddons(false)
                .build();
        
        if (jainAvailable) {
            item.setTags(List.of("Jain Available"));
        }
        
        return menuItemRepository.save(item);
    }
    
    /** Save item with variants only */
    private MenuItem saveWithVariants(Canteen canteen, String name, String desc, String cat, String subCat, 
                                      boolean isVeg, int order, V... variants) {
        BigDecimal basePrice = BigDecimal.valueOf(variants.length > 0 ? variants[0].price : 0);
        
        MenuItem item = MenuItem.builder()
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
        
        MenuItem savedItem = menuItemRepository.save(item);
                
        for (V v : variants) {
            MenuItemVariant variant = new MenuItemVariant();
            variant.setName(v.name);
            variant.setPrice(BigDecimal.valueOf(v.price));
            variant.setMenuItemId(savedItem.getId());
            menuItemVariantRepository.save(variant);
        }
        
        return savedItem;
    }
    
    /** Save item with variants and mark as has-addons (addons added separately) */
    private MenuItem saveWithVariantsAndAddons(Canteen canteen, String name, String desc, String cat, String subCat, 
                                               boolean isVeg, int order, int spicyLevel, V... variants) {
        BigDecimal basePrice = BigDecimal.valueOf(variants.length > 0 ? variants[0].price : 0);
        
        MenuItem item = MenuItem.builder()
                .canteenId(canteen.getId())
                .name(name)
                .description(desc != null ? desc : "")
                .price(basePrice)
                .category(cat)
                .subCategory(subCat)
                .isVeg(isVeg)
                .displayOrder(order)
                .preparationTime(15)
                .spicyLevel(spicyLevel)
                .isRecommended(true)
                .isAvailable(true)
                .hasVariants(variants.length > 0)
                .hasAddons(true)
                .build();
        
        MenuItem savedItem = menuItemRepository.save(item);
                
        for (V v : variants) {
            MenuItemVariant variant = new MenuItemVariant();
            variant.setName(v.name);
            variant.setPrice(BigDecimal.valueOf(v.price));
            variant.setMenuItemId(savedItem.getId());
            menuItemVariantRepository.save(variant);
        }
        
        return savedItem;
    }
    
    /** Add an addon group with options to a menu item */
    private void addAddonGroup(MenuItem item, String groupName, int minSel, int maxSel, AO... options) {
        AddonGroup group = AddonGroup.builder()
                .name(groupName)
                .menuItemId(item.getId())
                .minSelection(minSel)
                .maxSelection(maxSel)
                .build();
        
        AddonGroup savedGroup = addonGroupRepository.save(group);
        
        for (AO ao : options) {
            addonOptionRepository.save(AddonOption.builder()
                    .name(ao.name)
                    .price(BigDecimal.valueOf(ao.price))
                    .addonGroupId(savedGroup.getId())
                    .build());
        }
    }
}
