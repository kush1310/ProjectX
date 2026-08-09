-- ============================================================
-- Flyway Migration V4: Canteens Schedule Table
-- Supports automated day/time operating hours
-- ============================================================

CREATE TABLE IF NOT EXISTS canteens_schedule (
    id          BIGSERIAL PRIMARY KEY,
    canteen_id  BIGINT NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    open_time   TIME NOT NULL,
    close_time  TIME NOT NULL,
    CONSTRAINT unique_canteen_day UNIQUE (canteen_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_canteens_schedule_canteen ON canteens_schedule(canteen_id);
