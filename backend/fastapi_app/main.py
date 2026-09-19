import os
import sys
import json
import secrets
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Add parent dir to path to reuse database & notifications functions
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database
from notifications import dispatch_verification_code, generate_secure_otp, load_dotenv
from rate_limiter import limiter

load_dotenv()

app = FastAPI(
    title="Siri Sofa Services API",
    description="Production-Hardened 3D-First Home Services Booking & Business Management Platform",
    version="2.0.0"
)

# Restrict CORS origins in production
cors_env = os.environ.get("CORS_ORIGINS", "").strip()
if cors_env:
    allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')

security = HTTPBearer(auto_error=False)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required. Please provide a valid session token.")

    token = credentials.credentials
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        now_str = datetime.now().isoformat()
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.phone, u.role, u.is_email_verified, u.is_mobile_verified
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > ?
        """, (token, now_str))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")
        return dict(user)
    finally:
        conn.close()

def get_current_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Siri Sofa Services"}

# ----------------- AUTHENTICATION -----------------

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(payload: LoginRequest, request: Request):
    email = payload.email.strip().lower()
    ip_addr = get_client_ip(request)

    rate_key = f"login:{ip_addr}:{email}"
    allowed, retry_sec = limiter.check(rate_key, max_requests=5, window_seconds=300)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many login attempts. Please try again in {retry_sec} seconds.")

    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
        user = cursor.fetchone()
        if not user or not database.verify_password(payload.password, user['password_hash']):
            limiter.record_failure(rate_key)
            raise HTTPException(status_code=401, detail="Invalid email or password")

        limiter.reset(rate_key)
        user_agent = request.headers.get("User-Agent", "")
        session_token = secrets.token_urlsafe(32)
        created_at = datetime.now().isoformat()
        expires_at = (datetime.now() + timedelta(days=7)).isoformat()

        cursor.execute("""
            INSERT INTO user_sessions (session_token, user_id, role, created_at, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (session_token, user['id'], user['role'], created_at, expires_at, ip_addr, user_agent))
        conn.commit()

        u_dict = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role'],
            'is_email_verified': bool(user['is_email_verified']),
            'is_mobile_verified': bool(user['is_mobile_verified'])
        }
        return {"user": u_dict, "token": session_token}
    finally:
        conn.close()

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str

@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest, request: Request):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    phone = payload.phone.strip() if payload.phone else None
    password = payload.password

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email and password are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    now = datetime.now().isoformat()
    ip_addr = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")

    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User already exists with this email address. Please sign in instead.")

        pw_hash = database.hash_password(password)
        cursor.execute("""
            INSERT INTO users (name, email, phone, password_hash, role, is_email_verified, is_mobile_verified, created_at)
            VALUES (?, ?, ?, ?, 'customer', 0, 0, ?)
        """, (name, email, phone, pw_hash, now))
        conn.commit()
        new_id = cursor.lastrowid

        session_token = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(days=7)).isoformat()
        cursor.execute("""
            INSERT INTO user_sessions (session_token, user_id, role, created_at, expires_at, ip_address, user_agent)
            VALUES (?, ?, 'customer', ?, ?, ?, ?)
        """, (session_token, new_id, now, expires_at, ip_addr, user_agent))

        otp_expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
        m_challenge = None
        m_delivered = False
        if phone:
            m_code = generate_secure_otp()
            m_challenge = secrets.token_hex(16)
            m_hash = database.hash_otp(m_code, m_challenge)
            cursor.execute("""
                INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
                VALUES (?, ?, 'mobile', ?, 'HASHED', ?, 0, 0, ?, ?)
            """, (m_challenge, phone, m_hash, otp_expires_at, now, new_id))
            m_res = dispatch_verification_code(phone, 'mobile', m_code, name)
            m_delivered = m_res['delivered']
            cursor.execute("""
                INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                VALUES (?, 'mobile', ?, ?, ?)
            """, (phone, f"Verification code dispatched via mobile. Status: {'delivered' if m_delivered else 'simulated'}. Delivery ID: {m_res.get('delivery_id', 'none')}", 'delivered' if m_delivered else 'simulated_logged', now))

        e_code = generate_secure_otp()
        e_challenge = secrets.token_hex(16)
        e_hash = database.hash_otp(e_code, e_challenge)
        cursor.execute("""
            INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
            VALUES (?, ?, 'email', ?, 'HASHED', ?, 0, 0, ?, ?)
        """, (e_challenge, email, e_hash, otp_expires_at, now, new_id))
        e_res = dispatch_verification_code(email, 'email', e_code, name)
        e_delivered = e_res['delivered']
        cursor.execute("""
            INSERT INTO notifications_log (recipient, channel, message, status, created_at)
            VALUES (?, 'email', ?, ?, ?)
        """, (email, f"Verification code dispatched via email. Status: {'delivered' if e_delivered else 'simulated'}. Delivery ID: {e_res.get('delivery_id', 'none')}", 'delivered' if e_delivered else 'simulated_logged', now))
        conn.commit()

        u_dict = {
            'id': new_id,
            'name': name,
            'email': email,
            'phone': phone,
            'role': 'customer',
            'is_email_verified': False,
            'is_mobile_verified': False
        }
        return {
            "success": True,
            "user": u_dict,
            "token": session_token,
            "requires_verification": True,
            "mobile_delivered": m_delivered,
            "email_delivered": e_delivered,
            "mobile_challenge_id": m_challenge,
            "email_challenge_id": e_challenge,
            "message": "Account created! Verification codes sent to your mobile and email."
        }
    finally:
        conn.close()

