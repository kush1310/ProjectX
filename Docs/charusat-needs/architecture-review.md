# Charusat Needs — Comprehensive Architecture Review and Technical Debt Assessment

**Date:** 2026-09-23  
**Classification:** Internal Technical Architecture Evaluation  
**Author:** Senior Principal Software Systems Architect  

---

## 1. System Architecture Overview

The **Charusat Needs** platform implements a decoupled client-server architecture tailored for high-volume campus dining transactions during peak academic intervals (lunch periods, lecture breaks).

```mermaid
graph TD
    subgraph Client_Tier["Client Tier (Web SPA)"]
        SPA["React 18 SPA (Vite, TS, Tailwind)"]
        CryptoInterceptor["Axios Interceptor (AES-256-GCM)"]
        StompClient["SockJS + STOMP WebSocket Client"]
    end

    subgraph Edge_Security_Tier["Security & Boundary Gateway"]
        USF["UrlSanitizationFilter"]
        SHF["SecurityHeadersFilter"]
        PEF["PayloadEncryptionFilter (AES-256-GCM)"]
        JAF["JwtAuthenticationFilter"]
        RLS["RateLimiterService (Token Bucket)"]
    end

    subgraph Service_Tier["Spring Boot 3 Core Services"]
        AuthSvc["AuthService & GoogleAuthService"]
        OrderSvc["OrderService & CartService"]
        PaymentSvc["PaymentService (Razorpay)"]
        CouponSvc["CouponService & Validation"]
        NotifySvc["WebSocketService & EmailService"]
    end

    subgraph Persistence_Tier["Persistence & Infrastructure"]
        PG[("PostgreSQL 18 Database")]
        STOMP_Broker["STOMP In-Memory Message Broker"]
    end

    SPA -->|HTTP / JSON (AES-256)| CryptoInterceptor
    CryptoInterceptor --> USF --> SHF --> PEF --> JAF --> RLS
    RLS --> AuthSvc & OrderSvc & PaymentSvc & CouponSvc
    OrderSvc --> PG
    OrderSvc -->|Publish Status Changes| STOMP_Broker
    STOMP_Broker -->|Real-Time Push| StompClient
```

---

## 2. Architectural Analysis

### 2.1 Strengths
1. **End-to-End Cryptographic Tunneling:** Payload encryption (`AES-256-GCM`) encrypts non-public JSON bodies before transmission over HTTP, shielding requests and responses against local packet inspection and proxy interception.
2. **Defensive In-Depth Domain Isolation:** Institutional domain enforcement (`@charusat.edu.in`) is implemented redundantly at frontend validation, DTO validation patterns, service-level domain parsing, and Google OAuth2 audience checks.
3. **Reactive Real-Time State Sync:** Orders placed by students immediately stream to vendor terminals via STOMP WebSockets, eliminating polling overhead and reducing database connection contention.
4. **Resilient Spring Data JDBC Schema:** Avoids Hibernate N+1 query surprises and lazy-initialization exceptions by utilizing lightweight, explicit JDBC Template operations and Spring Data JDBC aggregate roots.

### 2.2 Technical Debt and Architectural Weaknesses
1. **Payload Encryption Endpoint Exceptions:** A subset of endpoints (`/cart/apply-coupon`, `/complaints`) bypasses the payload encryption filter due to raw `Map<String, String>` bindings in controllers. These should be normalized into strongly-typed DTOs supporting AES encryption uniformly.
2. **Artificial Frontend Delays:** Certain transitions, notably `LogoutConfirmModal`, include synthetic timeouts (e.g. 3.5 seconds) designed for visual animations that degrade usability.
3. **Scattered Styling Paradigms:** While Tailwind CSS 3.4.1 is configured, several legacy components rely on ad-hoc utility strings and inline CSS styles, causing visual divergence between student and vendor views.

---

## 3. Database Architecture and Schema Evaluation

PostgreSQL 18 schema verification confirms 3NF normalization across transactional entities:

| Table | Primary Key | Key Foreign Keys | Purpose |
|---|---|---|---|
| `users` | `id` (BIGSERIAL) | None | Core user entity; stores email, role, password hash |
| `canteens` | `id` (BIGSERIAL) | `owner_id -> users(id)` | Campus canteen profile, opening hours, banking data |
| `menu_items` | `id` (BIGSERIAL) | `canteen_id -> canteens(id)` | Food catalogue item, base price, stock status, veg flag |
| `menu_item_variants`| `id` (BIGSERIAL) | `menu_item_id -> menu_items(id)` | Sizing and portion variations (Regular, Large) |
| `orders` | `id` (BIGSERIAL) | `user_id -> users(id)`, `canteen_id -> canteens(id)` | Order state machine, payment reference, totals |
| `order_items` | `id` (BIGSERIAL) | `order_id -> orders(id)`, `menu_item_id -> menu_items(id)` | Snapshot items, unit prices, quantities |
| `coupons` | `id` (BIGSERIAL) | `canteen_id -> canteens(id)` | Discount vouchers, validity bounds, minimum cart constraints |
| `complaints` | `id` (BIGSERIAL) | `order_id -> orders(id)`, `user_id -> users(id)` | Feedback, dispute resolution, status tracking |

---

## 4. Scalability and Observability Recommendations

1. **Database Connection Pooling:** Maintain HikariCP maximum pool size proportional to database CPU cores (default: 10 connections per JVM instance).
2. **STOMP Broker Decoupling:** Currently utilizing the embedded in-memory STOMP broker. Under multi-node clustering, migrate to an external RabbitMQ or Redis STOMP relay to maintain cross-node message routing.
3. **Structured Logging:** Centralize application JSON logs with Logstash-compatible encoders for ingestion into Grafana Loki or ELK.
