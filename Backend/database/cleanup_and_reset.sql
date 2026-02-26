-- ============================================================================
-- CharusatNeeds Database Reset Script
-- Purpose: Wipe ALL data for a fresh start. 
-- The DataInitializer.java will re-seed 3 vendors on next app startup.
-- ============================================================================
-- Run with: psql -U postgres -d charusatneeds -f cleanup_and_reset.sql
-- ============================================================================

BEGIN;

-- Disable FK checks temporarily by truncating in correct dependency order
-- Child tables first, parent tables last

-- 1. Security & Auth tokens
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE password_history CASCADE;
TRUNCATE TABLE login_attempts CASCADE;

-- 2. Reviews (depends on orders, users, canteens)
TRUNCATE TABLE reviews CASCADE;

-- 3. Order items (depends on orders)
TRUNCATE TABLE order_items CASCADE;

-- 4. Orders (depends on users, canteens)
TRUNCATE TABLE orders CASCADE;

-- 5. Cart items (depends on carts)
TRUNCATE TABLE cart_items CASCADE;

-- 6. Carts (depends on users, canteens)
TRUNCATE TABLE carts CASCADE;

-- 7. Menu-related (addon_options → addon_groups → menu_item_variants → menu_item_tags → menu_items)
TRUNCATE TABLE addon_options CASCADE;
TRUNCATE TABLE addon_groups CASCADE;
TRUNCATE TABLE addons CASCADE;
TRUNCATE TABLE menu_item_variants CASCADE;
TRUNCATE TABLE menu_item_tags CASCADE;
TRUNCATE TABLE menu_items CASCADE;

-- 8. Coupons (depends on canteens)
TRUNCATE TABLE coupons CASCADE;

-- 9. Categories (depends on canteens)
TRUNCATE TABLE categories CASCADE;

-- 10. Canteens (depends on users via owner_id)
TRUNCATE TABLE canteens CASCADE;

-- 11. Users (parent table - last)
TRUNCATE TABLE users CASCADE;

-- Reset all auto-increment sequences to 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE canteens_id_seq RESTART WITH 1;
ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;
ALTER SEQUENCE menu_item_variants_id_seq RESTART WITH 1;
ALTER SEQUENCE addon_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE addon_options_id_seq RESTART WITH 1;
ALTER SEQUENCE coupons_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE carts_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE login_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE password_history_id_seq RESTART WITH 1;
ALTER SEQUENCE password_reset_tokens_id_seq RESTART WITH 1;
ALTER SEQUENCE refresh_tokens_id_seq RESTART WITH 1;

COMMIT;

-- Verify cleanup
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL SELECT 'Canteens: ' || COUNT(*) FROM canteens
UNION ALL SELECT 'Menu Items: ' || COUNT(*) FROM menu_items
UNION ALL SELECT 'Orders: ' || COUNT(*) FROM orders
UNION ALL SELECT 'Carts: ' || COUNT(*) FROM carts
UNION ALL SELECT 'Coupons: ' || COUNT(*) FROM coupons;

-- ============================================================================
-- DONE! Now restart the Spring Boot backend to trigger DataInitializer.
-- It will automatically create:
--   - 7 users (1 admin, 3 canteen owners, 2 regular users, 1 legacy owner)
--   - 3 canteens (Honest Restaurant, Madras Cafe, Fresh Bites)
--   - 90+ menu items with variants, addon groups, and addon options
--   - 9 coupons (3 per canteen)
--   - 12 sample orders (4 per canteen)
-- ============================================================================