@app.post("/api/auth/logout")
def logout(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    if credentials:
        conn = database.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_sessions WHERE session_token = ?", (credentials.credentials,))
            conn.commit()
        finally:
            conn.close()
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/auth/me")
def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}

# ----------------- OTP CHALLENGE FLOW -----------------

class OtpSendRequest(BaseModel):
    target: str
    type: str = "mobile"
    name: Optional[str] = "Customer"
    user_id: Optional[int] = None

@app.post("/api/auth/otp/send")
def send_otp(payload: OtpSendRequest, request: Request):
    target = payload.target.strip()
    otp_type = payload.type.strip().lower()
    ip_addr = get_client_ip(request)

    if not target:
        raise HTTPException(status_code=400, detail=f"Please provide a valid {otp_type} destination")

    otp_send_key = f"otp_send:{ip_addr}:{target}"
    allowed, retry_sec = limiter.check(otp_send_key, max_requests=5, window_seconds=3600)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Please wait {retry_sec} seconds before requesting another code.")

    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT created_at FROM verification_otps 
            WHERE target = ? AND target_type = ? 
            ORDER BY id DESC LIMIT 1
        """, (target, otp_type))
        last_otp = cursor.fetchone()
        now = datetime.now()
        if last_otp:
            try:
                last_time = datetime.fromisoformat(last_otp['created_at'])
                diff = (now - last_time).total_seconds()
                if diff < 30:
                    wait_sec = int(30 - diff)
                    raise HTTPException(status_code=429, detail=f"Please wait {wait_sec} seconds before requesting a new code")
            except HTTPException:
                raise
            except Exception:
                pass

        otp_code = generate_secure_otp()
        challenge_id = secrets.token_hex(16)
        otp_h = database.hash_otp(otp_code, challenge_id)
        now_str = now.isoformat()
        expires_at = (now + timedelta(minutes=10)).isoformat()

        cursor.execute("""
            INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
            VALUES (?, ?, ?, ?, 'HASHED', ?, 0, 0, ?, ?)
        """, (challenge_id, target, otp_type, otp_h, expires_at, now_str, payload.user_id))

        dispatch_res = dispatch_verification_code(target, otp_type, otp_code, payload.name or "Customer")
        status_str = 'delivered' if dispatch_res['delivered'] else 'simulated_logged'
        msg_body = f"Verification code dispatched via {otp_type}. Status: {status_str}. Provider: {dispatch_res['provider']}. Delivery ID: {dispatch_res.get('delivery_id', 'none')}"

        cursor.execute("""
            INSERT INTO notifications_log (recipient, channel, message, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (target, otp_type, msg_body, status_str, now_str))
        conn.commit()

        return {
            "success": True,
            "challenge_id": challenge_id,
            "message": f"6-digit verification code sent to {target}",
            "target": target,
            "type": otp_type,
            "delivered": dispatch_res['delivered'],
            "provider": dispatch_res['provider'],
            "expires_in_minutes": 10
        }
    finally:
        conn.close()

