-- ============================================================
-- CharusatNeeds — Complete PostgreSQL Schema
-- Generated from JPA Entity Annotations (21 Entities)
-- ============================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id                        BIGSERIAL PRIMARY KEY,
    email                     VARCHAR(255) NOT NULL UNIQUE,
    password                  VARCHAR(255),
    full_name                 VARCHAR(255) NOT NULL,
    mobile                    TEXT,
    role                      VARCHAR(20) NOT NULL DEFAULT 'USER',
    auth_provider             VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    created_at                TIMESTAMP DEFAULT NOW(),
    last_login                TIMESTAMP,
    is_active                 BOOLEAN DEFAULT TRUE,
    locked_until              TIMESTAMP,
    profile_image             VARCHAR(255),
    is_email_verified         BOOLEAN DEFAULT FALSE,
    email_verification_token  VARCHAR(255),
    email_verification_expiry TIMESTAMP,
    last_password_change      TIMESTAMP,
    mfa_enabled               BOOLEAN DEFAULT FALSE,
    mfa_secret                TEXT,
    date_of_birth             VARCHAR(255),
    anniversary               VARCHAR(255),
    gender                    VARCHAR(255),
    user_type                 VARCHAR(255),
    hostel_name               VARCHAR(255),
    room_number               VARCHAR(255),
    building_number           VARCHAR(255),
    department                VARCHAR(255),
    staff_room_number         VARCHAR(255),
    profile_image_data        BYTEA,
    profile_image_type        VARCHAR(255),
    deletion_requested_at     TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- 2. CANTEENS
CREATE TABLE IF NOT EXISTS canteens (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    location            VARCHAR(255),
    description         TEXT,
    image_url           VARCHAR(255),
    logo_url            VARCHAR(500),
    is_open             BOOLEAN DEFAULT TRUE,
    rush_hour_enabled   BOOLEAN DEFAULT FALSE,
    opening_time        VARCHAR(255),
    closing_time        VARCHAR(255),
    fssai_number        VARCHAR(255),
    gst_no              VARCHAR(255),
    bank_name           VARCHAR(255),
    account_number      VARCHAR(255),
    ifsc_code           VARCHAR(255),
    account_holder_name VARCHAR(255),
    kyc_document_url    VARCHAR(255),
    owner_id            BIGINT REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    canteen_id BIGINT REFERENCES canteens(id)
);

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    price            NUMERIC(10,2) NOT NULL,
    category         VARCHAR(255),
    sub_category     VARCHAR(255),
    display_order    INTEGER,
    available_from   VARCHAR(255),
    available_to     VARCHAR(255),
    image_url        VARCHAR(255),
    is_available     BOOLEAN DEFAULT TRUE,
    is_veg           BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER,
    spicy_level      INTEGER,
    is_recommended   BOOLEAN DEFAULT FALSE,
    has_variants     BOOLEAN DEFAULT FALSE,
    has_addons       BOOLEAN DEFAULT FALSE,
    canteen_id       BIGINT NOT NULL REFERENCES canteens(id),
    created_at       TIMESTAMP DEFAULT NOW()
);

-- 5. MENU ITEM TAGS (ElementCollection)
CREATE TABLE IF NOT EXISTS menu_item_tags (
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    tag          VARCHAR(255)
);

-- 6. MENU ITEM VARIANTS
CREATE TABLE IF NOT EXISTS menu_item_variants (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255),
    price        NUMERIC(10,2),
    menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 7. ADDON GROUPS
CREATE TABLE IF NOT EXISTS addon_groups (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255),
    min_selection INTEGER,
    max_selection INTEGER,
    menu_item_id  BIGINT REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 8. ADDON OPTIONS
CREATE TABLE IF NOT EXISTS addon_options (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255),
    price          NUMERIC(10,2),
    addon_group_id BIGINT REFERENCES addon_groups(id) ON DELETE CASCADE
);

-- 9. ADDONS (legacy)
CREATE TABLE IF NOT EXISTS addons (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    price        NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    group_id     BIGINT NOT NULL REFERENCES addon_groups(id)
);

