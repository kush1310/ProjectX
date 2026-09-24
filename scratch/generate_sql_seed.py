import os
import re

BCRYPT_HASH = "$2a$10$3C4p0ZeXhF5q0xmtzFnz3.Q75BSCh7KCfB0QtBXNp0FGwp4MuCuBW"

sql = []

sql.append("-- ==========================================================")
sql.append("-- CHARUSAT NEEDS - FULL DATABASE RE-SEEDING SCRIPT")
sql.append("-- Clears all data, preserves schema intact, seeds real menus")
sql.append("-- ==========================================================\n")

sql.append("BEGIN;\n")

# 1. Truncate all tables
sql.append("-- 1. Truncate all tables with cascade and restart identities")
sql.append("""TRUNCATE TABLE 
  order_items, 
  orders, 
  cart_items, 
  carts, 
  addon_options, 
  addons, 
  addon_groups, 
  menu_item_variants, 
  menu_item_tags, 
  menu_items, 
  categories, 
  canteens_schedule, 
  canteen_bank_details, 
  payouts, 
  reviews, 
  complaints, 
  coupon_usage, 
  coupon_applicability, 
  coupon_analytics, 
  coupons, 
  favorites, 
  payment_orders, 
  refresh_tokens, 
  mfa_events, 
  password_history, 
  password_reset_tokens, 
  login_attempts, 
  user_profiles, 
  vendor_applications, 
  webhook_events, 
  canteens, 
  users 
RESTART IDENTITY CASCADE;\n""")

# 2. Users
sql.append("-- 2. Insert Vendor and Core Users")
users = [
    ("sweetspot@charusat.edu.in", "Sweet Spot Vendor", "CANTEEN_OWNER"),
    ("99yogi@charusat.edu.in", "99 Yogi Food Vendor", "CANTEEN_OWNER"),
    ("dannys@charusat.edu.in", "Danny's Coffee Bar Vendor", "CANTEEN_OWNER"),
    ("iceberg@charusat.edu.in", "Ice Berg Juice & Cafe Vendor", "CANTEEN_OWNER"),
    ("pramukh@charusat.edu.in", "Pramukh Preet Vendor", "CANTEEN_OWNER"),
    ("gohunger@charusat.edu.in", "Go Hunger Cafe Vendor", "CANTEEN_OWNER"),
    ("patelpuff@charusat.edu.in", "Patel Puff Vendor", "CANTEEN_OWNER"),
    ("kush@charusat.edu.in", "Kush Shah", "USER"),
    ("student@charusat.edu.in", "CHARUSAT Student", "USER"),
    ("admin@charusat.edu.in", "CHARUSAT Administrator", "ADMIN")
]

for email, name, role in users:
    escaped_name = name.replace("'", "''")
    sql.append(f"""INSERT INTO users (email, password, full_name, role, auth_provider, is_active, is_email_verified, created_at)
VALUES ('{email}', '{BCRYPT_HASH}', '{escaped_name}', '{role}', 'LOCAL', true, true, NOW());""")

sql.append("\n-- 3. Insert Canteens")
canteens = [
    (
        "Sweet Spot",
        "CHARUSAT Campus, Student Activity Center",
        "Delicious fast food, thick shakes, burgers, subs, pizzas, and snacks.",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "sweetspot@charusat.edu.in",
        "08:00 AM",
        "07:30 PM"
    ),
    (
        "99 Yogi",
        "CHARUSAT Campus, Central Food Plaza",
        "Famous for 99 varieties of food, pizzas, pulavs, noodles, burgers, and wraps.",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "99yogi@charusat.edu.in",
        "08:30 AM",
        "08:00 PM"
    ),
    (
        "Danny''s",
        "CHARUSAT Campus, Changa",
        "Danny''s Coffee Bar: Famous thick cold coffee, grilled sandwiches, toasts, and pizzas.",
        "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80",
        "dannys@charusat.edu.in",
        "08:00 AM",
        "08:00 PM"
    ),
    (
        "Ice Berg",
        "CHARUSAT Campus, Fresh Hub",
        "Iceberg Fresh Fruit Juice, fruit mocktails, exotic thick shakes, and Davidoff coffees.",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80",
        "iceberg@charusat.edu.in",
        "08:30 AM",
        "07:00 PM"
    ),
    (
        "Pramukh",
        "CHARUSAT Campus, Pramukh Preet Point",
        "Pramukh Preet: Delicious variety puffs, pizzas, panini, Chinese dishes, and special pulav.",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
        "pramukh@charusat.edu.in",
        "08:00 AM",
        "08:00 PM"
    ),
    (
        "Go Hunger Cafe",
        "CHARUSAT Campus, Food Zone",
        "Good Food Good Mood: Fresh pizzas, calzones, garlic breads, frankies, burgers, shakes, and mocktails.",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        "gohunger@charusat.edu.in",
        "08:30 AM",
        "08:30 PM"
    ),
    (
        "Patel Puff",
        "CHARUSAT Campus, Student Corner",
        "Crispy outside, delicious inside: 100% Veg freshly baked classic and special gourmet puffs.",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
        "patelpuff@charusat.edu.in",
        "08:00 AM",
        "07:30 PM"
    )
]

for name, loc, desc, img, owner_email, op, cl in canteens:
    sql.append(f"""INSERT INTO canteens (name, location, description, image_url, is_open, opening_time, closing_time, owner_id, created_at)
VALUES ('{name}', '{loc}', '{desc}', '{img}', true, '{op}', '{cl}', (SELECT id FROM users WHERE email='{owner_email}'), NOW());""")

sql.append("\n-- 4. Insert Menu Items for all Canteens\n")

def addItem(canteen_name, item_name, price, category, desc=None, rec=False):
    esc_canteen = canteen_name.replace("'", "''")
    esc_item = item_name.replace("'", "''")
    esc_cat = category.replace("'", "''")
    desc_val = (desc or f"{item_name} prepared fresh.").replace("'", "''")
    rec_val = "true" if rec else "false"
    return f"""INSERT INTO menu_items (name, description, price, category, is_available, is_veg, canteen_id, preparation_time, is_recommended, created_at)
VALUES ('{esc_item}', '{desc_val}', {price}, '{esc_cat}', true, true, (SELECT id FROM canteens WHERE name='{esc_canteen}'), 15, {rec_val}, NOW());"""

