-- ============================================================
-- Flyway Migration V6: Scheduled Orders Architecture
-- Adds future date/time ordering, release-time scheduling,
-- and high-concurrency partial index for release workers.
-- ============================================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'INSTANT',
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
ADD COLUMN IF NOT EXISTS release_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;

-- Index for the OrderReleaseScheduler to poll pending releases with zero table scans
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_release 
ON orders (status, release_at);

CREATE INDEX IF NOT EXISTS idx_orders_canteen_scheduled 
ON orders (canteen_id, status, scheduled_for);
