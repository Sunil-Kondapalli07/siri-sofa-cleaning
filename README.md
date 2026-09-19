# 🛋️ Siri Sofa Cleaning Solutions — 3D-First Booking & Service Management Platform

> **"Fresh Sofa. Fresh Home."**  
> Premier Doorstep Upholstery & Furniture Deep Cleaning Platform powered by Three.js WebGL, OpenStreetMap Live Geolocation, Dual OTP Security, and Python.

---

## 🌟 Overview & Highlights

**Siri Sofa Cleaning Solutions** is a production-ready, full-stack home services platform built specifically for high-trust upholstery care in Hyderabad (Sofas, Dining Chairs, Mattresses, and Carpets).

- **Selective 3D WebGL Visualization:**
  - Procedural Three.js 3D Sofa model with realistic PBR fabric textures and soft ambient ground shadow.
  - Interactive seat morphing: **1-Seater (Armchair)**, **2-Seater (Loveseat)**, **3-Seater (Family Couch)**, and **L-Shape Sectional**.
  - Dynamic fabric color customization (Deep Ocean Teal, Slate Grey, Warm Cream, Midnight Navy, Mustard).
  - Ambient floating soap foam bubbles and high-pressure cleaning spray simulation.
  - Interactive **Before & After Transformation** split-slider showing soiled fabric turning into pristine sanitized velvet.
- **🗺️ 100% Free Live Maps & GPS Geolocation:**
  - **Zero Paid Dependencies:** Powered by OpenStreetMap tiles and Leaflet.js without Google Cloud / billing.
  - **📍 Live GPS Doorstep Detection:** Uses browser `navigator.geolocation` and OSM Nominatim reverse geocoding to automatically detect Hyderabad locality, road, and postal code.
  - **🛵 Live Transit Route:** Real-time visual route connecting technician dispatch to customer doorstep on an interactive map.
  - **Hyderabad Metropolitan Boundary:** Exclusively scoped to Hyderabad zones (Banjara Hills, Jubilee Hills, Gachibowli, Hitec City, Kondapur, Kukatpally, Secunderabad, etc.).
- **🔐 Real-Time Dual Mobile & Email Verification (2FA Signup Gate):**
  - Dispatches separate 6-digit cryptographic verification codes to **both Mobile Number (+91 SMS)** and **Email Address** during registration.
  - **Zero Codes on Screen:** OTP codes are strictly sent via carrier/SMTP and are never exposed in JSON responses or client UI (`otp_debug` eliminated).
  - **Carrier & SMTP Engine (`backend/notifications.py`):** Real-world SMTP delivery (Gmail SSL/TLS, Brevo, AWS SES) and Indian DLT SMS delivery (Fast2SMS `/dev/bulkV2`, Twilio REST API) with safe local console audit fallback.
  - **Interactive Verification Modal:** Enforces 10-minute validity, 30-second resend cooldown timers, and max 5 retry attempts.
- **🛡️ Strict Role-Based Access Control (RBAC):**
  - Admin operations, dynamic pricing edits, fleet assignment, and business analytics are strictly guarded.
  - Customer accounts cannot access the admin portal (`/admin`).
- **Portals:**
  - **👤 Customer Portal:**
    - Live registration with dual Mobile & Email OTP verification.
    - 5-Step Booking Wizard with interactive Leaflet map & GPS detection.
    - Visual Timeline Booking Tracker with live OpenStreetMap transit route.
    - Customer Dashboard with verification status pills (`✉️ Email Verified ✓`, `📱 Mobile Verified ✓`), live bookings, saved addresses, and GST tax invoices.
  - **⚡ Admin Operations Portal (`/admin`):**
    - Executive KPI Dashboard, filterable booking management, technician fleet dispatch, and live dynamic pricing engine.

---

## 🚀 Quick Start (Zero Dependencies Required)

The application includes an all-in-one runner using Python's standard library and SQLite. No external package installation is necessary!

```bash
# Clone the repository
git clone https://github.com/<YOUR_USERNAME>/siri-sofacleaning-solutions.git
cd siri-sofacleaning-solutions

# Run the platform
python3 run.py
```

Then open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🔑 Authentication & Production Configuration

Authentication is managed entirely server-side with OWASP PBKDF2-HMAC-SHA256 password hashing and cryptographically secure session management.

| Role | Configuration | Access / Notes |
|---|---|---|
| **Admin HQ** | Configured via `ADMIN_EMAIL` & `ADMIN_PASSWORD` | Operations HQ, Live Dynamic Pricing, Dispatching Technicians, Analytics |
| **New Customers** | Self-serve signup | Click **Sign Up**, verify dual Mobile & Email OTPs, and access customer dashboard |

