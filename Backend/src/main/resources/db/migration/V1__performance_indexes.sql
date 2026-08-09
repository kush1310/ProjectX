-- ============================================================
-- Flyway Migration V1: Performance Indexes
-- High-traffic filter and sort column indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_status   ON orders(canteen_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id   ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_coupons_canteen_end_time ON coupons(canteen_id, end_time);
