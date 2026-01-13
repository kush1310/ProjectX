-- =====================================================
-- CharusatNeeds - MySQL Database Schema
-- CHARUSAT Campus Canteen Aggregator System
-- 
-- Compatible with: XAMPP MySQL Server
-- Create this database in phpMyAdmin or MySQL CLI
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS charusatneeds
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE charusatneeds;

-- =====================================================
-- USERS TABLE
-- Stores all user types: student, canteen, warden, admin, superadmin
-- =====================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identity
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(15) NOT NULL,
    
    -- Role: 'student', 'canteen', 'warden', 'admin', 'superadmin'
    role ENUM('student', 'canteen', 'warden', 'admin', 'superadmin') NOT NULL DEFAULT 'student',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Student specific (nullable for other roles)
    hostel_name VARCHAR(100) NULL,
    room_number VARCHAR(20) NULL,
    
    -- Preferences
    language_preference ENUM('en', 'hi', 'gu') NOT NULL DEFAULT 'en',
    profile_image_url VARCHAR(500) NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    -- Constraints
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_hostel (hostel_name),
    
    -- Email must end with @charusat.edu.in
    CONSTRAINT chk_users_email CHECK (email REGEXP '^[a-zA-Z0-9._-]+@charusat\\.edu\\.in$'),
    
    -- Contact number must be 10 digits starting with 6-9
    CONSTRAINT chk_users_contact CHECK (contact_number REGEXP '^[6-9][0-9]{9}$'),
    
    -- Name must be letters and spaces only
    CONSTRAINT chk_users_name CHECK (full_name REGEXP '^[A-Za-z ]{2,100}$')
) ENGINE=InnoDB;

-- =====================================================
-- LOGIN ATTEMPTS TABLE
-- Rate limiting: 3 failed attempts = 44 second lockout
-- =====================================================
CREATE TABLE login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500) NULL,
    
    attempt_type ENUM('password', 'otp') NOT NULL DEFAULT 'password',
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_login_email_time (email, attempted_at),
    INDEX idx_login_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB;

-- =====================================================
-- LOCKOUTS TABLE
-- Stores active lockouts for rate limiting
-- =====================================================
CREATE TABLE lockouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NULL,
    
    reason ENUM('failed_login', 'failed_otp', 'suspicious_activity') NOT NULL,
    attempts_count INT UNSIGNED NOT NULL DEFAULT 1,
    
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unlocks_at TIMESTAMP NOT NULL,
    
    INDEX idx_lockout_email (email, unlocks_at),
    
    CONSTRAINT chk_lockout_unlock CHECK (unlocks_at > locked_at)
) ENGINE=InnoDB;

-- =====================================================
-- OTP TOKENS TABLE
-- For 2FA login and email verification
-- =====================================================
CREATE TABLE otp_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    otp_code VARCHAR(6) NOT NULL,
    otp_type ENUM('login_2fa', 'email_verify', 'password_reset', 'phone_verify') NOT NULL,
    
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_otp_user_type (user_id, otp_type),
    INDEX idx_otp_expires (expires_at),
    
    CONSTRAINT chk_otp_code CHECK (otp_code REGEXP '^[0-9]{6}$')
) ENGINE=InnoDB;

-- =====================================================
-- SESSIONS TABLE
-- JWT refresh tokens and session management
-- =====================================================
CREATE TABLE sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_session_user (user_id),
    INDEX idx_session_token (refresh_token_hash),
    INDEX idx_session_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- CANTEENS TABLE
-- Canteen profiles and subscription management
-- =====================================================
CREATE TABLE canteens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL UNIQUE,
    
    -- Business info
    canteen_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    cover_image_url VARCHAR(500) NULL,
    
    -- Location
    location_type ENUM('inside_campus', 'outside_campus') NOT NULL DEFAULT 'inside_campus',
    address VARCHAR(500) NULL,
    
    -- Contact
    business_phone VARCHAR(15) NULL,
    business_email VARCHAR(100) NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_closed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Ratings
    average_rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
    total_orders INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Operating hours (stored as JSON: {"mon": {"open": "09:00", "close": "21:00"}, ...})
    operating_hours JSON NULL,
    
    -- Subscription (₹1111/year)
    subscription_status ENUM('trial', 'active', 'expired', 'suspended') NOT NULL DEFAULT 'trial',
    trial_started_at TIMESTAMP NULL,
    trial_ends_at TIMESTAMP NULL,
    subscription_started_at TIMESTAMP NULL,
    subscription_ends_at TIMESTAMP NULL,
    subscription_plan ENUM('monthly', 'quarterly', 'half_yearly', 'yearly') NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_canteen_status (is_active, is_open),
    INDEX idx_canteen_subscription (subscription_status, subscription_ends_at),
    INDEX idx_canteen_rating (average_rating DESC),
    
    CONSTRAINT chk_canteen_rating CHECK (average_rating >= 0 AND average_rating <= 5)
) ENGINE=InnoDB;

