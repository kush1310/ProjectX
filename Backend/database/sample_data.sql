-- ============================================================
-- CharusatNeeds — Sample Seed Data for Testing
-- Run AFTER schema.sql has been applied
-- ============================================================

-- 1. SAMPLE USERS (password: 'Test@1234' bcrypt-hashed)
INSERT INTO users (email, password, full_name, mobile, role, auth_provider, is_active, is_email_verified)
VALUES
    ('akshar@charusat.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Akshar Patel', '9876543210', 'USER', 'LOCAL', TRUE, TRUE),
    ('riya@charusat.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Riya Sharma', '9876543211', 'USER', 'LOCAL', TRUE, TRUE),
    ('vendor@charusat.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Vendor Admin', '9876543212', 'CANTEEN_OWNER', 'LOCAL', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- 2. SAMPLE CANTEEN (Restaurant)
INSERT INTO canteens (name, location, description, is_open, opening_time, closing_time, owner_id)
SELECT 'DEPSTAR Canteen', 'DEPSTAR Building, CHARUSAT Campus', 'Main campus canteen with variety of food', TRUE, '08:00', '20:00', id
FROM users WHERE email = 'vendor@charusat.ac.in'
ON CONFLICT DO NOTHING;

-- 3. SAMPLE MENU ITEMS (Food Items)
INSERT INTO menu_items (name, description, price, category, is_available, is_veg, preparation_time, canteen_id)
SELECT 'Masala Dosa', 'Crispy dosa with potato filling', 80.00, 'South Indian', TRUE, TRUE, 10, c.id
FROM canteens c WHERE c.name = 'DEPSTAR Canteen'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (name, description, price, category, is_available, is_veg, preparation_time, canteen_id)
SELECT 'Paneer Butter Masala', 'Rich paneer curry', 180.00, 'North Indian', TRUE, TRUE, 15, c.id
FROM canteens c WHERE c.name = 'DEPSTAR Canteen'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (name, description, price, category, is_available, is_veg, preparation_time, canteen_id)
SELECT 'Veg Biryani', 'Fragrant rice with vegetables', 150.00, 'Biryani', TRUE, TRUE, 20, c.id
FROM canteens c WHERE c.name = 'DEPSTAR Canteen'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (name, description, price, category, is_available, is_veg, preparation_time, canteen_id)
SELECT 'Cold Coffee', 'Chilled coffee with ice cream', 90.00, 'Beverages', TRUE, TRUE, 5, c.id
FROM canteens c WHERE c.name = 'DEPSTAR Canteen'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (name, description, price, category, is_available, is_veg, preparation_time, canteen_id)
SELECT 'Samosa', 'Crispy fried pastry with spiced potato', 20.00, 'Snacks', TRUE, TRUE, 5, c.id
FROM canteens c WHERE c.name = 'DEPSTAR Canteen'
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE ORDER (for reference only — normally placed via API)
-- ============================================================
-- To place a test order, use the API:
-- POST http://localhost:8000/api/orders/place
-- See postman_examples.md for full request/response examples
