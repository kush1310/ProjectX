# CharusatNeeds -- Campus Food Aggregator

A full-stack campus food ordering platform built for CHARUSAT University. The system connects on-campus canteen vendors with students and staff, providing real-time menu management, order tracking, coupon campaigns, and analytics -- all behind domain-restricted Google OAuth authentication.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [License](#license)

---

## Overview

CharusatNeeds solves the fragmented food ordering experience across CHARUSAT University's campus canteens. Students browse menus, build carts, apply discount coupons, and place orders from a unified interface. Vendors manage their menus, track incoming orders in real time via WebSockets, run promotional campaigns, and access revenue analytics -- all from a dedicated vendor portal.

Authentication is restricted to the `@charusat.edu.in` domain through Google OAuth2, ensuring only verified university members can access the platform.

---

## Architecture

The project follows a monorepo layout with two independent applications that communicate over REST and WebSocket:

```
CharusatNeeds_SGP/
  Backend/     Spring Boot 3.2 REST API + WebSocket server (Java 17, Maven)
  Frontend/    React 18 SPA (TypeScript, Vite, Tailwind CSS)
  Docs/        Project documentation and compliance files
```

Data flows:

```
Browser (React SPA)
    |
    |--- REST (Axios) ---> Spring Boot API ---> PostgreSQL / H2
    |
    |--- STOMP/WS -------> Spring WebSocket ---> Real-time order updates
    |
    |--- Google OAuth ----> Google Identity ---> Backend token exchange
```

---

## Tech Stack

### Backend

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Framework      | Spring Boot 3.2.2                         |
| Language       | Java 17                                   |
| Build Tool     | Apache Maven                              |
| Database       | PostgreSQL (production), H2 (development) |
| ORM            | Spring Data JPA / Hibernate               |
| Authentication | JWT (jjwt 0.12.3) + Google OAuth2         |
| Real-time      | Spring WebSocket (STOMP)                  |
| Email          | Spring Mail (Brevo SMTP)                  |
| Security       | Spring Security, CORS, rate limiting, CSP |
| Utilities      | Lombok, Spring Validation                 |

### Frontend

| Layer         | Technology            |
| ------------- | --------------------- |
| Framework     | React 18.3            |
| Language      | TypeScript 5.6        |
| Build Tool    | Vite 6.0              |
| Styling       | Tailwind CSS 3.4      |
| Routing       | React Router DOM 6.22 |
| HTTP Client   | Axios 1.13            |
| Animations    | Framer Motion 11.0    |
| WebSocket     | STOMP.js 7.3          |
| Smooth Scroll | Lenis 1.0             |
| Validation    | Zod 4.3               |
| Icons         | Lucide React          |

---

## Features

### Authentication and Authorization

- **Google OAuth2** with strict `@charusat.edu.in` domain enforcement at both the frontend redirect level and the backend token-verification level.
- **Email/password registration** with CAPTCHA verification, password strength enforcement, and account lockout after repeated failed attempts.
- **Password reset flow** with time-limited tokens sent via Brevo SMTP transactional email.
- **JWT-based session management** with access tokens and rotating refresh tokens.
- **Role-based access control (RBAC)** with three roles: `USER` (student/staff), `CANTEEN_OWNER` (vendor), and `ADMIN`.

### Vendor Portal

- **Menu Management** -- Create, update, delete, and reorder menu items organized by category. Each item supports variants (size, type), addon groups, dietary flags, preparation time estimates, and availability scheduling.
- **Category Management** -- Define and manage item categories with custom display order.
- **Order Management** -- Real-time incoming order feed via WebSocket. Accept, reject (with reason), or mark orders as preparing/ready/completed.
- **Coupon Campaigns** -- Create percentage or flat-value discount coupons with minimum order thresholds, maximum discount caps, usage limits, expiry dates, and item/category-level targeting. Toggle coupon activation.
- **Restaurant Profile** -- Edit operating hours, location, bank account details, FSSAI license, GSTIN, and KYC document links.
- **Analytics Dashboard** -- Revenue charts, order volume tracking, popular items, and performance metrics.
- **Responsive Sidebar** -- Collapsible sidebar with mobile hamburger drawer.

### Customer Portal

- **Canteen Discovery** -- Browse open canteens with real-time status indicators, ratings, and location info. Fuzzy search filters canteens and menu items simultaneously.
- **Menu Browsing** -- View categorized menus per canteen with item details, pricing, dietary badges, and availability status.
- **Cart and Checkout** -- Add items to cart with variant and addon selection, apply coupon codes, select payment method, and submit orders.
- **Order History** -- View past orders with status timeline, filter by completion state.
- **User Profile** -- Edit name, mobile, date of birth, anniversary, gender, and profile picture.
- **Skeleton Loading** -- Content placeholders during data fetch for a polished perceived-performance experience.

### Admin Panel

- **Platform Overview** -- Aggregated statistics across all vendors: total users, revenue, order counts, and vendor performance rankings.
- **User Management** -- View and manage registered users.

### Real-time Communication

- **WebSocket (STOMP)** -- Vendors receive instant order notifications. Order status changes propagate to customers without page refresh.

---

## Project Structure

```
CharusatNeeds_SGP/
|
|-- Backend/
|   |-- pom.xml
|   |-- database/
|   |   |-- schema.sql                    # Full database schema reference
|   |-- src/main/java/com/charusat/canteen/
|   |   |-- CanteenApplication.java       # Spring Boot entry point
|   |   |-- config/
|   |   |   |-- SecurityConfig.java       # Spring Security filter chain
|   |   |   |-- SecurityHeadersConfig.java
|   |   |   |-- JwtAuthenticationFilter.java
|   |   |   |-- CustomUserDetailsService.java
|   |   |   |-- WebSocketConfig.java
|   |   |   |-- DataInitializer.java      # Seed data on startup
|   |   |-- controller/
|   |   |   |-- AuthController.java       # Login, register, Google OAuth
|   |   |   |-- CanteenController.java    # CRUD canteens and menus
|   |   |   |-- OrderController.java      # Order lifecycle
|   |   |   |-- CartController.java       # Cart operations
|   |   |   |-- CouponController.java     # Coupon CRUD
|   |   |   |-- CategoryController.java   # Category management
|   |   |   |-- UserController.java       # User profile
|   |   |   |-- VendorController.java     # Vendor-specific endpoints
|   |   |   |-- AnalyticsController.java  # Dashboard analytics
|   |   |   |-- PasswordResetController.java
|   |   |   |-- CaptchaController.java
|   |   |-- model/                        # JPA entities (18 entities)
|   |   |-- dto/                          # Request/response DTOs
|   |   |-- repository/                   # Spring Data JPA repositories
|   |   |-- service/                      # Business logic layer
|   |   |-- exception/                    # Custom exception handlers
|   |-- src/main/resources/
|       |-- application.properties
|
|-- Frontend/
|   |-- package.json
|   |-- vite.config.ts
|   |-- tailwind.config.js
|   |-- index.html
|   |-- src/
|   |   |-- App.tsx                       # Route definitions
|   |   |-- main.tsx                      # React entry point
|   |   |-- pages/                        # Auth pages (Login, Signup, etc.)
|   |   |-- components/                   # Shared UI components
|   |   |-- hooks/                        # Custom hooks (WebSocket, scroll)
|   |   |-- utils/                        # API client, auth store, toast
|   |   |-- Canteen/
|   |   |   |-- pages/                    # Feature pages
|   |   |   |   |-- Dashboard.tsx         # Vendor dashboard
|   |   |   |   |-- MenuManagement.tsx    # Item CRUD
|   |   |   |   |-- OrderHistory.tsx      # Order timeline
|   |   |   |   |-- VendorProfile.tsx     # Restaurant settings
|   |   |   |   |-- StudentDashboard.tsx  # Customer home
|   |   |   |   |-- CustomerMenu.tsx      # Menu browsing
|   |   |   |   |-- CartPage.tsx          # Shopping cart
|   |   |   |   |-- CheckoutPage.tsx      # Checkout flow
|   |   |   |   |-- CustomerProfile.tsx   # User profile
|   |   |   |   |-- AdminDashboard.tsx    # Admin panel
|   |   |   |-- components/              # Canteen-specific components
|   |   |   |-- coupon-app/src/          # Coupon management module
|   |   |   |-- utils/canteenStore.ts    # API functions and types
|   |   |   |-- types/                   # TypeScript interfaces
|
|-- Docs/
|   |-- GOOGLE_OAUTH_SETUP.md            # OAuth configuration guide
|   |-- SGPxModulesList.pdf              # Module specification
|   |-- SGP_PermissionLetter.pdf         # Institutional approval
|
|-- .gitignore
|-- README.md
```

---

## Getting Started

### Prerequisites

- Java 17 or higher
- Apache Maven 3.8+
- Node.js 18+ and npm
- PostgreSQL 15+ (or use the bundled H2 for local development)

### Backend Setup

```bash
cd Backend

# Configure environment (see Environment Configuration section below)
# Edit src/main/resources/application.properties

# Build and run
mvn clean install
mvn spring-boot:run
```

The API server starts at `http://localhost:8080`.

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Configure environment
# Copy .env.example to .env and fill in values

# Start development server
npm run dev
```

The development server starts at `http://localhost:5173`.

---

## Environment Configuration

### Backend -- application.properties

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/charusatneeds
spring.datasource.username=<db_user>
spring.datasource.password=<db_password>

# JWT
jwt.secret=<256-bit-secret-key>
jwt.expiration=86400000

# Google OAuth
google.oauth.client-id=<google_client_id>
google.oauth.client-secret=<google_client_secret>
google.oauth.redirect-uri=http://localhost:5173/auth/callback
google.oauth.allowed-domain=charusat.edu.in

# Email (Brevo SMTP)
spring.mail.host=smtp-relay.brevo.com
spring.mail.port=587
spring.mail.username=<brevo_smtp_login>
spring.mail.password=<brevo_smtp_key>
```

### Frontend -- .env

```env
VITE_GOOGLE_CLIENT_ID=<google_client_id>
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_ENV=development
```

A `.env.example` file is included in the `Frontend/` directory for reference.

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| POST   | /auth/register         | Register with email and password   |
| POST   | /auth/login            | Login and receive JWT              |
| POST   | /auth/google/callback  | Exchange Google auth code for JWT  |
| POST   | /auth/refresh          | Refresh access token               |
| GET    | /auth/me               | Get current authenticated user     |
| POST   | /auth/captcha/generate | Generate CAPTCHA challenge         |
| POST   | /auth/password/forgot  | Initiate password reset            |
| POST   | /auth/password/reset   | Complete password reset with token |

### Canteens and Menus

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | /canteens               | List all canteens           |
| GET    | /canteens/{id}          | Get canteen details         |
| PUT    | /canteens/{id}          | Update canteen profile      |
| GET    | /canteens/{id}/menu     | Get full menu for a canteen |
| POST   | /canteens/{id}/menu     | Add a menu item             |
| PUT    | /canteens/menu/{itemId} | Update a menu item          |
| DELETE | /canteens/menu/{itemId} | Delete a menu item          |

### Orders

| Method | Endpoint            | Description                     |
| ------ | ------------------- | ------------------------------- |
| POST   | /orders             | Place a new order               |
| GET    | /orders/my-orders   | Get current user's orders       |
| GET    | /orders/vendor      | Get orders for vendor's canteen |
| PUT    | /orders/{id}/status | Update order status             |

### Coupons

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| GET    | /coupons             | List all coupons           |
| POST   | /coupons             | Create a coupon            |
| DELETE | /coupons/{id}        | Delete a coupon            |
| PUT    | /coupons/{id}/toggle | Toggle coupon active state |

### Users

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| GET    | /users/profile       | Get user profile     |
| PUT    | /users/profile       | Update user profile  |
| POST   | /users/profile/image | Upload profile image |

### Analytics

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| GET    | /analytics/dashboard | Vendor dashboard statistics |
| GET    | /analytics/revenue   | Revenue breakdown           |

---

## Database Schema

The complete schema is maintained in `Backend/database/schema.sql`. Key entities:

| Entity                | Description                                     |
| --------------------- | ----------------------------------------------- |
| users                 | Registered users with roles and profile data    |
| canteens              | Vendor restaurants with operating hours and KYC |
| menu_items            | Food items with pricing, variants, and addons   |
| categories            | Menu item categories per canteen                |
| orders                | Customer orders with status lifecycle           |
| order_items           | Individual items within an order                |
| coupons               | Discount campaigns with targeting rules         |
| carts / cart_items    | Active shopping carts                           |
| reviews               | Customer reviews and ratings                    |
| refresh_tokens        | JWT refresh token rotation records              |
| login_attempts        | Brute-force detection audit log                 |
| password_history      | Previous password hashes for reuse prevention   |
| password_reset_tokens | Time-limited password reset tokens              |

---

## Security

The application implements multiple layers of security:

- **Domain-restricted authentication** -- Google OAuth `hd` parameter enforcement plus backend email suffix validation.
- **JWT with refresh token rotation** -- Short-lived access tokens with rotating refresh tokens. Compromised refresh tokens invalidate the entire token family.
- **Password policy enforcement** -- Minimum length, complexity requirements, and prevention of password reuse via password history tracking.
- **Account lockout** -- Automatic temporary lockout after configurable failed login attempts, with exponential backoff.
- **CAPTCHA** -- Server-generated CAPTCHA challenges on registration to prevent automated account creation.
- **Security headers** -- Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Strict-Transport-Security headers.
- **Input validation** -- Zod schema validation on the frontend and Spring Validation annotations on the backend DTOs.
- **CORS configuration** -- Restricted to allowed frontend origins only.
- **Security audit logging** -- Login attempts and security events are recorded for forensic analysis.

---

## License

This project is developed as part of the Student Guided Project (SGP) at CHARUSAT University. All rights reserved.