-- 10. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code         VARCHAR(30) NOT NULL UNIQUE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    color               VARCHAR(7),
    coupon_type         VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    discount_type       VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value      NUMERIC(10,2),
    max_discount_cap    NUMERIC(10,2),
    min_order_value     NUMERIC(10,2),
    usage_limit_total   INTEGER,
    usage_limit_per_user INTEGER,
    current_usage_count INTEGER DEFAULT 0,
    start_time          TIMESTAMP,
    end_time            TIMESTAMP,
    rush_hour_flag      BOOLEAN DEFAULT FALSE,
    rush_hour_start     TIME,
    rush_hour_end       TIME,
    bogo_buy_qty        INTEGER,
    bogo_get_qty        INTEGER,
    bogo_free_item_id   BIGINT,
    combo_items         TEXT,
    new_customer_only   BOOLEAN DEFAULT FALSE,
    new_dish_flag       BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    is_custom           BOOLEAN DEFAULT TRUE,
    offer_category      VARCHAR(30) DEFAULT 'COUPON',
    is_archived         BOOLEAN DEFAULT FALSE,
    archived_at         TIMESTAMP,
    original_end_time   TIMESTAMP,
    canteen_id          BIGINT REFERENCES canteens(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupon_code      ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_active    ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_validity  ON coupons(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_coupon_type      ON coupons(coupon_type);
CREATE INDEX IF NOT EXISTS idx_coupon_rush_hour ON coupons(rush_hour_flag);
CREATE INDEX IF NOT EXISTS idx_coupon_archived  ON coupons(is_archived);
CREATE INDEX IF NOT EXISTS idx_coupon_category  ON coupons(offer_category);

-- 11. COUPON APPLICABILITY
CREATE TABLE IF NOT EXISTS coupon_applicability (
    id           BIGSERIAL PRIMARY KEY,
    coupon_id    UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    required_qty INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_ca_coupon    ON coupon_applicability(coupon_id);
CREATE INDEX IF NOT EXISTS idx_ca_menu_item ON coupon_applicability(menu_item_id);

-- 12. CARTS
CREATE TABLE IF NOT EXISTS carts (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL UNIQUE REFERENCES users(id),
    canteen_id        BIGINT REFERENCES canteens(id),
    total_amount      NUMERIC(10,2) DEFAULT 0,
    applied_coupon_id UUID REFERENCES coupons(id),
    discount_amount   NUMERIC(10,2) DEFAULT 0,
    final_amount      NUMERIC(10,2) DEFAULT 0,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP
);

-- 13. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
    id                   BIGSERIAL PRIMARY KEY,
    cart_id              BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id         BIGINT NOT NULL REFERENCES menu_items(id),
    quantity             INTEGER NOT NULL DEFAULT 1,
    unit_price           NUMERIC(10,2) NOT NULL,
    selected_variant     VARCHAR(255),
    selected_addons      TEXT,
    special_instructions TEXT
);

-- 14. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id                   BIGSERIAL PRIMARY KEY,
    order_number         VARCHAR(255) NOT NULL UNIQUE,
    customer_id          BIGINT NOT NULL REFERENCES users(id),
    canteen_id           BIGINT NOT NULL REFERENCES canteens(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    order_type           VARCHAR(20) DEFAULT 'INSTANT',
    scheduled_for        TIMESTAMP,
    release_at           TIMESTAMP,
    released_at          TIMESTAMP,
    total_amount         NUMERIC(10,2) NOT NULL,
    sub_total            NUMERIC(10,2),
    discount_amount      NUMERIC(10,2) DEFAULT 0,
    delivery_fee         NUMERIC(10,2) DEFAULT 0,
    applied_coupon_id    UUID REFERENCES coupons(id),
    payment_method       VARCHAR(255),
    payment_status       VARCHAR(20) DEFAULT 'PENDING',
    special_instructions TEXT,
    rejection_reason     TEXT,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP,
    completed_at         TIMESTAMP
);

-- 15. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity     INTEGER NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    total_price  NUMERIC(10,2) NOT NULL,
    notes        TEXT
);

-- 16. COUPON USAGE (after orders, since it references orders.id)
CREATE TABLE IF NOT EXISTS coupon_usage (
    id               BIGSERIAL PRIMARY KEY,
    coupon_id        UUID NOT NULL,
    user_id          BIGINT NOT NULL REFERENCES users(id),
    order_id         BIGINT REFERENCES orders(id),
    discount_applied NUMERIC(10,2) NOT NULL,
    order_total      NUMERIC(10,2),
    used_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cu_coupon      ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_cu_user        ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_cu_coupon_user ON coupon_usage(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cu_used_at     ON coupon_usage(used_at);

-- 17. COUPON ANALYTICS
CREATE TABLE IF NOT EXISTS coupon_analytics (
    id                    BIGSERIAL PRIMARY KEY,
    coupon_id             UUID NOT NULL,
    snapshot_date         DATE NOT NULL,
    times_used            INTEGER DEFAULT 0,
    total_discount_given  NUMERIC(10,2) DEFAULT 0,
    total_order_value     NUMERIC(10,2) DEFAULT 0,
    new_customers_gained  INTEGER DEFAULT 0,
    repeat_customers_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cana_coupon      ON coupon_analytics(coupon_id);
CREATE INDEX IF NOT EXISTS idx_cana_date        ON coupon_analytics(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_cana_coupon_date ON coupon_analytics(coupon_id, snapshot_date);

-- 18. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    customer_id     BIGINT NOT NULL REFERENCES users(id),
    canteen_id      BIGINT NOT NULL REFERENCES canteens(id),
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         VARCHAR(500),
    food_rating     INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    packing_rating  INTEGER CHECK (packing_rating >= 1 AND packing_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    is_anonymous    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    vendor_reply    TEXT,
    replied_at      TIMESTAMP
);

-- 19. LOGIN ATTEMPTS
CREATE TABLE IF NOT EXISTS login_attempts (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    ip_address    VARCHAR(255) NOT NULL,
    user_agent    TEXT,
    attempted_at  TIMESTAMP NOT NULL,
    successful    BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason TEXT,
    attempt_type  VARCHAR(30) NOT NULL DEFAULT 'LOGIN',
    country_code  VARCHAR(10),
    suspicious    BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_login_attempt_email     ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempt_ip        ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempt_timestamp ON login_attempts(attempted_at);

-- 20. PASSWORD HISTORY
CREATE TABLE IF NOT EXISTS password_history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- 21. PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    token      VARCHAR(255) NOT NULL UNIQUE,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 22. REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id             BIGSERIAL PRIMARY KEY,
    token_hash     VARCHAR(255) NOT NULL UNIQUE,
    user_id        BIGINT NOT NULL REFERENCES users(id),
    expires_at     TIMESTAMP NOT NULL,
    created_at     TIMESTAMP NOT NULL,
    device_info    TEXT,
    ip_address     VARCHAR(255),
    revoked        BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at     TIMESTAMP,
    revoked_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_tokens(user_id);

-- ============================================================
-- MIGRATION: Field Encryption + MFA Support
-- Run once on existing databases
-- ============================================================

-- Widen columns for AES-256-GCM encrypted values (Base64-encoded)
ALTER TABLE users ALTER COLUMN mobile TYPE TEXT;
ALTER TABLE users ALTER COLUMN mfa_secret TYPE TEXT;

-- ============================================================
-- NORMALIZATION: 3NF — Extract profile, bank, and category data
-- ============================================================

-- 23. USER PROFILES (extracted from users — 3NF)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id            BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth      VARCHAR(255),
    anniversary        VARCHAR(255),
    gender             VARCHAR(20),
    user_type          VARCHAR(50),
    hostel_name        VARCHAR(255),
    room_number        VARCHAR(50),
    building_number    VARCHAR(50),
    department         VARCHAR(255),
    staff_room_number  VARCHAR(50),
    profile_image_data BYTEA,
    profile_image_type VARCHAR(100)
);

-- Migrate existing profile data
INSERT INTO user_profiles (user_id, date_of_birth, anniversary, gender, user_type,
    hostel_name, room_number, building_number, department, staff_room_number,
    profile_image_data, profile_image_type)
SELECT id, date_of_birth, anniversary, gender, user_type,
    hostel_name, room_number, building_number, department, staff_room_number,
    profile_image_data, profile_image_type
FROM users
WHERE date_of_birth IS NOT NULL OR anniversary IS NOT NULL OR gender IS NOT NULL
    OR user_type IS NOT NULL OR hostel_name IS NOT NULL OR department IS NOT NULL
    OR profile_image_data IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 24. CANTEEN BANK DETAILS (extracted from canteens — 3NF)
CREATE TABLE IF NOT EXISTS canteen_bank_details (
    canteen_id         BIGINT PRIMARY KEY REFERENCES canteens(id) ON DELETE CASCADE,
    bank_name          VARCHAR(255),
    account_number     TEXT,  -- encrypted with AES-256-GCM
    ifsc_code          VARCHAR(20),
    account_holder_name VARCHAR(255),
    fssai_number       VARCHAR(50),
    gst_no             VARCHAR(50),
    kyc_document_url   VARCHAR(255)
);

-- Migrate existing bank data
INSERT INTO canteen_bank_details (canteen_id, bank_name, account_number, ifsc_code,
    account_holder_name, fssai_number, gst_no, kyc_document_url)
SELECT id, bank_name, account_number, ifsc_code,
    account_holder_name, fssai_number, gst_no, kyc_document_url
FROM canteens
WHERE bank_name IS NOT NULL OR account_number IS NOT NULL OR fssai_number IS NOT NULL
ON CONFLICT (canteen_id) DO NOTHING;

-- 25. MFA EVENTS (full audit trail for MFA operations)
CREATE TABLE IF NOT EXISTS mfa_events (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    event_type  VARCHAR(30) NOT NULL,
    ip_address  VARCHAR(255),
    user_agent  TEXT,
    success     BOOLEAN NOT NULL DEFAULT FALSE,
    detail      TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mfa_event_user ON mfa_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_event_type ON mfa_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mfa_event_time ON mfa_events(created_at);

-- Add category_id FK to menu_items (2NF fix)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);

-- 26. FAVORITES (user's saved menu items)
CREATE TABLE IF NOT EXISTS favorites (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, menu_item_id)
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_menu_item ON favorites(menu_item_id);

-- ============================================================
-- 27. PAYMENT ORDERS (Razorpay Integration)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
    id                  BIGSERIAL PRIMARY KEY,
    razorpay_order_id   VARCHAR(50) UNIQUE,
    razorpay_payment_id VARCHAR(50),
    amount_in_paise     BIGINT NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    status              VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    user_id             BIGINT NOT NULL REFERENCES users(id),
    food_order_id       BIGINT REFERENCES orders(id),
    idempotency_key     VARCHAR(64) UNIQUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_po_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_food_order ON payment_orders(food_order_id);

-- 28. WEBHOOK EVENTS (Razorpay webhook idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
    id          BIGSERIAL PRIMARY KEY,
    event_id    VARCHAR(100) UNIQUE NOT NULL,
    event_type  VARCHAR(50) NOT NULL,
    payload     TEXT,
    processed   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_we_event_id ON webhook_events(event_id);

-- ============================================================
-- SAFE COLUMN MIGRATIONS
-- Each uses IF NOT EXISTS so re-running schema.sql is idempotent.
-- continue-on-error=true ensures existing-column errors are skipped.
-- ============================================================

-- Profile image storage columns (may not exist on databases created before this feature)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_data BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_type VARCHAR(255);

-- Review quick-tags column (array of tag IDs stored as comma-separated text)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tags TEXT;

-- ============================================================
-- 29. REVIEWS TABLE (if not created by earlier migration)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    customer_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    canteen_id       BIGINT REFERENCES canteens(id) ON DELETE CASCADE,
    rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    food_rating      INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    packing_rating   INTEGER CHECK (packing_rating >= 1 AND packing_rating <= 5),
    delivery_rating  INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    is_anonymous     BOOLEAN DEFAULT FALSE,
    vendor_reply     TEXT,
    replied_at       TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_canteen  ON reviews(canteen_id);
CREATE INDEX IF NOT EXISTS idx_review_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_review_order    ON reviews(order_id);

-- ============================================================
-- 30. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id            BIGSERIAL PRIMARY KEY,
    reference_id  VARCHAR(30) NOT NULL UNIQUE,
    customer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    canteen_id    BIGINT REFERENCES canteens(id) ON DELETE SET NULL,
    order_id      BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    order_number  VARCHAR(50),
    subject       VARCHAR(200),
    description   TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                      CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')),
    vendor_reply  TEXT,
    replied_at    TIMESTAMP,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_complaint_customer   ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaint_canteen    ON complaints(canteen_id);
CREATE INDEX IF NOT EXISTS idx_complaint_order      ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status     ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_ref        ON complaints(reference_id);

-- ============================================================
-- 31. VENDOR APPLICATIONS TABLE
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

-- ============================================================
-- 32. PAYOUTS TABLE
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

-- ============================================================
-- 33. CANTEENS SCHEDULE TABLE
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

-- ============================================================
-- 34. PERFORMANCE INDEXES (On-Demand Tab Queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_status   ON orders(canteen_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_created  ON orders(canteen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id   ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_created ON menu_items(canteen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_canteen_end_time ON coupons(canteen_id, end_time);
CREATE INDEX IF NOT EXISTS idx_reviews_canteen_created ON reviews(canteen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_canteen_created ON complaints(canteen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);

-- ============================================================
-- 35. SCHEDULED ORDERS ALTER TABLE & INDEXES (Idempotent)
-- ============================================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'INSTANT',
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
ADD COLUMN IF NOT EXISTS release_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_release 
ON orders (status, release_at);

CREATE INDEX IF NOT EXISTS idx_orders_canteen_scheduled 
ON orders (canteen_id, status, scheduled_for);

-- ============================================================
-- 36. PASSWORD HISTORY TABLE (NIST SP 800-63B Compliance)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, created_at DESC);



