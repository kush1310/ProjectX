-- =============================================
-- CharusatNeeds Database Schema (Raw JDBC)
-- PostgreSQL 18
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    locked_until TIMESTAMP,
    profile_image VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expiry TIMESTAMP,
    last_password_change TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    date_of_birth VARCHAR(255),
    anniversary VARCHAR(255),
    gender VARCHAR(255),
    user_type VARCHAR(255),
    hostel_name VARCHAR(255),
    room_number VARCHAR(255),
    building_number VARCHAR(255),
    department VARCHAR(255),
    staff_room_number VARCHAR(255),
    profile_image_data BYTEA,
    profile_image_type VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- Canteens table
CREATE TABLE IF NOT EXISTS canteens (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    is_open BOOLEAN DEFAULT TRUE,
    rush_hour_enabled BOOLEAN DEFAULT FALSE,
    opening_time VARCHAR(255),
    closing_time VARCHAR(255),
    fssai_number VARCHAR(255),
    gst_no VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(255),
    account_holder_name VARCHAR(255),
    kyc_document_url VARCHAR(255),
    owner_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    canteen_id BIGINT REFERENCES canteens(id),
    UNIQUE(name, canteen_id)
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(255),
    sub_category VARCHAR(255),
    display_order INTEGER,
    available_from VARCHAR(255),
    available_to VARCHAR(255),
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    is_veg BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER,
    spicy_level INTEGER,
    is_recommended BOOLEAN DEFAULT FALSE,
    has_variants BOOLEAN DEFAULT FALSE,
    has_addons BOOLEAN DEFAULT FALSE,
    canteen_id BIGINT NOT NULL REFERENCES canteens(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Item Tags (was @ElementCollection)
CREATE TABLE IF NOT EXISTS menu_item_tags (
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL
);

-- Menu Item Variants
CREATE TABLE IF NOT EXISTS menu_item_variants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    price NUMERIC(10,2),
    menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Addon Groups
CREATE TABLE IF NOT EXISTS addon_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    min_selection INTEGER,
    max_selection INTEGER,
    menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Addon Options
CREATE TABLE IF NOT EXISTS addon_options (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    price NUMERIC(10,2),
    addon_group_id BIGINT REFERENCES addon_groups(id) ON DELETE CASCADE
);

-- Addons (standalone)
CREATE TABLE IF NOT EXISTS addons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    group_id BIGINT NOT NULL REFERENCES addon_groups(id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(255),
    discount_type VARCHAR(50),
    discount_value NUMERIC(10,2),
    min_order_value NUMERIC(10,2),
    max_discount_amount NUMERIC(10,2),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT TRUE,
    canteen_id BIGINT REFERENCES canteens(id),
    type VARCHAR(50) DEFAULT 'DISCOUNT',
    scope VARCHAR(50) DEFAULT 'GLOBAL',
    target_ids VARCHAR(255),
    bogo_buy_qty INTEGER,
    bogo_get_qty INTEGER
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES users(id),
    canteen_id BIGINT NOT NULL REFERENCES canteens(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    special_instructions TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    notes TEXT
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    canteen_id BIGINT REFERENCES canteens(id),
    total_amount NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    selected_variant VARCHAR(255),
    selected_addons TEXT,
    special_instructions TEXT
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    customer_id BIGINT NOT NULL REFERENCES users(id),
    canteen_id BIGINT NOT NULL REFERENCES canteens(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    packing_rating INTEGER CHECK (packing_rating >= 1 AND packing_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendor_reply TEXT,
    replied_at TIMESTAMP
);

-- Login Attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(255) NOT NULL,
    user_agent TEXT,
    attempted_at TIMESTAMP NOT NULL,
    successful BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(255),
    attempt_type VARCHAR(50) NOT NULL DEFAULT 'LOGIN',
    country_code VARCHAR(10),
    suspicious BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_login_attempt_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempt_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempt_timestamp ON login_attempts(attempted_at);

-- Password History table
CREATE TABLE IF NOT EXISTS password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(255),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_tokens(user_id);
