const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'charusatneeds'
});

// BCrypt hash for 'Owner123'
const BCRYPT_OWNER123 = '$2a$10$3C4p0ZeXhF5q0xmtzFnz3.Q75BSCh7KCfB0QtBXNp0FGwp4MuCuBW';

async function seed() {
  await client.connect();
  console.log('Connected to PostgreSQL charusatneeds');

  console.log('Clearing existing data (keeping schema intact)...');
  await client.query(`
    TRUNCATE TABLE 
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
    RESTART IDENTITY CASCADE;
  `);
  console.log('Database truncated successfully.');

  // 1. Insert Users
  console.log('Inserting Users...');
  const usersData = [
    { email: 'sweetspot@charusat.edu.in', name: 'Sweet Spot Vendor', role: 'CANTEEN_OWNER' },
    { email: '99yogi@charusat.edu.in', name: '99 Yogi Food Vendor', role: 'CANTEEN_OWNER' },
    { email: 'dannys@charusat.edu.in', name: "Danny's Coffee Bar Vendor", role: 'CANTEEN_OWNER' },
    { email: 'iceberg@charusat.edu.in', name: 'Ice Berg Juice & Cafe Vendor', role: 'CANTEEN_OWNER' },
    { email: 'pramukh@charusat.edu.in', name: 'Pramukh Preet Vendor', role: 'CANTEEN_OWNER' },
    { email: 'kush@charusat.edu.in', name: 'Kush Shah', role: 'USER' },
    { email: 'admin@charusat.edu.in', name: 'CHARUSAT Administrator', role: 'ADMIN' },
  ];

  const userIds = {};
  for (const u of usersData) {
    const res = await client.query(
      `INSERT INTO users (email, password, full_name, role, auth_provider, is_active, is_email_verified, created_at)
       VALUES ($1, $2, $3, $4, 'LOCAL', true, true, NOW()) RETURNING id`,
      [u.email, BCRYPT_OWNER123, u.name, u.role]
    );
    userIds[u.email] = res.rows[0].id;
    console.log(`  User created: ${u.email} (ID: ${res.rows[0].id})`);
  }

  // 2. Insert Canteens
  console.log('Inserting Canteens...');
  const canteensData = [
    {
      name: 'Sweet Spot',
      location: 'CHARUSAT Campus, Student Activity Center',
      description: 'Delicious fast food, thick shakes, burgers, subs, pizzas, and snacks.',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      owner_email: 'sweetspot@charusat.edu.in',
      opening_time: '08:00 AM',
      closing_time: '07:30 PM'
    },
    {
      name: '99 Yogi',
      location: 'CHARUSAT Campus, Central Food Plaza',
      description: 'Famous for 99 varieties of food, pizzas, pulavs, noodles, burgers, and wraps.',
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      owner_email: '99yogi@charusat.edu.in',
      opening_time: '08:30 AM',
      closing_time: '08:00 PM'
    },
    {
      name: "Danny's",
      location: 'CHARUSAT Campus, Changa',
      description: "Danny's Coffee Bar: Famous thick cold coffee, grilled sandwiches, toasts, and pizzas.",
      image_url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
      owner_email: 'dannys@charusat.edu.in',
      opening_time: '08:00 AM',
      closing_time: '08:00 PM'
    },
    {
      name: 'Ice Berg',
      location: 'CHARUSAT Campus, Fresh Hub',
      description: 'Iceberg Fresh Fruit Juice, fruit mocktails, exotic thick shakes, and Davidoff coffees.',
      image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
      owner_email: 'iceberg@charusat.edu.in',
      opening_time: '08:30 AM',
      closing_time: '07:00 PM'
    },
    {
      name: 'Pramukh',
      location: 'CHARUSAT Campus, Pramukh Preet Point',
      description: 'Pramukh Preet: Delicious variety puffs, pizzas, panini, Chinese dishes, and special pulav.',
      image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
      owner_email: 'pramukh@charusat.edu.in',
      opening_time: '08:00 AM',
      closing_time: '08:00 PM'
    }
  ];

  const canteenIds = {};
  for (const c of canteensData) {
    const ownerId = userIds[c.owner_email];
    const res = await client.query(
      `INSERT INTO canteens (name, location, description, image_url, is_open, opening_time, closing_time, owner_id, created_at)
       VALUES ($1, $2, $3, $4, true, $5, $6, $7, NOW()) RETURNING id`,
      [c.name, c.location, c.description, c.image_url, c.opening_time, c.closing_time, ownerId]
    );
    canteenIds[c.name] = res.rows[0].id;
    console.log(`  Canteen created: ${c.name} (ID: ${res.rows[0].id}, Owner: ${c.owner_email})`);
  }

  // Helper for menu item insertion
  async function insertItems(canteenName, items) {
    const canteenId = canteenIds[canteenName];
    let count = 0;
    for (const item of items) {
      await client.query(
        `INSERT INTO menu_items (
          name, description, price, category, is_available, is_veg, canteen_id, preparation_time, is_recommended, created_at
        ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, NOW())`,
        [
          item.name,
          item.desc || `${item.name} prepared fresh at ${canteenName}.`,
          item.price,
          item.category,
          item.is_veg !== false,
          canteenId,
          item.prep || 15,
          item.recommended || false
        ]
      );
      count++;
    }
    console.log(`  Inserted ${count} menu items for ${canteenName}`);
  }

  // 3. Menu Items for Sweet Spot
  console.log('Inserting menu items for Sweet Spot...');
  await insertItems('Sweet Spot', [
    // Hot Drinks
    { name: 'Tea', price: 20, category: 'Hot Drinks', desc: 'Fresh brewed masala tea.' },
    { name: 'Coffee', price: 30, category: 'Hot Drinks', desc: 'Hot aromatic coffee.' },
    // Beverages
    { name: 'Cold Bournvita', price: 50, category: 'Beverages' },
    { name: 'Hot Bournvita', price: 60, category: 'Beverages' },
    { name: 'Cold Coffee', price: 50, category: 'Beverages', recommended: true },
    { name: 'Cold Coffee With Choco Chips', price: 80, category: 'Beverages' },
    { name: 'Oreo Shake', price: 70, category: 'Beverages', recommended: true },
    { name: 'Kitkat Shake', price: 70, category: 'Beverages' },
    { name: 'Strawberry Shake', price: 70, category: 'Beverages' },
    { name: 'Oreo Shake With Choco Chips', price: 80, category: 'Beverages' },
    // Breakfast
    { name: 'Bread Butter', price: 50, category: 'Breakfast' },
    { name: 'Bread Butter Jam', price: 60, category: 'Breakfast' },
    { name: 'Chocolate Slice', price: 40, category: 'Breakfast' },
    { name: 'Cheese Butter Slice', price: 60, category: 'Breakfast' },
    // Ever Green Snacks
    { name: 'Thepla', price: 40, category: 'Ever Green Snacks' },
    { name: 'Sev Thepla', price: 50, category: 'Ever Green Snacks' },
    { name: 'Masala Thepla', price: 60, category: 'Ever Green Snacks' },
    { name: 'Cheese Thepla', price: 80, category: 'Ever Green Snacks' },
    { name: 'Aloo Paratha', price: 40, category: 'Ever Green Snacks', recommended: true },
    { name: 'Cheese Aloo Paratha', price: 70, category: 'Ever Green Snacks' },
    // Bhel
    { name: 'Bombay Bhel', price: 50, category: 'Bhel' },
    { name: 'Cheese Bhel', price: 70, category: 'Bhel' },
    { name: 'Kurkure Chaat', price: 90, category: 'Bhel' },
    { name: 'Cheese Samosa', price: 100, category: 'Bhel' },
    // Momos
    { name: 'Veg Cheese Momos', price: 120, category: 'Momos', recommended: true },
    { name: 'Tandoori Mayo Momos', price: 140, category: 'Momos' },
    // Pasta
    { name: 'Cheese Pasta', price: 120, category: 'Pasta' },
    { name: 'Red Sauce Pasta', price: 120, category: 'Pasta' },
    { name: 'Cheese Corn Pasta', price: 130, category: 'Pasta' },
    { name: 'Cheese Garlic Pasta', price: 140, category: 'Pasta' },
    { name: 'Mix Sauce Pasta', price: 140, category: 'Pasta', recommended: true },
    { name: 'Mix Sauce Pasta With Veg', price: 150, category: 'Pasta' },
    // Puff
    { name: 'Potato Puff', price: 20, category: 'Puff' },
    { name: 'Sev Puff', price: 30, category: 'Puff' },
    { name: 'Sev Onion Puff', price: 40, category: 'Puff' },
    { name: 'Veg Masala Puff', price: 50, category: 'Puff' },
    { name: 'Sev Chezwan Puff', price: 50, category: 'Puff' },
    { name: 'Cheese Puff', price: 50, category: 'Puff' },
    { name: 'Cheese Onion Puff', price: 60, category: 'Puff' },
    { name: 'Butter Cheese Puff', price: 70, category: 'Puff' },
    { name: 'Cheesy Paneer Puff', price: 80, category: 'Puff' },
    { name: 'Veg Cheese Blast Puff', price: 80, category: 'Puff', recommended: true },
    { name: 'Cheese Chilli Puff', price: 80, category: 'Puff' },
    { name: 'Pizza Puff', price: 80, category: 'Puff' },
    // Fries
    { name: 'Salted Fries', price: 90, category: 'Fries' },
    { name: 'Masala Fries', price: 100, category: 'Fries' },
    { name: 'Peri Peri Fries', price: 110, category: 'Fries', recommended: true },
    { name: 'Cheese Masala Fries', price: 120, category: 'Fries' },
    { name: 'Tandoori Mayo Fries', price: 120, category: 'Fries' },
    // Maggi
    { name: 'Simple Maggi', price: 50, category: 'Maggi' },
    { name: 'Masala Maggi', price: 60, category: 'Maggi' },
    { name: 'Veg Maggi', price: 70, category: 'Maggi' },
    { name: 'Butter Maggi', price: 70, category: 'Maggi' },
    { name: 'Schezwan Maggi (Spicy)', price: 70, category: 'Maggi' },
    { name: 'Cheese Maggi', price: 80, category: 'Maggi', recommended: true },
    { name: 'Cheese Mayo Maggi', price: 90, category: 'Maggi' },
    { name: 'Cheese Corn Maggi', price: 90, category: 'Maggi' },
    { name: 'Butter Tadka Maggi', price: 100, category: 'Maggi' },
    { name: 'Cheese Tadka Maggi', price: 100, category: 'Maggi' },
    { name: 'Cheese Butter Tadka Maggi', price: 120, category: 'Maggi' },
    // Mexican
    { name: 'Nachos Salsa', price: 80, category: 'Mexican' },
    { name: 'Cheese Nachos', price: 100, category: 'Mexican', recommended: true },
    // Kathi Roll
    { name: 'Fusion Fire', price: 120, category: 'Kathi Roll' },
    { name: 'Hariyali Veg Cheese', price: 120, category: 'Kathi Roll' },
    { name: 'Veg Cheese Roll', price: 120, category: 'Kathi Roll' },
    { name: 'Veggie Dlite', price: 130, category: 'Kathi Roll' },
    { name: 'Schezwan Paneer', price: 140, category: 'Kathi Roll' },
    { name: 'Ultimate Paneer', price: 140, category: 'Kathi Roll', recommended: true },
    // Pizza
    { name: 'Margarita', price: 100, category: 'Pizza' },
    { name: 'Double Cheese Margarita', price: 120, category: 'Pizza', recommended: true },
    { name: 'Italiano Pizza', price: 120, category: 'Pizza' },
    { name: 'Tandoori Pizza', price: 120, category: 'Pizza' },
    { name: 'Corn Continental', price: 120, category: 'Pizza' },
    { name: 'Mexican Pizza', price: 120, category: 'Pizza' },
    { name: 'Paneer Paprika', price: 130, category: 'Pizza' },
    { name: 'Veg Extra Vegan', price: 130, category: 'Pizza' },
    { name: 'Tandoori Paneer Pizza', price: 140, category: 'Pizza' },
    { name: 'Chef Special Cheese Blast Pizza', price: 160, category: 'Pizza', recommended: true },
    // Sub
    { name: 'Veggie Subs', price: 90, category: 'Sub' },
    { name: 'Veg Exotica Sub', price: 110, category: 'Sub' },
    { name: 'Cheesy Sub', price: 120, category: 'Sub' },
    { name: 'Aloo Patty Sub', price: 130, category: 'Sub' },
    { name: 'BBQ Paneer Sub', price: 140, category: 'Sub', recommended: true },
    // Garlic Breads
    { name: 'Regular Garlic Bread', price: 130, category: 'Garlic Breads' },
    { name: 'American Garlic Bread', price: 140, category: 'Garlic Breads' },
    { name: 'Cheesy Jalapeno Garlic Bread', price: 150, category: 'Garlic Breads' },
    // Sandwich
    { name: 'Red Club Sandwich', price: 90, category: 'Sandwich' },
    { name: 'Cheese Grilled Sandwich', price: 90, category: 'Sandwich' },
    { name: 'Cheese Chutney Sandwich', price: 90, category: 'Sandwich' },
    { name: 'Veg Cheese Sandwich', price: 90, category: 'Sandwich' },
    { name: 'Veg Cheese Coleslaw', price: 100, category: 'Sandwich' },
    { name: 'Veg Creamy Sandwich', price: 100, category: 'Sandwich' },
    { name: 'Chilly Cheese Sandwich', price: 100, category: 'Sandwich' },
    { name: 'Spanish Corn Sandwich', price: 100, category: 'Sandwich' },
    { name: 'Veg Cheese Roasty Grill', price: 120, category: 'Sandwich' },
    { name: 'Chilly Garlic Cheese Grill', price: 120, category: 'Sandwich' },
    { name: 'Paneer Masala Grill Sandwich', price: 130, category: 'Sandwich' },
    { name: 'Tandoori Paneer Chilla', price: 140, category: 'Sandwich' },
    { name: 'Tandoori Paneer Cheese Chilla', price: 150, category: 'Sandwich' },
    { name: 'Club Grill 3 Layer', price: 150, category: 'Sandwich', recommended: true },
    { name: 'Tandoori Club Sandwich', price: 170, category: 'Sandwich' },
    { name: 'Chef Special Sandwich', price: 200, category: 'Sandwich', recommended: true },
    // Burger
    { name: 'Aloo Tikki Burger', price: 50, category: 'Burger' },
    { name: 'Schezwan Burger', price: 60, category: 'Burger' },
    { name: 'Veg Cheese Burger', price: 70, category: 'Burger', recommended: true },
    { name: 'Masala Cheese Grill Burger', price: 80, category: 'Burger' },
    { name: 'BBQ Burger', price: 80, category: 'Burger' },
    { name: 'Green Chilly Cheese Burger', price: 80, category: 'Burger' },
    { name: 'Paneer Chilly Cheese Burger', price: 90, category: 'Burger' },
    { name: 'Paneer BBQ Cheese Burger', price: 90, category: 'Burger' },
    { name: 'Maharaja Loaded Cheese Burger', price: 120, category: 'Burger', recommended: true },
    // Cakes & Pastries
    { name: 'Black Forest Cake', price: 450, category: 'Cakes & Pastries' },
    { name: 'Chocolate Cake', price: 450, category: 'Cakes & Pastries' },
    { name: 'Black Forest Pastry', price: 60, category: 'Cakes & Pastries' },
    { name: 'Chocolate Pastry', price: 60, category: 'Cakes & Pastries' },
    // Combos
    { name: 'Burger Combo (Aloo Tikki, Veg Cheese Burger, Fries, Coke)', price: 220, category: 'Combo Offers', recommended: true },
    { name: 'Sandwich Combo (3 Layer Sandwich, Fries, Coke)', price: 250, category: 'Combo Offers', recommended: true },
    { name: 'Pizza Combo (Indian Pizza, Garlic Bread, Coke)', price: 260, category: 'Combo Offers', recommended: true },
    { name: 'Extra Cheese', price: 30, category: 'Addons' }
  ]);

  // 4. Menu Items for 99 Yogi
  console.log('Inserting menu items for 99 Yogi...');
  await insertItems('99 Yogi', [
    // Fries
    { name: 'French Fries', price: 70, category: 'Fries' },
    { name: 'Peri Peri Fries', price: 90, category: 'Fries' },
    { name: 'Cheese Burst Loaded Fries', price: 100, category: 'Fries', recommended: true },
    { name: 'Maggi Masala Fries', price: 90, category: 'Fries' },
    { name: 'Cheese Loader Nachos', price: 110, category: 'Fries' },
    { name: 'Smiles', price: 80, category: 'Fries' },
    { name: 'Cheese Ball', price: 80, category: 'Fries' },
    { name: 'Chips-n-salsa', price: 100, category: 'Fries' },
    { name: 'Potato Wedges', price: 80, category: 'Fries' },
    { name: 'Pizza French Fries', price: 120, category: 'Fries' },
    { name: 'Chili Potato Fries', price: 100, category: 'Fries' },
    { name: 'Fries Loaded Bowl', price: 130, category: 'Fries', recommended: true },
    { name: 'Dragon Chilly Potato', price: 110, category: 'Fries' },
    // Maggi
    { name: 'Plain Maggi', price: 40, category: 'Maggi' },
    { name: 'Masala Maggi', price: 50, category: 'Maggi' },
    { name: 'Veg Masala Maggi', price: 70, category: 'Maggi' },
    { name: 'Butter Maggi', price: 80, category: 'Maggi' },
    { name: 'Cheese Maggi', price: 80, category: 'Maggi' },
    { name: 'Periperi Masala Maggi', price: 60, category: 'Maggi' },
    { name: 'Veg Cheese Maggi', price: 90, category: 'Maggi', recommended: true },
    { name: 'Schezwan Maggi', price: 60, category: 'Maggi' },
    { name: 'Cheese Butter Maggi', price: 100, category: 'Maggi' },
    { name: 'Maggi Bhel', price: 80, category: 'Maggi' },
    { name: 'Korean Maggi', price: 80, category: 'Maggi' },
    // Wrap
    { name: 'Tandoori Wrap', price: 100, category: 'Wrap' },
    { name: 'Veg Wrap', price: 70, category: 'Wrap' },
    { name: 'Mexican Wrap', price: 100, category: 'Wrap' },
    { name: 'Paneer Tikka Wrap', price: 120, category: 'Wrap', recommended: true },
    { name: 'Peri Peri Veg Wrap', price: 80, category: 'Wrap' },
    { name: 'Veg Noodles Wrap', price: 90, category: 'Wrap' },
    { name: 'Mushroom Wrap', price: 110, category: 'Wrap' },
    { name: 'Yogi Special Wrap', price: 150, category: 'Wrap', recommended: true },
    // Garlic Bread
    { name: 'Cheese Garlic Bread', price: 70, category: 'Garlic Bread' },
    { name: 'Cheese Chilly Garlic Bread', price: 80, category: 'Garlic Bread' },
    { name: 'Peri Peri Garlic Bread', price: 80, category: 'Garlic Bread' },
    { name: 'Red Paprika Olives Garlic Bread', price: 100, category: 'Garlic Bread' },
    // Milk Shake
    { name: 'Chocolate Shake', price: 80, category: 'Milk Shake' },
    { name: 'Oreo Shake', price: 99, category: 'Milk Shake', recommended: true },
    { name: 'Kitkat Shake', price: 99, category: 'Milk Shake', recommended: true },
    { name: 'Black Current Shake', price: 80, category: 'Milk Shake' },
    { name: 'Chocopie Milk Shake', price: 99, category: 'Milk Shake' },
    { name: 'Strawberry Shake', price: 80, category: 'Milk Shake' },
    { name: 'Plain Vanilla Shake', price: 80, category: 'Milk Shake' },
    { name: 'Mango Shake', price: 80, category: 'Milk Shake' },
    { name: 'Butter Scotch Shake', price: 80, category: 'Milk Shake' },
    { name: 'Litchi Milkshake', price: 80, category: 'Milk Shake' },
    { name: 'Guava Milkshake', price: 80, category: 'Milk Shake' },
    { name: 'Plain Vanilla With Ice Cream', price: 100, category: 'Milk Shake' },
    // Coffee & Tea
    { name: 'Hot Coffee', price: 30, category: 'Coffee & Tea' },
    { name: 'Cold Coffee', price: 80, category: 'Coffee & Tea', recommended: true },
    { name: 'Tea', price: 20, category: 'Coffee & Tea' },
    { name: 'Green Tea', price: 30, category: 'Coffee & Tea' },
    { name: 'Cold Coffee With Ice Cream', price: 100, category: 'Coffee & Tea' },
    // Combos
    { name: 'Manchurian With Noodles', price: 120, category: 'Combos', recommended: true },
    { name: 'Farm House Pizza + French Fries + Cold Drink', price: 210, category: 'Combos' },
    { name: 'White Sauce Pasta + Garlic Bread + Cold Drink', price: 200, category: 'Combos' },
    { name: 'Veg Sandwich With Smiles + Cold Drink', price: 170, category: 'Combos' },
    { name: 'Aloo Tikki Burger + Peri Peri French Fries + Cold Drink', price: 180, category: 'Combos' },
    { name: 'Margherita Pizza + Paneer Tikka Pizza + Cold Drink', price: 230, category: 'Combos', recommended: true },
    { name: 'Mug Pulav + Paneer Pulav + Cold Drink', price: 170, category: 'Combos' },
    { name: 'Cheese Burger + Cheese Vada Pav + Cold Drink', price: 140, category: 'Combos' },
    { name: 'Yogi Sp. Pulav + 5 PCS Samosa + Cold Drink', price: 200, category: 'Combos', recommended: true },
    // Veg Chinese
    { name: 'Mushroom Chilli Manchurian', price: 160, category: 'Veg Chinese' },
    { name: 'Dry Manchurian', price: 120, category: 'Veg Chinese', recommended: true },
    { name: 'Gravy Manchurian', price: 130, category: 'Veg Chinese' },
    { name: 'Paneer Chilly Dry', price: 150, category: 'Veg Chinese' },
    { name: 'Veg. Noodles', price: 100, category: 'Veg Chinese' },
    { name: 'Hakka Noodles', price: 100, category: 'Veg Chinese' },
    { name: 'Paneer Noodles', price: 120, category: 'Veg Chinese' },
    { name: 'Schezwan Noodles', price: 110, category: 'Veg Chinese' },
    { name: 'Chinese Bhel', price: 140, category: 'Veg Chinese' },
    { name: 'Mushroom Noodles', price: 130, category: 'Veg Chinese' },
    { name: 'Manchurian Pasta', price: 130, category: 'Veg Chinese' },
    // Pizza 7 Inch
    { name: 'Farmhouse Pizza', price: 130, category: 'Pizza' },
    { name: 'Peppy Paneer Pizza', price: 140, category: 'Pizza' },
    { name: 'Veg Extravaganza Pizza', price: 130, category: 'Pizza' },
    { name: 'Paneer Tikka Pizza', price: 120, category: 'Pizza' },
    { name: 'Margherita Pizza', price: 100, category: 'Pizza' },
    { name: 'Italian Treat Pizza', price: 140, category: 'Pizza' },
    { name: 'Special Pizza', price: 190, category: 'Pizza', recommended: true },
    { name: 'Paneer Tandoori Pizza', price: 150, category: 'Pizza' },
    { name: '4 Topping Pizza', price: 140, category: 'Pizza' },
    { name: 'Manchurian Pizza', price: 160, category: 'Pizza' },
    { name: 'Peri Peri Loaded Pizza', price: 120, category: 'Pizza' },
    { name: 'Corn Cheese Pizza', price: 120, category: 'Pizza' },
    { name: 'Nachos Mexican Pizza', price: 150, category: 'Pizza' },
    { name: 'Pizza Bread', price: 120, category: 'Pizza' },
    { name: 'Yogi Special Pizza', price: 200, category: 'Pizza', recommended: true },
    // Burger
    { name: 'Aloo Tikki Burger', price: 60, category: 'Burger' },
    { name: 'Aloo Tikki Cheese Burger', price: 80, category: 'Burger' },
    { name: 'Veg Burger', price: 70, category: 'Burger' },
    { name: 'Veg Cheese Burger', price: 90, category: 'Burger', recommended: true },
    { name: 'Cheese Mushroom Burger', price: 110, category: 'Burger' },
    { name: 'Paneer Cheese Burger', price: 130, category: 'Burger' },
    { name: 'Hot Mexican Burger', price: 80, category: 'Burger' },
    { name: 'Hot Mexican Cheese Burger', price: 100, category: 'Burger' },
    { name: 'Peri Peri Cheese Burger', price: 100, category: 'Burger' },
    { name: 'American Cheese Burger', price: 100, category: 'Burger' },
    { name: 'Tandoori Cheese Burger', price: 100, category: 'Burger' },
    // Pasta
    { name: 'Penne Alfredo', price: 120, category: 'Pasta', recommended: true },
    { name: 'Red Sauce Pasta', price: 120, category: 'Pasta' },
    { name: 'Cheese Corn Pasta', price: 140, category: 'Pasta' },
    { name: 'Pink Sauce Pasta', price: 140, category: 'Pasta' },
    // Pulav
    { name: 'Mug Pulav', price: 60, category: 'Pulav' },
    { name: 'Paneer Cheese Pulav', price: 100, category: 'Pulav', recommended: true },
    { name: 'Manchurian Rice', price: 120, category: 'Pulav' },
    { name: 'Cheese Manchurian Rice', price: 140, category: 'Pulav' },
    { name: 'Schezwan Fried Rice', price: 110, category: 'Pulav' },
    { name: 'Chana Pulav', price: 60, category: 'Pulav' },
    { name: 'Solid Masti Cheese Pulav', price: 150, category: 'Pulav' },
    { name: 'Mushroom Cheese Pulav', price: 120, category: 'Pulav' },
    { name: 'Yogi Special Cheese Pulav', price: 160, category: 'Pulav', recommended: true },
    // Sandwich
    { name: 'Garden Grilled Sandwich', price: 60, category: 'Sandwich' },
    { name: 'Cream And Corn Sandwich', price: 80, category: 'Sandwich' },
    { name: 'Cheese Mushroom Sandwich', price: 110, category: 'Sandwich' },
    { name: 'Corn Veg. Paneer Sandwich', price: 120, category: 'Sandwich' },
    { name: 'Mix Veg. Cheese Sandwich', price: 110, category: 'Sandwich' },
    { name: 'Club Sandwich (3 Layer)', price: 140, category: 'Sandwich', recommended: true },
    { name: 'Club Cheese Paneer (3 Layer)', price: 170, category: 'Sandwich' },
    { name: 'Triple Cheese Sandwich', price: 170, category: 'Sandwich' },
    { name: 'Cheese Garlic Corn Sandwich', price: 100, category: 'Sandwich' },
    { name: 'Yogi Special Sandwich (3 Layer)', price: 200, category: 'Sandwich', recommended: true },
    { name: 'Tandoori Cheese Sandwich', price: 110, category: 'Sandwich' },
    { name: 'American Cheese Sandwich', price: 110, category: 'Sandwich' },
    // Vada Pav
    { name: 'Vada Pav', price: 25, category: 'Vada Pav' },
    { name: 'Butter Vada Pav', price: 30, category: 'Vada Pav' },
    { name: 'Peri Peri Vada Pav', price: 35, category: 'Vada Pav' },
    { name: 'Cheese Vada Pav', price: 40, category: 'Vada Pav' },
    { name: 'Peri Peri Cheese Vada Pav', price: 50, category: 'Vada Pav' },
    { name: 'Onion Vada Pav', price: 40, category: 'Vada Pav' },
    { name: 'Cheese Butter Vada Pav', price: 60, category: 'Vada Pav' },
    { name: 'Tandoori Cheese Vada Pav', price: 60, category: 'Vada Pav' },
    { name: 'Schezwan Vada Pav', price: 40, category: 'Vada Pav' },
    { name: 'Schezwan Cheese Vada Pav', price: 60, category: 'Vada Pav' },
    // Specials
    { name: 'Chinese Samosa (5 Pcs)', price: 30, category: 'Specials' },
    { name: 'Bread Pakoda', price: 50, category: 'Specials' },
    { name: 'Cheese Salad (2 Bread)', price: 120, category: 'Specials' },
    { name: 'Bread Butter (3 Pcs)', price: 50, category: 'Specials' },
    { name: 'Bread Butter Jam (3 Pcs)', price: 80, category: 'Specials' },
    { name: 'Butter Milk Amul Jeera', price: 20, category: 'Specials' },
    { name: 'Chinese Sandwich', price: 80, category: 'Specials' },
    { name: 'Rose Lassi', price: 25, category: 'Specials' },
    { name: 'Aloo Paratha (1 Pcs)', price: 40, category: 'Specials' }
  ]);

  // 5. Menu Items for Danny's
  console.log("Inserting menu items for Danny's...");
  await insertItems("Danny's", [
    // Beverages
    { name: 'Cold Coffee', price: 70, category: 'Beverages', recommended: true },
    { name: 'Cold Coffee with Topping', price: 70, category: 'Beverages' },
    { name: 'Bournvita', price: 70, category: 'Beverages' },
    { name: 'Bournvita with Topping', price: 70, category: 'Beverages' },
    { name: 'Espresso Coffee', price: 60, category: 'Beverages' },
    { name: 'Hot Bournvita', price: 60, category: 'Beverages' },
    // Maggi
    { name: 'Masala Maggi', price: 60, category: 'Maggi' },
    { name: 'Veg. Masala Maggi', price: 70, category: 'Maggi' },
    { name: 'Butter Maggi', price: 80, category: 'Maggi' },
    { name: 'Cheese Maggi', price: 80, category: 'Maggi' },
    { name: 'Veg. Cheese Maggi', price: 90, category: 'Maggi', recommended: true },
    { name: 'Garlic Butter Cheese Maggi', price: 100, category: 'Maggi' },
    // Toast
    { name: 'Paneer Toast', price: 140, category: 'Toast' },
    { name: 'Beans Toast', price: 130, category: 'Toast' },
    { name: 'Cheese Chilly Toast', price: 130, category: 'Toast' },
    { name: 'Cheese Chilly Garlic Toast', price: 130, category: 'Toast' },
    { name: 'Thousand Bread', price: 140, category: 'Toast' },
    { name: 'Supreme Cheese Garlic Bread', price: 130, category: 'Toast', desc: 'Onion, Capsicum, Tomato, Cheese', recommended: true },
    { name: 'Masala Bread', price: 130, category: 'Toast', desc: 'Olive, Capsicum, Jalapeno, Onion' },
    { name: 'Premium Bread', price: 130, category: 'Toast', desc: 'Tomato, Onion, Corn, Green Chilly, Cheese' },
    // Pizza
    { name: 'Margareta Pizza', price: 130, category: 'Pizza' },
    { name: 'Onion Capsicum Pizza', price: 130, category: 'Pizza' },
    { name: 'Napolitano Pizza', price: 130, category: 'Pizza', desc: 'Tomato, Capsicum, Onion, Cheese' },
    { name: 'Mexican Pizza', price: 130, category: 'Pizza', desc: 'Beans, Capsicum, Onion, Cheese' },
    { name: 'Tandoori Pizza', price: 130, category: 'Pizza', desc: 'Paneer, Capsicum, Onion, Cheese' },
    { name: 'American Pizza', price: 130, category: 'Pizza', desc: 'Jalapeno, Onion, Capsicum, Cheese' },
    { name: "Danny's Special Pizza", price: 140, category: 'Pizza', desc: 'Tomato, Capsicum, Onion, Black Olive, Jalapeno, Oregano, Cheese', recommended: true },
    { name: 'Toofani Pizza', price: 140, category: 'Pizza' },
    // Sp. Sandwich
    { name: 'Tandoori Grilled Sandwich', price: 90, category: 'Special Sandwich', desc: 'Capsicum, Paneer, Onion, Tomato Gravy' },
    { name: 'Corn Hi Corn Grilled Sandwich', price: 90, category: 'Special Sandwich', desc: 'Corn, Capsicum, Sandwich Dressing' },
    { name: 'Garlic Bonanza Grilled Sandwich', price: 90, category: 'Special Sandwich', desc: 'Capsicum, Garlic, Onion, Cheese, Green Chatni' },
    { name: 'Mexican Grilled Sandwich', price: 90, category: 'Special Sandwich', desc: 'Baked Beans, Capsicum, Onion, Cheese' },
    { name: 'Hot & Spicy Grilled Sandwich', price: 90, category: 'Special Sandwich', desc: 'Onion, Capsicum, Chilly Garlic Sauce, Coriander, Sandwich Dressing' },
    { name: "Best of Danny's Sandwich", price: 90, category: 'Special Sandwich', desc: 'Onion, Capsicum, Coriander, Green Chatni, Cheese, Sandwich Dressing', recommended: true },
    { name: 'Italian Grilled Sandwich', price: 100, category: 'Special Sandwich', desc: 'Olive, Jalapenos, Corn, Sandwich Dressing' },
    { name: 'Cheese Chilly Garlic Grilled', price: 100, category: 'Special Sandwich' },
    { name: "Danny's Special Sandwich", price: 110, category: 'Special Sandwich', desc: 'Olive, Jalapenos, Corn, Cheese, Sandwich Dressing', recommended: true },
    // Club Sandwich
    { name: 'Cheese Veg. Club', price: 110, category: 'Club Sandwich', desc: 'Tomato, Cucumber, Jam, Cheese' },
    { name: 'Indian Club', price: 110, category: 'Club Sandwich', desc: 'Tomato, Cucumber, Capsicum, G. Chilly, Sandwich Dressing' },
    { name: 'Euro Club', price: 110, category: 'Club Sandwich', desc: 'Tomato, Cucumber, Capsicum, Cheese, Sandwich Dressing' },
    { name: 'House of Cheese Club', price: 130, category: 'Club Sandwich', desc: 'Lots of Cheese', recommended: true },
    { name: 'Tandoori Club', price: 130, category: 'Club Sandwich' },
    { name: "Danny's Special Club", price: 130, category: 'Club Sandwich', recommended: true },
    // Puffs
    { name: 'Mexican Puff', price: 80, category: 'Puffs' },
    { name: 'Veg. Puff', price: 50, category: 'Puffs' },
    { name: 'Veg. Cheese Puff', price: 60, category: 'Puffs' },
    { name: 'Cheese Garlic Puff', price: 60, category: 'Puffs' },
    { name: 'Mayonnaise Puff', price: 60, category: 'Puffs' },
    { name: 'Paneer Puff', price: 60, category: 'Puffs' },
    // Plain & Grilled Sandwich
    { name: 'Bread Butter (Plain)', price: 40, category: 'Plain & Grilled Sandwich' },
    { name: 'Bread Butter (Grill)', price: 50, category: 'Plain & Grilled Sandwich' },
    { name: 'Chatni Sandwich (Plain)', price: 40, category: 'Plain & Grilled Sandwich' },
    { name: 'Chatni Sandwich (Grill)', price: 50, category: 'Plain & Grilled Sandwich' },
    { name: 'Butter Jam (Plain)', price: 40, category: 'Plain & Grilled Sandwich' },
    { name: 'Butter Jam (Grill)', price: 50, category: 'Plain & Grilled Sandwich' },
    { name: 'Veg. Sandwich (Plain)', price: 60, category: 'Plain & Grilled Sandwich' },
    { name: 'Veg. Sandwich (Grill)', price: 70, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Chatni (Plain)', price: 70, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Chatni (Grill)', price: 80, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Sandwich (Plain)', price: 70, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Sandwich (Grill)', price: 80, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Jam (Plain)', price: 70, category: 'Plain & Grilled Sandwich' },
    { name: 'Cheese Jam (Grill)', price: 80, category: 'Plain & Grilled Sandwich' },
    { name: 'Veg Cheese Sandwich (Plain)', price: 80, category: 'Plain & Grilled Sandwich' },
    { name: 'Veg Cheese Sandwich (Grill)', price: 90, category: 'Plain & Grilled Sandwich', recommended: true },
    // Pav Bhaji
    { name: 'Pav Bhaji Plain', price: 100, category: 'Pav Bhaji' },
    { name: 'Pav Bhaji Butter', price: 120, category: 'Pav Bhaji', recommended: true },
    { name: 'Pav Bhaji Cheese', price: 120, category: 'Pav Bhaji' },
    { name: 'Cheese Butter Bhaji', price: 130, category: 'Pav Bhaji' },
    { name: 'Masala Pav', price: 100, category: 'Pav Bhaji' },
    { name: "Danny's Special Pav Bhaji", price: 150, category: 'Pav Bhaji', recommended: true },
    { name: 'Extra Pav', price: 10, category: 'Pav Bhaji' },
    // Pulav
    { name: 'Veg Pulav', price: 90, category: 'Pulav' },
    { name: 'Veg Butter Pulav', price: 110, category: 'Pulav' },
    { name: 'Veg Cheese Pulav', price: 110, category: 'Pulav' },
    { name: 'Veg Paneer Pulav', price: 120, category: 'Pulav' },
    { name: "Danny's Special Pulav", price: 130, category: 'Pulav', recommended: true },
    // Fries
    { name: 'Peri Peri French Fries', price: 100, category: 'Fries' },
    { name: 'Salted French Fries', price: 100, category: 'Fries' },
    { name: 'Grated Cheese French Fries', price: 120, category: 'Fries', recommended: true },
    // Panini
    { name: 'Indian Panini', price: 130, category: 'Panini' },
    { name: 'Mexican Panini', price: 130, category: 'Panini' },
    { name: 'Tandoori Panini', price: 130, category: 'Panini', recommended: true }
  ]);

  // 6. Menu Items for Ice Berg
  console.log('Inserting menu items for Ice Berg...');
  await insertItems('Ice Berg', [
    // Mocktails & Juices
    { name: 'Pineapple Kiwi Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Blueberry Mint Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Lychee Lemon Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Mango Kiwi Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Blueberry Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Mint Mojito', price: 60, category: 'Mocktails & Juices', recommended: true },
    { name: 'Litchi Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Orange Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Lemon Soda', price: 50, category: 'Mocktails & Juices' },
    { name: 'Jeer Soda', price: 50, category: 'Mocktails & Juices' },
    { name: 'Pineapple Juice', price: 50, category: 'Mocktails & Juices' },
    { name: 'Rose Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Kala Khatta Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Kachi Keri Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Guava Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Strawberry Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Pomegranate Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Kiwi Mocktail', price: 70, category: 'Mocktails & Juices' },
    { name: 'Watermelon Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Bubblegum Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Black Current Mocktail', price: 60, category: 'Mocktails & Juices' },
    { name: 'Green Apple Mocktail', price: 50, category: 'Mocktails & Juices' },
    { name: 'Mix Fruit Mocktail', price: 60, category: 'Mocktails & Juices', recommended: true },
    // Oreo Milkshakes
    { name: 'Oreo Shake', price: 60, category: 'Oreo Milkshakes', recommended: true },
    { name: 'Oreo Kitkate Shake', price: 70, category: 'Oreo Milkshakes' },
    { name: 'Oreo Coffee', price: 80, category: 'Oreo Milkshakes' },
    { name: 'Oreo Strawberry Shake', price: 70, category: 'Oreo Milkshakes' },
    { name: 'Oreo Bournvita', price: 70, category: 'Oreo Milkshakes' },
    { name: 'Oreo Red Velvet Cake Shake', price: 80, category: 'Oreo Milkshakes' },
    { name: 'Oreo Chocolate Cake Shake', price: 80, category: 'Oreo Milkshakes', recommended: true },
    { name: 'Oreo Kitkate Coco', price: 80, category: 'Oreo Milkshakes' },
    { name: 'Oreo Chocolate Bournvita', price: 80, category: 'Oreo Milkshakes' },
    { name: 'Oreo Lotte Chocopie Shake', price: 80, category: 'Oreo Milkshakes' },
    // Kitkat Milkshakes
    { name: 'Kitkate Milkshake', price: 80, category: 'Kitkat Milkshakes', recommended: true },
    { name: 'Kitkate Coffee', price: 80, category: 'Kitkat Milkshakes' },
    { name: 'Kitkate Lotte Chocopie', price: 80, category: 'Kitkat Milkshakes' },
    { name: 'Kitkate Bournvita', price: 80, category: 'Kitkat Milkshakes' },
    // Special Milkshakes
    { name: 'Bournvita Shake', price: 50, category: 'Special Milkshakes' },
    { name: 'Chocolate Milkshake', price: 50, category: 'Special Milkshakes' },
    { name: 'Special Iceberg Shake', price: 100, category: 'Special Milkshakes', recommended: true },
    { name: 'Chocolate & Hazelnut Shake', price: 80, category: 'Special Milkshakes' },
    { name: 'Cold Coffee Shake', price: 80, category: 'Special Milkshakes' },
    { name: 'Vanilla & Roasted Almonds Shake', price: 80, category: 'Special Milkshakes' },
    { name: 'Cookies & Cream Shake', price: 80, category: 'Special Milkshakes', recommended: true },
    // Coffee & Davidoff
    { name: 'Cold Coffee', price: 70, category: 'Coffee & Brews', recommended: true },
    { name: 'Cold Coffee Strawberry', price: 80, category: 'Coffee & Brews' },
    { name: 'Cold Coffee Bournvita', price: 80, category: 'Coffee & Brews' },
    { name: 'Classic Strong Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'French Vanilla Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Hazelnut Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Chocolate Mocha Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Butterscotch Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Iced Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Dark Wish Coffee', price: 80, category: 'Coffee & Brews' },
    { name: 'Davidoff Elegant Coffee', price: 100, category: 'Coffee & Brews', recommended: true },
    { name: 'Davidoff Asia Coffee', price: 100, category: 'Coffee & Brews' },
    { name: 'Davidoff Brazil Coffee', price: 100, category: 'Coffee & Brews' },
    { name: 'Cold Coffee Sugar Less', price: 50, category: 'Coffee & Brews' },
    { name: 'Cold Chocolate', price: 50, category: 'Coffee & Brews' },
    { name: 'Frappe Mocha', price: 60, category: 'Coffee & Brews' },
    // Lotte
    { name: 'Lotte Choco Pie Shake', price: 70, category: 'Lotte Special' },
    { name: 'Lotte Choco Pie Coffee', price: 80, category: 'Lotte Special' },
    // Hot Coffee
    { name: 'Tapri Coffee', price: 30, category: 'Hot Drinks' },
    { name: 'Espresso', price: 40, category: 'Hot Drinks' },
    { name: 'Cappuccino', price: 40, category: 'Hot Drinks', recommended: true },
    { name: 'Cafe Latte', price: 40, category: 'Hot Drinks' },
    { name: 'Cafe Mocha', price: 40, category: 'Hot Drinks' },
    { name: 'Hot Chocolate', price: 40, category: 'Hot Drinks' },
    { name: 'Hot Milk', price: 30, category: 'Hot Drinks' },
    // Ice Tea
    { name: 'Lemon Ice Tea', price: 50, category: 'Ice Tea' },
    { name: 'Water Melon Ice Tea', price: 60, category: 'Ice Tea' },
    { name: 'Mojito Ice Tea', price: 60, category: 'Ice Tea' },
    { name: 'Peach Ice Tea', price: 60, category: 'Ice Tea', recommended: true },
    // Jar Cake
    { name: 'Chocolate Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Butterscotch Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Strawberry Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Pineapple Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Blueberry Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Mango Jar Cake', price: 70, category: 'Jar Cakes' },
    { name: 'Mix Fruits Jar Cake', price: 70, category: 'Jar Cakes', recommended: true }
  ]);

  // 7. Menu Items for Pramukh (Pramukh Preet)
  console.log('Inserting menu items for Pramukh...');
  await insertItems('Pramukh', [
    // Pizza's
    { name: 'Margherita Pizza', price: 120, category: 'Pizzas' },
    { name: 'Veg. Cheese Pizza', price: 130, category: 'Pizzas' },
    { name: 'Paneer Chili Sp. Pizza', price: 130, category: 'Pizzas' },
    { name: 'Paneer Tandoori Pizza', price: 130, category: 'Pizzas', recommended: true },
    { name: 'Onion Capsicum Pizza', price: 130, category: 'Pizzas' },
    { name: 'Paneer Corn Pizza', price: 130, category: 'Pizzas' },
    // Appetizer
    { name: 'Garlic Bread', price: 80, category: 'Appetizers' },
    { name: 'Cheese Toast', price: 90, category: 'Appetizers' },
    { name: 'Cheese Garlic Bread', price: 100, category: 'Appetizers', recommended: true },
    { name: 'Cheese Chili Toast', price: 100, category: 'Appetizers' },
    { name: 'Cheese Tandori Toast', price: 100, category: 'Appetizers' },
    { name: 'Pizza Toast', price: 100, category: 'Appetizers' },
    // Sandwich
    { name: 'Bread Butter Cheese Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Fruit Jam Cheese Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Chutney Cheese Special Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Double Cheese Special Sandwich', price: 80, category: 'Sandwiches' },
    { name: 'Veg. Cheese Special Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Tikka Masala Special Sandwich', price: 80, category: 'Sandwiches' },
    { name: 'Chocolate Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Chocolate Cheese Special Sandwich', price: 80, category: 'Sandwiches' },
    { name: 'Bombay Kaccha Sandwich', price: 70, category: 'Sandwiches' },
    { name: 'Our Special Sandwich', price: 70, category: 'Sandwiches', recommended: true },
    // Club Sandwich
    { name: 'Red Cheese Club Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Green Club Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Mexican Bean Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Paneer Tandoori Club', price: 110, category: 'Club Sandwiches', recommended: true },
    { name: 'Cheese Peri Peri Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Paneer Corn Masala Club', price: 110, category: 'Club Sandwiches' },
    { name: 'Indian Club Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Paneer Delight Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'American Club Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'European Club Sandwich', price: 110, category: 'Club Sandwiches' },
    { name: 'Junglee Paneer Club', price: 110, category: 'Club Sandwiches', recommended: true },
    { name: 'Regular Club Sandwich', price: 110, category: 'Club Sandwiches' },
    // Burger
    { name: 'Aloo Tikki Burger', price: 60, category: 'Burgers' },
    { name: 'Veg Cheese Burger', price: 70, category: 'Burgers', recommended: true },
    { name: 'Schezwan Cheese Burger', price: 70, category: 'Burgers' },
    { name: 'Cheese Garlic Burger', price: 70, category: 'Burgers' },
    { name: 'Peri Peri Sp. Burger', price: 80, category: 'Burgers' },
    { name: 'Double Tikki Burger', price: 100, category: 'Burgers', recommended: true },
    // Wrap / Frenkie
    { name: 'Sp. Cheese Wrap', price: 80, category: 'Wraps & Frenkie' },
    { name: 'Paneer Chili Wrap', price: 90, category: 'Wraps & Frenkie' },
    { name: 'Paneer Tandoori Wrap', price: 90, category: 'Wraps & Frenkie', recommended: true },
    { name: 'Cheese Garlic Wrap', price: 90, category: 'Wraps & Frenkie' },
    // Panini
    { name: 'Indian Panini', price: 110, category: 'Panini' },
    { name: 'Mexican Panini', price: 110, category: 'Panini' },
    { name: 'Tandoori Panini', price: 120, category: 'Panini', recommended: true },
    { name: 'Veg. Cheese Panini', price: 110, category: 'Panini' },
    // Maggi & Pasta
    { name: 'Masala Maggi', price: 50, category: 'Maggi & Pasta' },
    { name: 'Butter Maggi', price: 60, category: 'Maggi & Pasta' },
    { name: 'Cheese Maggi', price: 70, category: 'Maggi & Pasta' },
    { name: 'Veg. Cheese Maggi', price: 70, category: 'Maggi & Pasta' },
    { name: 'Veg. Maggi Pasta Cheese', price: 90, category: 'Maggi & Pasta', recommended: true },
    { name: 'Maggi Pasta', price: 80, category: 'Maggi & Pasta' },
    { name: 'Maggi Pasta Oil Tadka', price: 70, category: 'Maggi & Pasta' },
    { name: 'Maggi Pasta Butter Tadka', price: 80, category: 'Maggi & Pasta' },
    { name: 'Masala Pasta', price: 70, category: 'Maggi & Pasta' },
    { name: 'Cheese Pasta', price: 80, category: 'Maggi & Pasta' },
    { name: 'Veg. Cheese Pasta', price: 90, category: 'Maggi & Pasta' },
    { name: 'Veg. Cheese Pasta Oil Tadka', price: 90, category: 'Maggi & Pasta' },
    { name: 'Veg. Cheese Pasta Butter Tadka', price: 100, category: 'Maggi & Pasta' },
    { name: 'Red Sauce Pasta', price: 80, category: 'Maggi & Pasta' },
    { name: 'White Sauce Pasta', price: 80, category: 'Maggi & Pasta' },
    { name: 'Chinese Pasta', price: 80, category: 'Maggi & Pasta' },
    // Vada Pav
    { name: 'Oil Vada Pav', price: 25, category: 'Vada Pav' },
    { name: 'Butter Vada Pav', price: 35, category: 'Vada Pav' },
    { name: 'Cheese Vada Pav', price: 40, category: 'Vada Pav' },
    { name: 'Cheese Butter Vada Pav', price: 50, category: 'Vada Pav', recommended: true },
    { name: 'Onion Vada Pav', price: 30, category: 'Vada Pav' },
    { name: 'Cheese Onion Vada Pav', price: 40, category: 'Vada Pav' },
    { name: 'Classic Vada Pav', price: 35, category: 'Vada Pav' },
    { name: 'Bun Butter Cheese', price: 25, category: 'Vada Pav' },
    // Manchuriyan
    { name: 'Veg. Manchuriyan Dry', price: 200, category: 'Manchurian & Chinese' },
    { name: 'Veg. Manchuriyan Gravy', price: 200, category: 'Manchurian & Chinese' },
    { name: 'Veg. Garlic Manchuriyan', price: 100, category: 'Manchurian & Chinese' },
    { name: 'Veg. Schezwan Spicy Manchuriyan', price: 100, category: 'Manchurian & Chinese' },
    { name: 'Paneer Chilli', price: 180, category: 'Manchurian & Chinese', recommended: true },
    { name: 'Cheese Chilli', price: 200, category: 'Manchurian & Chinese' },
    { name: 'Chilli Potato', price: 120, category: 'Manchurian & Chinese' },
    // Noodles
    { name: 'Manchuriyan Noodles', price: 100, category: 'Noodles' },
    { name: 'Hakka Noodles', price: 100, category: 'Noodles', recommended: true },
    { name: 'Schezwan Noodles', price: 100, category: 'Noodles' },
    // Rice
    { name: 'Manchuriyan Rice', price: 100, category: 'Rice' },
    { name: 'Schezwan Rice', price: 100, category: 'Rice' },
    { name: 'Chinese Rice', price: 100, category: 'Rice' },
    { name: 'Veg. Fried Rice', price: 80, category: 'Rice' },
    { name: 'Chinese Bhel', price: 100, category: 'Rice' },
    // Special Pulao
    { name: 'Mug Pulao', price: 70, category: 'Special Pulao' },
    { name: 'Cheese Mug Pulao', price: 100, category: 'Special Pulao' },
    { name: 'Butter Mug Pulao', price: 100, category: 'Special Pulao' },
    { name: 'Cheese Butter Mug Pulao', price: 120, category: 'Special Pulao', recommended: true },
    { name: 'Hyderabadi Pulao', price: 200, category: 'Special Pulao' },
    { name: 'Veg. Pulao', price: 80, category: 'Special Pulao' },
    { name: 'Mexican Pulao', price: 90, category: 'Special Pulao' },
    { name: 'Chinese Pulao', price: 100, category: 'Special Pulao' },
    { name: 'Paneer Pulao', price: 100, category: 'Special Pulao' },
    { name: 'Maggi Pulao', price: 100, category: 'Special Pulao' },
    // Fries & Sides
    { name: 'French Fries', price: 80, category: 'Fries & Sides' },
    { name: 'Peri Peri French Fries', price: 90, category: 'Fries & Sides' },
    { name: 'Cheese Peri Peri French Fries', price: 110, category: 'Fries & Sides' },
    { name: 'Amul Dahi', price: 10, category: 'Fries & Sides' },
    { name: 'Bhujia Sev', price: 10, category: 'Fries & Sides' },
    { name: 'Extra Cheese', price: 20, category: 'Fries & Sides' },
    { name: 'Extra Butter', price: 10, category: 'Fries & Sides' },
    // Variety Puffs
    { name: 'Jeera Puff', price: 20, category: 'Variety Puffs' },
    { name: 'Garlic Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Garlic Sev Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Garlic Peanut Puff', price: 40, category: 'Variety Puffs' },
    { name: 'Sizwan Jeera Puff', price: 20, category: 'Variety Puffs' },
    { name: 'Sizwan Sev Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Sizwan Onion Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Sizwan Paneer Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Salad Puff', price: 50, category: 'Variety Puffs' },
    { name: 'Salad Cheese Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Salad Malai Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Chilly Puff', price: 70, category: 'Variety Puffs', recommended: true },
    { name: 'Garlic Chilly Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Tanduri Sp. Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Mayo Sp. Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Pizza Puff Sp.', price: 80, category: 'Variety Puffs', recommended: true },
    { name: 'Peri - Peri Sp. Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Chinese Puff', price: 25, category: 'Variety Puffs' },
    { name: 'Chinese Cheese Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Chinese Cheese Chilly Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Chinese Sizwan Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Chinese Garlic Puff', price: 30, category: 'Variety Puffs' },
    { name: 'Chinese Peri-peri Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Puff', price: 50, category: 'Variety Puffs' },
    { name: 'Cheese Onion Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Sizwan Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Tikki Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Cheese Sev Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Garlic Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese Tanduri Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Cheese & Peri - Peri Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Paneer Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Paneer & Cheese Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Paneer & Malai Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Paneer & Sizwan Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Paneer & Peri - Peri Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Malai Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Malai Cheese Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Malai Sizwan Puff', price: 70, category: 'Variety Puffs' },
    { name: 'Malai Tandoor Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Malai Sev Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Malai Paneer Puff', price: 60, category: 'Variety Puffs' },
    { name: 'Malai Peri - Peri Puff', price: 60, category: 'Variety Puffs' }
  ]);

  // 8. Insert Active Campus Coupons
  console.log('Inserting Active Coupons...');
  const coupons = [
    {
      code: 'WELCOME50',
      title: 'Welcome Campus Offer',
      desc: 'Flat 50 off on orders above 150',
      discount_type: 'FLAT',
      discount_value: 50,
      min_order_value: 150,
      color: '#E23744'
    },
    {
      code: 'CHARUSAT20',
      title: 'Campus Special Discount',
      desc: '20% off up to 100 on all orders above 199',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      min_order_value: 199,
      max_discount_cap: 100,
      color: '#10B981'
    },
    {
      code: 'DEALOFTHEDAY',
      title: 'Deal of the Day',
      desc: 'Flat 100 off on orders above 299',
      discount_type: 'FLAT',
      discount_value: 100,
      min_order_value: 299,
      color: '#EA580C'
    }
  ];

  for (const cp of coupons) {
    await client.query(
      `INSERT INTO coupons (
        id, coupon_code, title, description, color, coupon_type, discount_type,
        discount_value, min_order_value, max_discount_cap, usage_limit_total,
        usage_limit_per_user, current_usage_count, is_active, is_custom,
        offer_category, is_archived, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'GENERAL', $5,
        $6, $7, $8, 1000,
        5, 0, true, false,
        'COUPON', false, NOW(), NOW()
      )`,
      [
        cp.code,
        cp.title,
        cp.desc,
        cp.color,
        cp.discount_type,
        cp.discount_value,
        cp.min_order_value,
        cp.max_discount_cap || null
      ]
    );
    console.log(`  Coupon created: ${cp.code}`);
  }

  // 9. Sync Categories table from distinct menu_item categories
  console.log('Syncing categories table from menu_items...');
  const catsRes = await client.query(`
    SELECT DISTINCT category, canteen_id FROM menu_items WHERE category IS NOT NULL;
  `);

  for (const row of catsRes.rows) {
    await client.query(`
      INSERT INTO categories (name, canteen_id, is_available)
      VALUES ($1, $2, true)
      ON CONFLICT (name) DO NOTHING;
    `, [row.category, row.canteen_id]);
  }

  // Verify total count
  const canteenCount = await client.query('SELECT count(*) FROM canteens');
  const itemCount = await client.query('SELECT count(*) FROM menu_items');
  const userCount = await client.query('SELECT count(*) FROM users');

  console.log('\n======================================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`Canteens created: ${canteenCount.rows[0].count}`);
  console.log(`Menu Items created: ${itemCount.rows[0].count}`);
  console.log(`Users created: ${userCount.rows[0].count}`);
  console.log('======================================================');

  await client.end();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  client.end();
  process.exit(1);
});
