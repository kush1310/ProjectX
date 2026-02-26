#!/usr/bin/env python3
"""Generate CharusatNeeds SRS Document as styled HTML for PDF export."""

import os

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; color: #1a1a2e; line-height: 1.7; background: #fff; }
@page { size: A4; margin: 20mm 18mm; }
@media print { .no-print { display: none !important; } .page-break { page-break-before: always; } body { font-size: 11pt; } }
.cover { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); color: #fff; text-align: center; padding: 60px 40px; }
.cover h1 { font-size: 42px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
.cover .subtitle { font-size: 20px; font-weight: 300; opacity: 0.85; margin-bottom: 40px; }
.cover .meta { font-size: 14px; opacity: 0.7; margin: 4px 0; }
.cover .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 40px; text-align: left; margin-top: 30px; background: rgba(255,255,255,0.08); padding: 24px 32px; border-radius: 12px; }
.cover .team-grid .member { font-size: 13px; } .cover .team-grid .role { opacity: 0.6; font-size: 11px; }
.container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
h2 { font-size: 24px; font-weight: 700; color: #302b63; border-bottom: 3px solid #302b63; padding-bottom: 8px; margin: 40px 0 20px; }
h3 { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 28px 0 12px; }
h4 { font-size: 15px; font-weight: 600; color: #555; margin: 20px 0 8px; }
p, li { font-size: 13.5px; } ul, ol { padding-left: 24px; margin: 8px 0; }
li { margin: 4px 0; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
th { background: #302b63; color: #fff; padding: 10px 14px; text-align: left; font-weight: 600; }
td { padding: 9px 14px; border-bottom: 1px solid #e5e7eb; }
tr:nth-child(even) td { background: #f8f9fc; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge-done { background: #d1fae5; color: #065f46; } .badge-planned { background: #fef3c7; color: #92400e; }
.toc a { text-decoration: none; color: #302b63; display: block; padding: 4px 0; font-size: 14px; }
.toc a:hover { color: #6366f1; }
.print-btn { position: fixed; bottom: 30px; right: 30px; padding: 14px 28px; background: #302b63; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 999; }
.print-btn:hover { background: #6366f1; }
.gantt { width: 100%; margin: 16px 0; } .gantt td, .gantt th { font-size: 12px; padding: 6px 8px; }
.bar { height: 18px; border-radius: 4px; display: inline-block; }
.bar-p { background: #818cf8; } .bar-e { background: #34d399; } .bar-t { background: #fbbf24; } .bar-d { background: #f87171; }
"""

def sect(id, title, content):
    return f'<div id="{id}"><h2>{title}</h2>{content}</div>'

def table(headers, rows):
    h = ''.join(f'<th>{x}</th>' for x in headers)
    r = ''
    for row in rows:
        r += '<tr>' + ''.join(f'<td>{x}</td>' for x in row) + '</tr>'
    return f'<table><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table>'

team = [
    ("Kush Shah", "Team Lead + Full Stack Developer + Security Tester", "Project management, full-stack development, architecture design, security testing, code reviews"),
    ("Krina Parikh", "Frontend Developer", "UI/UX implementation, responsive design, React component development, frontend state management"),
    ("Ishan Shastri", "Full Stack Developer", "Feature development across frontend and backend, API integration, database design"),
    ("Dhairy Tanna", "Backend Developer + Security Architecture", "Backend API development, security architecture, database optimization, authentication system"),
    ("Shrey Raval", "System/Security Tester + QA", "Test case design, security testing, quality assurance, performance testing, bug tracking"),
]

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CharusatNeeds — Software Requirements Specification</title>
<style>{CSS}</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
<p class="meta">CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)</p>
<p class="meta">Faculty of Computer Science & Engineering</p>
<p class="meta" style="margin-bottom:30px">Subject: Software Group Project (SGP) — B.Tech CSE</p>
<h1>CharusatNeeds</h1>
<p class="subtitle">Campus Food Aggregator Platform</p>
<p class="meta" style="font-size:16px; opacity:0.9; margin-bottom:6px">Software Requirements Specification (SRS)</p>
<p class="meta">Document Version: 1.0 &nbsp;|&nbsp; Date: February 2026</p>
<p class="meta">Standard: IEEE 830-1998 / ISO/IEC/IEEE 29148:2018</p>
<div class="team-grid">
<div style="grid-column:1/-1;font-weight:600;font-size:14px;margin-bottom:4px;opacity:0.9">Project Team</div>
{''.join(f'<div class="member"><strong>{t[0]}</strong><div class="role">{t[1]}</div></div>' for t in team)}
</div>
</div>

<div class="container">

<!-- TABLE OF CONTENTS -->
<div class="page-break"></div>
{sect("toc","Table of Contents",'''<div class="toc">
<a href="#s1">1. Introduction</a>
<a href="#s1.1" style="padding-left:20px">1.1 Purpose</a>
<a href="#s1.2" style="padding-left:20px">1.2 Scope</a>
<a href="#s1.3" style="padding-left:20px">1.3 Definitions & Acronyms</a>
<a href="#s1.4" style="padding-left:20px">1.4 References</a>
<a href="#s1.5" style="padding-left:20px">1.5 Overview</a>
<a href="#s2">2. Overall Description</a>
<a href="#s2.1" style="padding-left:20px">2.1 Product Perspective</a>
<a href="#s2.2" style="padding-left:20px">2.2 Product Functions</a>
<a href="#s2.3" style="padding-left:20px">2.3 User Classes & Characteristics</a>
<a href="#s2.4" style="padding-left:20px">2.4 Operating Environment</a>
<a href="#s2.5" style="padding-left:20px">2.5 Design & Implementation Constraints</a>
<a href="#s2.6" style="padding-left:20px">2.6 Assumptions & Dependencies</a>
<a href="#s3">3. System Architecture</a>
<a href="#s4">4. Specific Requirements</a>
<a href="#s4.1" style="padding-left:20px">4.1 Functional Requirements</a>
<a href="#s4.2" style="padding-left:20px">4.2 Non-Functional Requirements</a>
<a href="#s4.3" style="padding-left:20px">4.3 API Specification</a>
<a href="#s4.4" style="padding-left:20px">4.4 Database Schema</a>
<a href="#s5">5. Team & Work Distribution</a>
<a href="#s6">6. Project Planning & Phases</a>
<a href="#s7">7. Appendices</a>
</div>''')}

<!-- 1. INTRODUCTION -->
<div class="page-break"></div>
<div id="s1"><h2>1. Introduction</h2>

<h3 id="s1.1">1.1 Purpose</h3>
<p>This Software Requirements Specification (SRS) document provides a comprehensive description of the <strong>CharusatNeeds — Campus Food Aggregator Platform</strong>. It details the functional and non-functional requirements for the system and is intended for the development team, project evaluators, and stakeholders. The document follows the IEEE 830-1998 standard for software requirements specifications.</p>

<h3 id="s1.2">1.2 Scope</h3>
<p>CharusatNeeds is a full-stack web application designed to digitize the campus food ordering experience at CHARUSAT. The system enables students and faculty to browse canteen menus, place orders, track order status in real-time via WebSocket, and manage their profiles. Canteen vendors can manage menus, process orders, offer coupons, and view analytics. The platform is designed for multi-device access across mobile, tablet, desktop, kiosk, and TV displays.</p>
<p><strong>Key Objectives:</strong></p>
<ul>
<li>Eliminate physical queues at campus canteens</li>
<li>Provide real-time order tracking and notifications</li>
<li>Enable vendors to manage operations digitally</li>
<li>Ensure enterprise-grade security (OWASP, NIST 800-63B)</li>
<li>Support responsive deployment across all screen form factors</li>
</ul>

<h3 id="s1.3">1.3 Definitions, Acronyms & Abbreviations</h3>
{table(["Term","Definition"],[
["SRS","Software Requirements Specification"],
["JWT","JSON Web Token — Stateless authentication token"],
["STOMP","Simple Text Oriented Messaging Protocol — WebSocket sub-protocol"],
["CAPTCHA","Completely Automated Public Turing test to tell Computers and Humans Apart"],
["FSSAI","Food Safety and Standards Authority of India"],
["CRUD","Create, Read, Update, Delete operations"],
["OWASP","Open Web Application Security Project"],
["MFA","Multi-Factor Authentication"],
["RBAC","Role-Based Access Control"],
["REST","Representational State Transfer"],
["WebSocket","Full-duplex communication protocol over TCP"],
["BOGO","Buy One Get One — Coupon type"],
])}

<h3 id="s1.4">1.4 References</h3>
<ul>
<li>IEEE 830-1998: Recommended Practice for Software Requirements Specifications</li>
<li>ISO/IEC/IEEE 29148:2018: Systems and Software Engineering — Life Cycle Processes — Requirements Engineering</li>
<li>OWASP Application Security Verification Standard (ASVS) v4.0</li>
<li>NIST Special Publication 800-63B: Digital Identity Guidelines — Authentication</li>
<li>Spring Boot 3.x Official Documentation</li>
<li>React 18 Official Documentation</li>
</ul>

<h3 id="s1.5">1.5 Document Overview</h3>
<p>Section 2 presents the overall product context and user classes. Section 3 covers the system architecture. Section 4 defines detailed functional and non-functional requirements, API endpoints, and database schema. Section 5 details the team composition and work distribution. Section 6 provides the project planning phases with a Gantt chart. Section 7 contains appendices.</p>
</div>

<!-- 2. OVERALL DESCRIPTION -->
<div class="page-break"></div>
<div id="s2"><h2>2. Overall Description</h2>

<h3 id="s2.1">2.1 Product Perspective</h3>
<p>CharusatNeeds is a standalone, self-contained web application. It does not replace any existing system but introduces a new digital food ordering workflow on the CHARUSAT campus. The system is composed of three primary subsystems:</p>
<ul>
<li><strong>Frontend SPA</strong> — React + TypeScript + Tailwind CSS, served via Vite</li>
<li><strong>Backend API Server</strong> — Spring Boot 3.x MVC + JDBC (Java 21)</li>
<li><strong>Database</strong> — PostgreSQL 15+</li>
</ul>
<p>Real-time communication is achieved via STOMP-over-WebSocket (native + SockJS fallback). Email services are handled through SMTP (Brevo/SendinBlue). Authentication supports both local credentials and Google OAuth 2.0.</p>

<h3 id="s2.2">2.2 Product Functions (High-Level)</h3>
{table(["Module","Functions","Status"],[
["Authentication","User registration, login (local + Google OAuth), JWT token management, refresh tokens, email verification, password reset, CAPTCHA, account lockout, MFA support",'<span class="badge badge-done">Implemented</span>'],
["User Management","Profile CRUD, profile image upload/storage, address management (student/teacher), name validation with email ID retention",'<span class="badge badge-done">Implemented</span>'],
["Canteen Management","Canteen CRUD, open/close toggle, rush hour mode, FSSAI/GST compliance fields, bank details, KYC document upload",'<span class="badge badge-done">Implemented</span>'],
["Menu Management","Menu item CRUD with variants, add-on groups, dietary info, categories, availability scheduling, display ordering, item toggle",'<span class="badge badge-done">Implemented</span>'],
["Shopping Cart","Server-side cart, add/update/remove items, auto-total recalculation, variant and add-on selection, special instructions",'<span class="badge badge-done">Implemented</span>'],
["Order System","Order placement, status lifecycle (Pending→Confirmed→Preparing→Ready→Completed/Cancelled), payment tracking, rejection reasons",'<span class="badge badge-done">Implemented</span>'],
["Real-time Notifications","WebSocket (STOMP) for live order updates, canteen-specific topics, user-specific topics, auto-reconnect",'<span class="badge badge-done">Implemented</span>'],
["Coupon System","Percentage/flat discounts, BOGO offers, scope (global/category/item), usage limits, validity periods, activation toggle",'<span class="badge badge-done">Implemented</span>'],
["Analytics Dashboard","Revenue stats, order count, top-selling items, mealtime distribution, sales trends (daily/weekly/monthly), review insights",'<span class="badge badge-done">Implemented</span>'],
["Review System","Multi-criteria ratings (food, packing, delivery), comments, anonymous reviews, vendor replies",'<span class="badge badge-done">Implemented</span>'],
["Responsive UI","Mobile-first design with xs/sm/md/lg/xl/kiosk/tv breakpoints, skeleton loading, Framer Motion animations",'<span class="badge badge-done">Implemented</span>'],
["Payment Gateway","UPI/card/wallet integration for online payments",'<span class="badge badge-planned">Planned</span>'],
["Push Notifications","Mobile push notifications for order status changes",'<span class="badge badge-planned">Planned</span>'],
["Admin Panel","Super-admin dashboard for platform-wide management, vendor approval, analytics aggregation",'<span class="badge badge-planned">Planned</span>'],
["Delivery Tracking","Real-time delivery tracking with map integration",'<span class="badge badge-planned">Planned</span>'],
])}

<h3 id="s2.3">2.3 User Classes and Characteristics</h3>
{table(["User Class","Description","Access Level"],[
["Student (USER)","CHARUSAT students who browse canteen menus, place orders, track status, and write reviews","Browse menus, manage cart, place orders, view order history, manage profile"],
["Faculty (USER)","CHARUSAT faculty/staff with the same ordering capabilities as students, with additional address fields","Same as Student + teacher-specific address fields"],
["Canteen Owner (CANTEEN_OWNER)","Operates a registered canteen on campus. Manages menu, processes orders, runs promotions","Menu CRUD, order management, coupon management, analytics dashboard, profile settings"],
["Administrator (ADMIN)","Platform administrator with full system access","All operations + user management + platform analytics + vendor approval"],
])}

<h3 id="s2.4">2.4 Operating Environment</h3>
{table(["Component","Technology","Version"],[
["Frontend Runtime","Node.js","20.x LTS"],
["Frontend Framework","React + TypeScript","18.x + 5.x"],
["CSS Framework","Tailwind CSS","3.x"],
["Build Tool","Vite","6.x"],
["Backend Runtime","Java (JDK)","21"],
["Backend Framework","Spring Boot","3.x"],
["Database","PostgreSQL","15+"],
["WebSocket","STOMP over Native WS + SockJS","—"],
["Email Service","SMTP (Brevo/SendinBlue)","—"],
["Browser Support","Chrome 90+, Firefox 88+, Safari 14+, Edge 90+","—"],
])}

<h3 id="s2.5">2.5 Design and Implementation Constraints</h3>
<ul>
<li>The system must use Spring Boot's JDBC template (not JPA/Hibernate) for database access</li>
<li>Authentication must be stateless using JWT tokens</li>
<li>All API endpoints must follow RESTful conventions</li>
<li>Frontend must be a single-page application (SPA) with client-side routing</li>
<li>The application must be responsive across 7 breakpoints (xs through tv)</li>
<li>Security must comply with OWASP ASVS and NIST 800-63B</li>
<li>Passwords must enforce policy: minimum length, complexity, and history checks</li>
</ul>

<h3 id="s2.6">2.6 Assumptions and Dependencies</h3>
<ul>
<li>Users have access to a modern web browser with JavaScript enabled</li>
<li>Campus network provides stable internet connectivity</li>
<li>PostgreSQL database server is available and configured</li>
<li>SMTP service (Brevo) is accessible for email operations</li>
<li>Google OAuth client credentials are configured for social login</li>
<li>The application runs on localhost during development (frontend: 5173, backend: 8080)</li>
</ul>
</div>

<!-- 3. SYSTEM ARCHITECTURE -->
<div class="page-break"></div>
<div id="s3"><h2>3. System Architecture</h2>

<h3>3.1 High-Level Architecture</h3>
<p>The system follows a <strong>3-tier client-server architecture</strong> with a clear separation of concerns:</p>

{table(["Layer","Technology","Responsibility"],[
["Presentation Layer","React 18 + TypeScript + Tailwind CSS","UI rendering, state management, client-side routing, responsive layouts"],
["Application Layer","Spring Boot 3.x (Java 21)","Business logic, REST API, authentication, WebSocket messaging, email services"],
["Data Layer","PostgreSQL 15+ via JDBC","Data persistence, relational storage, indexing, constraints"],
])}

<h3>3.2 Component Diagram</h3>
<p>The application consists of the following major components:</p>

<h4>Frontend Components (11 Pages + 25 Components)</h4>
{table(["Page","Route","Description"],[
["Login","/login","User authentication with email/password and Google OAuth"],
["Signup","/signup","New user registration with email verification"],
["Forgot Password","/forgot-password","Password reset request form"],
["Reset Password","/reset-password","Token-validated password reset form"],
["Student Dashboard","/customer/dashboard","Canteen browsing, search, filters, explore section"],
["Customer Menu","/canteen/:id/menu","Menu browsing, item details, add to cart"],
["Customer Profile","/customer/profile","Profile management, address, image upload"],
["Cart Page","/cart","Shopping cart review and modification"],
["Checkout","/checkout","Order placement and payment"],
["Vendor Dashboard","/dashboard","Order management, live notifications, analytics"],
["Menu Management","/canteen/menu","Menu item CRUD, categories, variants, add-ons"],
["Order History","/order-history","Order history with filtering and real-time status"],
["Analytics","/analytics","Sales data, top items, reviews, mealtime distribution"],
["Vendor Profile","/vendor/profile","Vendor profile and canteen settings"],
["Vendor Coupons","/vendor/coupons","Coupon creation and management"],
])}

<h4>Backend Components (11 Controllers + 16 Services)</h4>
{table(["Controller","Base Path","Endpoints"],[
["AuthController","/api/auth","register, login, logout, refresh, google-callback, me, verify-email, resend-verification"],
["UserController","/api/users","profile GET/PUT, address GET/PUT, profile-image upload/GET"],
["CanteenController","/api/canteens","CRUD, open filter, menu CRUD, rush-hour toggle, availability toggle"],
["OrderController","/api/orders","CRUD, my-orders, canteen orders, active/recent orders, status update, cancel, pending count"],
["CartController","/api/cart","get, add, update quantity, remove, clear"],
["VendorController","/api/vendor","add menu item, update item, create/get coupons"],
["CouponController","/api/vendor/coupons","list, create, delete, toggle"],
["AnalyticsController","/api/analytics","dashboard stats, sales data, top items, reviews, mealtime distribution"],
["PasswordResetController","/api/auth","forgot-password, validate-token, reset-password"],
["CaptchaController","/api/captcha","generate, validate"],
["CategoryController","/api/categories","CRUD operations for menu categories"],
])}

<h3>3.3 Security Architecture</h3>
{table(["Security Layer","Implementation"],[
["Authentication","JWT tokens (access + refresh), Google OAuth 2.0, CAPTCHA verification"],
["Authorization","Role-Based Access Control (USER, CANTEEN_OWNER, ADMIN)"],
["Password Policy","Minimum length, complexity rules, password history (prevent reuse), bcrypt hashing"],
["Account Protection","Account lockout after failed attempts, IP-based rate limiting"],
["Session Management","Stateless JWT, refresh token rotation, all-device logout"],
["Input Validation","Server-side validation (Jakarta Bean Validation), input sanitization"],
["Security Headers","X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Content-Security-Policy"],
["Transport Security","HTTPS enforcement, CORS whitelisting, secure cookie flags"],
["Email Security","Token-based email verification, single-use password reset tokens with expiry"],
["Audit Logging","Security event logging with IP tracking, login attempt recording"],
])}
</div>

<!-- 4. SPECIFIC REQUIREMENTS -->
<div class="page-break"></div>
<div id="s4"><h2>4. Specific Requirements</h2>

<h3 id="s4.1">4.1 Functional Requirements</h3>

<h4>FR-01: User Registration</h4>
<ul>
<li>FR-01.1: System shall allow users to register with email, password, full name, and mobile number</li>
<li>FR-01.2: System shall validate email format and reject duplicates</li>
<li>FR-01.3: System shall enforce password policy (min length, complexity)</li>
<li>FR-01.4: System shall send email verification link upon registration</li>
<li>FR-01.5: System shall support Google OAuth 2.0 registration</li>
</ul>

<h4>FR-02: User Authentication</h4>
<ul>
<li>FR-02.1: System shall authenticate users via email/password with JWT issuance</li>
<li>FR-02.2: System shall support CAPTCHA verification during login</li>
<li>FR-02.3: System shall implement account lockout after consecutive failed attempts</li>
<li>FR-02.4: System shall provide refresh token rotation for session extension</li>
<li>FR-02.5: System shall support single-device and all-device logout</li>
<li>FR-02.6: System shall provide secure password reset via email tokens</li>
</ul>

<h4>FR-03: User Profile Management</h4>
<ul>
<li>FR-03.1: Users shall be able to view and update their profile (name, mobile, gender, DOB)</li>
<li>FR-03.2: System shall enforce name validation (ID from email must be retained)</li>
<li>FR-03.3: Users shall be able to upload and view profile images (stored in DB)</li>
<li>FR-03.4: Students shall manage address (hostel, room, building)</li>
<li>FR-03.5: Teachers shall manage address (department, staff room)</li>
</ul>

<h4>FR-04: Canteen Browsing</h4>
<ul>
<li>FR-04.1: System shall display all registered canteens with status, rating, and location</li>
<li>FR-04.2: Users shall filter canteens by: nearest, great offers, rating 4.0+</li>
<li>FR-04.3: Users shall search canteens and menu items by keyword</li>
<li>FR-04.4: System shall display canteen open/closed status in real-time</li>
</ul>

<h4>FR-05: Menu Browsing and Ordering</h4>
<ul>
<li>FR-05.1: System shall display menu items with name, price, category, availability, dietary info</li>
<li>FR-05.2: Users shall filter menu by category and search by name/description</li>
<li>FR-05.3: Users shall add items to cart with variant selection, add-ons, and special instructions</li>
<li>FR-05.4: System shall maintain server-side cart with auto-total recalculation</li>
<li>FR-05.5: Users shall place orders with payment method selection</li>
</ul>

<h4>FR-06: Order Lifecycle Management</h4>
<ul>
<li>FR-06.1: Orders shall follow status lifecycle: Pending → Confirmed → Preparing → Ready → Completed</li>
<li>FR-06.2: Vendors shall update order status with optional rejection reason</li>
<li>FR-06.3: Users and vendors shall cancel orders (with reason tracking)</li>
<li>FR-06.4: System shall broadcast order updates via WebSocket in real-time</li>
<li>FR-06.5: Users shall view complete order history with filtering</li>
</ul>

<h4>FR-07: Vendor Operations</h4>
<ul>
<li>FR-07.1: Vendors shall perform full CRUD on menu items (with variants, add-ons, dietary tags)</li>
<li>FR-07.2: Vendors shall manage menu categories (create, delete)</li>
<li>FR-07.3: Vendors shall toggle item availability and canteen open/close status</li>
<li>FR-07.4: Vendors shall create and manage coupons (percentage, flat, BOGO)</li>
<li>FR-07.5: Vendors shall view analytics: revenue, order count, top items, mealtime distribution</li>
<li>FR-07.6: Vendors shall manage canteen compliance (FSSAI, GST) and bank details</li>
</ul>

<h4>FR-08: Real-Time Notifications</h4>
<ul>
<li>FR-08.1: System shall provide WebSocket connection via STOMP protocol</li>
<li>FR-08.2: New orders shall be broadcast to canteen-specific topics (/topic/canteen/{'{id}'}/orders)</li>
<li>FR-08.3: Order status changes shall be broadcast to user-specific topics (/topic/user/{'{id}'}/orders)</li>
<li>FR-08.4: WebSocket shall auto-reconnect with heartbeat monitoring</li>
</ul>

<h4>FR-09: Review System</h4>
<ul>
<li>FR-09.1: Users shall submit reviews with overall rating, food/packing/delivery sub-ratings</li>
<li>FR-09.2: Users shall submit anonymous reviews</li>
<li>FR-09.3: Vendors shall reply to reviews</li>
</ul>

<h3 id="s4.2">4.2 Non-Functional Requirements</h3>
{table(["ID","Category","Requirement"],[
["NFR-01","Performance","Page load time shall not exceed 3 seconds on standard broadband"],
["NFR-02","Performance","API response time shall not exceed 500ms for 95th percentile requests"],
["NFR-03","Performance","WebSocket message delivery latency shall not exceed 1 second"],
["NFR-04","Scalability","System shall support 500+ concurrent users"],
["NFR-05","Availability","System shall maintain 99.5% uptime during operational hours (7 AM - 11 PM)"],
["NFR-06","Security","All passwords shall be hashed with bcrypt (cost factor ≥ 10)"],
["NFR-07","Security","JWT access tokens shall expire within 15-30 minutes"],
["NFR-08","Security","System shall resist OWASP Top 10 vulnerabilities"],
["NFR-09","Usability","UI shall be responsive across 7 breakpoints (475px to 1920px+)"],
["NFR-10","Usability","System shall provide skeleton loading for all data-fetching states"],
["NFR-11","Usability","All interactive elements shall have smooth animations (Framer Motion)"],
["NFR-12","Maintainability","Codebase shall follow MVC architecture with clear separation of concerns"],
["NFR-13","Portability","Frontend shall work on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+"],
["NFR-14","Reliability","Failed WebSocket connections shall auto-reconnect with exponential backoff"],
])}

<h3 id="s4.3">4.3 REST API Specification</h3>
{table(["Method","Endpoint","Description","Auth"],[
["POST","/api/auth/register","Register new user","Public"],
["POST","/api/auth/login","Authenticate user","Public"],
["POST","/api/auth/refresh","Refresh access token","Public"],
["POST","/api/auth/logout","Revoke refresh token","Authenticated"],
["POST","/api/auth/google/callback","Google OAuth callback","Public"],
["GET","/api/auth/me","Get current user","Authenticated"],
["GET","/api/auth/verify-email","Verify email token","Public"],
["POST","/api/auth/forgot-password","Request password reset","Public"],
["POST","/api/auth/reset-password","Reset password with token","Public"],
["GET","/api/users/profile","Get user profile","Authenticated"],
["PUT","/api/users/profile","Update user profile","Authenticated"],
["POST","/api/users/profile/image","Upload profile image","Authenticated"],
["GET","/api/users/profile/image/:id","Get profile image","Public"],
["PUT","/api/users/address","Update user address","Authenticated"],
["GET","/api/canteens","List all canteens","Public"],
["GET","/api/canteens/open","List open canteens","Public"],
["GET","/api/canteens/:id","Get canteen details","Public"],
["POST","/api/canteens","Create canteen","CANTEEN_OWNER"],
["PUT","/api/canteens/:id","Update canteen","CANTEEN_OWNER"],
["GET","/api/canteens/:id/menu","Get canteen menu","Public"],
["POST","/api/canteens/:id/menu","Add menu item","CANTEEN_OWNER"],
["PUT","/api/canteens/menu/:id","Update menu item","CANTEEN_OWNER"],
["DELETE","/api/canteens/menu/:id","Delete menu item","CANTEEN_OWNER"],
["GET","/api/cart","Get user cart","Authenticated"],
["POST","/api/cart/add","Add item to cart","Authenticated"],
["PUT","/api/cart/update/:id","Update cart item quantity","Authenticated"],
["DELETE","/api/cart/remove/:id","Remove from cart","Authenticated"],
["DELETE","/api/cart/clear","Clear entire cart","Authenticated"],
["POST","/api/orders","Create order","Authenticated"],
["GET","/api/orders/my-orders","Get user's orders","Authenticated"],
["PUT","/api/orders/:id/status","Update order status","CANTEEN_OWNER"],
["POST","/api/orders/:id/cancel","Cancel order","Authenticated"],
["GET","/api/analytics/dashboard","Dashboard statistics","CANTEEN_OWNER"],
["GET","/api/analytics/sales","Sales trend data","CANTEEN_OWNER"],
["GET","/api/analytics/top-items","Top selling items","CANTEEN_OWNER"],
])}

<h3 id="s4.4">4.4 Database Schema</h3>
{table(["Entity","Key Fields","Relationships"],[
["users","id, email, password, fullName, mobile, role, authProvider, isActive, lockedUntil, mfaEnabled, profileImageData","1:N → orders, carts, reviews"],
["canteens","id, name, location, description, isOpen, rushHourEnabled, fssaiNumber, gstNo, bankDetails, ownerId","1:N → menu_items, orders, coupons; N:1 → users"],
["menu_items","id, name, description, price, category, isAvailable, isVeg, preparationTime, hasVariants, hasAddons, canteenId","N:1 → canteens; 1:N → variants, addon_groups, cart_items"],
["menu_item_variants","id, name, price, menuItemId","N:1 → menu_items"],
["addon_groups","id, name, minSelection, maxSelection, menuItemId","N:1 → menu_items; 1:N → addon_options"],
["orders","id, orderNumber, customerId, canteenId, status, totalAmount, paymentMethod, paymentStatus, specialInstructions","N:1 → users, canteens; 1:N → order_items"],
["order_items","id, orderId, menuItemId, quantity, price, variant, addons","N:1 → orders, menu_items"],
["carts","id, userId, canteenId, totalAmount","N:1 → users; 1:N → cart_items"],
["cart_items","id, cartId, menuItemId, quantity, variant, addons, subtotal","N:1 → carts, menu_items"],
["coupons","id, code, title, discountType, discountValue, scope, type (DISCOUNT/BOGO), canteenId, validFrom, validUntil","N:1 → canteens"],
["reviews","id, orderId, customerId, canteenId, rating, foodRating, packingRating, deliveryRating, comment, vendorReply","N:1 → orders, users, canteens"],
["categories","id, name, canteenId","N:1 → canteens"],
["refresh_tokens","id, token, userId, expiresAt, revoked","N:1 → users"],
["password_reset_tokens","id, token, userId, expiresAt, used","N:1 → users"],
["password_history","id, userId, passwordHash, createdAt","N:1 → users"],
["login_attempts","id, email, ip, success, timestamp","Audit log"],
])}
</div>

<!-- 5. TEAM & WORK DISTRIBUTION -->
<div class="page-break"></div>
<div id="s5"><h2>5. Team Composition & Work Distribution</h2>

<h3>5.1 Team Members</h3>
{table(["#","Name","Role","Responsibilities"],[
[str(i+1), t[0], t[1], t[2]] for i, t in enumerate(team)
])}

<h3>5.2 Module-Wise Work Distribution</h3>
{table(["Module","Primary Owner","Support","Key Deliverables"],[
["Authentication & Security","Dhairy Tanna","Kush Shah","JWT auth, Google OAuth, CAPTCHA, account lockout, password reset, security headers"],
["Frontend Architecture","Krina Parikh","Kush Shah","React app structure, routing, responsive layout, Tailwind config, animations"],
["Student-Facing Pages","Krina Parikh","Ishan Shastri","Dashboard, menu browsing, cart, checkout, order history, profile"],
["Vendor Dashboard & Analytics","Ishan Shastri","Krina Parikh","Order management, analytics charts, menu management, coupon UI"],
["Backend API & Services","Kush Shah","Dhairy Tanna","Controllers, services, repositories, JDBC queries, business logic"],
["Database Design","Dhairy Tanna","Ishan Shastri","Schema design, migrations, indexes, seed data"],
["WebSocket & Real-time","Kush Shah","Ishan Shastri","STOMP config, WebSocket service, frontend hook, live notifications"],
["Coupon & Review System","Ishan Shastri","Dhairy Tanna","Coupon CRUD, discount logic, review submission, vendor replies"],
["Testing & QA","Shrey Raval","All members","Test case design, manual testing, security testing, bug reporting"],
["Documentation","Kush Shah","Shrey Raval","SRS, README, API documentation, code comments"],
])}
</div>

<!-- 6. PROJECT PLANNING -->
<div class="page-break"></div>
<div id="s6"><h2>6. Project Planning & Phases</h2>

<h3>6.1 Development Methodology</h3>
<p>The project follows an <strong>Agile-Waterfall Hybrid</strong> approach — structured phases with iterative development within each phase. Each phase has defined deliverables and review checkpoints.</p>

<h3>6.2 Phase-Wise Planning</h3>

{table(["Phase","Duration","Activities","Deliverables","Team Focus"],[
["Phase 1: Requirement Analysis & Planning","Week 1-2",
"• Stakeholder interviews and requirement gathering<br>• Feasibility study and technology evaluation<br>• SRS document creation<br>• UI/UX wireframe design<br>• Database schema design",
"SRS Document, Wireframes, ER Diagram, Project Plan",
"Kush Shah (Lead), Shrey Raval (Requirements), All (Review)"],

["Phase 2: System Design & Architecture","Week 3-4",
"• High-level system architecture design<br>• API contract definition (REST endpoints)<br>• Database schema finalization<br>• Security architecture planning<br>• Frontend component hierarchy design",
"Architecture Document, API Spec, DB Schema, Security Plan",
"Dhairy Tanna (Security), Kush Shah (Architecture), Krina Parikh (UI Design)"],

["Phase 3: Core Backend Development","Week 5-8",
"• Spring Boot project setup and configuration<br>• Database tables creation and JDBC repositories<br>• Authentication system (JWT, OAuth, CAPTCHA)<br>• Core services: User, Canteen, Menu, Category<br>• Security configuration and headers",
"Working backend with auth, user, canteen, and menu APIs",
"Kush Shah, Dhairy Tanna, Ishan Shastri"],

["Phase 4: Core Frontend Development","Week 5-8 (Parallel)",
"• React + Vite project setup with TypeScript<br>• Design system: Tailwind config, colors, animations<br>• Authentication pages (Login, Signup, Password Reset)<br>• Student dashboard and canteen browsing<br>• Menu browsing and cart implementation",
"Working frontend with auth flow, dashboard, menu, and cart",
"Krina Parikh, Ishan Shastri, Kush Shah"],

["Phase 5: Order & Payment System","Week 9-11",
"• Order controller and service implementation<br>• Checkout flow and order placement<br>• Order management dashboard for vendors<br>• Order history page for users<br>• Payment method integration (COD initially)",
"Complete order lifecycle, vendor order management",
"Ishan Shastri, Kush Shah, Krina Parikh"],

["Phase 6: Advanced Features","Week 12-14",
"• WebSocket integration (STOMP over WS)<br>• Real-time order notifications<br>• Coupon system (BOGO, percentage, flat)<br>• Review and rating system<br>• Analytics dashboard with charts<br>• Profile image upload",
"Real-time notifications, coupons, reviews, analytics",
"Kush Shah (WebSocket), Ishan Shastri (Coupons/Reviews), Krina Parikh (Analytics UI)"],

["Phase 7: UI Polish & Responsiveness","Week 15-16",
"• Responsive breakpoint strategy (xs to tv)<br>• Skeleton loading for all pages<br>• Framer Motion animations<br>• Accessibility improvements<br>• Cross-browser testing",
"Fully responsive UI, polished UX across all devices",
"Krina Parikh, Kush Shah, Shrey Raval (Testing)"],

["Phase 8: Security Hardening & Testing","Week 17-18",
"• OWASP vulnerability assessment<br>• Rate limiting implementation<br>• Input sanitization audit<br>• Password policy enforcement<br>• Security headers verification<br>• Penetration testing<br>• Performance testing",
"Security audit report, test results, bug fixes",
"Shrey Raval, Dhairy Tanna, Kush Shah"],

["Phase 9: Integration Testing & Deployment","Week 19-20",
"• End-to-end integration testing<br>• User acceptance testing (UAT)<br>• Bug fixing and optimization<br>• Production deployment preparation<br>• Final documentation and README<br>• Project presentation preparation",
"Deployed application, final documentation, presentation",
"All members, Shrey Raval (QA Lead)"],
])}

<h3>6.3 Gantt Chart (Visual Timeline)</h3>
<table class="gantt">
<thead><tr><th style="width:200px">Phase</th><th>W1-2</th><th>W3-4</th><th>W5-6</th><th>W7-8</th><th>W9-10</th><th>W11-12</th><th>W13-14</th><th>W15-16</th><th>W17-18</th><th>W19-20</th></tr></thead>
<tbody>
<tr><td>1. Requirements</td><td><span class="bar bar-p" style="width:100%">&nbsp;</span></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>2. Design</td><td></td><td><span class="bar bar-p" style="width:100%">&nbsp;</span></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>3. Backend Core</td><td></td><td></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>4. Frontend Core</td><td></td><td></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>5. Orders & Payment</td><td></td><td></td><td></td><td></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td><span class="bar bar-e" style="width:50%">&nbsp;</span></td><td></td><td></td><td></td><td></td></tr>
<tr><td>6. Advanced Features</td><td></td><td></td><td></td><td></td><td></td><td><span class="bar bar-e" style="width:50%">&nbsp;</span></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td></td><td></td><td></td></tr>
<tr><td>7. UI Polish</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><span class="bar bar-e" style="width:100%">&nbsp;</span></td><td></td><td></td></tr>
<tr><td>8. Security & Testing</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><span class="bar bar-t" style="width:100%">&nbsp;</span></td><td></td></tr>
<tr><td>9. Integration & Deploy</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><span class="bar bar-d" style="width:100%">&nbsp;</span></td></tr>
</tbody>
</table>
<p style="font-size:12px;margin-top:8px">
<span class="bar bar-p" style="width:12px">&nbsp;</span> Planning &nbsp;&nbsp;
<span class="bar bar-e" style="width:12px">&nbsp;</span> Execution &nbsp;&nbsp;
<span class="bar bar-t" style="width:12px">&nbsp;</span> Testing &nbsp;&nbsp;
<span class="bar bar-d" style="width:12px">&nbsp;</span> Deployment
</p>

<h3>6.4 Risk Management</h3>
{table(["Risk","Probability","Impact","Mitigation Strategy"],[
["WebSocket connection instability","Medium","High","Auto-reconnect with exponential backoff, SockJS fallback"],
["Database performance bottleneck","Low","High","Query optimization, indexing strategy, connection pooling"],
["Security vulnerabilities","Medium","Critical","OWASP compliance, regular security audits, penetration testing"],
["Scope creep","High","Medium","Strict phase-based deliverables, backlog prioritization"],
["Team member unavailability","Medium","Medium","Cross-training, documented codebase, shared knowledge"],
])}
</div>

<!-- 7. APPENDICES -->
<div class="page-break"></div>
<div id="s7"><h2>7. Appendices</h2>

<h3>Appendix A: Technology Stack Summary</h3>
{table(["Category","Technology","Purpose"],[
["Frontend Framework","React 18 + TypeScript 5","Component-based UI development"],
["Styling","Tailwind CSS 3 + Custom Config","Utility-first responsive styling"],
["Animations","Framer Motion","Page transitions and micro-interactions"],
["Icons","Lucide React + Custom SVGs","Iconography"],
["HTTP Client","Fetch API","REST API communication"],
["WebSocket Client","@stomp/stompjs","Real-time STOMP messaging"],
["Loading States","react-loading-skeleton","Skeleton placeholder UI"],
["Backend Framework","Spring Boot 3.x","REST API server"],
["Language","Java 21","Backend programming language"],
["Database Access","Spring JDBC Template","SQL query execution"],
["Security","Spring Security 6","Authentication and authorization"],
["Token Management","jjwt (JSON Web Token)","JWT generation and validation"],
["Encryption","BCrypt","Password hashing"],
["Email","JavaMail + Brevo SMTP","Transactional emails"],
["Database","PostgreSQL 15","Relational data storage"],
["Build (Frontend)","Vite 6","Fast dev server and bundler"],
["Build (Backend)","Maven","Java dependency management and build"],
])}

<h3>Appendix B: Responsive Breakpoint Configuration</h3>
{table(["Breakpoint","Width","Columns (Grid)","Target Device"],[
["xs","475px","1","Small phones"],
["sm","640px","1-2","Phones"],
["md","768px","2","Tablets"],
["lg","1024px","3","Small laptops"],
["xl","1280px","4","Desktops"],
["kiosk","1440px","4-5","Kiosk displays"],
["tv","1920px","5-6","TV / large displays"],
])}

<h3>Appendix C: WebSocket Topic Architecture</h3>
{table(["Topic","Direction","Payload","Subscriber"],[
["/topic/orders","Server → Client","Order object (JSON)","All vendors (global)"],
["/topic/canteen/{'{id}'}/orders","Server → Client","Order object for specific canteen","Canteen vendor dashboard"],
["/topic/canteen/{'{id}'}/order-updates","Server → Client","Updated order with new status","Canteen vendor dashboard"],
["/topic/user/{'{id}'}/orders","Server → Client","User's order status change","User order history page"],
["/topic/order-updates","Server → Client","Order status update (global)","All connected clients"],
])}

<h3>Appendix D: Document Revision History</h3>
{table(["Version","Date","Author","Changes"],[
["1.0","February 2026","Kush Shah","Initial SRS document creation with all sections"],
])}

</div>

</div><!-- /container -->

<!-- PRINT BUTTON -->
<button class="print-btn no-print" onclick="window.print()">📄 Download as PDF</button>

</body>
</html>"""

# Write the file
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SRS_CharusatNeeds.html")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ SRS Document generated successfully!")
print(f"📄 File: {output_path}")
print(f"📏 Size: {len(html):,} bytes")
print(f"\n🖨️  To save as PDF:")
print(f"   1. Open the HTML file in Chrome/Edge")
print(f"   2. Click the 'Download as PDF' button (or Ctrl+P)")
print(f"   3. Set 'Destination' to 'Save as PDF'")
print(f"   4. Enable 'Background graphics' in More Settings")
print(f"   5. Click 'Save'")
