-- ============================================================
-- Flyway Migration V3: Payouts Table
-- Financial settlement tracking for canteens
-- ============================================================

CREATE TABLE IF NOT EXISTS payouts (
    id            BIGSERIAL PRIMARY KEY,
    canteen_id    BIGINT NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    period_start  TIMESTAMP NOT NULL,
    period_end    TIMESTAMP NOT NULL,
    gross_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
    fees          NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    status        VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    paid_at       TIMESTAMP,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_canteen_id ON payouts(canteen_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status     ON payouts(status);
