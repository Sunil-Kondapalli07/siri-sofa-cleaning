import http.server
import socketserver
import json
import os
import mimetypes
import urllib.parse
import sqlite3
import random
import string
from datetime import datetime, date, timedelta

from database import get_connection, hash_password, DB_PATH, init_db
from notifications import dispatch_verification_code, load_dotenv

# Load .env variables
load_dotenv()

PORT = int(os.environ.get('PORT', 8000))
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

# Ensure DB is initialized
init_db(DB_PATH)

def generate_booking_id() -> str:
    nums = ''.join(random.choices(string.digits, k=6))
    return f"SIRI-{nums}"

class SiriSofaHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

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
            raw_body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(raw_body)
        except Exception:
            return {}

    def get_authenticated_user(self, conn):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:].strip()
        parts = token.split('_')
        if len(parts) < 3 or parts[0] != 'token':
            return None
        try:
            user_id = int(parts[1])
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, phone, role FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception:
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

        # Static file serving from FRONTEND_DIR
        rel_path = path.lstrip('/')
        if not rel_path:
            rel_path = 'index.html'

        target_path = os.path.join(FRONTEND_DIR, rel_path)
        # Normalize and prevent directory traversal
        target_path = os.path.abspath(target_path)
        if not target_path.startswith(FRONTEND_DIR):
            self.send_error(403, "Access Denied")
            return

        # If file exists, serve it
        if os.path.isfile(target_path):
            return self.serve_static_file(target_path)

        # SPA fallback for frontend client routes like /admin, /track, /book
        spa_index = os.path.join(FRONTEND_DIR, 'index.html')
        if os.path.isfile(spa_index):
            return self.serve_static_file(spa_index)

        self.send_error(404, "File Not Found")

    def serve_static_file(self, filepath: str):
        mime_type, _ = mimetypes.guess_type(filepath)
        if not mime_type:
            mime_type = 'application/octet-stream'
        if filepath.endswith('.js'):
            mime_type = 'application/javascript'
        elif filepath.endswith('.css'):
            mime_type = 'text/css'

        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

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
            # GET /api/services
            if path == '/api/services':
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
                user_id = query.get('user_id', [None])[0]
                status_filter = query.get('status', [None])[0]

                # Security & RBAC:
                # If caller is logged in as customer, lock user_id to their own ID so they cannot view others
                if caller and caller.get('role') == 'customer':
                    user_id = str(caller['id'])
                elif not caller:
                    # If unauthenticated, cannot view all bookings across the business
                    if not user_id:
                        return self.send_json(401, {'error': 'Authentication required to view bookings'})

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

            # GET /api/addresses?user_id=X
            elif path == '/api/addresses':
                user_id = query.get('user_id', [None])[0]
                if not user_id:
                    return self.send_json(400, {'error': 'user_id required'})
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC", (user_id,))
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

        try:
            # POST /api/auth/login
            if path == '/api/auth/login':
                email = payload.get('email', '').strip().lower()
                password = payload.get('password', '')
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
                user = cursor.fetchone()
                if not user or user['password_hash'] != hash_password(password):
                    return self.send_json(401, {'error': 'Invalid email or password'})

                u_dict = {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user['phone'],
                    'role': user['role'],
                    'is_email_verified': bool(user['is_email_verified']) if 'is_email_verified' in user.keys() else False,
                    'is_mobile_verified': bool(user['is_mobile_verified']) if 'is_mobile_verified' in user.keys() else False
                }
                return self.send_json(200, {'user': u_dict, 'token': f"token_{user['id']}_{int(datetime.now().timestamp())}"})

            # POST /api/auth/register
            elif path == '/api/auth/register':
                name = payload.get('name', '').strip()
                email = payload.get('email', '').strip().lower()
                phone = payload.get('phone', '').strip()
                password = payload.get('password', '')

                if not name or not email or not password:
                    return self.send_json(400, {'error': 'Name, email and password are required'})

                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
                if cursor.fetchone():
                    return self.send_json(400, {'error': 'Account with this email already exists'})

                pw_hash = hash_password(password)
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password_hash, role, is_email_verified, is_mobile_verified, created_at)
                    VALUES (?, ?, ?, ?, 'customer', 0, 0, ?)
                """, (name, email, phone, pw_hash, now))
                conn.commit()
                new_id = cursor.lastrowid

                expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

                # Dispatch Mobile OTP
                if phone:
                    m_code = f"{random.randint(100000, 999999)}"
                    cursor.execute("""
                        INSERT INTO verification_otps (target, target_type, otp_code, expires_at, attempts, is_used, created_at)
                        VALUES (?, 'mobile', ?, ?, 0, 0, ?)
                    """, (phone, m_code, expires_at, now))
                    m_res = dispatch_verification_code(phone, 'mobile', m_code, name)
                    cursor.execute("""
                        INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                        VALUES (?, 'mobile', ?, ?, ?)
                    """, (phone, f"Your Siri Sofa Services verification code is {m_code}", 'delivered' if m_res['delivered'] else 'simulated_logged', now))

                # Dispatch Email OTP
                e_code = f"{random.randint(100000, 999999)}"
                cursor.execute("""
                    INSERT INTO verification_otps (target, target_type, otp_code, expires_at, attempts, is_used, created_at)
                    VALUES (?, 'email', ?, ?, 0, 0, ?)
                """, (email, e_code, expires_at, now))
                e_res = dispatch_verification_code(email, 'email', e_code, name)
                cursor.execute("""
                    INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                    VALUES (?, 'email', ?, ?, ?)
                """, (email, f"Your Siri Sofa Services verification code is {e_code}", 'delivered' if e_res['delivered'] else 'simulated_logged', now))

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
                    'token': f"token_{new_id}_{int(datetime.now().timestamp())}",
                    'requires_verification': True,
                    'message': 'Account created! Verification codes sent to both your mobile and email.'
                })

            # POST /api/auth/otp/send
            elif path == '/api/auth/otp/send':
                target = payload.get('target', '').strip()
                otp_type = payload.get('type', 'mobile').strip().lower()
                user_id = payload.get('user_id')
                user_name = payload.get('name', 'Customer').strip()

                if not target:
                    return self.send_json(400, {'error': f'Please provide a valid {otp_type} destination for the verification code'})

                cursor = conn.cursor()

                # Rate limiting: minimum 30 seconds cooldown between requests
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

                # Generate secure 6-digit OTP
                otp_code = f"{random.randint(100000, 999999)}"
                expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

                cursor.execute("""
                    INSERT INTO verification_otps (target, target_type, otp_code, expires_at, attempts, is_used, created_at)
                    VALUES (?, ?, ?, ?, 0, 0, ?)
                """, (target, otp_type, otp_code, expires_at, now))

                # Real notification dispatch (SMTP or SMS gateway)
                dispatch_res = dispatch_verification_code(target, otp_type, otp_code, user_name)
                msg_body = f"Your Siri Sofa Services verification code is {otp_code}. Valid for 10 minutes."
                status_str = 'delivered' if dispatch_res['delivered'] else 'simulated_logged'

                cursor.execute("""
                    INSERT INTO notifications_log (recipient, channel, message, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (target, otp_type, msg_body, status_str, now))
                conn.commit()

                return self.send_json(200, {
                    'success': True,
                    'message': f"6-digit verification code sent to {target}",
                    'target': target,
                    'type': otp_type,
                    'delivered': dispatch_res['delivered'],
                    'provider': dispatch_res['provider'],
                    'expires_in_minutes': 10
                })

            # POST /api/auth/otp/verify
            elif path == '/api/auth/otp/verify':
                target = payload.get('target', '').strip()
                otp_type = payload.get('type', 'mobile').strip().lower()
                otp_code = payload.get('otp_code', '').strip()
                user_id = payload.get('user_id')

                if not target or not otp_code:
                    return self.send_json(400, {'error': 'Target and 6-digit verification code are required'})

                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM verification_otps 
                    WHERE target = ? AND target_type = ? AND is_used = 0 
                    ORDER BY id DESC LIMIT 1
                """, (target, otp_type))
                record = cursor.fetchone()

                if not record:
                    return self.send_json(400, {'error': 'No active verification code found. Please request a new code.'})

                if record['expires_at'] < now:
                    return self.send_json(400, {'error': 'Verification code has expired. Please request a new code.'})

                if record['attempts'] >= 5:
                    return self.send_json(400, {'error': 'Maximum verification attempts exceeded. Please request a new code.'})

                if record['otp_code'] != otp_code:
                    cursor.execute("UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?", (record['id'],))
                    conn.commit()
                    remaining = 4 - record['attempts']
                    return self.send_json(400, {'error': f'Incorrect code. {max(0, remaining)} attempts remaining.'})

                # Successful verification
                cursor.execute("UPDATE verification_otps SET is_used = 1 WHERE id = ?", (record['id'],))

                if user_id:
                    if otp_type == 'mobile':
                        cursor.execute("UPDATE users SET is_mobile_verified = 1 WHERE id = ?", (user_id,))
                    else:
                        cursor.execute("UPDATE users SET is_email_verified = 1 WHERE id = ?", (user_id,))
                else:
                    if otp_type == 'mobile':
                        cursor.execute("UPDATE users SET is_mobile_verified = 1 WHERE phone = ?", (target,))
                    else:
                        cursor.execute("UPDATE users SET is_email_verified = 1 WHERE LOWER(email) = LOWER(?)", (target,))

                conn.commit()

                return self.send_json(200, {
                    'success': True,
                    'message': f"{otp_type.capitalize()} verified successfully!",
                    'target': target,
                    'type': otp_type
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

            # POST /api/bookings
            elif path == '/api/bookings':
                user_id = payload.get('user_id')
                token_header = self.headers.get('Authorization', '')

                # Resolve user_id from Bearer token if not explicitly provided
                if not user_id and token_header.startswith('Bearer '):
                    token = token_header.replace('Bearer ', '').strip()
                    if token.startswith('token_'):
                        try:
                            user_id = int(token.split('_')[1])
                        except Exception:
                            pass

                # Strict Authentication Requirement: Guest bookings are disabled
                if not user_id:
                    return self.send_json(401, {
                        'error': 'Sign in required. Please log in or create an account to schedule a cleaning appointment.'
                    })

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

                # Generate unique booking ID
                booking_id = generate_booking_id()

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

                for ci in computed_items:
                    cursor.execute("""
                        INSERT INTO booking_items (booking_id, service_name, variant_name, quantity, unit_price, total_price)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (booking_id, ci['service_name'], ci['variant_name'], ci['quantity'], ci['unit_price'], ci['total_price']))

                # Save address if user logged in
                if user_id and address_data.get('house_flat'):
                    cursor.execute("""
                        INSERT INTO addresses (user_id, house_flat, street, area, city, pincode, instructions, is_default)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
                    """, (
                        user_id,
                        address_data.get('house_flat', ''),
                        address_data.get('street', ''),
                        address_data.get('area', ''),
                        address_data.get('city', ''),
                        address_data.get('pincode', ''),
                        notes
                    ))

                conn.commit()

                return self.send_json(201, {
                    'message': 'Booking confirmed successfully',
                    'booking_id': booking_id,
                    'total_amount': total_amount,
                    'service_date': service_date,
                    'service_slot': service_slot
                })

            # POST /api/reviews
            elif path == '/api/reviews':
                booking_id = payload.get('booking_id')
                user_name = payload.get('user_name', 'Customer').strip()
                rating = int(payload.get('rating', 5))
                comment = payload.get('comment', '').strip()
                service_type = payload.get('service_type', 'Sofa Cleaning').strip()

                cursor = conn.cursor()
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

                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE bookings 
                    SET service_date = ?, service_slot = ?, updated_at = ?
                    WHERE UPPER(id) = UPPER(?)
                """, (new_date, new_slot, now, booking_id))
                conn.commit()
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
        print(f"🛋️ Siri Sofa Services Server running on http://localhost:{PORT}")
        print(f"📁 Serving static files from {FRONTEND_DIR}")
        print(f"🗄️ Database connected at {DB_PATH}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Siri Sofa Services server...")

if __name__ == '__main__':
    run_server()