# --- Sweet Spot ---
sweet_spot_items = [
    # Hot Drinks
    ("Tea", 20, "Hot Drinks", "Fresh brewed masala tea.", False),
    ("Coffee", 30, "Hot Drinks", "Hot aromatic coffee.", False),
    # Beverages
    ("Cold Bournvita", 50, "Beverages", "Refreshing chilled Bournvita.", False),
    ("Hot Bournvita", 60, "Beverages", "Warm Bournvita drink.", False),
    ("Cold Coffee", 50, "Beverages", "Classic thick cold coffee.", True),
    ("Cold Coffee With Choco Chips", 80, "Beverages", "Cold coffee topped with rich choco chips.", False),
    ("Oreo Shake", 70, "Beverages", "Rich chocolate shake blended with crunchy Oreos.", True),
    ("Kitkat Shake", 70, "Beverages", "Creamy Kitkat crunch shake.", False),
    ("Strawberry Shake", 70, "Beverages", "Fresh strawberry flavored thick shake.", False),
    ("Oreo Shake With Choco Chips", 80, "Beverages", "Oreo shake loaded with chocolate chips.", False),
    # Breakfast
    ("Bread Butter", 50, "Breakfast", "Fresh bread slices with Amul butter.", False),
    ("Bread Butter Jam", 60, "Breakfast", "Bread with butter and sweet fruit jam.", False),
    ("Chocolate Slice", 40, "Breakfast", "Toasted slice layered with chocolate spread.", False),
    ("Cheese Butter Slice", 60, "Breakfast", "Toasted slice with melted cheese and butter.", False),
    # Ever Green Snacks
    ("Thepla", 40, "Ever Green Snacks", "Traditional Gujarati spiced methi thepla.", False),
    ("Sev Thepla", 50, "Ever Green Snacks", "Spiced thepla served with crunchy sev.", False),
    ("Masala Thepla", 60, "Ever Green Snacks", "Special spiced masala thepla.", False),
    ("Cheese Thepla", 80, "Ever Green Snacks", "Thepla stuffed with rich processed cheese.", False),
    ("Aloo Paratha", 40, "Ever Green Snacks", "Hot stuffed potato paratha with spices.", True),
    ("Cheese Aloo Paratha", 70, "Ever Green Snacks", "Aloo paratha stuffed with melted cheese.", False),
    # Bhel
    ("Bombay Bhel", 50, "Bhel", "Crisp puffed rice tossed with tangy chutneys.", False),
    ("Cheese Bhel", 70, "Bhel", "Bombay bhel topped with shredded cheese.", False),
    ("Kurkure Chaat", 90, "Bhel", "Spicy crunchy Kurkure chaat mix.", False),
    ("Cheese Samosa", 100, "Bhel", "Golden crisp samosa stuffed with cheese.", False),
    # Momos
    ("Veg Cheese Momos", 120, "Momos", "Steamed dumplings stuffed with cheese and veggies.", True),
    ("Tandoori Mayo Momos", 140, "Momos", "Tandoori seasoned momos served with creamy mayo.", False),
    # Pasta
    ("Cheese Pasta", 120, "Pasta", "Creamy pasta with shredded cheese.", False),
    ("Red Sauce Pasta", 120, "Pasta", "Penne in tangy Italian herb tomato sauce.", False),
    ("Cheese Corn Pasta", 130, "Pasta", "Penne with sweet corn in rich cheese sauce.", False),
    ("Cheese Garlic Pasta", 140, "Pasta", "Garlic infused cheesy pasta.", False),
    ("Mix Sauce Pasta", 140, "Pasta", "Combination of red and white cream sauces.", True),
    ("Mix Sauce Pasta With Veg", 150, "Pasta", "Mix sauce pasta loaded with fresh veggies.", False),
    # Puff
    ("Potato Puff", 20, "Puff", "Classic golden potato puff.", False),
    ("Sev Puff", 30, "Puff", "Crispy puff filled with savory sev.", False),
    ("Sev Onion Puff", 40, "Puff", "Puff with crunchy onions and sev.", False),
    ("Veg Masala Puff", 50, "Puff", "Spiced mixed vegetable puff.", False),
    ("Sev Chezwan Puff", 50, "Puff", "Sev puff tossed with fiery schezwan sauce.", False),
    ("Cheese Puff", 50, "Puff", "Warm puff filled with melted cheese.", False),
    ("Cheese Onion Puff", 60, "Puff", "Melted cheese and diced onions in flaky pastry.", False),
    ("Butter Cheese Puff", 70, "Puff", "Butter roasted cheese puff.", False),
    ("Cheesy Paneer Puff", 80, "Puff", "Cottage cheese cubes with gooey mozzarella.", False),
    ("Veg Cheese Blast Puff", 80, "Puff", "Bursting with cheese and fresh vegetables.", True),
    ("Cheese Chilli Puff", 80, "Puff", "Spicy green chillies with rich cheese.", False),
    ("Pizza Puff", 80, "Puff", "Italian herbs, pizza sauce, and cheese inside.", False),
    # Fries
    ("Salted Fries", 90, "Fries", "Crispy golden salted potato fries.", False),
    ("Masala Fries", 100, "Fries", "Fries tossed with Indian chaat masala.", False),
    ("Peri Peri Fries", 110, "Fries", "Spicy tangy peri peri seasoned fries.", True),
    ("Cheese Masala Fries", 120, "Fries", "Masala fries smothered in cheese sauce.", False),
    ("Tandoori Mayo Fries", 120, "Fries", "Fries topped with smoky tandoori mayo.", False),
    # Maggi
    ("Simple Maggi", 50, "Maggi", "Classic favorite instant noodles.", False),
    ("Masala Maggi", 60, "Maggi", "Maggi with extra aromatic spice blend.", False),
    ("Veg Maggi", 70, "Maggi", "Maggi cooked with fresh capsicum and carrots.", False),
    ("Butter Maggi", 70, "Maggi", "Cooked with generous dollop of Amul butter.", False),
    ("Schezwan Maggi (Spicy)", 70, "Maggi", "Spicy noodles with pungent schezwan sauce.", False),
    ("Cheese Maggi", 80, "Maggi", "Topped with a generous layer of grated cheese.", True),
    ("Cheese Mayo Maggi", 90, "Maggi", "Creamy blend of mayonnaise and melted cheese.", False),
    ("Cheese Corn Maggi", 90, "Maggi", "Sweet corn kernels and melted cheese.", False),
    ("Butter Tadka Maggi", 100, "Maggi", "Infused with sizzling butter tempering.", False),
    ("Cheese Tadka Maggi", 100, "Maggi", "Sizzling garlic tadka with melted cheese.", False),
    ("Cheese Butter Tadka Maggi", 120, "Maggi", "Ultimate indulgence with butter, cheese, and tadka.", False),
    # Mexican
    ("Nachos Salsa", 80, "Mexican", "Tortilla chips served with fresh tomato salsa.", False),
    ("Cheese Nachos", 100, "Mexican", "Crispy nachos drenched in warm melted cheese.", True),
    # Kathi Roll
    ("Fusion Fire Roll", 120, "Kathi Roll", "Spicy fusion vegetable filling in soft roll.", False),
    ("Hariyali Veg Cheese Roll", 120, "Kathi Roll", "Mint coriander green chutney with cheese.", False),
    ("Veg Cheese Roll", 120, "Kathi Roll", "Mixed vegetable and cheese roll.", False),
    ("Veggie D'lite Roll", 130, "Kathi Roll", "Crunchy vegetables with special dressing.", False),
    ("Schezwan Paneer Roll", 140, "Kathi Roll", "Paneer tossed in spicy schezwan sauce.", False),
    ("Ultimate Paneer Roll", 140, "Kathi Roll", "Loaded paneer tikka with spices and cheese.", True),
    # Pizza
    ("Margarita", 100, "Pizza", "Classic cheese and tomato herb pizza.", False),
    ("Double Cheese Margarita", 120, "Pizza", "Double loaded cheese margarita pizza.", True),
    ("Italiano Pizza", 120, "Pizza", "Italian herbs, olives, and capsicum.", False),
    ("Tandoori Pizza", 120, "Pizza", "Smoky tandoori seasoning with paneer and onions.", False),
    ("Corn Continental Pizza", 120, "Pizza", "Sweet corn and continental herbs with cheese.", False),
    ("Mexican Pizza", 120, "Pizza", "Jalapenos, beans, and Mexican spices.", False),
    ("Paneer Paprika", 130, "Pizza", "Spicy red paprika and marinated paneer cubes.", False),
    ("Veg Extra Vegan", 130, "Pizza", "Loaded with seasonal garden vegetables.", False),
    ("Tandoori Paneer Pizza", 140, "Pizza", "Tandoori paneer, onions, and capsicum.", False),
    ("Chef Special Cheese Blast Pizza", 160, "Pizza", "Cheese stuffed crust with overflowing toppings.", True),
    # Sub
    ("Veggie Subs", 90, "Sub", "Crisp sub bread with garden vegetables.", False),
    ("Veg Exotica Sub", 110, "Sub", "Exotic vegetables with gourmet dressing.", False),
    ("Cheesy Sub", 120, "Sub", "Sub loaded with double cheese and dressing.", False),
    ("Aloo Patty Sub", 130, "Sub", "Crispy spiced potato patty with salad in sub.", False),
    ("BBQ Paneer Sub", 140, "Sub", "Grilled paneer in smoky barbecue sauce.", True),
    # Garlic Breads
    ("Regular Garlic Bread", 130, "Garlic Breads", "Toasted baguette with garlic butter.", False),
    ("American Garlic Bread", 140, "Garlic Breads", "Garlic bread topped with sweet corn and cheese.", False),
    ("Cheesy Jalapeno Garlic Bread", 150, "Garlic Breads", "Spicy jalapenos and melted cheese on garlic bread.", False),
    # Sandwich
    ("Red Club Sandwich", 90, "Sandwich", "Triple layer sandwich with red chili chutney.", False),
    ("Cheese Grilled Sandwich", 90, "Sandwich", "Golden grilled sandwich stuffed with cheese.", False),
    ("Cheese Chutney Sandwich", 90, "Sandwich", "Spicy green mint chutney with cheese.", False),
    ("Veg Cheese Sandwich", 90, "Sandwich", "Fresh veggies with slices of processed cheese.", False),
    ("Veg Cheese Coleslaw", 100, "Sandwich", "Crisp cabbage and carrot coleslaw with cheese.", False),
    ("Veg Creamy Sandwich", 100, "Sandwich", "Creamy herb vegetable filling.", False),
    ("Chilly Cheese Sandwich", 100, "Sandwich", "Green chilies, capsicum, and melted cheese.", False),
    ("Spanish Corn Sandwich", 100, "Sandwich", "Corn and Spanish seasoning with cheese.", False),
    ("Veg Cheese Roasty Grill", 120, "Sandwich", "Double roasted crispy grilled sandwich.", False),
    ("Chilly Garlic Cheese Grill", 120, "Sandwich", "Garlic butter, green chilies, and cheese.", False),
    ("Paneer Masala Grill", 130, "Sandwich", "Spiced paneer bhurji stuffed grilled sandwich.", False),
    ("Tandoori Paneer Chilla", 140, "Sandwich", "Tandoori paneer packed in savory chilla bread.", False),
    ("Tandoori Paneer Cheese Chilla", 150, "Sandwich", "Paneer chilla loaded with mozzarella cheese.", False),
    ("Club Grill 3 Layer", 150, "Sandwich", "Grand 3-layer toasted club sandwich.", True),
    ("Tandoori Club Sandwich", 170, "Sandwich", "Tandoori paneer club sandwich with fries.", False),
    ("Chef Special Sandwich", 200, "Sandwich", "The ultimate signature sandwich of Sweet Spot.", True),
    # Burger
    ("Aloo Tikki Burger", 50, "Burger", "Crispy spiced potato patty with tomato and onion.", False),
    ("Schezwan Burger", 60, "Burger", "Burger dressed with fiery schezwan mayo.", False),
    ("Veg Cheese Burger", 70, "Burger", "Potato patty topped with melted cheese slice.", True),
    ("Masala Cheese Grill Burger", 80, "Burger", "Grilled burger bun with spiced masala patty.", False),
    ("BBQ Burger", 80, "Burger", "Burger glazed in rich barbecue sauce.", False),
    ("Green Chilly Cheese Burger", 80, "Burger", "Spicy green chili kick with melted cheese.", False),
    ("Paneer Chilly Cheese Burger", 90, "Burger", "Paneer patty with chili cheese sauce.", False),
    ("Paneer BBQ Cheese Burger", 90, "Burger", "Grilled paneer patty with BBQ glaze.", False),
    ("Maharaja Loaded Cheese Burger", 120, "Burger", "Double stacked patty with extra cheese.", True),
    # Cakes & Pastries
    ("Black Forest Cake", 450, "Cakes & Pastries", "Classic chocolate sponge cake with cherries.", False),
    ("Chocolate Cake", 450, "Cakes & Pastries", "Rich chocolate truffle cream cake.", False),
    ("Black Forest Pastry", 60, "Cakes & Pastries", "Single slice of fresh black forest pastry.", False),
    ("Chocolate Pastry", 60, "Cakes & Pastries", "Decadent chocolate pastry slice.", False),
    # Combos
    ("Burger Combo (Aloo Tikki, Veg Cheese Burger, Fries, Coke)", 220, "Combo Offers", "Complete meal with 2 burgers, fries and cold drink.", True),
    ("Sandwich Combo (3 Layer Sandwich, Fries, Coke)", 250, "Combo Offers", "3-layer club sandwich served with fries and cold drink.", True),
    ("Pizza Combo (Indian Pizza, Garlic Bread, Coke)", 260, "Combo Offers", "Personal pizza with garlic bread and chilled Coke.", True),
    ("Extra Cheese Addon", 30, "Addons", "Extra portion of melted cheese.", False)
]

for name, price, cat, desc, rec in sweet_spot_items:
    sql.append(addItem("Sweet Spot", name, price, cat, desc, rec))

