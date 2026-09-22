import http.server
import socketserver
import json
import os
import mimetypes
import urllib.parse
import sqlite3
import random
import string
import secrets
import hmac
from datetime import datetime, date, timedelta

from database import get_connection, hash_password, verify_password, hash_otp, verify_otp_hash, DB_PATH, init_db
from notifications import dispatch_verification_code, generate_secure_otp, load_dotenv
from rate_limiter import limiter

# Load .env variables
load_dotenv()

PORT = int(os.environ.get('PORT', 8000))
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Ensure DB is initialized
init_db(DB_PATH)

def normalize_phone(value: str) -> str:
    digits = ''.join(ch for ch in str(value or '') if ch.isdigit())
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    if digits.startswith('0') and len(digits) == 11:
        digits = digits[1:]
    return digits

def validate_service_slot(service_date: str, service_slot: str) -> bool:
    try:
        d = date.fromisoformat(service_date)
    except Exception:
        return False
    allowed = {"09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"}
    return d >= date.today() and service_slot in allowed

def generate_booking_id(conn = None) -> str:
    """Generate cryptographically random booking ID with collision retry"""
    for _ in range(10):
        nums = ''.join(secrets.choice(string.digits) for _ in range(6))
        candidate = f"SIRI-{nums}"
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM bookings WHERE id = ?", (candidate,))
            if not cursor.fetchone():
                return candidate
        else:
            return candidate
    return f"SIRI-{secrets.token_hex(4).upper()}"

def create_user_session(conn, user_id: int, role: str, ip_address: str = None, user_agent: str = None) -> str:
    """Issue a high-entropy cryptographic session token stored server-side with expiration"""
    session_token = secrets.token_urlsafe(32)
    created_at = datetime.now().isoformat()
    expires_at = (datetime.now() + timedelta(days=7)).isoformat()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_sessions (session_token, user_id, role, created_at, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (session_token, user_id, role, created_at, expires_at, ip_address, user_agent))
    conn.commit()
    return session_token

def delete_user_session(conn, session_token: str):
    """Revoke user session immediately upon logout"""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_sessions WHERE session_token = ?", (session_token,))
    conn.commit()

class SiriSofaHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        origin = self.headers.get('Origin', '')
        allowed_origins_env = os.environ.get('CORS_ORIGINS', '').strip()
        if allowed_origins_env:
            allowed_list = [o.strip() for o in allowed_origins_env.split(',') if o.strip()]
            if origin in allowed_list:
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Vary', 'Origin')
            else:
                self.send_header('Access-Control-Allow-Origin', allowed_list[0])
        else:
            # Development permissive CORS
            self.send_header('Access-Control-Allow-Origin', origin or '*')
            if origin:
                self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def send_json(self, status_code: int, data: dict):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict:
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                return {}
            raw_bytes = self.rfile.read(content_length)
            self._last_raw_body = raw_bytes
            return json.loads(raw_bytes.decode('utf-8'))
        except Exception:
            return {}

    def get_authenticated_user(self, conn):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:].strip()
        if not token:
            return None

        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()

        # 1. Look up cryptographic session token
        cursor.execute("""
            SELECT s.user_id, s.role, u.name, u.email, u.phone, u.is_email_verified, u.is_mobile_verified
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > ?
        """, (token, now_iso))
        row = cursor.fetchone()
        if row:
            res = dict(row)
            res['id'] = res['user_id']
            return res

        return None

    def require_admin(self, conn):
        user = self.get_authenticated_user(conn)
        if not user:
            self.send_json(401, {'error': 'Authentication required. Please sign in with administrator credentials.'})
            return None
        if user.get('role') != 'admin':
            self.send_json(403, {'error': 'Access Denied: Administrative privileges required.'})
            return None
        return user

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path.startswith('/api/'):
            return self.handle_api_get(path, query)

        # Root / health check for backend REST API
        if path in ('/', '/health', '/api', '/api/'):
            return self.send_json(200, {
                'service': 'Siri Sofa Services — Backend REST API',
                'status': 'online',
                'frontend_url': 'http://localhost:3000',
                'endpoints': {
                    'services': '/api/services',
                    'pricing': '/api/pricing',
                    'slots': '/api/slots/available',
                    'bookings': '/api/bookings',
                    'auth': '/api/auth/login'
                }
            })

        self.send_error(404, "Endpoint Not Found")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        if path.startswith('/api/'):
            return self.handle_api_post(path)
        self.send_error(404)

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        if path.startswith('/api/'):
            return self.handle_api_put(path)
        self.send_error(404)

    # ------------------ API ROUTING ------------------

    def handle_api_get(self, path: str, query: dict):
        conn = get_connection()
        try:
            # GET /api/health
            if path == '/api/health':
                return self.send_json(200, {'status': 'healthy', 'service': 'Siri Sofa Services'})

            # GET /api/services
            elif path == '/api/services':
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC")
                services = [dict(row) for row in cursor.fetchall()]
                for s in services:
                    cursor.execute("""
                        SELECT * FROM service_variants 
                        WHERE service_id = ? 
                        ORDER BY sort_order ASC, id ASC
                    """, (s['id'],))
                    s['variants'] = [dict(v) for v in cursor.fetchall()]
                return self.send_json(200, {'services': services})

            # GET /api/pricing
            elif path == '/api/pricing':
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM pricing_config WHERE id = 1")
                cfg = dict(cursor.fetchone() or {})
                cursor.execute("""
                    SELECT sv.*, s.slug as service_slug, s.title as service_title
                    FROM service_variants sv
                    JOIN services s ON sv.service_id = s.id
                    ORDER BY s.id ASC, sv.sort_order ASC
                """)
                variants = [dict(row) for row in cursor.fetchall()]
                return self.send_json(200, {'config': cfg, 'variants': variants})

            # GET /api/slots/available?date=YYYY-MM-DD
            elif path == '/api/slots/available':
                req_date = query.get('date', [date.today().isoformat()])[0]
                all_slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT service_slot, COUNT(*) as count 
                    FROM bookings 
                    WHERE service_date = ? AND status != 'cancelled'
                    GROUP BY service_slot
                """, (req_date,))
                booked = {row['service_slot']: row['count'] for row in cursor.fetchall()}
                slot_data = []
                max_capacity_per_slot = 3
                for slot in all_slots:
                    count = booked.get(slot, 0)
                    available = count < max_capacity_per_slot
                    slot_data.append({
                        'slot': slot,
                        'available': available,
                        'remaining': max(0, max_capacity_per_slot - count)
                    })
                return self.send_json(200, {'date': req_date, 'slots': slot_data})

            # GET /api/bookings or /api/bookings/<id>
            elif path == '/api/bookings':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required to view bookings'})

                user_id = query.get('user_id', [None])[0]
                status_filter = query.get('status', [None])[0]

                # Security & RBAC:
                # If caller is logged in as customer, lock user_id to their own ID so they cannot view others
                if caller.get('role') == 'customer':
                    user_id = str(caller['id'])
                elif caller.get('role') != 'admin':
                    return self.send_json(403, {'error': 'Access denied'})

                cursor = conn.cursor()
                query_str = "SELECT b.*, t.name as technician_name, t.phone as technician_phone FROM bookings b LEFT JOIN technicians t ON b.technician_id = t.id"
                params = []
                clauses = []
                if user_id:
                    clauses.append("b.user_id = ?")
                    params.append(user_id)
                if status_filter and status_filter != 'all':
                    clauses.append("b.status = ?")
                    params.append(status_filter)

                if clauses:
                    query_str += " WHERE " + " AND ".join(clauses)
                query_str += " ORDER BY b.created_at DESC"

                cursor.execute(query_str, params)
                bookings = []
                for row in cursor.fetchall():
                    b_dict = dict(row)
                    try:
                        b_dict['address'] = json.loads(b_dict['address_json'])
                    except Exception:
                        b_dict['address'] = {}
                    cursor.execute("SELECT * FROM booking_items WHERE booking_id = ?", (b_dict['id'],))
                    b_dict['items'] = [dict(item) for item in cursor.fetchall()]
                    bookings.append(b_dict)
                return self.send_json(200, {'bookings': bookings})

            elif path.startswith('/api/bookings/'):
                booking_id = path.split('/api/bookings/')[1].strip()
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT b.*, t.name as technician_name, t.phone as technician_phone, t.rating as technician_rating
                    FROM bookings b
                    LEFT JOIN technicians t ON b.technician_id = t.id
                    WHERE UPPER(b.id) = UPPER(?)
                """, (booking_id,))
                row = cursor.fetchone()
                if not row:
                    return self.send_json(404, {'error': f'Booking {booking_id} not found'})
                b_dict = dict(row)

                # Authorization check: Authenticated customer can only access their own booking
                caller = self.get_authenticated_user(conn)
                if caller and caller.get('role') == 'customer':
                    if b_dict.get('user_id') and str(b_dict.get('user_id')) != str(caller['id']):
                        return self.send_json(403, {'error': 'Access denied: You are not authorized to view this booking.'})

                try:
                    b_dict['address'] = json.loads(b_dict['address_json'])
                except Exception:
                    b_dict['address'] = {}
                cursor.execute("SELECT * FROM booking_items WHERE booking_id = ?", (b_dict['id'],))
                b_dict['items'] = [dict(item) for item in cursor.fetchall()]
                return self.send_json(200, {'booking': b_dict})

            # GET /api/technicians (Admin only)
            elif path == '/api/technicians':
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM technicians ORDER BY id ASC")
                technicians = [dict(t) for t in cursor.fetchall()]
                return self.send_json(200, {'technicians': technicians})

            # GET /api/analytics (Admin only)
            elif path == '/api/analytics':
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return
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

                # Most booked service
                cursor.execute("""
                    SELECT service_name, COUNT(*) as bookings_count, SUM(total_price) as service_revenue
                    FROM booking_items
                    GROUP BY service_name
                    ORDER BY bookings_count DESC
                """)
                services_breakdown = [dict(row) for row in cursor.fetchall()]

                # Recent bookings schedule for today
                cursor.execute("""
                    SELECT b.id, b.customer_name, b.service_slot, b.status, b.total_amount,
                           t.name as technician_name,
                           (SELECT GROUP_CONCAT(variant_name, ', ') FROM booking_items WHERE booking_id = b.id) as service_summary
                    FROM bookings b
                    LEFT JOIN technicians t ON b.technician_id = t.id
                    ORDER BY b.service_date DESC, b.service_slot ASC
                    LIMIT 10
                """)
                recent_schedule = [dict(row) for row in cursor.fetchall()]

                return self.send_json(200, {
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
                    'services_breakdown': services_breakdown,
                    'recent_schedule': recent_schedule
                })

            # GET /api/reviews
            elif path == '/api/reviews':
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM reviews ORDER BY id DESC LIMIT 20")
                reviews = [dict(r) for r in cursor.fetchall()]
                return self.send_json(200, {'reviews': reviews})

            # GET /api/addresses (IDOR Protected)
            elif path == '/api/addresses':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required to view saved addresses'})

                target_user_id = caller['id']
                if caller.get('role') == 'admin':
                    requested_id = query.get('user_id', [None])[0]
                    if requested_id:
                        target_user_id = requested_id

                cursor = conn.cursor()
                cursor.execute("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC", (target_user_id,))
                addresses = [dict(a) for a in cursor.fetchall()]
                return self.send_json(200, {'addresses': addresses})

            else:
                return self.send_json(404, {'error': 'API endpoint not found'})
        finally:
            conn.close()

    def handle_api_post(self, path: str):
        conn = get_connection()
        payload = self.read_json_body()
        now = datetime.now().isoformat()
        client_addr = getattr(self, 'client_address', None)
        ip_addr = client_addr[0] if (client_addr and isinstance(client_addr, (tuple, list))) else None
        headers = getattr(self, 'headers', {}) or {}
        user_agent = headers.get('User-Agent', '') if hasattr(headers, 'get') else ''

        try:
            # POST /api/auth/login
            if path == '/api/auth/login':
                email = payload.get('email', '').strip().lower()
                password = payload.get('password', '')

                # Rate limiting: max 5 failed attempts per 5 minutes per IP + email
                rate_key = f"login:{ip_addr}:{email}"
                allowed, retry_sec = limiter.check(rate_key, max_requests=5, window_seconds=300)
                if not allowed:
                    return self.send_json(429, {'error': f'Too many login attempts. Please try again in {retry_sec} seconds.'})

                cursor = conn.cursor()
                clean_phone = email.replace('+91', '').replace(' ', '').replace('-', '').strip()
                cursor.execute("""
                    SELECT * FROM users 
                    WHERE LOWER(email) = ? 
                       OR (LENGTH(?) >= 10 AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+91', '') LIKE ?)
                """, (email, clean_phone, f"%{clean_phone[-10:]}"))
                user = cursor.fetchone()
                if not user or not verify_password(password, user['password_hash']):
                    limiter.record_failure(rate_key)
                    return self.send_json(401, {'error': 'Invalid email or password'})

                limiter.reset(rate_key)
                token = create_user_session(conn, user['id'], user['role'], ip_addr, user_agent)

                u_dict = {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user['phone'],
                    'role': user['role'],
                    'is_email_verified': bool(user['is_email_verified']) if 'is_email_verified' in user.keys() else False,
                    'is_mobile_verified': bool(user['is_mobile_verified']) if 'is_mobile_verified' in user.keys() else False
                }
                return self.send_json(200, {'user': u_dict, 'token': token})

            # POST /api/auth/logout
            elif path == '/api/auth/logout':
                auth_header = self.headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header.replace('Bearer ', '').strip()
                    delete_user_session(conn, token)
                return self.send_json(200, {'success': True, 'message': 'Logged out successfully'})

            # POST /api/auth/register
            elif path == '/api/auth/register':
                name = payload.get('name', '').strip()
                email = payload.get('email', '').strip().lower()
                phone = payload.get('phone', '').strip()
                password = payload.get('password', '')

                if not name or not email or not password:
                    return self.send_json(400, {'error': 'Name, email and password are required'})

                if len(password) < 6:
                    return self.send_json(400, {'error': 'Password must be at least 6 characters long'})

                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
                if cursor.fetchone():
                    return self.send_json(400, {
                        'error': 'User already exists. Please sign in.',
                        'user_exists': True,
                        'field': 'email',
                        'target': email
                    })

                if phone:
                    clean_phone = phone.replace('+91', '').replace(' ', '').replace('-', '').strip()
                    if len(clean_phone) >= 10:
                        cursor.execute("SELECT id FROM users WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+91', '') LIKE ?", (f"%{clean_phone[-10:]}",))
                        if cursor.fetchone():
                            return self.send_json(400, {
                                'error': 'User already exists with this mobile number. Please sign in.',
                                'user_exists': True,
                                'field': 'phone',
                                'target': phone
                            })

                pw_hash = hash_password(password)
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password_hash, role, is_email_verified, is_mobile_verified, created_at)
                    VALUES (?, ?, ?, ?, 'customer', 0, 0, ?)
                """, (name, email, phone, pw_hash, now))
                conn.commit()
                new_id = cursor.lastrowid

                token = create_user_session(conn, new_id, 'customer', ip_addr, user_agent)
                expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

                m_challenge = None
                m_delivered = False
                # Dispatch Mobile OTP
                if phone:
                    m_code = generate_secure_otp()
                    m_challenge = secrets.token_hex(16)
                    m_hash = hash_otp(m_code, m_challenge)
                    cursor.execute("""
                        INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
                        VALUES (?, ?, 'mobile', ?, 'HASHED', ?, 0, 0, ?, ?)
                    """, (m_challenge, phone, m_hash, expires_at, now, new_id))
                    m_res = dispatch_verification_code(phone, 'mobile', m_code, name)
                    m_delivered = m_res['delivered']
                    cursor.execute("""
                        INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                        VALUES (?, 'mobile', ?, ?, ?)
                    """, (phone, f"Verification code dispatched via mobile. Status: {'delivered' if m_delivered else 'simulated'}. Delivery ID: {m_res.get('delivery_id', 'none')}", 'delivered' if m_delivered else 'simulated_logged', now))

                # Dispatch Email OTP
                e_code = generate_secure_otp()
                e_challenge = secrets.token_hex(16)
                e_hash = hash_otp(e_code, e_challenge)
                cursor.execute("""
                    INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
                    VALUES (?, ?, 'email', ?, 'HASHED', ?, 0, 0, ?, ?)
                """, (e_challenge, email, e_hash, expires_at, now, new_id))
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
                return self.send_json(201, {
                    'success': True,
                    'user': u_dict,
                    'token': token,
                    'requires_verification': True,
                    'mobile_delivered': m_delivered,
                    'email_delivered': e_delivered,
                    'mobile_challenge_id': m_challenge,
                    'email_challenge_id': e_challenge,
                    'message': 'Account created! Verification codes sent to your mobile and email.'
                })

            # POST /api/auth/otp/send
            elif path == '/api/auth/otp/send':
                target = payload.get('target', '').strip()
                otp_type = payload.get('type', 'mobile').strip().lower()
                user_id = payload.get('user_id')
                user_name = payload.get('name', 'Customer').strip()

                if not target:
                    return self.send_json(400, {'error': f'Please provide a valid {otp_type} destination for the verification code'})

                # Rate limiting: max 5 requests per hour per target + IP, 30s minimum cooldown
                otp_send_key = f"otp_send:{ip_addr}:{target}"
                allowed, retry_sec = limiter.check(otp_send_key, max_requests=5, window_seconds=3600)
                if not allowed:
                    return self.send_json(429, {'error': f'Rate limit exceeded. Please wait {retry_sec} seconds before requesting another code.'})

                cursor = conn.cursor()
                cursor.execute("""
                    SELECT created_at FROM verification_otps 
                    WHERE target = ? AND target_type = ? 
                    ORDER BY id DESC LIMIT 1
                """, (target, otp_type))
                last_otp = cursor.fetchone()
                if last_otp:
                    try:
                        last_time = datetime.fromisoformat(last_otp['created_at'])
                        diff = (datetime.now() - last_time).total_seconds()
                        if diff < 30:
                            wait_sec = int(30 - diff)
                            return self.send_json(429, {'error': f'Please wait {wait_sec} seconds before requesting a new code'})
                    except Exception:
                        pass

                # Generate secure 6-digit OTP and challenge ID
                otp_code = generate_secure_otp()
                challenge_id = secrets.token_hex(16)
                otp_h = hash_otp(otp_code, challenge_id)
                expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

                cursor.execute("""
                    INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
                    VALUES (?, ?, ?, ?, 'HASHED', ?, 0, 0, ?, ?)
                """, (challenge_id, target, otp_type, otp_h, expires_at, now, user_id))

                # Real notification dispatch (SMTP or SMS gateway)
                dispatch_res = dispatch_verification_code(target, otp_type, otp_code, user_name)
                status_str = 'delivered' if dispatch_res['delivered'] else 'simulated_logged'
                msg_body = f"Verification code dispatched via {otp_type}. Status: {status_str}. Provider: {dispatch_res['provider']}. Delivery ID: {dispatch_res.get('delivery_id', 'none')}"

                cursor.execute("""
                    INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (target, otp_type, msg_body, status_str, now))
                conn.commit()

                # Security: never return otp_code in payload; return challenge_id and metadata only
                return self.send_json(200, {
                    'success': True,
                    'challenge_id': challenge_id,
                    'message': f"6-digit verification code sent to {target}",
                    'target': target,
                    'type': otp_type,
                    'delivered': dispatch_res['delivered'],
                    'provider': dispatch_res['provider'],
                    'expires_in_minutes': 10
                })

            # POST /api/auth/otp/verify
            elif path == '/api/auth/otp/verify':
                challenge_id = payload.get('challenge_id')
                target = payload.get('target', '').strip()
                otp_type = payload.get('type', 'mobile').strip().lower()
                otp_code = (payload.get('otp_code') or payload.get('otp') or '').strip()

                if not otp_code:
                    return self.send_json(400, {'error': '6-digit verification code is required'})

                cursor = conn.cursor()
                if challenge_id:
                    cursor.execute("""
                        SELECT * FROM verification_otps 
                        WHERE challenge_id = ? AND is_used = 0 
                        ORDER BY id DESC LIMIT 1
                    """, (challenge_id,))
                else:
                    if not target:
                        return self.send_json(400, {'error': 'Challenge ID is required'})
                    cursor.execute("""
                        SELECT * FROM verification_otps 
                        WHERE target = ? AND target_type = ? AND is_used = 0 
                        ORDER BY id DESC LIMIT 1
                    """, (target, otp_type))

                record = cursor.fetchone()

                if not record:
                    return self.send_json(400, {'error': 'No active verification request found. Please request a new code.'})

                if record['expires_at'] < now:
                    return self.send_json(400, {'error': 'Verification code has expired. Please request a new code.'})

                if record['attempts'] >= 5:
                    return self.send_json(400, {'error': 'Maximum verification attempts exceeded. Please request a new code.'})

                c_id = record['challenge_id'] or 'default_challenge'
                is_valid = False
                if record['otp_hash']:
                    is_valid = verify_otp_hash(otp_code, c_id, record['otp_hash'])
                elif record['otp_code'] and record['otp_code'] != 'HASHED':
                    is_valid = hmac.compare_digest(record['otp_code'], otp_code)

                if not is_valid:
                    cursor.execute("UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?", (record['id'],))
                    conn.commit()
                    remaining = 4 - record['attempts']
                    return self.send_json(400, {'error': f'Incorrect code. {max(0, remaining)} attempts remaining.'})

                # Successful verification: mark challenge as used
                cursor.execute("UPDATE verification_otps SET is_used = 1 WHERE id = ?", (record['id'],))

                # Determine which user to mark verified strictly from the challenge record (anti-tamper)
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

                return self.send_json(200, {
                    'success': True,
                    'message': f"{v_type.capitalize()} verified successfully!",
                    'target': v_target,
                    'type': v_type
                })

            # POST /api/auth/password/reset-request
            elif path == '/api/auth/password/reset-request':
                target = payload.get('target', '').strip()
                if not target:
                    return self.send_json(400, {'error': 'Please enter your registered email address or mobile number.'})

                # Rate limiting: max 5 reset requests per 15 mins per IP + target
                reset_key = f"reset_req:{ip_addr}:{target}"
                allowed, retry_sec = limiter.check(reset_key, max_requests=5, window_seconds=900)
                if not allowed:
                    return self.send_json(429, {'error': f'Too many reset requests. Please wait {retry_sec} seconds before trying again.'})

                cursor = conn.cursor()
                user = None
                target_type = 'email'
                clean_target = target

                if '@' in target:
                    clean_target = target.lower().strip()
                    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_target,))
                    user = cursor.fetchone()
                    target_type = 'email'
                else:
                    digits = target.replace('+91', '').replace(' ', '').replace('-', '').strip()
                    if len(digits) >= 10:
                        clean_digits = digits[-10:]
                        cursor.execute("""
                            SELECT * FROM users 
                            WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+91', '') LIKE ?
                        """, (f"%{clean_digits}",))
                        user = cursor.fetchone()
                    target_type = 'mobile'

                if not user:
                    return self.send_json(404, {'error': 'No account found with this email or mobile number. Please check or sign up.'})

                dest = user['email'] if target_type == 'email' else (user['phone'] or target)
                otp_code = generate_secure_otp()
                challenge_id = secrets.token_hex(16)
                otp_h = hash_otp(otp_code, challenge_id)
                expires_at = (datetime.now() + timedelta(minutes=15)).isoformat()

                cursor.execute("""
                    INSERT INTO verification_otps (challenge_id, target, target_type, otp_hash, otp_code, expires_at, attempts, is_used, created_at, user_id)
                    VALUES (?, ?, ?, ?, 'HASHED', ?, 0, 0, ?, ?)
                """, (challenge_id, dest, target_type, otp_h, expires_at, now, user['id']))

                dispatch_res = dispatch_verification_code(dest, target_type, otp_code, user['name'])
                status_str = 'delivered' if dispatch_res['delivered'] else 'simulated_logged'
                cursor.execute("""
                    INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (dest, target_type, f"Password reset verification code dispatched. Status: {status_str}", status_str, now))
                conn.commit()

                return self.send_json(200, {
                    'success': True,
                    'challenge_id': challenge_id,
                    'target': dest,
                    'target_type': target_type,
                    'user_id': user['id'],
                    'message': f'A 6-digit password reset code has been sent to {dest}'
                })

            # POST /api/auth/password/reset
            elif path == '/api/auth/password/reset':
                challenge_id = payload.get('challenge_id', '').strip()
                otp_code = (payload.get('otp_code') or payload.get('otp') or '').strip()
                new_password = payload.get('new_password', '')

                if not challenge_id:
                    return self.send_json(400, {'error': 'Challenge session expired or missing. Please request a new reset code.'})
                if not otp_code:
                    return self.send_json(400, {'error': 'Please enter the 6-digit verification code.'})
                if len(new_password) < 6:
                    return self.send_json(400, {'error': 'New password must be at least 6 characters long.'})

                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM verification_otps 
                    WHERE challenge_id = ? AND is_used = 0 
                    ORDER BY id DESC LIMIT 1
                """, (challenge_id,))
                record = cursor.fetchone()

                if not record:
                    return self.send_json(400, {'error': 'Reset request not found or code already used. Please request a new code.'})

                if record['expires_at'] < now:
                    return self.send_json(400, {'error': 'Reset code has expired. Please request a new code.'})

                if record['attempts'] >= 5:
                    return self.send_json(400, {'error': 'Maximum verification attempts exceeded. Please request a new code.'})

                is_valid = False
                if record['otp_hash']:
                    is_valid = verify_otp_hash(otp_code, challenge_id, record['otp_hash'])
                elif record['otp_code'] and record['otp_code'] != 'HASHED':
                    is_valid = hmac.compare_digest(record['otp_code'], otp_code)

                if not is_valid:
                    cursor.execute("UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?", (record['id'],))
                    conn.commit()
                    remaining = 4 - record['attempts']
                    return self.send_json(400, {'error': f'Incorrect verification code. {max(0, remaining)} attempts remaining.'})

                # Valid: mark OTP used, update password, and terminate existing sessions
                cursor.execute("UPDATE verification_otps SET is_used = 1 WHERE id = ?", (record['id'],))
                user_id = record['user_id']
                pw_hash = hash_password(new_password)
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, user_id))
                cursor.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
                conn.commit()

                return self.send_json(200, {
                    'success': True,
                    'message': 'Password has been reset successfully! Please sign in with your new password.'
                })

            # POST /api/auth/google
            elif path == '/api/auth/google':
                credential = payload.get('credential', '').strip()
                email = payload.get('email', '').strip().lower()
                name = payload.get('name', '').strip()
                avatar_url = payload.get('avatar_url', '').strip()
                google_id = payload.get('google_id', '').strip()

                # If credential JWT is provided from Google Identity Services, verify it cryptographically with Google
                if credential:
                    try:
                        import urllib.request
                        import urllib.parse
                        import ssl
                        ctx = ssl.create_default_context()
                        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(credential)}"
                        req = urllib.request.Request(verify_url, headers={'User-Agent': 'SiriSofa-GoogleAuth/1.0'})
                        with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
                            if resp.status == 200:
                                g_payload = json.loads(resp.read().decode('utf-8'))
                                # Verify Google is the legitimate token issuer
                                expected_aud = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
                                if (g_payload.get('iss') in ['accounts.google.com', 'https://accounts.google.com'] and g_payload.get('email_verified') is True and (not expected_aud or g_payload.get('aud') == expected_aud)):
                                    email = g_payload.get('email', '').strip().lower()
                                    name = g_payload.get('name') or name or (email.split('@')[0] if email else 'Customer')
                                    avatar_url = g_payload.get('picture') or avatar_url
                                    google_id = g_payload.get('sub') or google_id
                                else:
                                    return self.send_json(401, {'error': 'Google token verification rejected'})
                            else:
                                return self.send_json(401, {'error': 'Google verification rejected: Invalid ID token signature'})
                    except urllib.error.HTTPError as he:
                        return self.send_json(401, {'error': f'Google token verification failed: {he.reason}'})
                    except Exception as e:
                        print(f"Notice: Live Google token check encountered network error: {e}")

                if not email or '@' not in email:
                    return self.send_json(400, {'error': 'Valid Google email is required for authentication'})

                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
                user = cursor.fetchone()

                if not user:
                    # Auto-provision user with verified email
                    display_name = name or email.split('@')[0].replace('.', ' ').title()
                    random_pw = secrets.token_urlsafe(32)
                    pw_hash = hash_password(random_pw)
                    cursor.execute("""
                        INSERT INTO users (name, email, phone, password_hash, role, is_email_verified, is_mobile_verified, created_at)
                        VALUES (?, ?, '', ?, 'customer', 1, 0, ?)
                    """, (display_name, email, pw_hash, now))
                    conn.commit()
                    user_id = cursor.lastrowid
                    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                    user = cursor.fetchone()
                else:
                    user_id = user['id']
                    if not user['is_email_verified']:
                        cursor.execute("UPDATE users SET is_email_verified = 1 WHERE id = ?", (user_id,))
                        conn.commit()

                token = create_user_session(conn, user_id, user['role'], ip_addr, user_agent)
                u_dict = {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user['phone'],
                    'role': user['role'],
                    'avatar_url': avatar_url or None,
                    'is_email_verified': True,
                    'is_mobile_verified': bool(user['is_mobile_verified']) if 'is_mobile_verified' in user.keys() else False
                }

                return self.send_json(200, {
                    'success': True,
                    'user': u_dict,
                    'token': token,
                    'message': f'Signed in as {u_dict["name"]} with Google'
                })

            # POST /api/coupons/validate
            elif path == '/api/coupons/validate':
                code = payload.get('code', '').strip().upper()
                subtotal = float(payload.get('subtotal', 0.0))
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1", (code,))
                coupon = cursor.fetchone()
                if not coupon:
                    return self.send_json(404, {'valid': False, 'error': 'Invalid coupon code'})

                if subtotal < coupon['min_order_amount']:
                    return self.send_json(400, {
                        'valid': False, 
                        'error': f"Minimum order of ₹{int(coupon['min_order_amount'])} required for this coupon"
                    })

                discount = coupon['value'] if coupon['discount_type'] == 'fixed' else round((subtotal * coupon['value']) / 100.0, 2)
                discount = min(discount, subtotal)
                return self.send_json(200, {
                    'valid': True,
                    'code': coupon['code'],
                    'discount': discount,
                    'discount_type': coupon['discount_type'],
                    'value': coupon['value']
                })

            # POST /api/bookings (Atomic slot capacity check and IDOR protection)
            elif path == '/api/bookings':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {
                        'error': 'Sign in required. Please log in or create an account to schedule a cleaning appointment.'
                    })

                user_id = caller['id']
                cursor = conn.cursor()
                cursor.execute("SELECT id, name, email, phone FROM users WHERE id = ?", (user_id,))
                user_row = cursor.fetchone()
                if not user_row:
                    return self.send_json(401, {
                        'error': 'User account not found. Please log in again before scheduling.'
                    })

                name = payload.get('name', '').strip() or user_row['name']
                phone = payload.get('phone', '').strip() or user_row['phone']
                email = payload.get('email', '').strip() or user_row['email']
                address_data = payload.get('address', {})
                service_date = payload.get('service_date')
                service_slot = payload.get('service_slot')
                items = payload.get('items', [])
                coupon_code = payload.get('coupon_code', '').strip().upper() or None
                notes = payload.get('notes', '')

                if not name or not phone or not service_date or not service_slot or not items:
                    return self.send_json(400, {'error': 'Missing required booking details'})

                # Atomic Slot Capacity Check & Reservation using BEGIN IMMEDIATE transaction
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
                        return self.send_json(409, {
                            'error': f'The selected slot ({service_slot}) on {service_date} is fully booked. Please choose another time slot.'
                        })

                    # Get pricing config
                    cursor.execute("SELECT * FROM pricing_config WHERE id = 1")
                    cfg = dict(cursor.fetchone())
                    service_charge = cfg['service_charge']
                    gst_pct = cfg['gst_percentage']

                    # Compute subtotal from verified database prices
                    subtotal = 0.0
                    computed_items = []
                    for it in items:
                        variant_id = it.get('variant_id')
                        qty = int(it.get('quantity', 1))
                        if qty <= 0:
                            continue
                        cursor.execute("""
                            SELECT sv.*, s.title as service_title 
                            FROM service_variants sv 
                            JOIN services s ON sv.service_id = s.id 
                            WHERE sv.id = ?
                        """, (variant_id,))
                        v_row = cursor.fetchone()
                        if v_row:
                            item_total = v_row['base_price'] * qty
                            subtotal += item_total
                            computed_items.append({
                                'service_name': v_row['service_title'],
                                'variant_name': v_row['name'],
                                'quantity': qty,
                                'unit_price': v_row['base_price'],
                                'total_price': item_total
                            })

                    if not computed_items:
                        cursor.execute("ROLLBACK")
                        return self.send_json(400, {'error': 'No valid services selected'})

                    # Discount
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

                    # Generate cryptographically secure booking ID
                    booking_id = generate_booking_id(conn)

                    cursor.execute("""
                        INSERT INTO bookings (
                            id, user_id, customer_name, customer_email, customer_phone, address_json,
                            service_date, service_slot, status, subtotal, service_charge, tax, discount,
                            coupon_code, total_amount, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        booking_id, user_id, name, email, phone, json.dumps(address_data),
                        service_date, service_slot, subtotal, service_charge, tax, discount,
                        coupon_code, total_amount, notes, now, now
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

                    # Save address for authenticated user
                    if address_data.get('house_flat'):
                        cursor.execute("""
                            INSERT INTO addresses (user_id, house_flat, street, area, city, pincode, instructions, is_default)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
                        """, (
                            user_id,
                            address_data.get('house_flat', ''),
                            address_data.get('street', ''),
                            address_data.get('area', ''),
                            address_data.get('city', 'Hyderabad'),
                            address_data.get('pincode', ''),
                            address_data.get('instructions', '')
                        ))

                    cursor.execute("COMMIT")

                    return self.send_json(201, {
                        'success': True,
                        'message': 'Booking confirmed successfully',
                        'booking_id': booking_id,
                        'total_amount': total_amount,
                        'service_date': service_date,
                        'service_slot': service_slot
                    })
                except Exception as b_err:
                    cursor.execute("ROLLBACK")
                    raise b_err

            # POST /api/payments/razorpay/order
            elif path == '/api/payments/razorpay/order':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required'})
                booking_id = str(payload.get('booking_id', '')).strip()
                if not booking_id:
                    return self.send_json(400, {'error': 'booking_id is required'})
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM bookings WHERE id=?", (booking_id,))
                booking = cursor.fetchone()
                if not booking:
                    return self.send_json(404, {'error': 'Booking not found'})
                if caller['role'] != 'admin' and str(booking['user_id']) != str(caller['id']):
                    return self.send_json(403, {'error': 'Access denied'})
                key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
                if not key_id or not key_secret:
                    return self.send_json(503, {'error': 'Razorpay is not configured. COD remains available.'})
                amount_paise = int(round(float(booking['total_amount']) * 100))
                import base64
                auth = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
                req = urllib.request.Request(
                    "https://api.razorpay.com/v1/orders",
                    data=json.dumps({'amount': amount_paise, 'currency': 'INR', 'receipt': booking_id}).encode(),
                    headers={'Content-Type':'application/json','Authorization':f'Basic {auth}'}, method='POST')
                try:
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        order = json.loads(resp.read().decode())
                except Exception as e:
                    return self.send_json(502, {'error': 'Unable to create Razorpay order'})
                cursor.execute("UPDATE bookings SET payment_method='razorpay', payment_gateway_order_id=?, payment_status='created', updated_at=? WHERE id=?",
                               (order.get('id'), now, booking_id))
                cursor.execute("""INSERT INTO payments(booking_id,provider,order_id,amount,currency,status,created_at,updated_at)
                                  VALUES(?,?,?,?,?,?,?,?)
                                  ON CONFLICT(booking_id) DO UPDATE SET order_id=excluded.order_id,status='created',updated_at=excluded.updated_at""",
                               (booking_id,'razorpay',order.get('id'),float(booking['total_amount']),'INR','created',now,now))
                conn.commit()
                return self.send_json(200, {'success':True,'key_id':key_id,'order_id':order.get('id'),'amount':amount_paise,'currency':'INR','booking_id':booking_id})

            # POST /api/payments/razorpay/verify
            elif path == '/api/payments/razorpay/verify':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error':'Authentication required'})
                booking_id = str(payload.get('booking_id','')).strip()
                order_id = str(payload.get('razorpay_order_id','')).strip()
                payment_id = str(payload.get('razorpay_payment_id','')).strip()
                signature = str(payload.get('razorpay_signature','')).strip()
                if not all([booking_id, order_id, payment_id, signature]):
                    return self.send_json(400, {'error':'Incomplete payment verification payload'})
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM bookings WHERE id=?", (booking_id,))
                booking = cursor.fetchone()
                if not booking:
                    return self.send_json(404, {'error':'Booking not found'})
                if caller['role'] != 'admin' and str(booking['user_id']) != str(caller['id']):
                    return self.send_json(403, {'error':'Access denied'})
                if order_id != (booking['payment_gateway_order_id'] or ''):
                    return self.send_json(400, {'error':'Payment order mismatch'})
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET','').strip()
                if not key_secret:
                    return self.send_json(503, {'error':'Razorpay is not configured'})
                expected = hmac.new(key_secret.encode(), f"{order_id}|{payment_id}".encode(), __import__('hashlib').sha256).hexdigest()
                if not hmac.compare_digest(expected, signature):
                    return self.send_json(400, {'error':'Invalid payment signature'})
                cursor.execute("UPDATE bookings SET payment_status='paid', payment_gateway_payment_id=?, updated_at=? WHERE id=?",(payment_id,now,booking_id))
                cursor.execute("UPDATE payments SET payment_id=?,status='paid',updated_at=? WHERE booking_id=?",(payment_id,now,booking_id))
                conn.commit()
                return self.send_json(200, {'success':True,'payment_status':'paid','booking_id':booking_id})

            # POST /api/payments/razorpay/webhook
            elif path == '/api/payments/razorpay/webhook':
                secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET','').strip()
                signature = self.headers.get('X-Razorpay-Signature','')
                if not secret or not signature:
                    return self.send_json(503, {'error':'Razorpay webhook is not configured'})
                raw = getattr(self, '_last_raw_body', json.dumps(payload,separators=(',',':')).encode())
                expected = hmac.new(secret.encode(), raw, __import__('hashlib').sha256).hexdigest()
                if not hmac.compare_digest(expected, signature):
                    return self.send_json(401, {'error':'Invalid webhook signature'})
                event_id = self.headers.get('X-Razorpay-Event-Id','') or payload.get('event_id','')
                if not event_id:
                    return self.send_json(400, {'error':'Missing webhook event id'})
                cursor = conn.cursor()
                try:
                    cursor.execute("INSERT INTO payment_events(provider,event_id,event_type,payload,created_at) VALUES('razorpay',?,?,?,?)",
                                   (event_id,payload.get('event'),json.dumps(payload),now))
                except sqlite3.IntegrityError:
                    return self.send_json(200, {'success':True,'duplicate':True})
                entity = ((payload.get('payload') or {}).get('payment') or {}).get('entity') or {}
                payment_id, order_id = entity.get('id'), entity.get('order_id')
                event = payload.get('event','')
                new_status = 'paid' if event in ('payment.captured','order.paid') else ('failed' if event=='payment.failed' else 'created')
                if order_id:
                    cursor.execute("UPDATE bookings SET payment_status=?,payment_gateway_payment_id=COALESCE(?,payment_gateway_payment_id),updated_at=? WHERE payment_gateway_order_id=?",(new_status,payment_id,now,order_id))
                    cursor.execute("UPDATE payments SET status=?,payment_id=COALESCE(?,payment_id),updated_at=? WHERE order_id=?",(new_status,payment_id,now,order_id))
                conn.commit()
                return self.send_json(200, {'success':True})

            # POST /api/reviews (Authenticated, completed booking, and anti-tamper)
            elif path == '/api/reviews':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required to submit a review'})

                booking_id = payload.get('booking_id')
                user_name = payload.get('user_name', caller['name']).strip()
                rating = int(payload.get('rating', 5))
                comment = payload.get('comment', '').strip()
                service_type = payload.get('service_type', 'Sofa Cleaning').strip()

                if not booking_id or not comment:
                    return self.send_json(400, {'error': 'Booking ID and review comment are required'})

                cursor = conn.cursor()
                cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
                booking = cursor.fetchone()
                if not booking:
                    return self.send_json(404, {'error': 'Booking not found'})

                # RBAC & IDOR: Customers can only review their own bookings
                if caller['role'] != 'admin' and str(booking['user_id']) != str(caller['id']):
                    return self.send_json(403, {'error': 'Access denied: You can only review your own bookings'})

                if booking['status'] != 'completed':
                    return self.send_json(400, {'error': 'Reviews can only be submitted after the service is marked completed'})

                cursor.execute("SELECT id FROM reviews WHERE booking_id = ?", (booking_id,))
                if cursor.fetchone():
                    return self.send_json(400, {'error': 'A review has already been submitted for this booking'})

                cursor.execute("""
                    INSERT INTO reviews (booking_id, user_name, rating, comment, service_type, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (booking_id, user_name, rating, comment, service_type, now))
                conn.commit()
                return self.send_json(201, {'message': 'Review submitted successfully'})

            else:
                return self.send_json(404, {'error': 'Endpoint not found'})
        finally:
            conn.close()

    def handle_api_put(self, path: str):
        conn = get_connection()
        payload = self.read_json_body()
        now = datetime.now().isoformat()

        try:
            # PUT /api/pricing (Admin only)
            if path == '/api/pricing':
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return

                config_data = payload.get('config')
                variant_updates = payload.get('variants', [])
                cursor = conn.cursor()

                if config_data:
                    cursor.execute("""
                        UPDATE pricing_config
                        SET min_booking_amount = ?, service_charge = ?, gst_percentage = ?, updated_at = ?
                        WHERE id = 1
                    """, (
                        float(config_data.get('min_booking_amount', 499.0)),
                        float(config_data.get('service_charge', 49.0)),
                        float(config_data.get('gst_percentage', 18.0)),
                        now
                    ))

                for vu in variant_updates:
                    vid = vu.get('id')
                    new_price = float(vu.get('base_price', 0))
                    cursor.execute("UPDATE service_variants SET base_price = ? WHERE id = ?", (new_price, vid))

                conn.commit()
                return self.send_json(200, {'message': 'Pricing successfully updated across system'})

            # PUT /api/bookings/<id>/status (Admin only)
            elif '/api/bookings/' in path and path.endswith('/status'):
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return

                parts = path.split('/')
                booking_id = parts[3]
                new_status = payload.get('status')
                valid_statuses = ['received', 'confirmed', 'assigned', 'cleaning_started', 'completed', 'cancelled']
                if new_status not in valid_statuses:
                    return self.send_json(400, {'error': f'Invalid status. Allowed: {valid_statuses}'})

                cursor = conn.cursor()
                cursor.execute("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, booking_id))
                if new_status == 'cancelled':
                    cursor.execute("DELETE FROM slot_reservations WHERE booking_id = ?", (booking_id,))
                conn.commit()
                return self.send_json(200, {'message': f'Booking {booking_id} status updated to {new_status}'})

            # PUT /api/bookings/<id>/assign (Admin only)
            elif '/api/bookings/' in path and path.endswith('/assign'):
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return

                parts = path.split('/')
                booking_id = parts[3]
                technician_id = payload.get('technician_id')

                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE bookings 
                    SET technician_id = ?, status = 'assigned', updated_at = ?
                    WHERE id = ?
                """, (technician_id, now, booking_id))
                if technician_id:
                    cursor.execute("UPDATE technicians SET status = 'busy', current_job_id = ? WHERE id = ?", (booking_id, technician_id))
                conn.commit()
                return self.send_json(200, {'message': f'Technician assigned to booking {booking_id}'})

            # PUT /api/bookings/<id>/reschedule
            elif '/api/bookings/' in path and path.endswith('/reschedule'):
                parts = path.split('/')
                booking_id = parts[3]
                new_date = payload.get('service_date')
                new_slot = payload.get('service_slot')

                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required'})
                if not validate_service_slot(new_date, new_slot):
                    return self.send_json(400, {'error': 'Invalid or unavailable service date/time slot'})
                cursor = conn.cursor()
                cursor.execute("SELECT user_id, status FROM bookings WHERE UPPER(id)=UPPER(?)", (booking_id,))
                booking = cursor.fetchone()
                if not booking:
                    return self.send_json(404, {'error': 'Booking not found'})
                if caller.get('role') != 'admin' and str(booking['user_id']) != str(caller['id']):
                    return self.send_json(403, {'error': 'Access denied'})
                if booking['status'] in ('completed', 'cancelled'):
                    return self.send_json(400, {'error': 'This booking cannot be rescheduled'})
                cursor.execute("SELECT COUNT(*) FROM slot_reservations sr JOIN bookings b ON b.id=sr.booking_id WHERE sr.service_date=? AND sr.service_slot=? AND sr.booking_id<>? AND b.status!='cancelled'", (new_date,new_slot,booking_id))
                if cursor.fetchone()[0] >= 3:
                    return self.send_json(409, {'error': 'The selected slot is fully booked'})
                conn.isolation_level = None
                cursor.execute('BEGIN IMMEDIATE')
                try:
                    cursor.execute("DELETE FROM slot_reservations WHERE booking_id=?", (booking_id,))
                    cursor.execute("SELECT slot_number FROM slot_reservations WHERE service_date=? AND service_slot=? ORDER BY slot_number", (new_date,new_slot))
                    occupied={row[0] for row in cursor.fetchall()}
                    slot_num=next((n for n in (1,2,3) if n not in occupied),None)
                    if not slot_num:
                        cursor.execute('ROLLBACK')
                        return self.send_json(409, {'error':'The selected slot is fully booked'})
                    cursor.execute("UPDATE bookings SET service_date=?, service_slot=?, updated_at=? WHERE UPPER(id)=UPPER(?)", (new_date,new_slot,now,booking_id))
                    cursor.execute("INSERT INTO slot_reservations(service_date,service_slot,slot_number,booking_id,created_at) VALUES(?,?,?,?,?)", (new_date,new_slot,slot_num,booking_id,now))
                    cursor.execute('COMMIT')
                except Exception:
                    cursor.execute('ROLLBACK')
                    raise
                return self.send_json(200, {'message': f'Booking {booking_id} rescheduled to {new_date} at {new_slot}'})

            # PUT /api/technicians/<id> (Admin only)
            elif path.startswith('/api/technicians/'):
                admin_user = self.require_admin(conn)
                if not admin_user:
                    return

                tech_id = path.split('/api/technicians/')[1].strip()
                new_status = payload.get('status')
                cursor = conn.cursor()
                cursor.execute("UPDATE technicians SET status = ? WHERE id = ?", (new_status, tech_id))
                conn.commit()
                return self.send_json(200, {'message': f'Technician {tech_id} updated'})

            else:
                return self.send_json(404, {'error': 'PUT endpoint not found'})
        finally:
            conn.close()

def run_server():
    server_address = ('', PORT)
    # Enable socket reuse so restart doesn't fail with address already in use
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(server_address, SiriSofaHandler) as httpd:
        print(f"🛋️ Siri Sofa Services REST API Server running on http://localhost:{PORT}")
        print(f"👉 API Root: http://localhost:{PORT}/api/services")
        print(f"🗄️ Database connected at {DB_PATH}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Siri Sofa Services server...")

if __name__ == '__main__':
    run_server()
