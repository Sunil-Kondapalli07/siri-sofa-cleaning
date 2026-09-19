import sqlite3
import hashlib
import hmac
import secrets
import json
import os
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'siri_sofa.db')

def hash_password(password: str, salt: str = None) -> str:
    """PBKDF2-HMAC-SHA256 password hashing with 100,000 iterations (OWASP compliant)"""
    if not salt:
        salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"pbkdf2:sha256:100000${salt}${derived}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against PBKDF2-HMAC-SHA256 hash or legacy SHA-256 hash"""
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2:sha256:"):
        parts = stored_hash.split('$')
        if len(parts) != 3:
            return False
        _, salt, expected_derived = parts
        check_derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return hmac.compare_digest(check_derived, expected_derived)
    # Backward compatibility with existing development SHA-256 hashes
    legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)

def hash_otp(otp_code: str, salt: str = "siri_otp_salt_2026") -> str:
    """Hash one-time passcode with salt before saving to database"""
    return hashlib.sha256(f"{salt}:{otp_code.strip()}".encode('utf-8')).hexdigest()

def verify_otp_hash(otp_code: str, stored_hash: str, salt: str = "siri_otp_salt_2026") -> bool:
    """Constant-time comparison for OTP verification"""
    candidate = hash_otp(otp_code, salt)
    return hmac.compare_digest(candidate, stored_hash)

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = DB_PATH):
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        is_email_verified INTEGER DEFAULT 0,
        is_mobile_verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
        session_token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_id TEXT,
        user_id INTEGER,
        target TEXT NOT NULL,
        target_type TEXT NOT NULL,
        otp_hash TEXT,
        otp_code TEXT,
        expires_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        is_used INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient TEXT NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        house_flat TEXT NOT NULL,
        street TEXT NOT NULL,
        area TEXT NOT NULL,
        city TEXT NOT NULL,
        pincode TEXT NOT NULL,
        instructions TEXT,
        is_default INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS service_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        base_price REAL NOT NULL,
        unit_type TEXT DEFAULT 'unit',
        estimated_minutes INTEGER DEFAULT 45,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pricing_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        min_booking_amount REAL DEFAULT 499.0,
        service_charge REAL DEFAULT 49.0,
        gst_percentage REAL DEFAULT 18.0,
        weekend_multiplier REAL DEFAULT 1.0,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        value REAL NOT NULL,
        min_order_amount REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS technicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        rating REAL DEFAULT 4.8,
        jobs_completed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'available',
        current_job_id TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT NOT NULL,
        address_json TEXT NOT NULL,
        service_date TEXT NOT NULL,
        service_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'received',
        subtotal REAL NOT NULL,
        service_charge REAL NOT NULL,
        tax REAL NOT NULL,
        discount REAL DEFAULT 0.0,
        coupon_code TEXT,
        total_amount REAL NOT NULL,
        technician_id INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS booking_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT NOT NULL,
        service_name TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        service_type TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)
    # Migrations for existing DB instances
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_mobile_verified INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE verification_otps ADD COLUMN challenge_id TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE verification_otps ADD COLUMN otp_hash TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE verification_otps ADD COLUMN user_id INTEGER")
    except Exception:
        pass

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        session_token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    seed_data(conn)
    conn.close()