# --- 99 Yogi ---
yogi_items = [
    # Fries
    ("French Fries", 70, "Fries", "Crispy golden salted fries.", False),
    ("Peri Peri Fries", 90, "Fries", "Crispy fries tossed in peri peri spice.", False),
    ("Cheese Burst Loaded Fries", 100, "Fries", "Loaded with overflowing cheese sauce.", True),
    ("Maggi Masala Fries", 90, "Fries", "Fries dusted with spicy Maggi tastemaker.", False),
    ("Cheese Loader Nachos", 110, "Fries", "Nachos smothered in melted cheese.", False),
    ("Smiles", 80, "Fries", "Crispy potato smiley faces.", False),
    ("Cheese Ball", 80, "Fries", "Crispy fried golden cheese balls.", False),
    ("Chips-n-salsa", 100, "Fries", "Tortilla chips with fresh salsa dip.", False),
    ("Potato Wedges", 80, "Fries", "Thick seasoned crispy potato wedges.", False),
    ("Pizza French Fries", 120, "Fries", "Fries baked with pizza sauce and cheese.", False),
    ("Chili Potato Fries", 100, "Fries", "Crispy potatoes in sweet spicy chili glaze.", False),
    ("Fries Loaded Bowl", 130, "Fries", "Giant bowl of fries loaded with toppings.", True),
    ("Dragon Chilly Potato", 110, "Fries", "Fiery dragon chili glazed potatoes.", False),
    # Maggi
    ("Plain Maggi", 40, "Maggi", "Classic instant noodles.", False),
    ("Masala Maggi", 50, "Maggi", "Maggi with extra aromatic masala.", False),
    ("Veg Masala Maggi", 70, "Maggi", "Maggi cooked with fresh vegetables.", False),
    ("Butter Maggi", 80, "Maggi", "Cooked with generous butter.", False),
    ("Cheese Maggi", 80, "Maggi", "Maggi with shredded cheese on top.", False),
    ("Periperi Masala Maggi", 60, "Maggi", "Spicy peri peri flavored noodles.", False),
    ("Veg Cheese Maggi", 90, "Maggi", "Veggies and cheese blend with noodles.", True),
    ("Schezwan Maggi", 60, "Maggi", "Spicy schezwan sauce noodles.", False),
    ("Cheese Butter Maggi", 100, "Maggi", "Rich butter and melted cheese Maggi.", False),
    ("Maggi Bhel", 80, "Maggi", "Crispy noodle chaat tossed with spices.", False),
    ("Korean Maggi", 80, "Maggi", "Spicy sweet Korean chili garlic noodles.", False),
    # Wrap
    ("Tandoori Wrap", 100, "Wrap", "Tandoori spiced vegetables wrapped in tortilla.", False),
    ("Veg Wrap", 70, "Wrap", "Fresh mixed vegetable roll.", False),
    ("Mexican Wrap", 100, "Wrap", "Beans, jalapenos and Mexican spices.", False),
    ("Paneer Tikka Wrap", 120, "Wrap", "Char-grilled paneer tikka with onions.", True),
    ("Peri Peri Veg Wrap", 80, "Wrap", "Spicy peri peri tossed vegetables.", False),
    ("Veg Noodles Wrap", 90, "Wrap", "Hakka noodles and veggies wrapped up.", False),
    ("Mushroom Wrap", 110, "Wrap", "Sautéed garlic mushrooms in warm wrap.", False),
    ("Yogi Special Wrap", 150, "Wrap", "Chef's signature loaded cheese wrap.", True),
    # Garlic Bread
    ("Cheese Garlic Bread (3 Pcs)", 70, "Garlic Bread", "Toasted with garlic butter and cheese.", False),
    ("Cheese Chilly Garlic Bread", 80, "Garlic Bread", "Spicy green chillies and melted cheese.", False),
    ("Peri Peri Garlic Bread", 80, "Garlic Bread", "Garlic bread dusted with peri peri.", False),
    ("Red Paprika Olives Garlic Bread", 100, "Garlic Bread", "Topped with red paprika and black olives.", False),
    # Milk Shake
    ("Chocolate Shake", 80, "Milk Shake", "Classic rich chocolate shake.", False),
    ("Oreo Shake", 99, "Milk Shake", "Thick shake loaded with Oreos.", True),
    ("Kitkat Shake", 99, "Milk Shake", "Crispy Kitkat wafer shake.", True),
    ("Black Current Shake", 80, "Milk Shake", "Tangy sweet blackcurrant shake.", False),
    ("Chocopie Milk Shake", 99, "Milk Shake", "Lotte Chocopie blended into rich shake.", False),
    ("Strawberry Shake", 80, "Milk Shake", "Sweet strawberry fruit shake.", False),
    ("Plain Vanilla Shake", 80, "Milk Shake", "Smooth creamy vanilla shake.", False),
    ("Mango Shake", 80, "Milk Shake", "Tropical Alphonso mango shake.", False),
    ("Butter Scotch Shake", 80, "Milk Shake", "Sweet crunchy butterscotch milkshake.", False),
    ("Litchi Milkshake", 80, "Milk Shake", "Exotic sweet litchi milkshake.", False),
    ("Guava Milkshake", 80, "Milk Shake", "Refreshing guava shake with a pinch of spice.", False),
    ("Plain Vanilla With Ice Cream", 100, "Milk Shake", "Vanilla shake topped with a rich scoop.", False),
    # Coffee & Tea
    ("Hot Coffee", 30, "Coffee & Tea", "Hot freshly brewed coffee.", False),
    ("Cold Coffee", 80, "Coffee & Tea", "Creamy chilled coffee.", True),
    ("Tea", 20, "Coffee & Tea", "Hot masala chai.", False),
    ("Green Tea", 30, "Coffee & Tea", "Healthy herbal green tea.", False),
    ("Cold Coffee With Ice Cream", 100, "Coffee & Tea", "Cold coffee crowned with vanilla ice cream.", False),
    # Combos
    ("Manchurian With Noodles", 120, "Combos", "Crisp veg manchurian balls with hakka noodles.", True),
    ("Farm House Pizza + French Fries + Cold Drink", 210, "Combos", "Veggie pizza with salted fries and soft drink.", False),
    ("White Sauce Pasta + Garlic Bread + Cold Drink", 200, "Combos", "Cheesy pasta, garlic bread and beverage.", False),
    ("Veg Sandwich With Smiles + Cold Drink", 170, "Combos", "Grilled sandwich, potato smiles and drink.", False),
    ("Aloo Tikki Burger + Peri Peri French Fries + Cold Drink", 180, "Combos", "Crisp burger with spicy fries and beverage.", False),
    ("Margherita Pizza + Paneer Tikka Pizza + Cold Drink", 230, "Combos", "Two 7-inch pizzas with chilled drink.", True),
    ("Mug Pulav + Paneer Pulav + Cold Drink", 170, "Combos", "Tawa pulav feast with cold drink.", False),
    ("Cheese Burger + Cheese Vada Pav + Cold Drink", 140, "Combos", "Double street food combo with beverage.", False),
    ("Yogi Sp. Pulav + 5 PCS Samosa + Cold Drink", 200, "Combos", "Signature pulav with samosas and drink.", True),
    # Veg Chinese
    ("Mushroom Chilli Manchurian", 160, "Veg Chinese", "Mushrooms in spicy Indo-Chinese gravy.", False),
    ("Dry Manchurian", 120, "Veg Chinese", "Crispy vegetable balls tossed with scallions.", True),
    ("Gravy Manchurian", 130, "Veg Chinese", "Veggie balls in rich savory soy garlic gravy.", False),
    ("Paneer Chilly Dry", 150, "Veg Chinese", "Wok tossed paneer with bell peppers and green chilies.", False),
    ("Veg. Noodles", 100, "Veg Chinese", "Stir-fried noodles with crisp vegetables.", False),
    ("Hakka Noodles", 100, "Veg Chinese", "Classic Indo-Chinese street style noodles.", False),
    ("Paneer Noodles", 120, "Veg Chinese", "Hakka noodles topped with paneer cubes.", False),
    ("Schezwan Noodles", 110, "Veg Chinese", "Fiery spicy schezwan wok tossed noodles.", False),
    ("Chinese Bhel", 140, "Veg Chinese", "Crispy fried noodles in sweet tangy chili sauce.", False),
    ("Mushroom Noodles", 130, "Veg Chinese", "Savory noodles loaded with button mushrooms.", False),
    ("Manchurian Pasta", 130, "Veg Chinese", "Fusion pasta tossed with manchurian sauce.", False),
    # Pizza (7 Inch)
    ("Farmhouse Pizza", 130, "Pizza", "Loaded with onions, capsicum, tomatoes and mushrooms.", False),
    ("Peppy Paneer Pizza", 140, "Pizza", "Spiced paneer, red paprika and capsicum.", False),
    ("Veg Extravaganza Pizza", 130, "Pizza", "Corn, olives, jalapenos, onions and tomatoes.", False),
    ("Paneer Tikka Pizza", 120, "Pizza", "Tandoori paneer tikka with capsicum.", False),
    ("Margherita Pizza", 100, "Pizza", "Classic tomato sauce with melted mozzarella.", False),
    ("Italian Treat Pizza", 140, "Pizza", "Italian herbs with black olives and sun-dried tomatoes.", False),
    ("Special Pizza", 190, "Pizza", "Yogi's mega loaded 7-inch pizza.", True),
    ("Paneer Tandoori Pizza", 150, "Pizza", "Smoky roasted paneer and mozzarella.", False),
    ("4 Topping Pizza", 140, "Pizza", "Choose four signature vegetable toppings.", False),
    ("Manchurian Pizza", 160, "Pizza", "Topped with crunchy manchurian dumplings.", False),
    ("Peri Peri Loaded Pizza", 120, "Pizza", "Fiery peri peri spiced crust and toppings.", False),
    ("Corn Cheese Pizza", 120, "Pizza", "Golden sweet corn with rich mozzarella.", False),
    ("Nachos Mexican Pizza", 150, "Pizza", "Topped with crunchy nachos and cheese.", False),
    ("Pizza Bread", 120, "Pizza", "Thick toasted bread with pizza toppings.", False),
    ("Yogi Special Pizza", 200, "Pizza", "Double cheese signature specialty pizza.", True),
    # Burger
    ("Aloo Tikki Burger", 60, "Burger", "Crispy potato patty with fresh salad.", False),
    ("Aloo Tikki Cheese Burger", 80, "Burger", "Potato patty with melted cheddar slice.", False),
    ("Veg Burger", 70, "Burger", "Mixed vegetable patty with mayo.", False),
    ("Veg Cheese Burger", 90, "Burger", "Veg patty topped with rich melted cheese.", True),
    ("Cheese Mushroom Burger", 110, "Burger", "Grilled mushrooms with melted cheese sauce.", False),
    ("Paneer Cheese Burger", 130, "Burger", "Thick cottage cheese patty with slice.", False),
    ("Hot Mexican Burger", 80, "Burger", "Jalapeno salsa with spicy patty.", False),
    ("Hot Mexican Cheese Burger", 100, "Burger", "Mexican burger with extra cheese.", False),
    ("Peri Peri Cheese Burger", 100, "Burger", "Peri peri spiced cheese burger.", False),
    ("American Cheese Burger", 100, "Burger", "American style burger with dill relish.", False),
    ("Tandoori Cheese Burger", 100, "Burger", "Smoky tandoori sauce with melted cheese.", False),
    # Pasta
    ("Penne Alfredo", 120, "Pasta", "Creamy white garlic parmesan sauce.", True),
    ("Red Sauce Pasta", 120, "Pasta", "Spicy tomato basil arrabbiata sauce.", False),
    ("Cheese Corn Pasta", 140, "Pasta", "Cheesy pasta loaded with sweet corn.", False),
    ("Pink Sauce Pasta", 140, "Pasta", "Rich blend of alfredo and arrabbiata.", False),
    # Pulav
    ("Mug Pulav", 60, "Pulav", "Spiced whole moong tawa pulav.", False),
    ("Paneer Cheese Pulav", 100, "Pulav", "Tawa pulav with paneer and shredded cheese.", True),
    ("Manchurian Rice", 120, "Pulav", "Fried rice topped with manchurian balls.", False),
    ("Cheese Manchurian Rice", 140, "Pulav", "Manchurian fried rice with cheese.", False),
    ("Schezwan Fried Rice", 110, "Pulav", "Spicy wok tossed schezwan rice.", False),
    ("Chana Pulav", 60, "Pulav", "Nutritious spiced chickpea pulav.", False),
    ("Solid Masti Cheese Pulav", 150, "Pulav", "Loaded cheese pulav with exotic vegetables.", False),
    ("Mushroom Cheese Pulav", 120, "Pulav", "Tawa pulav with mushrooms and cheese.", False),
    ("Yogi Special Cheese Pulav", 160, "Pulav", "Yogi's signature tawa cheese pulav.", True),
    # Sandwich
    ("Garden Grilled Sandwich", 60, "Sandwich", "Fresh cucumbers, tomatoes and mint chutney.", False),
    ("Cream And Corn Sandwich", 80, "Sandwich", "Sweet corn in creamy herb dressing.", False),
    ("Cheese Mushroom Sandwich", 110, "Sandwich", "Sautéed mushrooms and melted cheese.", False),
    ("Corn Veg. Paneer Sandwich", 120, "Sandwich", "Triple combination of corn, veggies and paneer.", False),
    ("Mix Veg. Cheese Sandwich", 110, "Sandwich", "Assorted vegetables with cheese.", False),
    ("Club Sandwich (3 Layer)", 140, "Sandwich", "3-layer toasted club sandwich.", True),
    ("Club Cheese Paneer (3 Layer)", 170, "Sandwich", "3-layer sandwich with paneer and cheese.", False),
    ("Triple Cheese Sandwich", 170, "Sandwich", "Three varieties of cheese melted together.", False),
    ("Cheese Garlic Corn Sandwich", 100, "Sandwich", "Garlic butter, corn and mozzarella.", False),
    ("Yogi Special Sandwich (3 Layer)", 200, "Sandwich", "Signature jumbo 3-layer sandwich.", True),
    ("Tandoori Cheese Sandwich", 110, "Sandwich", "Tandoori seasoned grilled sandwich.", False),
    ("American Cheese Sandwich", 110, "Sandwich", "American style grilled cheese.", False),
    # Vada Pav
    ("Vada Pav", 25, "Vada Pav", "Mumbai style batata vada in pav with chutneys.", False),
    ("Butter Vada Pav", 30, "Vada Pav", "Pav toasted with pure Amul butter.", False),
    ("Peri Peri Vada Pav", 35, "Vada Pav", "Spicy peri peri seasoned vada pav.", False),
    ("Cheese Vada Pav", 40, "Vada Pav", "Vada pav stuffed with melted cheese.", False),
    ("Peri Peri Cheese Vada Pav", 50, "Vada Pav", "Spicy peri peri with gooey cheese.", False),
    ("Onion Vada Pav", 40, "Vada Pav", "Served with crunchy spiced onions.", False),
    ("Cheese Butter Vada Pav", 60, "Vada Pav", "Double butter and cheese indulgence.", False),
    ("Tandoori Cheese Vada Pav", 60, "Vada Pav", "Smoky tandoori mayo and cheese.", False),
    ("Schezwan Vada Pav", 40, "Vada Pav", "Vada pav smeared with schezwan chutney.", False),
    ("Schezwan Cheese Vada Pav", 60, "Vada Pav", "Schezwan sauce with melted cheese.", False),
    # Specials
    ("Chinese Samosa (5 Pcs)", 30, "Specials", "Noodle and veggie stuffed crispy samosas.", False),
    ("Bread Pakoda", 50, "Specials", "Batter fried spiced potato stuffed bread.", False),
    ("Cheese Salad (2 Bread)", 120, "Specials", "Fresh garden salad with 2 bread slices and cheese.", False),
    ("Bread Butter (3 Pcs)", 50, "Specials", "3 bread slices served with butter.", False),
    ("Bread Butter Jam (3 Pcs)", 80, "Specials", "3 bread slices with butter and mixed fruit jam.", False),
    ("Butter Milk Amul Jeera", 20, "Specials", "Refreshing chilled Amul spiced buttermilk.", False),
    ("Chinese Sandwich", 80, "Specials", "Sandwich stuffed with noodles and schezwan sauce.", False),
    ("Rose Lassi", 25, "Specials", "Sweet curd drink flavored with rose syrup.", False),
    ("Aloo Paratha (1 Pcs)", 40, "Specials", "Freshly roasted spiced potato flatbread.", False)
]

