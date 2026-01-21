-- ============================================================================
-- CharusatNeeds PostgreSQL Database Schema
-- Version: 1.0
-- Generated: 2026-01-21
-- ============================================================================

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_item_tags CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS canteens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS TABLE
-- Represents all application users (students, admins, canteen owners)
-- ============================================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15),
    role VARCHAR(50) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'CANTEEN_OWNER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    locked_until TIMESTAMP
);

-- Index for email lookups (case-insensitive login)
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_role ON users (role);

COMMENT ON TABLE users IS 'Application users including students, admins, and canteen owners';
COMMENT ON COLUMN users.role IS 'USER = Student, ADMIN = System Admin, CANTEEN_OWNER = Vendor';
COMMENT ON COLUMN users.locked_until IS 'Account lock timestamp for failed login attempts';

-- ============================================================================
-- 2. CANTEENS TABLE
-- Represents campus canteens/food outlets
-- ============================================================================
CREATE TABLE canteens (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    image_url VARCHAR(500),
    is_open BOOLEAN DEFAULT TRUE,
    rush_hour_enabled BOOLEAN DEFAULT FALSE,
    opening_time VARCHAR(10),
    closing_time VARCHAR(10),
    owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for owner lookup
CREATE INDEX idx_canteens_owner ON canteens (owner_id);
CREATE INDEX idx_canteens_is_open ON canteens (is_open);

COMMENT ON TABLE canteens IS 'Campus canteens and food outlets';
COMMENT ON COLUMN canteens.rush_hour_enabled IS 'When true, canteen is experiencing high traffic';
COMMENT ON COLUMN canteens.opening_time IS 'Opening time in HH:MM format';
COMMENT ON COLUMN canteens.closing_time IS 'Closing time in HH:MM format';

-- ============================================================================
-- 3. MENU_ITEMS TABLE
-- Represents food items available in canteens
-- ============================================================================
CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_veg BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER, -- in minutes
    spicy_level INTEGER CHECK (spicy_level BETWEEN 0 AND 3),
    canteen_id BIGINT NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for menu queries
CREATE INDEX idx_menu_items_canteen ON menu_items (canteen_id);
CREATE INDEX idx_menu_items_category ON menu_items (category);
CREATE INDEX idx_menu_items_available ON menu_items (is_available);
CREATE INDEX idx_menu_items_veg ON menu_items (is_veg);

COMMENT ON TABLE menu_items IS 'Food items available in canteens';
COMMENT ON COLUMN menu_items.spicy_level IS '0=Not Spicy, 1=Mild, 2=Medium, 3=Hot';
COMMENT ON COLUMN menu_items.preparation_time IS 'Estimated preparation time in minutes';

-- ============================================================================
-- 4. MENU_ITEM_TAGS TABLE
-- Stores tags for menu items (ElementCollection in JPA)
-- ============================================================================
CREATE TABLE menu_item_tags (
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (menu_item_id, tag)
);

CREATE INDEX idx_menu_item_tags_tag ON menu_item_tags (tag);

COMMENT ON TABLE menu_item_tags IS 'Tags for menu items (e.g., Popular, New, Recommended)';

-- ============================================================================
-- 5. ORDERS TABLE
-- Represents customer orders
-- ============================================================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    canteen_id BIGINT NOT NULL REFERENCES canteens(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'PENDING'
        CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for order queries
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_canteen ON orders (canteen_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_order_number ON orders (order_number);

COMMENT ON TABLE orders IS 'Customer orders placed at canteens';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number (e.g., ORD-2026-0001)';
COMMENT ON COLUMN orders.status IS 'Order workflow: PENDING → CONFIRMED → PREPARING → READY → COMPLETED';

-- ============================================================================
-- 6. ORDER_ITEMS TABLE
-- Represents individual items within an order
-- ============================================================================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    notes TEXT
);

-- Indexes for order item queries
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_menu_item ON order_items (menu_item_id);

COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN order_items.unit_price IS 'Price at time of order (may differ from current menu price)';

-- ============================================================================
-- 7. PASSWORD_RESET_TOKENS TABLE
-- Stores secure tokens for password reset functionality
-- ============================================================================
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for token lookup
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens (expires_at);

COMMENT ON TABLE password_reset_tokens IS 'Secure tokens for password reset (valid for 1 hour)';
COMMENT ON COLUMN password_reset_tokens.token IS 'UUID token sent via email';
COMMENT ON COLUMN password_reset_tokens.used IS 'True if token has already been used';

-- ============================================================================
-- SEED DATA (Optional - for development/testing)
-- This matches the DataInitializer.java in the Spring Boot app
-- ============================================================================

-- Note: Passwords below are BCrypt hashed versions of "kush"
-- BCrypt hash for "kush": $2a$10$N.Xz1xP7gVsX9gZWGJPMb.6pjpN5JzQX.zC1fNQj3R9oZzJ1qX3Xy

-- Uncomment the following to seed initial data:

/*
-- Insert demo users
INSERT INTO users (email, password, full_name, role) VALUES
('d25ce145@charusat.edu.in', '$2a$10$N.Xz1xP7gVsX9gZWGJPMb.6pjpN5JzQX.zC1fNQj3R9oZzJ1qX3Xy', 'Kush Shah', 'USER'),
('admin@charusat.edu.in', '$2a$10$N.Xz1xP7gVsX9gZWGJPMb.6pjpN5JzQX.zC1fNQj3R9oZzJ1qX3Xy', 'Admin User', 'ADMIN'),
('vendor@charusat.edu.in', '$2a$10$N.Xz1xP7gVsX9gZWGJPMb.6pjpN5JzQX.zC1fNQj3R9oZzJ1qX3Xy', 'Vendor User', 'CANTEEN_OWNER');

-- Insert demo canteens
INSERT INTO canteens (name, location, description, is_open, opening_time, closing_time, owner_id) VALUES
('CSPIT Canteen', 'CSPIT Building, Ground Floor', 'Main canteen serving fresh food', TRUE, '08:00', '18:00', 3),
('DEPSTAR Cafe', 'DEPSTAR Building, 1st Floor', 'Quick bites and beverages', TRUE, '09:00', '17:00', 3);

-- Insert demo menu items (Canteen 1 - CSPIT)
INSERT INTO menu_items (name, description, price, category, is_veg, preparation_time, spicy_level, canteen_id) VALUES
('Masala Dosa', 'Crispy dosa with potato filling', 60.00, 'South Indian', TRUE, 10, 1, 1),
('Vada Pav', 'Mumbai style spicy potato fritter in bun', 30.00, 'Street Food', TRUE, 5, 2, 1),
('Paneer Tikka', 'Grilled cottage cheese with spices', 120.00, 'Starters', TRUE, 15, 2, 1),
('Chicken Biryani', 'Aromatic basmati rice with tender chicken', 150.00, 'Main Course', FALSE, 20, 2, 1),
('Cold Coffee', 'Chilled coffee with ice cream', 50.00, 'Beverages', TRUE, 5, 0, 1),
('Samosa', 'Crispy pastry with spiced potato filling', 20.00, 'Snacks', TRUE, 5, 1, 1),
('Pav Bhaji', 'Spiced vegetable mash with buttered buns', 70.00, 'Street Food', TRUE, 12, 2, 1),
('Manchurian Dry', 'Indo-Chinese vegetable balls', 90.00, 'Chinese', TRUE, 15, 2, 1);

-- Insert demo menu items (Canteen 2 - DEPSTAR)
INSERT INTO menu_items (name, description, price, category, is_veg, preparation_time, spicy_level, canteen_id) VALUES
('Maggi', 'Classic 2-minute noodles', 40.00, 'Snacks', TRUE, 5, 1, 2),
('Sandwich', 'Grilled vegetable sandwich', 50.00, 'Snacks', TRUE, 8, 0, 2),
('Tea', 'Hot masala chai', 15.00, 'Beverages', TRUE, 3, 0, 2),
('Coffee', 'Fresh brewed coffee', 25.00, 'Beverages', TRUE, 3, 0, 2),
('Veg Spring Roll', 'Crispy rolls with vegetable filling', 60.00, 'Chinese', TRUE, 10, 1, 2),
('French Fries', 'Crispy golden potato fries', 50.00, 'Snacks', TRUE, 8, 0, 2),
('Pasta', 'Creamy white sauce pasta', 80.00, 'Italian', TRUE, 12, 0, 2),
('Burger', 'Vegetable patty burger with cheese', 70.00, 'Fast Food', TRUE, 10, 1, 2);
*/

-- ============================================================================
-- VIEWS (Optional - for reporting)
-- ============================================================================

-- View for active orders with details
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.id,
    o.order_number,
    u.full_name AS customer_name,
    u.email AS customer_email,
    c.name AS canteen_name,
    o.status,
    o.total_amount,
    o.payment_status,
    o.created_at,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN canteens c ON o.canteen_id = c.id
WHERE o.status NOT IN ('COMPLETED', 'CANCELLED');

-- View for daily revenue per canteen
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT 
    c.id AS canteen_id,
    c.name AS canteen_name,
    DATE(o.created_at) AS order_date,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_revenue
FROM orders o
JOIN canteens c ON o.canteen_id = c.id
WHERE o.status = 'COMPLETED'
GROUP BY c.id, c.name, DATE(o.created_at)
ORDER BY order_date DESC;

-- ============================================================================
-- FUNCTIONS (Optional - for business logic)
-- ============================================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
    order_num TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';
    
    order_num := 'ORD-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_timestamp();

-- ============================================================================
-- GRANT PERMISSIONS (Uncomment and modify for production)
-- ============================================================================

/*
-- Create application user
CREATE USER charusatneeds_app WITH PASSWORD 'your_secure_password';

-- Grant permissions
GRANT CONNECT ON DATABASE charusatneeds TO charusatneeds_app;
GRANT USAGE ON SCHEMA public TO charusatneeds_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO charusatneeds_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO charusatneeds_app;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