-- =====================================================
-- MENU CATEGORIES TABLE
-- =====================================================
CREATE TABLE menu_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    canteen_id BIGINT UNSIGNED NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    display_order INT NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    
    INDEX idx_category_canteen (canteen_id, display_order),
    UNIQUE KEY uk_category_name (canteen_id, name)
) ENGINE=InnoDB;

-- =====================================================
-- MENU ITEMS TABLE
-- =====================================================
CREATE TABLE menu_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    canteen_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    
    -- Item details
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    discounted_price DECIMAL(10, 2) NULL,
    
    -- Dietary info
    is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
    is_vegan BOOLEAN NOT NULL DEFAULT FALSE,
    spice_level ENUM('none', 'mild', 'medium', 'hot', 'extra_hot') NULL,
    
    -- Availability
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    available_from TIME NULL,
    available_until TIME NULL,
    
    -- Stats
    total_orders INT UNSIGNED NOT NULL DEFAULT 0,
    average_rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
    
    INDEX idx_menu_canteen (canteen_id, is_available),
    INDEX idx_menu_category (category_id),
    
    CONSTRAINT chk_menu_price CHECK (price > 0),
    CONSTRAINT chk_menu_discount CHECK (discounted_price IS NULL OR discounted_price < price)
) ENGINE=InnoDB;

-- =====================================================
-- ORDERS TABLE
-- Time-bound ordering: 10:00 AM - 5:45 PM only
-- =====================================================
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    
    user_id BIGINT UNSIGNED NOT NULL,
    canteen_id BIGINT UNSIGNED NOT NULL,
    
    -- Order status lifecycle
    status ENUM(
        'placed',
        'accepted',
        'preparing',
        'ready',
        'delivered',
        'cancelled',
        'rejected'
    ) NOT NULL DEFAULT 'placed',
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Delivery
    delivery_location VARCHAR(200) NOT NULL,
    special_instructions TEXT NULL,
    
    -- Tracking
    estimated_ready_time TIMESTAMP NULL,
    actual_ready_time TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- Warden acknowledgment
    warden_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    warden_acknowledged_at TIMESTAMP NULL,
    warden_id BIGINT UNSIGNED NULL,
    
    -- Cancellation
    cancelled_by ENUM('user', 'canteen', 'system') NULL,
    cancellation_reason VARCHAR(500) NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE RESTRICT,
    FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_order_user (user_id, created_at DESC),
    INDEX idx_order_canteen (canteen_id, status, created_at DESC),
    INDEX idx_order_status (status, created_at DESC),
    INDEX idx_order_date (DATE(created_at)),
    
    -- Ensure order is placed during allowed hours (10:00 - 17:45)
    -- Note: This is enforced at application level for real-time flexibility
    CONSTRAINT chk_order_total CHECK (total_amount > 0)
) ENGINE=InnoDB;

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    special_request VARCHAR(500) NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
    
    INDEX idx_order_items (order_id),
    
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (unit_price > 0 AND total_price > 0)
) ENGINE=InnoDB;

-- =====================================================
-- REVIEWS TABLE
-- Post-delivery reviews only
-- =====================================================
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    user_id BIGINT UNSIGNED NOT NULL,
    canteen_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    
    -- Rating 1-5 stars
    rating TINYINT UNSIGNED NOT NULL,
    review_text TEXT NULL,
    
    -- Moderation
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    moderated_by BIGINT UNSIGNED NULL,
    moderation_reason VARCHAR(500) NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_review_canteen (canteen_id, is_approved, created_at DESC),
    INDEX idx_review_user (user_id),
    
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB;

-- =====================================================
-- COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    canteen_id BIGINT UNSIGNED NOT NULL,
    
    code VARCHAR(50) NOT NULL,
    description VARCHAR(500) NULL,
    
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    
    min_order_amount DECIMAL(10, 2) NULL,
    max_discount_amount DECIMAL(10, 2) NULL,
    
    -- Validity
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- Usage limits
    max_uses INT UNSIGNED NULL,
    max_uses_per_user INT UNSIGNED NOT NULL DEFAULT 1,
    current_uses INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Targeting
    target_hostels JSON NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_coupon_code (canteen_id, code),
    INDEX idx_coupon_active (canteen_id, is_active, expires_at),
    
    CONSTRAINT chk_coupon_dates CHECK (expires_at > starts_at),
    CONSTRAINT chk_coupon_value CHECK (discount_value > 0)
) ENGINE=InnoDB;