for name, price, cat, desc, rec in yogi_items:
    sql.append(addItem("99 Yogi", name, price, cat, desc, rec))

# --- Danny's ---
dannys_items = [
    # Beverages
    ("Cold Coffee", 70, "Beverages", "Danny's world famous thick cold coffee.", True),
    ("Cold Coffee with Topping", 70, "Beverages", "Cold coffee topped with chocolate syrup.", False),
    ("Bournvita", 70, "Beverages", "Chilled chocolate malt Bournvita.", False),
    ("Bournvita with Topping", 70, "Beverages", "Chilled Bournvita with chocolate crunch.", False),
    ("Espresso Coffee", 60, "Beverages", "Rich concentrated hot espresso shot.", False),
    ("Hot Bournvita", 60, "Beverages", "Comforting hot Bournvita milk.", False),
    # Maggi
    ("Masala Maggi", 60, "Maggi", "Danny's signature masala Maggi.", False),
    ("Veg. Masala Maggi", 70, "Maggi", "Loaded with onions and bell peppers.", False),
    ("Butter Maggi", 80, "Maggi", "Cooked with rich Amul butter.", False),
    ("Cheese Maggi", 80, "Maggi", "Topped with fresh grated cheese.", False),
    ("Veg. Cheese Maggi", 90, "Maggi", "Veggies, spices and melted cheese.", True),
    ("Garlic Butter Cheese Maggi", 100, "Maggi", "Roasted garlic butter with rich cheese.", False),
    # Toast
    ("Paneer Toast", 140, "Toast", "Spiced paneer on toasted bread slices.", False),
    ("Beans Toast", 130, "Toast", "Baked beans in tomato sauce on toast.", False),
    ("Cheese Chilly Toast", 130, "Toast", "Melted cheese and spicy green chilies.", False),
    ("Cheese Chilly Garlic Toast", 130, "Toast", "Garlic butter, green chilies and cheese.", False),
    ("Thousand Bread", 140, "Toast", "Toast with thousand island dressing and cheese.", False),
    ("Supreme Cheese Garlic Bread", 130, "Toast", "Onion, Capsicum, Tomato, Cheese.", True),
    ("Masala Bread", 130, "Toast", "Olive, Capsicum, Jalapeno, Onion.", False),
    ("Premium Bread", 130, "Toast", "Tomato, Onion, Corn, Green Chilly, Cheese.", False),
    # Pizza
    ("Margareta Pizza", 130, "Pizza", "Soft base with baked mozzarella cheese.", False),
    ("Onion Capsicum Pizza", 130, "Pizza", "Crisp onions and green capsicum with cheese.", False),
    ("Napolitano Pizza", 130, "Pizza", "Tomato, Capsicum, Onion, Cheese.", False),
    ("Mexican Pizza", 130, "Pizza", "Beans, Capsicum, Onion, Cheese.", False),
    ("Tandoori Pizza", 130, "Pizza", "Paneer, Capsicum, Onion, Cheese.", False),
    ("American Pizza", 130, "Pizza", "Jalapeno, Onion, Capsicum, Cheese.", False),
    ("Danny's Special Pizza", 140, "Pizza", "Tomato, Capsicum, Onion, Black Olive, Jalapeno, Oregano, Cheese.", True),
    ("Toofani Pizza", 140, "Pizza", "Fiery spicy pizza loaded with toppings.", False),
    # Special Sandwich
    ("Tandoori Grilled Sandwich", 90, "Special Sandwich", "Capsicum, Paneer, Onion, Tomato gravy.", False),
    ("Corn Hi Corn Grilled Sandwich", 90, "Special Sandwich", "Corn, Capsicum, Sandwich Dressing.", False),
    ("Garlic Bonanza Grilled Sandwich", 90, "Special Sandwich", "Capsicum, Garlic, Onion, Cheese, Green Chatni.", False),
    ("Mexican Grilled Sandwich", 90, "Special Sandwich", "Baked Beans, Capsicum, Onion, Cheese.", False),
    ("Hot & Spicy Grilled Sandwich", 90, "Special Sandwich", "Onion, Capsicum, Chilly garlic Sauce, Coriander, Sandwich Dressing.", False),
    ("Best of Danny's Sandwich", 90, "Special Sandwich", "Onion, Capsicum, Coriander, Green Chatni, Cheese, Sandwich Dressing.", True),
    ("Italian Grilled Sandwich", 100, "Special Sandwich", "Olive, Jalapenos, Corn, Sandwich Dressing.", False),
    ("Cheese Chilly Garlic Grilled", 100, "Special Sandwich", "Spicy garlic and cheese grilled to perfection.", False),
    ("Danny's Special Sandwich", 110, "Special Sandwich", "Olive, Jalapenos, Corn, Cheese, Sandwich Dressing.", True),
    # Club Sandwich
    ("Cheese Veg. Club", 110, "Club Sandwich", "Tomato, Cucumber, Jam, Cheese.", False),
    ("Indian Club", 110, "Club Sandwich", "Tomato, Cucumber, Capsicum, G. Chilly, Sandwich Dressing.", False),
    ("Euro Club", 110, "Club Sandwich", "Tomato, Cucumber, Capsicum, Cheese, Sandwich Dressing.", False),
    ("House of Cheese Club", 130, "Club Sandwich", "Overflowing with layers of melted cheese.", True),
    ("Tandoori Club", 130, "Club Sandwich", "Smoky tandoori paneer club sandwich.", False),
    ("Danny's Special Club", 130, "Club Sandwich", "Danny's signature triple-layer club sandwich.", True),
    # Puffs
    ("Mexican Puff", 80, "Puffs", "Stuffed with Mexican beans and cheese.", False),
    ("Veg. Puff", 50, "Puffs", "Crispy spiced potato vegetable puff.", False),
    ("Veg. Cheese Puff", 60, "Puffs", "Veggie puff with melted cheese.", False),
    ("Cheese Garlic Puff", 60, "Puffs", "Garlic butter and melted cheese.", False),
    ("Mayonnaise Puff", 60, "Puffs", "Creamy mayonnaise stuffed puff.", False),
    ("Paneer Puff", 60, "Puffs", "Cottage cheese filling in golden pastry.", False),
    # Plain & Grilled Sandwich
    ("Bread Butter (Plain)", 40, "Plain & Grilled Sandwich", "Soft white bread with butter.", False),
    ("Bread Butter (Grill)", 50, "Plain & Grilled Sandwich", "Toasted golden with butter.", False),
    ("Chatni Sandwich (Plain)", 40, "Plain & Grilled Sandwich", "Green mint coriander chutney.", False),
    ("Chatni Sandwich (Grill)", 50, "Plain & Grilled Sandwich", "Grilled with spicy chutney.", False),
    ("Butter Jam (Plain)", 40, "Plain & Grilled Sandwich", "Butter and sweet fruit jam.", False),
    ("Butter Jam (Grill)", 50, "Plain & Grilled Sandwich", "Warm grilled sweet jam sandwich.", False),
    ("Veg. Sandwich (Plain)", 60, "Plain & Grilled Sandwich", "Cucumber, tomato and potato.", False),
    ("Veg. Sandwich (Grill)", 70, "Plain & Grilled Sandwich", "Grilled spiced vegetable sandwich.", False),
    ("Cheese Chatni (Plain)", 70, "Plain & Grilled Sandwich", "Cheese and spicy green chutney.", False),
    ("Cheese Chatni (Grill)", 80, "Plain & Grilled Sandwich", "Grilled chutney cheese sandwich.", False),
    ("Cheese Sandwich (Plain)", 70, "Plain & Grilled Sandwich", "Simple cheese slices in bread.", False),
    ("Cheese Sandwich (Grill)", 80, "Plain & Grilled Sandwich", "Grilled melted cheese sandwich.", False),
    ("Cheese Jam (Plain)", 70, "Plain & Grilled Sandwich", "Cheese with sweet mixed fruit jam.", False),
    ("Cheese Jam (Grill)", 80, "Plain & Grilled Sandwich", "Grilled cheese and fruit jam.", False),
    ("Veg Cheese Sandwich (Plain)", 80, "Plain & Grilled Sandwich", "Veggies with cheese slice.", False),
    ("Veg Cheese Sandwich (Grill)", 90, "Plain & Grilled Sandwich", "Classic grilled veg cheese sandwich.", True),
    # Pav Bhaji
    ("Pav Bhaji Plain", 100, "Pav Bhaji", "Spiced mashed vegetable bhaji with 2 pav.", False),
    ("Pav Bhaji Butter", 120, "Pav Bhaji", "Mashed bhaji cooked with Amul butter.", True),
    ("Pav Bhaji Cheese", 120, "Pav Bhaji", "Bhaji topped with grated processed cheese.", False),
    ("Cheese Butter Bhaji", 130, "Pav Bhaji", "Rich butter and cheese loaded bhaji.", False),
    ("Masala Pav", 100, "Pav Bhaji", "Pav toasted with spicy tomato garlic bhaji.", False),
    ("Danny's Special Pav Bhaji", 150, "Pav Bhaji", "Danny's chef special dry-fruit and paneer bhaji.", True),
    ("Extra Pav", 10, "Pav Bhaji", "Extra pair of soft butter toasted pav.", False),
    # Pulav
    ("Veg Pulav", 90, "Pulav", "Fragrant spiced tawa vegetable rice.", False),
    ("Veg Butter Pulav", 110, "Pulav", "Tawa pulav roasted in butter.", False),
    ("Veg Cheese Pulav", 110, "Pulav", "Tawa pulav topped with cheese.", False),
    ("Veg Paneer Pulav", 120, "Pulav", "Tawa pulav with spiced paneer cubes.", False),
    ("Danny's Special Pulav", 130, "Pulav", "Special rich pulav with paneer and cheese.", True),
    # Fries
    ("Peri Peri French Fries", 100, "Fries", "Crispy fries tossed in peri peri seasoning.", False),
    ("Salted French Fries", 100, "Fries", "Golden crispy salted potato fries.", False),
    ("Grated Cheese French Fries", 120, "Fries", "Hot fries topped with mountain of cheese.", True),
    # Panini
    ("Indian Panini", 130, "Panini", "Pressed panini with Indian spiced filling.", False),
    ("Mexican Panini", 130, "Panini", "Pressed panini with beans, jalapenos and cheese.", False),
    ("Tandoori Panini", 130, "Panini", "Tandoori paneer in warm pressed panini bread.", True)
]