def seed_data(conn: sqlite3.Connection):
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        return

    now = datetime.now().isoformat()

    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    admin_pw = hash_password(admin_password)
    cursor.execute("""
        INSERT INTO users (name, email, phone, password_hash, role, is_email_verified, is_mobile_verified, created_at)
        VALUES 
        ('Admin Siri', 'admin@sirisofa.com', '+91 98000 00000', ?, 'admin', 1, 1, ?)
    """, (admin_pw, now))

    cursor.execute("""
        INSERT INTO pricing_config (id, min_booking_amount, service_charge, gst_percentage, weekend_multiplier, updated_at)
        VALUES (1, 499.0, 49.0, 18.0, 1.0, ?)
    """, (now,))

    cursor.execute("""
        INSERT INTO services (slug, title, subtitle, description, icon, is_active)
        VALUES 
        ('sofa', 'Sofa Cleaning', 'Deep cleaning & sanitization', 'Eco-friendly deep shampoo extraction for fabric, velvet, leather, and faux leather sofas.', 'couch', 1),
        ('chair', 'Chair Cleaning', 'Dining & office seating refresh', 'Spot removal, steam deodorizing, and dust extraction for all types of residential & office chairs.', 'chair', 1),
        ('mattress', 'Mattress Cleaning', 'Anti-allergen & dust mite elimination', 'High-suction extraction and UV-safe sanitization to ensure pure, hygienic, allergy-free sleep.', 'bed', 1),
        ('carpet', 'Carpet Cleaning', 'Deep fiber restoration', 'Heavy-duty rotary scrubber extraction restoring brightness, texture, and deep fiber freshness.', 'layers', 1)
    """)

    variants = [
        (1, '1 Seater Sofa', 499.0, 'seat', 30, 1),
        (1, '2 Seater Sofa', 899.0, 'seat', 45, 2),
        (1, '3 Seater Sofa', 1299.0, 'seat', 60, 3),
        (1, '4 Seater Sofa', 1699.0, 'seat', 75, 4),
        (1, 'L Shape Sectional', 2199.0, 'sofa', 90, 5),
        (1, 'Recliner Sofa', 849.0, 'seat', 40, 6),
        (1, 'Cushion Deep Clean (Set of 5)', 349.0, 'set', 20, 7),

        (2, 'Dining Chair', 199.0, 'chair', 15, 1),
        (2, 'Office Ergonomic Chair', 299.0, 'chair', 20, 2),
        (2, 'Arm Chair / Accent Chair', 399.0, 'chair', 25, 3),
        (2, 'Recliner Single Chair', 599.0, 'chair', 35, 4),
        (2, 'Fabric Stool / Ottoman', 179.0, 'chair', 15, 5),

        (3, 'Single Bed Mattress', 899.0, 'mattress', 45, 1),
        (3, 'Queen Size Mattress', 1299.0, 'mattress', 60, 2),
        (3, 'King Size Mattress', 1599.0, 'mattress', 75, 3),

        (4, 'Small Accent Rug (< 25 sq ft)', 599.0, 'rug', 30, 1),
        (4, 'Medium Living Room Carpet (up to 60 sq ft)', 1199.0, 'carpet', 50, 2),
        (4, 'Large Hall Carpet (up to 120 sq ft)', 1899.0, 'carpet', 80, 3)
    ]
    cursor.executemany("""
        INSERT INTO service_variants (service_id, name, base_price, unit_type, estimated_minutes, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    """, variants)

    cursor.execute("""
        INSERT INTO technicians (name, phone, rating, jobs_completed, status)
        VALUES 
        ('Raj Kumar', '+91 98480 11223', 4.9, 142, 'available'),
        ('Ravi Teja', '+91 98480 22334', 4.8, 98, 'busy'),
        ('Mahesh Goud', '+91 98480 33445', 4.9, 215, 'available'),
        ('Kiran Varma', '+91 98480 44556', 4.7, 76, 'off_duty')
    """)

    cursor.execute("""
        INSERT INTO coupons (code, discount_type, value, min_order_amount, is_active)
        VALUES 
        ('FRESH50', 'fixed', 150.0, 799.0, 1),
        ('FIRST100', 'fixed', 100.0, 499.0, 1),
        ('SIRI20', 'percentage', 20.0, 1499.0, 1)
    """)

    cursor.execute("""
        INSERT INTO reviews (booking_id, user_name, rating, comment, service_type, created_at)
        VALUES 
        (NULL, 'Vikram Reddy', 5, 'Technician Raj Kumar explained the 6-step hygiene process and showed remarkable before/after results on our 3-seater sofa.', 'Sofa Cleaning', '2026-08-20T14:30:00'),
        (NULL, 'Ananya R.', 5, 'The 3D sofa selector made booking so straightforward. Pricing was clear and the dirt extraction was eye-opening!', 'Sofa Cleaning', '2026-09-02T09:15:00'),
        (NULL, 'Dr. Arishetty', 5, 'Mattress and sofa sanitization done professionally. Very hygienic uniforms and sealed eco-friendly solutions.', 'Mattress Cleaning', '2026-09-12T16:00:00')
    """)

    conn.commit()

if __name__ == '__main__':
    print(f"Initializing database at {DB_PATH}...")
    init_db()
    print("Database successfully initialized and seeded with clean production data!")