---

## ⚙️ Configuration (`.env`)

Copy `.env.example` to `.env` to configure platform secrets and messaging gateways:

```env
# Server Security
SECRET_KEY=siri-sofa-strong-secret-key-change-in-production
ADMIN_EMAIL=admin@sirisofa.com
ADMIN_PASSWORD=your_strong_admin_password_here
CORS_ORIGINS=http://localhost:8000,http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
EMAIL_FROM=Siri Sofa Services <support@sirisofa.com>

# SMS Gateway
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

---

## 📁 Project Structure

```text
siri-sofacleaning-solutions/
├── run.py                         # Single command all-in-one runner (port 8000)
├── README.md                      # Complete documentation & API specs
├── .gitignore                     # Git ignore rules (.env, runtime DB, etc.)
├── .env.example                   # Environment configuration template
├── data/                          # Database storage (auto-seeded on first run)
│   └── .gitkeep
├── backend/
│   ├── database.py                # Relational schema (SQLite/PostgreSQL compatible)
│   ├── server.py                  # Standalone REST API & Static File Server
│   ├── notifications.py           # Real SMTP & SMS gateway delivery engine
│   ├── tests/
│   │   ├── test_database.py       # Unit tests for schema & seed integrity
│   │   └── test_api.py            # Unit tests for REST API endpoints & dual OTP
│   └── fastapi_app/               # Modular FastAPI production app
│       ├── main.py                # FastAPI endpoints & CORS
│       └── requirements.txt       # FastAPI & Uvicorn dependencies
└── frontend/
    ├── index.html                 # Single-Page Web Application
    ├── css/
    │   └── styles.css             # Tailwind CSS & 3D styling
    └── js/
        ├── api.js                 # Async REST client
        ├── store.js               # Reactive state store & calculations
        ├── three-sofa.js          # Three.js 3D Sofa model & particle systems
        ├── app.js                 # Router, dual OTP verification modal, lifecycle
        └── components/
            ├── navbar.js          # Top header & quick portal switcher
            ├── hero.js            # 3D Sofa showcase with controls
            ├── hygiene-process.js # 6-Step Hygiene & Before/After slider
            ├── service-selector.js# Interactive chair & sofa itemizer
            ├── booking-wizard.js  # 5-Step progressive booking flow with Leaflet map
            ├── booking-tracker.js # Visual status progression & live transit map
            ├── customer-portal.js # Customer account, verified badges & invoices
            ├── admin-portal.js    # Admin HQ, dynamic pricing & fleet
            └── reviews-faq.js     # Testimonials, coverage & WhatsApp CTA
```

---

## 🔌 REST API Endpoints

### Authentication & Verification
- `POST /api/auth/login` — Sign in as Customer or Admin
- `POST /api/auth/register` — Register a customer (automatically dispatches Mobile & Email OTPs)
- `POST /api/auth/otp/send` — Request a 6-digit OTP (30s rate-limited)
- `POST /api/auth/otp/verify` — Verify 6-digit OTP and activate account flags

### Services & Dynamic Pricing
- `GET /api/services` — List active services with nested variants and prices
- `GET /api/pricing` — Get pricing config (surcharges, taxes) and all variants
- `PUT /api/pricing` — Update base prices and system fees in real time

### Booking & Slots
- `GET /api/slots/available?date=YYYY-MM-DD` — Real-time slot capacity check
- `POST /api/bookings` — Create booking with validated totals and unique `SIRI-XXXXXX` ID
- `GET /api/bookings` — Filterable bookings list (by user or status)
- `GET /api/bookings/<id>` — Complete booking details with items & technician info
- `PUT /api/bookings/<id>/status` — Advance booking status
- `PUT /api/bookings/<id>/assign` — Assign a technician to a booking
- `PUT /api/bookings/<id>/reschedule` — Update date & time slot

### Operations & Analytics
- `GET /api/technicians` — Fleet roster with live status and ratings
- `PUT /api/technicians/<id>` — Update technician availability status
- `GET /api/analytics` — Business KPIs, revenue, and service breakdown
- `POST /api/coupons/validate` — Validate promo code (`FRESH50`, `FIRST100`)

---

## 🧪 Automated Testing

Run the test suites with:

```bash
python3 -m unittest discover backend/tests
```

13/13 tests pass cleanly.

---

## 📄 License

MIT License. Copyright © 2026 Siri Sofa Cleaning Solutions.