for name, price, cat, desc, rec in dannys_items:
    sql.append(addItem("Danny''s", name, price, cat, desc, rec))

# --- Ice Berg ---
iceberg_items = [
    # Mocktails
    ("Pineapple Kiwi Mocktail", 60, "Mocktails & Juices", "Sweet pineapple and tangy kiwi blend.", False),
    ("Blueberry Mint Mocktail", 60, "Mocktails & Juices", "Wild blueberries with fresh mint leaves.", False),
    ("Lychee Lemon Mocktail", 60, "Mocktails & Juices", "Juicy litchi with a zesty lemon kick.", False),
    ("Mango Kiwi Mocktail", 60, "Mocktails & Juices", "Ripe mango and tangy kiwi coolers.", False),
    ("Blueberry Mocktail", 50, "Mocktails & Juices", "Chilled blueberry fruit cooler.", False),
    ("Mint Mojito", 60, "Mocktails & Juices", "Classic refreshing mint lime mojito.", True),
    ("Litchi Mocktail", 50, "Mocktails & Juices", "Sweet fragrant litchi juice.", False),
    ("Orange Mocktail", 50, "Mocktails & Juices", "Fresh zesty orange citrus mocktail.", False),
    ("Lemon Soda", 50, "Mocktails & Juices", "Refreshing carbonated lemon soda.", False),
    ("Jeer Soda", 50, "Mocktails & Juices", "Tangy cumin spiced digestive soda.", False),
    ("Pineapple Juice", 50, "Mocktails & Juices", "Pure fresh pineapple juice.", False),
    ("Rose Mocktail", 50, "Mocktails & Juices", "Fragrant rose petal syrup with lime.", False),
    ("Kala Khatta Mocktail", 50, "Mocktails & Juices", "Traditional tangy blackberry cooler.", False),
    ("Kachi Keri Mocktail", 50, "Mocktails & Juices", "Raw green mango summer cooler.", False),
    ("Guava Mocktail", 50, "Mocktails & Juices", "Pink guava juice with chili salt rim.", False),
    ("Strawberry Mocktail", 50, "Mocktails & Juices", "Fresh sweet strawberry cooler.", False),
    ("Pomegranate Mocktail", 50, "Mocktails & Juices", "Rich antioxidant pomegranate juice.", False),
    ("Kiwi Mocktail", 70, "Mocktails & Juices", "Fresh exotic kiwi crush mocktail.", False),
    ("Watermelon Mocktail", 50, "Mocktails & Juices", "Chilled hydrating fresh watermelon juice.", False),
    ("Bubblegum Mocktail", 60, "Mocktails & Juices", "Playful sweet bubblegum flavored drink.", False),
    ("Black Current Mocktail", 60, "Mocktails & Juices", "Rich blackcurrant mocktail.", False),
    ("Green Apple Mocktail", 50, "Mocktails & Juices", "Crisp tangy green apple cooler.", False),
    ("Mix Fruit Mocktail", 60, "Mocktails & Juices", "Seasonal fresh mixed fruit juice.", True),
    # Oreo Milkshakes
    ("Oreo Shake", 60, "Oreo Milkshakes", "Creamy shake blended with Oreo cookies.", True),
    ("Oreo Kitkate Shake", 70, "Oreo Milkshakes", "Fusion of Oreo and Kitkat wafer chocolate.", False),
    ("Oreo Coffee", 80, "Oreo Milkshakes", "Cold coffee blended with crunchy Oreos.", False),
    ("Oreo Strawberry Shake", 70, "Oreo Milkshakes", "Strawberry shake with Oreo crumbs.", False),
    ("Oreo Bournvita", 70, "Oreo Milkshakes", "Chocolate Bournvita and Oreo cookies.", False),
    ("Oreo Red Velvet Cake Shake", 80, "Oreo Milkshakes", "Red velvet cake blended with Oreos.", False),
    ("Oreo Chocolate Cake Shake", 80, "Oreo Milkshakes", "Rich chocolate cake and Oreo milkshake.", True),
    ("Oreo Kitkate Coco", 80, "Oreo Milkshakes", "Decadent cocoa, Kitkat and Oreo blend.", False),
    ("Oreo Chocolate Bournvita", 80, "Oreo Milkshakes", "Triple chocolate loaded shake.", False),
    ("Oreo Lotte Chocopie Shake", 80, "Oreo Milkshakes", "Soft marshmallow chocopie blended with Oreos.", False),
    # Kitkat Milkshakes
    ("Kitkate Milkshake", 80, "Kitkat Milkshakes", "Thick shake loaded with crispy Kitkat bars.", True),
    ("Kitkate Coffee", 80, "Kitkat Milkshakes", "Iced coffee with Kitkat wafer blend.", False),
    ("Kitkate Lotte Chocopie", 80, "Kitkat Milkshakes", "Kitkat crunch with chocolate pie.", False),
    ("Kitkate Bournvita", 80, "Kitkat Milkshakes", "Malted chocolate Bournvita with Kitkat.", False),
    # Special Milkshakes
    ("Bournvita Shake", 50, "Special Milkshakes", "Classic creamy cold Bournvita.", False),
    ("Chocolate Milkshake", 50, "Special Milkshakes", "Rich milk chocolate shake.", False),
    ("Special Iceberg Shake", 100, "Special Milkshakes", "Signature thick shake with ice cream and nuts.", True),
    ("Chocolate & Hazelnut Shake", 80, "Special Milkshakes", "Nutella style chocolate hazelnut shake.", False),
    ("Cold Coffee Shake", 80, "Special Milkshakes", "Creamy coffee ice cream shake.", False),
    ("Vanilla & Roasted Almonds Shake", 80, "Special Milkshakes", "Roasted almonds in rich vanilla shake.", False),
    ("Cookies & Cream Shake", 80, "Special Milkshakes", "Creamy cookie crumb milkshake.", True),
    # Coffee & Davidoff
    ("Cold Coffee", 70, "Coffee & Brews", "Classic creamy cold coffee.", True),
    ("Cold Coffee Strawberry", 80, "Coffee & Brews", "Cold coffee with strawberry syrup swirl.", False),
    ("Cold Coffee Bournvita", 80, "Coffee & Brews", "Coffee blended with malted Bournvita.", False),
    ("Classic Strong Coffee", 80, "Coffee & Brews", "Double shot intense cold brew coffee.", False),
    ("French Vanilla Coffee", 80, "Coffee & Brews", "Cold coffee infused with Madagascar vanilla.", False),
    ("Hazelnut Coffee", 80, "Coffee & Brews", "Roasted hazelnut flavored coffee.", False),
    ("Chocolate Mocha Coffee", 80, "Coffee & Brews", "Rich chocolate and espresso cold blend.", False),
    ("Butterscotch Coffee", 80, "Coffee & Brews", "Butterscotch caramel syrup coffee.", False),
    ("Iced Coffee", 80, "Coffee & Brews", "Chilled black coffee over ice.", False),
    ("Dark Wish Coffee", 80, "Coffee & Brews", "High caffeine extra dark roasted coffee.", False),
    ("Davidoff Elegant Coffee", 100, "Coffee & Brews", "Premium Swiss Davidoff Elegant roast.", True),
    ("Davidoff Asia Coffee", 100, "Coffee & Brews", "Davidoff Asian beans rich aroma coffee.", False),
    ("Davidoff Brazil Coffee", 100, "Coffee & Brews", "Single-origin Brazilian bean iced coffee.", False),
    ("Cold Coffee Sugar Less", 50, "Coffee & Brews", "Health-conscious zero sugar cold coffee.", False),
    ("Cold Chocolate", 50, "Coffee & Brews", "Chilled creamy chocolate milk.", False),
    ("Frappe Mocha", 60, "Coffee & Brews", "Blended iced mocha frappe with whipped foam.", False),
    # Lotte
    ("Lotte Choco Pie Shake", 70, "Lotte Special", "Lotte marshmallow pie in sweet shake.", False),
    ("Lotte Choco Pie Coffee", 80, "Lotte Special", "Coffee blended with Lotte Choco Pie.", False),
    # Hot Coffee
    ("Tapri Coffee", 30, "Hot Drinks", "Desi boiled frothy tapri style coffee.", False),
    ("Espresso", 40, "Hot Drinks", "Hot concentrated dark roast coffee.", False),
    ("Cappuccino", 40, "Hot Drinks", "Espresso with steamed milk and thick foam.", True),
    ("Cafe Latte", 40, "Hot Drinks", "Smooth espresso with warm steamed milk.", False),
    ("Cafe Mocha", 40, "Hot Drinks", "Hot chocolate combined with espresso.", False),
    ("Hot Chocolate", 40, "Hot Drinks", "Rich hot melted chocolate drink.", False),
    ("Hot Milk", 30, "Hot Drinks", "Steamed whole milk.", False),
    # Ice Tea
    ("Lemon Ice Tea", 50, "Ice Tea", "Chilled black tea with fresh lemon juice.", False),
    ("Water Melon Ice Tea", 60, "Ice Tea", "Refreshing watermelon infused iced tea.", False),
    ("Mojito Ice Tea", 60, "Ice Tea", "Mint and lime infused iced tea.", False),
    ("Peach Ice Tea", 60, "Ice Tea", "Sweet Southern style peach iced tea.", True),
    # Jar Cakes
    ("Chocolate Jar Cake", 70, "Jar Cakes", "Layered chocolate cake with mousse in jar.", False),
    ("Butterscotch Jar Cake", 70, "Jar Cakes", "Butterscotch cake with caramel praline.", False),
    ("Strawberry Jar Cake", 70, "Jar Cakes", "Fresh strawberry compote layered cake.", False),
    ("Pineapple Jar Cake", 70, "Jar Cakes", "Juicy pineapple chunks with vanilla sponge.", False),
    ("Blueberry Jar Cake", 70, "Jar Cakes", "Blueberry cheesecake layers in a jar.", False),
    ("Mango Jar Cake", 70, "Jar Cakes", "Alphonso mango pulp and cream cake.", False),
    ("Mix Fruits Jar Cake", 70, "Jar Cakes", "Seasonal fresh fruits with vanilla cake.", True)
]