-- =====================================================
-- COUPON USAGE TABLE
-- =====================================================
CREATE TABLE coupon_usages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coupon_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    
    INDEX idx_coupon_usage_user (coupon_id, user_id)
) ENGINE=InnoDB;

-- =====================================================
-- ADMIN NOTICES TABLE
-- =====================================================
CREATE TABLE admin_notices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    issued_by BIGINT UNSIGNED NOT NULL,
    target_canteen_id BIGINT UNSIGNED NULL,
    
    notice_type ENUM('warning', 'violation', 'suspension', 'info') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    
    INDEX idx_notice_canteen (target_canteen_id, created_at DESC)
) ENGINE=InnoDB;

-- =====================================================
-- HOSTELS REFERENCE TABLE
-- =====================================================
CREATE TABLE hostels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('girls', 'boys', 'staff') NOT NULL DEFAULT 'girls',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    warden_id BIGINT UNSIGNED NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert super admin
INSERT INTO users (email, password_hash, full_name, contact_number, role, is_active, is_email_verified)
VALUES (
    'd25ce145@charusat.edu.in',
    -- Password: Charusat@2026 (hashed with BCrypt - replace with actual hash)
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2oK9JXuQVy',
    'Super Admin',
    '9876543210',
    'superadmin',
    TRUE,
    TRUE
);

-- Insert sample hostels (Girls hostels for CHARUSAT)
INSERT INTO hostels (name, type) VALUES
('Saraswati Bhavan', 'girls'),
('Lakshmi Bhavan', 'girls'),
('Parvati Bhavan', 'girls'),
('Durga Bhavan', 'girls'),
('Gayatri Bhavan', 'girls');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update canteen rating when review is added
DELIMITER //
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE canteens 
    SET 
        average_rating = (
            SELECT AVG(rating) FROM reviews 
            WHERE canteen_id = NEW.canteen_id AND is_approved = TRUE AND is_hidden = FALSE
        ),
        total_reviews = (
            SELECT COUNT(*) FROM reviews 
            WHERE canteen_id = NEW.canteen_id AND is_approved = TRUE AND is_hidden = FALSE
        )
    WHERE id = NEW.canteen_id;
END//
DELIMITER ;

-- Update menu item stats when order is delivered
DELIMITER //
CREATE TRIGGER after_order_delivered
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Update canteen order count
        UPDATE canteens SET total_orders = total_orders + 1 WHERE id = NEW.canteen_id;
        
        -- Update menu item order counts
        UPDATE menu_items mi
        INNER JOIN order_items oi ON mi.id = oi.menu_item_id
        SET mi.total_orders = mi.total_orders + oi.quantity
        WHERE oi.order_id = NEW.id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- VIEWS
-- =====================================================

-- Active canteens view
CREATE VIEW active_canteens AS
SELECT 
    c.*,
    u.full_name as owner_name,
    u.contact_number as owner_phone
FROM canteens c
JOIN users u ON c.owner_id = u.id
WHERE c.is_active = TRUE 
  AND (c.subscription_status = 'active' OR c.subscription_status = 'trial');

-- Today's orders view
CREATE VIEW todays_orders AS
SELECT o.*, u.full_name as customer_name, c.canteen_name
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN canteens c ON o.canteen_id = c.id
WHERE DATE(o.created_at) = CURDATE();

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Check if ordering is allowed (10:00 AM - 5:45 PM)
DELIMITER //
CREATE FUNCTION is_ordering_allowed() RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE current_time TIME;
    SET current_time = CURTIME();
    RETURN current_time >= '10:00:00' AND current_time <= '17:45:00';
END//
DELIMITER ;

-- Clean up expired OTPs
DELIMITER //
CREATE PROCEDURE cleanup_expired_otps()
BEGIN
    DELETE FROM otp_tokens WHERE expires_at < NOW();
END//
DELIMITER ;

-- Clean up expired lockouts
DELIMITER //
CREATE PROCEDURE cleanup_expired_lockouts()
BEGIN
    DELETE FROM lockouts WHERE unlocks_at < NOW();
END//
DELIMITER ;

-- =====================================================
-- EVENTS (for automatic cleanup)
-- =====================================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT cleanup_expired_data
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    CALL cleanup_expired_otps();
    CALL cleanup_expired_lockouts();
    DELETE FROM sessions WHERE expires_at < NOW();
END;
