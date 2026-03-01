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
    mobile                    VARCHAR(15),
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
    mfa_secret                VARCHAR(255),
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
    profile_image_type        VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- 2. CANTEENS
CREATE TABLE IF NOT EXISTS canteens (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    location            VARCHAR(255),
    description         TEXT,
    image_url           VARCHAR(255),
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

-- 12. COUPON USAGE
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

-- 13. COUPON ANALYTICS
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

-- 14. CARTS
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

-- 15. CART ITEMS
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

-- 16. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id                   BIGSERIAL PRIMARY KEY,
    order_number         VARCHAR(255) NOT NULL UNIQUE,
    customer_id          BIGINT NOT NULL REFERENCES users(id),
    canteen_id           BIGINT NOT NULL REFERENCES canteens(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
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

-- 17. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity     INTEGER NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    total_price  NUMERIC(10,2) NOT NULL,
    notes        TEXT
);

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