for name, price, cat, desc, rec in iceberg_items:
    sql.append(addItem("Ice Berg", name, price, cat, desc, rec))

# --- Pramukh ---
pramukh_items = [
    # Pizzas
    ("Margherita Pizza", 120, "Pizzas", "Classic cheese and herb pizza.", False),
    ("Veg. Cheese Pizza", 130, "Pizzas", "Loaded with onions, capsicum and cheese.", False),
    ("Paneer Chili Sp. Pizza", 130, "Pizzas", "Spicy green chili and paneer cubes.", False),
    ("Paneer Tandoori Pizza", 130, "Pizzas", "Tandoori marinated paneer and cheese.", True),
    ("Onion Capsicum Pizza", 130, "Pizzas", "Crunchy onions and green peppers.", False),
    ("Paneer Corn Pizza", 130, "Pizzas", "Sweet corn kernels and paneer cubes.", False),
    # Appetizers
    ("Garlic Bread", 80, "Appetizers", "Toasted bread with garlic herb butter.", False),
    ("Cheese Toast", 90, "Appetizers", "Crispy toast topped with melted cheese.", False),
    ("Cheese Garlic Bread", 100, "Appetizers", "Garlic bread topped with gooey cheese.", True),
    ("Cheese Chili Toast", 100, "Appetizers", "Green chilies and cheese on toast.", False),
    ("Cheese Tandori Toast", 100, "Appetizers", "Smoky tandoori seasoning on cheese toast.", False),
    ("Pizza Toast", 100, "Appetizers", "Toast baked with pizza sauce and cheese.", False),
    # Sandwiches
    ("Bread Butter Cheese Sandwich", 70, "Sandwiches", "Classic butter and cheese sandwich.", False),
    ("Fruit Jam Cheese Sandwich", 70, "Sandwiches", "Sweet fruit jam with savory cheese.", False),
    ("Chutney Cheese Special Sandwich", 70, "Sandwiches", "Mint chutney and processed cheese.", False),
    ("Double Cheese Special Sandwich", 80, "Sandwiches", "Double layer of cheddar and mozzarella.", False),
    ("Veg. Cheese Special Sandwich", 70, "Sandwiches", "Tomatoes, cucumbers and cheese.", False),
    ("Tikka Masala Special Sandwich", 80, "Sandwiches", "Paneer tikka masala stuffed sandwich.", False),
    ("Chocolate Sandwich", 70, "Sandwiches", "Nutella chocolate spread inside toast.", False),
    ("Chocolate Cheese Special Sandwich", 80, "Sandwiches", "Chocolate and cheese melted together.", False),
    ("Bombay Kaccha Sandwich", 70, "Sandwiches", "Raw vegetables with tangy green chutney.", False),
    ("Our Special Sandwich", 70, "Sandwiches", "Pramukh chef's special recipe sandwich.", True),
    # Club Sandwiches
    ("Red Cheese Club Sandwich", 110, "Club Sandwiches", "Chili garlic sauce with cheese layers.", False),
    ("Green Club Sandwich", 110, "Club Sandwiches", "Mint chutney, cucumber and capsicum.", False),
    ("Mexican Bean Sandwich", 110, "Club Sandwiches", "Refried beans, salsa and cheese.", False),
    ("Paneer Tandoori Club", 110, "Club Sandwiches", "Tandoori paneer in 3-layer sandwich.", True),
    ("Cheese Peri Peri Sandwich", 110, "Club Sandwiches", "Spicy peri peri sauce with cheese.", False),
    ("Paneer Corn Masala Club", 110, "Club Sandwiches", "Corn, paneer and chatpata masala.", False),
    ("Indian Club Sandwich", 110, "Club Sandwiches", "Classic Indian street club sandwich.", False),
    ("Paneer Delight Sandwich", 110, "Club Sandwiches", "Soft paneer cubes with cheese.", False),
    ("American Club Sandwich", 110, "Club Sandwiches", "American style double decker sandwich.", False),
    ("European Club Sandwich", 110, "Club Sandwiches", "Herb dressing with olives and cheese.", False),
    ("Junglee Paneer Club", 110, "Club Sandwiches", "Spicy rustic wild paneer filling.", True),
    ("Regular Club Sandwich", 110, "Club Sandwiches", "Traditional toasted vegetable club.", False),
    # Burgers
    ("Aloo Tikki Burger", 60, "Burgers", "Crispy spiced potato patty burger.", False),
    ("Veg Cheese Burger", 70, "Burgers", "Vegetable patty with melted cheese.", True),
    ("Schezwan Cheese Burger", 70, "Burgers", "Spicy schezwan sauce and cheese.", False),
    ("Cheese Garlic Burger", 70, "Burgers", "Garlic mayo and melted cheese patty.", False),
    ("Peri Peri Sp. Burger", 80, "Burgers", "Peri peri dusted patty and bun.", False),
    ("Double Tikki Burger", 100, "Burgers", "Two potato patties stacked with cheese.", True),
    # Wraps & Frenkies
    ("Sp. Cheese Wrap", 80, "Wraps & Frenkie", "Stuffed with cheese and fresh veggies.", False),
    ("Paneer Chili Wrap", 90, "Wraps & Frenkie", "Indo-Chinese chili paneer roll.", False),
    ("Paneer Tandoori Wrap", 90, "Wraps & Frenkie", "Smoky roasted paneer in paratha wrap.", True),
    ("Cheese Garlic Wrap", 90, "Wraps & Frenkie", "Garlic butter, vegetables and cheese.", False),
    # Panini
    ("Indian Panini", 110, "Panini", "Indian spiced potato and vegetable panini.", False),
    ("Mexican Panini", 110, "Panini", "Jalapenos, beans and Mexican salsa panini.", False),
    ("Tandoori Panini", 120, "Panini", "Tandoori paneer in toasted panini bread.", True),
    ("Veg. Cheese Panini", 110, "Panini", "Mixed vegetables with melted mozzarella.", False),
    # Maggi & Pasta
    ("Masala Maggi", 50, "Maggi & Pasta", "Classic spiced Maggi noodles.", False),
    ("Butter Maggi", 60, "Maggi & Pasta", "Maggi cooked with butter.", False),
    ("Cheese Maggi", 70, "Maggi & Pasta", "Topped with grated cheese.", False),
    ("Veg. Cheese Maggi", 70, "Maggi & Pasta", "Vegetables and cheese with Maggi.", False),
    ("Veg. Maggi Pasta Cheese", 90, "Maggi & Pasta", "Fusion of Maggi and pasta with cheese.", True),
    ("Maggi Pasta", 80, "Maggi & Pasta", "Combination of noodles and penne pasta.", False),
    ("Maggi Pasta Oil Tadka", 70, "Maggi & Pasta", "Tempered with spicy chili oil.", False),
    ("Maggi Pasta Butter Tadka", 80, "Maggi & Pasta", "Tempered with hot sizzled butter.", False),
    ("Masala Pasta", 70, "Maggi & Pasta", "Penne tossed in spicy Indian gravy.", False),
    ("Cheese Pasta", 80, "Maggi & Pasta", "Penne in rich cheese sauce.", False),
    ("Veg. Cheese Pasta", 90, "Maggi & Pasta", "Pasta with vegetables and cheese.", False),
    ("Veg. Cheese Pasta Oil Tadka", 90, "Maggi & Pasta", "Spicy oil tadka on cheesy pasta.", False),
    ("Veg. Cheese Pasta Butter Tadka", 100, "Maggi & Pasta", "Butter tadka over cheesy pasta.", False),
    ("Red Sauce Pasta", 80, "Maggi & Pasta", "Tangy tomato herb sauce pasta.", False),
    ("White Sauce Pasta", 80, "Maggi & Pasta", "Creamy garlic bechamel sauce pasta.", False),
    ("Chinese Pasta", 80, "Maggi & Pasta", "Penne tossed with soy garlic Chinese sauce.", False),
    # Vada Pav
    ("Oil Vada Pav", 25, "Vada Pav", "Traditional Mumbai style batata vada pav.", False),
    ("Butter Vada Pav", 35, "Vada Pav", "Pav pan-fried with Amul butter.", False),
    ("Cheese Vada Pav", 40, "Vada Pav", "Batata vada with melted cheese in pav.", False),
    ("Cheese Butter Vada Pav", 50, "Vada Pav", "Double butter toasted pav with cheese.", True),
    ("Onion Vada Pav", 30, "Vada Pav", "Served with chopped spiced onions.", False),
    ("Cheese Onion Vada Pav", 40, "Vada Pav", "Onions and melted cheese with vada.", False),
    ("Classic Vada Pav", 35, "Vada Pav", "Authentic spicy garlic chutney vada pav.", False),
    ("Bun Butter Cheese", 25, "Vada Pav", "Soft bun with butter and cheese slice.", False),
    # Manchurian & Chinese
    ("Veg. Manchuriyan Dry", 200, "Manchurian & Chinese", "Crispy fried vegetable dumplings dry.", False),
    ("Veg. Manchuriyan Gravy", 200, "Manchurian & Chinese", "Vegetable balls in thick savory gravy.", False),
    ("Veg. Garlic Manchuriyan", 100, "Manchurian & Chinese", "Garlic flavored spicy manchurian.", False),
    ("Veg. Schezwan Spicy Manchuriyan", 100, "Manchurian & Chinese", "Manchurian in fiery schezwan sauce.", False),
    ("Paneer Chilli", 180, "Manchurian & Chinese", "Fried paneer with capsicum and chilies.", True),
    ("Cheese Chilli", 200, "Manchurian & Chinese", "Gooey cheese cubes in spicy chili gravy.", False),
    ("Chilli Potato", 120, "Manchurian & Chinese", "Crisp potatoes in sweet and spicy chili sauce.", False),
    # Noodles & Rice
    ("Manchuriyan Noodles", 100, "Noodles", "Noodles tossed with manchurian sauce.", False),
    ("Hakka Noodles", 100, "Noodles", "Wok-tossed noodles with julienned vegetables.", True),
    ("Schezwan Noodles", 100, "Noodles", "Spicy noodles in schezwan chili paste.", False),
    ("Manchuriyan Rice", 100, "Rice", "Fried rice tossed with manchurian balls.", False),
    ("Schezwan Rice", 100, "Rice", "Spicy red schezwan fried rice.", False),
    ("Chinese Rice", 100, "Rice", "Wok-tossed soy garlic vegetable fried rice.", False),
    ("Veg. Fried Rice", 80, "Rice", "Classic mixed vegetable fried rice.", False),
    ("Chinese Bhel", 100, "Rice", "Crispy noodles with cabbage and sweet spicy sauce.", False),
    # Special Pulao
    ("Mug Pulao", 70, "Special Pulao", "Tawa spiced whole green gram pulav.", False),
    ("Cheese Mug Pulao", 100, "Special Pulao", "Moong pulav topped with melted cheese.", False),
    ("Butter Mug Pulao", 100, "Special Pulao", "Moong pulav roasted in butter.", False),
    ("Cheese Butter Mug Pulao", 120, "Special Pulao", "Butter and cheese rich moong pulav.", True),
    ("Hyderabadi Pulao", 200, "Special Pulao", "Fragrant saffron rice with mint and spices.", False),
    ("Veg. Pulao", 80, "Special Pulao", "Classic tawa vegetable pulav.", False),
    ("Mexican Pulao", 90, "Special Pulao", "Rice cooked with kidney beans and salsa.", False),
    ("Chinese Pulao", 100, "Special Pulao", "Indo-Chinese spiced tawa pulav.", False),
    ("Paneer Pulao", 100, "Special Pulao", "Tawa pulav loaded with paneer cubes.", False),
    ("Maggi Pulao", 100, "Special Pulao", "Unique fusion of Maggi noodles and pulav rice.", False),
    # Fries & Sides
    ("French Fries", 80, "Fries & Sides", "Salted crispy potato fries.", False),
    ("Peri Peri French Fries", 90, "Fries & Sides", "Fries dusted with peri peri spice.", False),
    ("Cheese Peri Peri French Fries", 110, "Fries & Sides", "Peri peri fries with melted cheese.", False),
    ("Amul Dahi", 10, "Fries & Sides", "Fresh chilled Amul curd cup.", False),
    ("Bhujia Sev", 10, "Fries & Sides", "Crispy spiced besan sev.", False),
    ("Extra Cheese", 20, "Fries & Sides", "Extra portion of cheese.", False),
    ("Extra Butter", 10, "Fries & Sides", "Extra pat of Amul butter.", False),
    # Variety Puffs
    ("Jeera Puff", 20, "Variety Puffs", "Roasted cumin flavored golden puff.", False),
    ("Garlic Puff", 30, "Variety Puffs", "Aromatic garlic spiced puff.", False),
    ("Garlic Sev Puff", 30, "Variety Puffs", "Garlic puff filled with savory sev.", False),
    ("Garlic Peanut Puff", 40, "Variety Puffs", "Garlic puff with roasted crushed peanuts.", False),
    ("Sizwan Jeera Puff", 20, "Variety Puffs", "Spicy schezwan and roasted jeera puff.", False),
    ("Sizwan Sev Puff", 30, "Variety Puffs", "Schezwan sauce and crispy sev puff.", False),
    ("Sizwan Onion Puff", 30, "Variety Puffs", "Schezwan sauce and diced onions puff.", False),
    ("Sizwan Paneer Puff", 60, "Variety Puffs", "Cottage cheese in spicy schezwan sauce.", False),
    ("Salad Puff", 50, "Variety Puffs", "Cabbage, carrots and cucumber salad puff.", False),
    ("Salad Cheese Puff", 60, "Variety Puffs", "Garden salad with shredded cheese puff.", False),
    ("Salad Malai Puff", 60, "Variety Puffs", "Salad with rich malai cream dressing puff.", False),
    ("Cheese Chilly Puff", 70, "Variety Puffs", "Spicy green chilies with melted cheese.", True),
    ("Garlic Chilly Puff", 70, "Variety Puffs", "Garlic, green chilies and savory filling.", False),
    ("Tanduri Sp. Puff", 70, "Variety Puffs", "Smoky tandoori spiced vegetable puff.", False),
    ("Mayo Sp. Puff", 70, "Variety Puffs", "Creamy mayonnaise vegetable puff.", False),
    ("Pizza Puff Sp.", 80, "Variety Puffs", "Pizza sauce, mozzarella and Italian herbs.", True),
    ("Peri - Peri Sp. Puff", 70, "Variety Puffs", "Tangy spicy peri peri seasoned puff.", False),
    ("Chinese Puff", 25, "Variety Puffs", "Noodles and vegetables in crispy puff.", False),
    ("Chinese Cheese Puff", 60, "Variety Puffs", "Chinese noodle filling with melted cheese.", False),
    ("Chinese Cheese Chilly Puff", 70, "Variety Puffs", "Chili garlic Chinese filling with cheese.", False),
    ("Chinese Sizwan Puff", 30, "Variety Puffs", "Schezwan spiced Chinese puff.", False),
    ("Chinese Garlic Puff", 30, "Variety Puffs", "Garlic Chinese noodle puff.", False),
    ("Chinese Peri-peri Puff", 60, "Variety Puffs", "Chinese filling with peri peri spice.", False),
    ("Cheese Puff", 50, "Variety Puffs", "Pramukh's classic melted cheese puff.", False),
    ("Cheese Onion Puff", 60, "Variety Puffs", "Melted cheese and diced onions.", False),
    ("Cheese Sizwan Puff", 60, "Variety Puffs", "Cheese and schezwan sauce puff.", False),
    ("Cheese Tikki Puff", 70, "Variety Puffs", "Spiced potato tikki and cheese inside.", False),
    ("Cheese Sev Puff", 60, "Variety Puffs", "Melted cheese with savory sev.", False),
    ("Cheese Garlic Puff", 60, "Variety Puffs", "Garlic butter and melted cheese puff.", False),
    ("Cheese Tanduri Puff", 60, "Variety Puffs", "Tandoori masala and melted cheese.", False),
    ("Cheese & Peri - Peri Puff", 60, "Variety Puffs", "Peri peri spice with melted cheese.", False),
    ("Paneer Puff", 60, "Variety Puffs", "Paneer cubes in spiced gravy puff.", False),
    ("Paneer & Cheese Puff", 70, "Variety Puffs", "Paneer and mozzarella cheese puff.", False),
    ("Paneer & Malai Puff", 70, "Variety Puffs", "Soft paneer in rich malai cream.", False),
    ("Paneer & Sizwan Puff", 60, "Variety Puffs", "Paneer tossed in spicy schezwan sauce.", False),
    ("Paneer & Peri - Peri Puff", 70, "Variety Puffs", "Paneer dusted with peri peri spice.", False),
    ("Malai Puff", 60, "Variety Puffs", "Rich cream malai spiced puff.", False),
    ("Malai Cheese Puff", 70, "Variety Puffs", "Creamy malai and melted cheese.", False),
    ("Malai Sizwan Puff", 70, "Variety Puffs", "Malai cream with spicy schezwan sauce.", False),
    ("Malai Tandoor Puff", 60, "Variety Puffs", "Smoky tandoori spiced malai puff.", False),
    ("Malai Sev Puff", 60, "Variety Puffs", "Malai cream with crispy sev.", False),
    ("Malai Paneer Puff", 60, "Variety Puffs", "Malai cream with paneer cubes.", False),
    ("Malai Peri - Peri Puff", 60, "Variety Puffs", "Malai cream with peri peri spice.", False)
]