class OtpVerifyRequest(BaseModel):
    challenge_id: Optional[str] = None
    target: Optional[str] = None
    type: Optional[str] = "mobile"
    otp_code: str

@app.post("/api/auth/otp/verify")
def verify_otp(payload: OtpVerifyRequest):
    otp_code = payload.otp_code.strip()
    if not otp_code:
        raise HTTPException(status_code=400, detail="6-digit verification code is required")

    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        if payload.challenge_id:
            cursor.execute("""
                SELECT * FROM verification_otps 
                WHERE challenge_id = ? AND is_used = 0 
                ORDER BY id DESC LIMIT 1
            """, (payload.challenge_id,))
        else:
            if not payload.target:
                raise HTTPException(status_code=400, detail="Challenge ID is required for verification")
            cursor.execute("""
                SELECT * FROM verification_otps 
                WHERE target = ? AND target_type = ? AND is_used = 0 
                ORDER BY id DESC LIMIT 1
            """, (payload.target.strip(), (payload.type or "mobile").strip().lower()))

        record = cursor.fetchone()
        if not record:
            raise HTTPException(status_code=400, detail="No active verification request found. Please request a new code.")

        now_str = datetime.now().isoformat()
        if record['expires_at'] < now_str:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

        if record['attempts'] >= 5:
            raise HTTPException(status_code=400, detail="Maximum verification attempts exceeded. Please request a new code.")

        c_id = record['challenge_id'] or "default_challenge"
        is_valid = False
        if record['otp_hash']:
            is_valid = database.verify_otp_hash(otp_code, c_id, record['otp_hash'])

        if not is_valid:
            cursor.execute("UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?", (record['id'],))
            conn.commit()
            remaining = max(0, 4 - record['attempts'])
            raise HTTPException(status_code=400, detail=f"Incorrect code. {remaining} attempts remaining.")

        cursor.execute("UPDATE verification_otps SET is_used = 1 WHERE id = ?", (record['id'],))

        v_target = record['target']
        v_type = record['target_type']
        target_user_id = record['user_id']

        if target_user_id:
            if v_type == 'mobile':
                cursor.execute("UPDATE users SET is_mobile_verified = 1 WHERE id = ?", (target_user_id,))
            else:
                cursor.execute("UPDATE users SET is_email_verified = 1 WHERE id = ?", (target_user_id,))
        else:
            if v_type == 'mobile':
                cursor.execute("UPDATE users SET is_mobile_verified = 1 WHERE phone = ?", (v_target,))
            else:
                cursor.execute("UPDATE users SET is_email_verified = 1 WHERE LOWER(email) = LOWER(?)", (v_target,))

        conn.commit()
        return {
            "success": True,
            "message": f"{v_type.capitalize()} verified successfully!",
            "target": v_target,
            "type": v_type
        }
    finally:
        conn.close()

# ----------------- SERVICES & PRICING -----------------

@app.get("/api/services")
def get_services():
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC")
        services = [dict(r) for r in cursor.fetchall()]
        for s in services:
            cursor.execute("SELECT * FROM service_variants WHERE service_id = ? ORDER BY sort_order ASC", (s['id'],))
            s['variants'] = [dict(v) for v in cursor.fetchall()]
        return {"services": services}
    finally:
        conn.close()

@app.get("/api/pricing")
def get_pricing():
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pricing_config WHERE id = 1")
        cfg = dict(cursor.fetchone() or {})
        cursor.execute("""
            SELECT sv.*, s.slug as service_slug, s.title as service_title
            FROM service_variants sv
            JOIN services s ON sv.service_id = s.id
            ORDER BY s.id ASC, sv.sort_order ASC
        """)
        variants = [dict(r) for r in cursor.fetchall()]
        return {"config": cfg, "variants": variants}
    finally:
        conn.close()

@app.put("/api/pricing")
def update_pricing(payload: Dict[str, Any], admin: Dict[str, Any] = Depends(get_current_admin)):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        config_data = payload.get("config")
        if config_data:
            cursor.execute("""
                UPDATE pricing_config 
                SET min_booking_amount = ?, service_charge = ?, gst_percentage = ?, updated_at = datetime('now')
                WHERE id = 1
            """, (
                config_data.get('min_booking_amount', 499.0),
                config_data.get('service_charge', 49.0),
                config_data.get('gst_percentage', 18.0)
            ))

        for v in payload.get("variants", []):
            cursor.execute("UPDATE service_variants SET base_price = ? WHERE id = ?", (v['base_price'], v['id']))

        conn.commit()
        return {"message": "Pricing updated successfully"}
    finally:
        conn.close()

