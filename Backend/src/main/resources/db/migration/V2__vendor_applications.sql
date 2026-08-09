-- ============================================================
-- Flyway Migration V2: Vendor Applications Table
-- Supports end-to-end multi-step vendor onboarding
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_applications (
    id                BIGSERIAL PRIMARY KEY,
    applicant_name    VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    phone             VARCHAR(50),
    canteen_name      VARCHAR(255) NOT NULL,
    canteen_type      VARCHAR(100),
    description       TEXT,
    address           TEXT,
    bank_name         VARCHAR(255),
    account_number_enc TEXT,
    ifsc_code_enc      TEXT,
    fssai_license_enc  TEXT,
    status            VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at      TIMESTAMP DEFAULT NOW(),
    reviewed_by       BIGINT REFERENCES users(id),
    reviewed_at       TIMESTAMP,
    rejection_reason  TEXT
);

CREATE INDEX IF NOT EXISTS idx_vendor_app_status ON vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_app_email  ON vendor_applications(email);