for name, price, cat, desc, rec in pramukh_items:
    sql.append(addItem("Pramukh", name, price, cat, desc, rec))

# --- Go Hunger Cafe ---
gohunger_items = [
    # Sandwich
    ("Bombay Sandwich", 70, "Sandwich", "Classic Mumbai street sandwich with boiled potatoes, beets, cucumber and green chutney.", False),
    ("Cheese Chutney Sandwich", 80, "Sandwich", "Spicy fresh mint coriander chutney layered with cheese.", False),
    ("Hub Roasted Sandwich", 130, "Sandwich", "Roasted vegetables and paneer in specialty herb dressing.", False),
    ("Cheese Pizza Sandwich", 150, "Sandwich", "Double decker sandwich stuffed with pizza sauce, veggies and mozzarella.", False),
    ("Tandoori Paneer Sandwich", 160, "Sandwich", "Marinated paneer tikka grilled with cheese.", True),
    ("Veg Club Sandwich", 170, "Sandwich", "Grand triple layer club sandwich with fresh veggies and cheese.", True),
    # Burger
    ("Surti Famous Time Pass", 50, "Burger", "Surti special crunchy potato patty burger.", False),
    ("Aalu Tikki Burger", 60, "Burger", "Crispy spiced potato tikki with tomato, onion and mayo.", False),
    ("Cheese Pizza Burger", 80, "Burger", "Burger with pizza sauce, oregano and melted cheese.", False),
    ("Mexican Burger", 90, "Burger", "Jalapenos, spicy salsa and crisp patty.", False),
    ("Peri Peri Paneer Burger", 100, "Burger", "Grilled paneer patty dusted in peri peri seasoning with cheese.", True),
    # Frankie
    ("Veg Cheese Frankie", 80, "Frankie", "Spiced vegetable roll with melted cheese.", False),
    ("Aalu Tikki Frankie", 100, "Frankie", "Crispy potato tikki rolled in warm roti with chutneys.", False),
    ("Mexican Frankie", 120, "Frankie", "Beans, salsa, jalapenos and cheese wrapped in soft frankie.", False),
    ("Tandoori Paneer Frankie", 130, "Frankie", "Smoky roasted paneer tikka with onions and tandoori sauce.", True),
    # Fries
    ("Salted Fries", 60, "Fries", "Crispy golden salted French fries.", False),
    ("Peri Peri Fries", 80, "Fries", "Hot French fries tossed with spicy peri peri.", False),
    ("Cheese Fries", 100, "Fries", "Fries smothered in warm melted cheese sauce.", False),
    ("Cheese Peri Peri Spicy Fries", 110, "Fries", "Peri peri spiced fries loaded with melted cheese.", True),
    ("Mexican Nacho", 110, "Fries", "Tortilla chips with melted cheese, beans and jalapeno salsa.", False),
    # Hot Drinks
    ("Hot Coffee", 30, "Hot Drinks", "Fresh hot brewed coffee.", False),
    ("Hot Chocolate", 50, "Hot Drinks", "Rich velvety hot cocoa.", False),
    # Mocktail
    ("Mint Mojito", 70, "Mocktail", "Classic crushed mint, lime and sparkling soda.", True),
    ("Water Melon Mocktail", 90, "Mocktail", "Refreshing chilled watermelon cooler.", False),
    ("Strawberry Mint Mocktail", 90, "Mocktail", "Sweet strawberries with fresh mint leaves.", False),
    ("Guava Punch", 90, "Mocktail", "Tropical pink guava juice with chili-salt rim.", False),
    ("Love in the Sky", 110, "Mocktail", "Exotic layered blue curacao and berry cooler.", False),
    ("Special Cloud Heaven", 150, "Mocktail", "Signature mocktail with fruit bubbles and creamy float.", True),
    ("Red Bull Mojito", 180, "Mocktail", "Energizing Red Bull infused with fresh lime and mint.", True),
    # Shake
    ("Cold Coffee", 100, "Shake", "Go Hunger signature thick rich cold coffee.", True),
    ("Oreo Shake", 120, "Shake", "Thick creamy shake blended with Oreo cookies.", False),
    ("Cold Coco", 120, "Shake", "Famous thick chilled chocolate drink.", True),
    ("Chocolate Shake", 120, "Shake", "Decadent milk chocolate shake.", False),
    ("Strawberry Shake", 110, "Shake", "Fresh strawberry puree milkshake.", False),
    # Pizza Menu (8 Inch)
    ("Margarita Pizza (8 Inch)", 120, "Pizza Menu", "Fresh tomato sauce and 100% mozzarella cheese.", False),
    ("Red Paprika Pizza (8 Inch)", 130, "Pizza Menu", "Spicy red paprika peppers with mozzarella.", False),
    ("Gourmet Pizza (8 Inch)", 150, "Pizza Menu", "Exotic vegetables, black olives and sun-dried tomatoes.", False),
    ("Paneer Makhani Pizza (8 Inch)", 160, "Pizza Menu", "Creamy makhani sauce with marinated paneer.", True),
    ("Pesto Paneer Pizza (8 Inch)", 160, "Pizza Menu", "Basil pesto sauce, paneer cubes and mozzarella.", False),
    ("Mushrooms Pizza (8 Inch)", 160, "Pizza Menu", "Sautéed button mushrooms and herbs.", False),
    ("Five Cheese Pizza (8 Inch)", 170, "Pizza Menu", "Mozzarella, cheddar, gouda, parmesan and cream cheese.", True),
    # Breads & Calzone
    ("Stick Garlic Bread", 150, "Breads & Calzone", "Crispy garlic bread sticks served with cheesy dip.", False),
    ("Stuffed Garlic Bread", 170, "Breads & Calzone", "Garlic bread stuffed with cheese, corn and jalapenos.", True),
    ("Classic Calzone", 160, "Breads & Calzone", "Folded Italian pizza pocket stuffed with cheese and vegetables.", True)
]