@app.get("/api/slots/available")
def get_slots(date: str):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT service_slot, COUNT(*) as count 
            FROM bookings 
            WHERE service_date = ? AND status != 'cancelled'
            GROUP BY service_slot
        """, (date,))
        booked = {r['service_slot']: r['count'] for r in cursor.fetchall()}
        all_slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
        slot_data = []
        for s in all_slots:
            count = booked.get(s, 0)
            slot_data.append({"slot": s, "available": count < 3, "remaining": max(0, 3 - count)})
        return {"date": date, "slots": slot_data}
    finally:
        conn.close()

# ----------------- BOOKINGS -----------------

class BookingItem(BaseModel):
    variant_id: int
    quantity: int = 1

class CreateBookingRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_date: str
    service_slot: str
    address: Dict[str, Any]
    items: List[BookingItem]
    coupon_code: Optional[str] = None
    notes: Optional[str] = ""

@app.post("/api/bookings", status_code=201)
def create_booking(payload: CreateBookingRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user['id']
    name = payload.name or current_user['name']
    email = payload.email or current_user['email']
    phone = payload.phone or current_user['phone']
    service_date = payload.service_date
    service_slot = payload.service_slot
    coupon_code = payload.coupon_code.strip().upper() if payload.coupon_code else None
    now = datetime.now().isoformat()

    conn = database.get_connection()
    conn.isolation_level = None
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN IMMEDIATE")

        cursor.execute("""
            SELECT slot_number FROM slot_reservations
            WHERE service_date = ? AND service_slot = ?
            ORDER BY slot_number ASC
        """, (service_date, service_slot))
        occupied_slots = {r[0] for r in cursor.fetchall()}

        cursor.execute("""
            SELECT COUNT(*) FROM bookings
            WHERE service_date = ? AND service_slot = ? AND status != 'cancelled'
        """, (service_date, service_slot))
        bookings_count = cursor.fetchone()[0]

        assigned_slot_num = None
        for s_num in (1, 2, 3):
            if s_num not in occupied_slots:
                assigned_slot_num = s_num
                break

        if not assigned_slot_num or bookings_count >= 3:
            cursor.execute("ROLLBACK")
            raise HTTPException(status_code=409, detail=f"The selected slot ({service_slot}) on {service_date} is fully booked.")

        cursor.execute("SELECT * FROM pricing_config WHERE id = 1")
        cfg = dict(cursor.fetchone())
        service_charge = cfg['service_charge']
        gst_pct = cfg['gst_percentage']

        subtotal = 0.0
        computed_items = []
        for it in payload.items:
            cursor.execute("""
                SELECT sv.*, s.title as service_title 
                FROM service_variants sv 
                JOIN services s ON sv.service_id = s.id 
                WHERE sv.id = ?
            """, (it.variant_id,))
            v_row = cursor.fetchone()
            if v_row:
                item_total = v_row['base_price'] * it.quantity
                subtotal += item_total
                computed_items.append({
                    'service_name': v_row['service_title'],
                    'variant_name': v_row['name'],
                    'quantity': it.quantity,
                    'unit_price': v_row['base_price'],
                    'total_price': item_total
                })

        if not computed_items:
            cursor.execute("ROLLBACK")
            raise HTTPException(status_code=400, detail="No valid services selected")

        discount = 0.0
        if coupon_code:
            cursor.execute("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1", (coupon_code,))
            c_row = cursor.fetchone()
            if c_row and subtotal >= c_row['min_order_amount']:
                if c_row['discount_type'] == 'fixed':
                    discount = min(c_row['value'], subtotal)
                else:
                    discount = round((subtotal * c_row['value']) / 100.0, 2)

        taxable_amount = max(0.0, subtotal - discount + service_charge)
        tax = round((taxable_amount * (gst_pct / 100.0)), 2)
        total_amount = round(taxable_amount + tax, 2)

        import string
        booking_id = f"SIRI-{''.join(secrets.choice(string.digits) for _ in range(6))}"

        cursor.execute("""
            INSERT INTO bookings (
                id, user_id, customer_name, customer_email, customer_phone, address_json,
                service_date, service_slot, status, subtotal, service_charge, tax, discount,
                coupon_code, total_amount, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id, user_id, name, email, phone, json.dumps(payload.address),
            service_date, service_slot, subtotal, service_charge, tax, discount,
            coupon_code, total_amount, payload.notes or "", now, now
        ))

        cursor.execute("""
            INSERT INTO slot_reservations (service_date, service_slot, slot_number, booking_id, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (service_date, service_slot, assigned_slot_num, booking_id, now))

        for ci in computed_items:
            cursor.execute("""
                INSERT INTO booking_items (booking_id, service_name, variant_name, quantity, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (booking_id, ci['service_name'], ci['variant_name'], ci['quantity'], ci['unit_price'], ci['total_price']))

        if payload.address.get('house_flat'):
            cursor.execute("""
                INSERT INTO addresses (user_id, house_flat, street, area, city, pincode, instructions, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                user_id,
                payload.address.get('house_flat', ''),
                payload.address.get('street', ''),
                payload.address.get('area', ''),
                payload.address.get('city', 'Hyderabad'),
                payload.address.get('pincode', ''),
                payload.address.get('instructions', '')
            ))

        cursor.execute("COMMIT")
        return {
            "message": "Booking confirmed successfully",
            "booking_id": booking_id,
            "total_amount": total_amount,
            "service_date": service_date,
            "service_slot": service_slot
        }
    except HTTPException:
        raise
    except Exception as e:
        cursor.execute("ROLLBACK")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/bookings")
def get_bookings(
    user_id: Optional[int] = None, 
    status: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT b.*, t.name as technician_name, t.phone as technician_phone FROM bookings b LEFT JOIN technicians t ON b.technician_id = t.id"
        params = []
        clauses = []

        if current_user.get("role") == "customer":
            clauses.append("b.user_id = ?")
            params.append(current_user["id"])
        elif current_user.get("role") == "admin":
            if user_id:
                clauses.append("b.user_id = ?")
                params.append(user_id)

        if status and status != 'all':
            clauses.append("b.status = ?")
            params.append(status)

        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY b.created_at DESC"
        cursor.execute(query, params)
        bookings = []
        for r in cursor.fetchall():
            bd = dict(r)
            try:
                bd['address'] = json.loads(bd['address_json'])
            except Exception:
                bd['address'] = {}
            cursor.execute("SELECT * FROM booking_items WHERE booking_id = ?", (bd['id'],))
            bd['items'] = [dict(i) for i in cursor.fetchall()]
            bookings.append(bd)
        return {"bookings": bookings}
    finally:
        conn.close()

@app.get("/api/bookings/{booking_id}")
def get_booking(booking_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT b.*, t.name as technician_name, t.phone as technician_phone, t.rating as technician_rating
            FROM bookings b
            LEFT JOIN technicians t ON b.technician_id = t.id
            WHERE UPPER(b.id) = UPPER(?)
        """, (booking_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Booking not found")

        b_dict = dict(row)
        if current_user['role'] != 'admin' and str(b_dict['user_id']) != str(current_user['id']):
            raise HTTPException(status_code=403, detail="Access denied: You can only view your own bookings")

        try:
            b_dict['address'] = json.loads(b_dict['address_json'])
        except Exception:
            b_dict['address'] = {}

        cursor.execute("SELECT * FROM booking_items WHERE booking_id = ?", (b_dict['id'],))
        b_dict['items'] = [dict(i) for i in cursor.fetchall()]
        return {"booking": b_dict}
    finally:
        conn.close()

@app.put("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, payload: Dict[str, Any], admin: Dict[str, Any] = Depends(get_current_admin)):
    new_status = payload.get("status")
    valid_statuses = ['received', 'confirmed', 'assigned', 'cleaning_started', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {valid_statuses}")

    now = datetime.now().isoformat()
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, booking_id))
        if new_status == 'cancelled':
            cursor.execute("DELETE FROM slot_reservations WHERE booking_id = ?", (booking_id,))
        conn.commit()
        return {"message": f"Booking {booking_id} status updated to {new_status}"}
    finally:
        conn.close()

@app.put("/api/bookings/{booking_id}/assign")
def assign_technician(booking_id: str, payload: Dict[str, Any], admin: Dict[str, Any] = Depends(get_current_admin)):
    technician_id = payload.get("technician_id")
    now = datetime.now().isoformat()
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE bookings 
            SET technician_id = ?, status = 'assigned', updated_at = ?
            WHERE id = ?
        """, (technician_id, now, booking_id))
        if technician_id:
            cursor.execute("UPDATE technicians SET status = 'busy', current_job_id = ? WHERE id = ?", (booking_id, technician_id))
        conn.commit()
        return {"message": f"Technician assigned to booking {booking_id}"}
    finally:
        conn.close()

# ----------------- REVIEWS -----------------

@app.get("/api/reviews")
def get_reviews():
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reviews ORDER BY id DESC LIMIT 20")
        return {"reviews": [dict(r) for r in cursor.fetchall()]}
    finally:
        conn.close()

class CreateReviewRequest(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
    service_type: Optional[str] = "Sofa Cleaning"

@app.post("/api/reviews", status_code=201)
def create_review(payload: CreateReviewRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (payload.booking_id,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if current_user['role'] != 'admin' and str(booking['user_id']) != str(current_user['id']):
            raise HTTPException(status_code=403, detail="Access denied: You can only review your own bookings")

        if booking['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Reviews can only be submitted after the service is marked completed")

        cursor.execute("SELECT id FROM reviews WHERE booking_id = ?", (payload.booking_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="A review has already been submitted for this booking")

        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO reviews (booking_id, user_name, rating, comment, service_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (payload.booking_id, current_user['name'], payload.rating, payload.comment.strip(), payload.service_type or "Sofa Cleaning", now))
        conn.commit()
        return {"message": "Review submitted successfully"}
    finally:
        conn.close()

# ----------------- TECHNICIANS & ANALYTICS -----------------

@app.get("/api/technicians")
def get_technicians(admin: Dict[str, Any] = Depends(get_current_admin)):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM technicians ORDER BY id ASC")
        return {"technicians": [dict(t) for t in cursor.fetchall()]}
    finally:
        conn.close()

@app.get("/api/analytics")
def get_analytics(admin: Dict[str, Any] = Depends(get_current_admin)):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM bookings WHERE status != 'cancelled'")
        overview = dict(cursor.fetchone())
        total_rev = overview['revenue'] or 0.0
        total_count = overview['total'] or 0

        today_str = date.today().isoformat()
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE service_date = ?", (today_str,))
        today_bookings = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status IN ('received', 'confirmed')")
        pending_bookings = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'")
        completed_bookings = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'")
        cancelled_bookings = cursor.fetchone()['count']

        cancellation_rate = round((cancelled_bookings / max(1, (total_count + cancelled_bookings))) * 100, 1)

        cursor.execute("""
            SELECT service_name, COUNT(*) as bookings_count, SUM(total_price) as service_revenue
            FROM booking_items
            GROUP BY service_name
            ORDER BY bookings_count DESC
        """)
        services_breakdown = [dict(row) for row in cursor.fetchall()]

        return {
            'metrics': {
                'total_revenue': round(total_rev, 2),
                'total_bookings': total_count,
                'today_bookings': today_bookings,
                'pending_bookings': pending_bookings,
                'completed_bookings': completed_bookings,
                'cancelled_bookings': cancelled_bookings,
                'cancellation_rate': cancellation_rate,
                'average_order_value': round(total_rev / max(1, total_count), 2)
            },
            'services_breakdown': services_breakdown
        }
    finally:
        conn.close()

# ----------------- COUPONS -----------------

@app.post("/api/coupons/validate")
def validate_coupon(payload: Dict[str, Any]):
    code = payload.get('code', '').strip().upper()
    subtotal = float(payload.get('subtotal', 0.0))

    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required")

    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1", (code,))
        coupon = cursor.fetchone()
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid or expired promo code")

        if subtotal < coupon['min_order_amount']:
            raise HTTPException(status_code=400, detail=f"Minimum order of ₹{coupon['min_order_amount']} required for code {code}")

        if coupon['discount_type'] == 'fixed':
            discount = min(coupon['value'], subtotal)
        else:
            discount = round((subtotal * coupon['value']) / 100.0, 2)

        return {
            "valid": True,
            "code": code,
            "discount_type": coupon['discount_type'],
            "discount_value": coupon['value'],
            "discount_amount": discount,
            "message": f"Promo code {code} applied!"
        }
    finally:
        conn.close()

# Mount frontend
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