for name, price, cat, desc, rec in gohunger_items:
    sql.append(addItem("Go Hunger Cafe", name, price, cat, desc, rec))

# --- Patel Puff ---
patelpuff_items = [
    # Classic Puffs
    ("Classic Puff", 20, "Classic Puffs", "100% Veg freshly baked crispy golden puff.", False),
    ("Cheese Puff", 35, "Classic Puffs", "Crispy puff filled with savory spiced filling and melted cheese.", False),
    ("Double Cheese Puff", 45, "Classic Puffs", "NEW: Overflowing with double layers of melted cheese.", True),
    ("Sev Onion Puff", 30, "Classic Puffs", "Crispy puff stuffed with crunchy sev and diced onions.", False),
    ("Sev Onion Cheese Puff", 45, "Classic Puffs", "Sev, onions and gooey melted cheese in flaky pastry.", False),
    ("Mayonnaise Puff", 30, "Classic Puffs", "Creamy herb mayonnaise filling inside golden puff.", False),
    ("Garlic Puff", 30, "Classic Puffs", "Spiced with roasted garlic butter and herbs.", False),
    ("Garlic Sev Puff", 35, "Classic Puffs", "Garlic spiced pastry stuffed with savory sev.", False),
    ("Garlic Sev Cheese Puff", 45, "Classic Puffs", "Garlic, crispy sev and melted cheese puff.", False),
    ("Malai Puff", 40, "Classic Puffs", "Rich cream malai spiced vegetable filling.", False),
    ("Malai Cheese Puff", 50, "Classic Puffs", "Malai cream and melted cheese in golden flaky crust.", True),
    # Special Puffs
    ("Paneer Makhani Puff", 70, "Special Puffs", "Rich creamy butter makhani gravy with cottage cheese cubes.", True),
    ("Tandoori Paneer Puff", 70, "Special Puffs", "Smoky roasted paneer tikka stuffed gourmet puff.", True),
    ("Pizza Puff", 80, "Special Puffs", "Tangy pizza sauce, sweet corn, Italian herbs and mozzarella cheese.", True)
]

for name, price, cat, desc, rec in patelpuff_items:
    sql.append(addItem("Patel Puff", name, price, cat, desc, rec))

sql.append("\n-- 5. Insert Active Coupons\n")
coupons = [
    ("WELCOME50", "Welcome Campus Offer", "Flat 50 off on orders above 150", "FLAT", 50, 150, "NULL", "#E23744"),
    ("CHARUSAT20", "Campus Special Discount", "20% off up to 100 on orders above 199", "PERCENTAGE", 20, 199, "100", "#10B981"),
    ("DEALOFTHEDAY", "Deal of the Day", "Flat 100 off on orders above 299", "FLAT", 100, 299, "NULL", "#EA580C"),
    ("PUFFPARTY", "Patel Puff Special", "Flat 20 off on orders above 100", "FLAT", 20, 100, "NULL", "#D97706")
]

for code, title, desc, dtype, val, min_v, max_c, color in coupons:
    sql.append(f"""INSERT INTO coupons (
    id, coupon_code, title, description, color, coupon_type, discount_type,
    discount_value, min_order_value, max_discount_cap, usage_limit_total,
    usage_limit_per_user, current_usage_count, is_active, is_custom,
    offer_category, is_archived, created_at, updated_at
) VALUES (
    gen_random_uuid(), '{code}', '{title}', '{desc}', '{color}', 'GENERAL', '{dtype}',
    {val}, {min_v}, {max_c}, 1000, 5, 0, true, false, 'COUPON', false, NOW(), NOW()
);""")

sql.append("\n-- 6. Synchronize categories table from distinct menu_item categories\n")
sql.append("""INSERT INTO categories (name, canteen_id, is_available)
SELECT DISTINCT category, canteen_id, true
FROM menu_items
WHERE category IS NOT NULL
ON CONFLICT (name) DO NOTHING;
""")

sql.append("COMMIT;\n")

output_file = os.path.join(os.path.dirname(__file__), "seed_database.sql")
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(sql))

print(f"Successfully generated {output_file} with {len(sql)} lines of SQL.")
