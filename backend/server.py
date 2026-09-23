import http.server
import socketserver
import json
import os
import mimetypes
import socket
import sys
import ssl
import urllib.parse
import urllib.request
import subprocess
import shutil
import time
import sqlite3
import random
import re
import string
import secrets
import hmac
from datetime import datetime, date, timedelta
from qrcodegen import QrCode

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

def _curl_config_value(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\r", "\\r").replace("\n", "\\n")

def razorpay_request_json(
    method: str,
    url: str,
    key_id: str,
    key_secret: str,
    payload: dict | None = None,
    timeout_seconds: int = 20,
) -> tuple[int, dict]:
    """Call Razorpay using a system HTTPS client while retaining certificate verification.

    The working Rice-business application uses Node's native fetch(). On this machine,
    Python's OpenSSL trust store rejects a trusted/self-installed network certificate.
    curl can use the operating system trust configuration while still verifying TLS.
    Secrets are passed through curl's config on stdin, never as command-line arguments.
    """
    config_lines = [
        'url = "' + _curl_config_value(url) + '"',
        'request = "' + _curl_config_value(method.upper()) + '"',
        'silent',
        'show-error',
        'location',
        'proto = "https"',
        f'max-time = {int(timeout_seconds)}',
        'user-agent = "SiriSofaServices/1.0"',
        'user = "' + _curl_config_value(f"{key_id}:{key_secret}") + '"',
        'header = "Accept: application/json"',
    ]
    if payload is not None:
        body = json.dumps(payload, separators=(",", ":"))
        config_lines.extend([
            'header = "Content-Type: application/json"',
            'data = "' + _curl_config_value(body) + '"',
        ])
    config_lines.append('write-out = "\\n%{http_code}"')
    config = "\n".join(config_lines) + "\n"

    curl_bin = os.environ.get("RAZORPAY_CURL_BIN", "").strip()
    if not curl_bin:
        if sys.platform == "darwin" and os.path.exists("/usr/bin/curl"):
            curl_bin = "/usr/bin/curl"
        else:
            curl_bin = shutil.which("curl") or "curl"

    try:
        proc = subprocess.run(
            [curl_bin, "--config", "-"],
            input=config.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout_seconds + 5,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("The backend requires curl for the Razorpay HTTPS connection. Install curl or use a standard system Python certificate store.") from exc
    except subprocess.TimeoutExpired as exc:
        raise TimeoutError("Razorpay API request timed out from the backend.") from exc

    raw = proc.stdout.decode("utf-8", errors="replace")
    match = re.search(r"\n(\d{3})\s*$", raw)
    if not match:
        detail = proc.stderr.decode("utf-8", errors="replace").strip() or "no HTTP response"
        raise RuntimeError(f"Razorpay API connection failed: {detail}")

    status_code = int(match.group(1))
    body = raw[:match.start()].strip()
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        raise RuntimeError(f"Razorpay returned a non-JSON response (HTTP {status_code}).")

    return status_code, data

def create_razorpay_ssl_context() -> ssl.SSLContext:
    """Build a verified TLS context using an explicit CA bundle when configured."""
    configured_bundle = (
        os.environ.get("RAZORPAY_CA_BUNDLE", "").strip()
        or os.environ.get("SSL_CERT_FILE", "").strip()
    )
    if configured_bundle:
        if not os.path.isfile(configured_bundle):
            raise RuntimeError(
                f"Configured Razorpay CA bundle was not found: {configured_bundle}"
            )
        return ssl.create_default_context(cafile=configured_bundle)

    # Python's official macOS installer provides certifi through its
    # Install Certificates.command workflow. Prefer it when installed.
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()

def test_upi_qr_data_url(amount_paise: int, booking_id: str) -> str:
    """Generate a visible Test Mode UPI QR without creating a live/test Razorpay resource.

    Razorpay's sandbox simulates UPI inside Checkout; it does not make this QR
    payload a real bank transaction. The payload is intentionally labeled as test data.
    """
    if amount_paise < 100:
        raise ValueError("Payment amount must be at least ₹1")
    query = urllib.parse.urlencode({
        "pa": "success@razorpay",
        "pn": "Siri Sofa Services TEST",
        "am": f"{amount_paise / 100:.2f}",
        "cu": "INR",
        "tn": f"TEST {booking_id}",
    })
    return razorpay_payment_link_qr_data_url(f"upi://pay?{query}")

def razorpay_payment_link_qr_data_url(payment_url: str) -> str:
    """Generate a QR image locally from a Razorpay hosted Payment Link.

    No QR package or external QR service is used at runtime. The payload is only
    the Razorpay short URL, so scanning opens Razorpay's hosted payment page.
    """
    if not payment_url or not payment_url.startswith(("https://", "http://")):
        raise ValueError("Invalid Razorpay payment URL")
    qr = QrCode.encode_text(payment_url, QrCode.Ecc.MEDIUM)
    border = 4
    scale = 8
    size = qr.get_size()
    viewbox = size + border * 2
    paths = []
    for y in range(size):
        run_start = None
        for x in range(size + 1):
            dark = x < size and qr.get_module(x, y)
            if dark and run_start is None:
                run_start = x
            elif not dark and run_start is not None:
                paths.append(f"M{run_start + border},{y + border}h{x - run_start}v1h-{x - run_start}z")
                run_start = None
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {viewbox} {viewbox}" '
        f'width="{viewbox * scale}" height="{viewbox * scale}" shape-rendering="crispEdges">'
        f'<rect width="100%" height="100%" fill="white"/>'
        f'<path d="{" ".join(paths)}" fill="black"/>'
        f'</svg>'
    )
    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg, safe="")

def create_razorpay_order(key_id: str, key_secret: str, amount_paise: int, receipt: str) -> dict:
    """Create a Razorpay order with server-only credentials."""
    if not key_id or not key_secret:
        raise RuntimeError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required")
    if not isinstance(amount_paise, int) or amount_paise < 100:
        raise ValueError("Payment amount must be at least ₹1")

    status_code, data = razorpay_request_json(
        "POST",
        "https://api.razorpay.com/v1/orders",
        key_id,
        key_secret,
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
        },
    )

    if status_code < 200 or status_code >= 300:
        provider_error = data.get("error") or {}
        description = (
            provider_error.get("description")
            or provider_error.get("reason")
            or f"Razorpay returned HTTP {status_code}"
        )
        raise RuntimeError(f"Razorpay order creation failed: {description}")

    order_id = str(data.get("id") or "").strip()
    if not order_id.startswith("order_"):
        raise RuntimeError("Razorpay returned an invalid order response.")

    returned_amount = int(data.get("amount") or 0)
    if returned_amount != amount_paise:
        raise RuntimeError("Razorpay order amount did not match the server-calculated booking total.")

    return data

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

            # GET /api/location/reverse?lat=<latitude>&lon=<longitude>
            elif path == '/api/location/reverse':
                try:
                    latitude = float(query.get('lat', [''])[0])
                    longitude = float(query.get('lon', [''])[0])
                except (TypeError, ValueError):
                    return self.send_json(400, {'error': 'Valid latitude and longitude are required'})

                if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                    return self.send_json(400, {'error': 'Invalid latitude or longitude'})

                try:
                    import urllib.request
                    reverse_url = (
                        "https://nominatim.openstreetmap.org/reverse"
                        f"?format=jsonv2&lat={urllib.parse.quote(str(latitude))}"
                        f"&lon={urllib.parse.quote(str(longitude))}&zoom=18&addressdetails=1"
                    )
                    req = urllib.request.Request(
                        reverse_url,
                        headers={
                            'Accept': 'application/json',
                            'User-Agent': 'SiriSofaServices/1.0 (customer-location)'
                        }
                    )
                    with urllib.request.urlopen(req, timeout=8) as resp:
                        data = json.loads(resp.read().decode('utf-8'))
                    address = data.get('address') or {}
                    return self.send_json(200, {
                        'success': True,
                        'display_name': data.get('display_name') or '',
                        'house_flat': address.get('house_number') or '',
                        'street': address.get('road') or address.get('neighbourhood') or '',
                        'area': (
                            address.get('suburb')
                            or address.get('neighbourhood')
                            or address.get('city_district')
                            or address.get('city')
                            or address.get('town')
                            or ''
                        ),
                        'city': address.get('city') or address.get('town') or address.get('village') or '',
                        'pincode': address.get('postcode') or ''
                    })
                except Exception:
                    return self.send_json(502, {
                        'success': False,
                        'error': 'Location captured, but address lookup is temporarily unavailable.'
                    })

            # GET /api/payments/razorpay/status?booking_id=<id>
            elif path == '/api/payments/razorpay/status':
                caller = self.get_authenticated_user(conn)
                if not caller:
                    return self.send_json(401, {'error': 'Authentication required'})

                booking_id = str(query.get('booking_id', [''])[0]).strip()
                if not booking_id:
                    return self.send_json(400, {'error': 'booking_id is required'})

                cursor = conn.cursor()
                cursor.execute("SELECT * FROM bookings WHERE id=?", (booking_id,))
                booking = cursor.fetchone()
                if not booking:
                    return self.send_json(404, {'error': 'Booking not found'})
                if caller['role'] != 'admin' and str(booking['user_id']) != str(caller['id']):
                    return self.send_json(403, {'error': 'Access denied'})

                current_status = str(booking['payment_status'] or 'pending').lower()
                if current_status == 'paid':
                    return self.send_json(200, {'success': True, 'payment_status': 'paid', 'booking_id': booking_id})

                key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
                order_id = str(booking['payment_gateway_order_id'] or '').strip()
                link_id = str(booking['payment_gateway_link_id'] or '').strip()

                if not key_id or not key_secret or (not order_id and not link_id):
                    return self.send_json(200, {'success': True, 'payment_status': current_status, 'booking_id': booking_id})

                amount_paise = int(round(float(booking['total_amount']) * 100))

                # Payment-link QR fallback: Razorpay returns the captured payment
                # inside the Payment Link resource itself.
                if link_id and not order_id:
                    try:
                        link_status, link_data = razorpay_request_json(
                            "GET",
                            f"https://api.razorpay.com/v1/payment_links/{urllib.parse.quote(link_id, safe='')}",
                            key_id,
                            key_secret,
                        )
                    except (RuntimeError, TimeoutError) as exc:
                        return self.send_json(502, {'error': str(exc)})

                    if link_status < 200 or link_status >= 300:
                        return self.send_json(502, {'error': 'Razorpay could not return the payment-link status.'})

                    link_payments = link_data.get('payments') if isinstance(link_data.get('payments'), list) else []
                    captured = next(
                        (
                            p for p in link_payments
                            if p.get('status') == 'captured'
                            and int(p.get('amount') or 0) == amount_paise
                            and p.get('currency') == 'INR'
                        ),
                        None
                    )
                    if captured or link_data.get('status') == 'paid':
                        payment_id = captured.get('id') if captured else None
                        cursor.execute(
                            "UPDATE bookings SET payment_status='paid', payment_gateway_payment_id=?, updated_at=? WHERE id=?",
                            (payment_id, now, booking_id)
                        )
                        cursor.execute(
                            "UPDATE payments SET payment_id=?, method=?, status='paid', raw_response=?, updated_at=? WHERE booking_id=?",
                            (payment_id, captured.get('method') if captured else 'upi', json.dumps(captured or link_data), now, booking_id)
                        )
                        conn.commit()
                        return self.send_json(200, {
                            'success': True,
                            'payment_status': 'paid',
                            'payment_id': payment_id,
                            'payment_method': captured.get('method') if captured else 'upi',
                            'booking_id': booking_id
                        })

                    link_state = str(link_data.get('status') or '').lower()
                    return self.send_json(200, {
                        'success': True,
                        'payment_status': 'failed' if link_state in ('expired', 'cancelled') else 'pending',
                        'booking_id': booking_id
                    })

                try:
                    status_code, gateway = razorpay_request_json(
                        "GET",
                        f"https://api.razorpay.com/v1/orders/{urllib.parse.quote(order_id, safe='')}/payments",
                        key_id,
                        key_secret,
                    )
                except (RuntimeError, TimeoutError) as exc:
                    return self.send_json(502, {'error': str(exc)})

                if status_code < 200 or status_code >= 300:
                    return self.send_json(502, {'error': 'Razorpay could not return the payment status.'})

                payments = gateway.get('items') if isinstance(gateway.get('items'), list) else []
                captured = next(
                    (
                        p for p in payments
                        if p.get('status') == 'captured'
                        and p.get('order_id') == order_id
                        and int(p.get('amount') or 0) == amount_paise
                        and p.get('currency') == 'INR'
                    ),
                    None
                )
                if captured:
                    cursor.execute(
                        "UPDATE bookings SET payment_status='paid', payment_gateway_payment_id=?, updated_at=? WHERE id=?",
                        (captured.get('id'), now, booking_id)
                    )
                    cursor.execute(
                        "UPDATE payments SET payment_id=?, method=?, status='paid', raw_response=?, updated_at=? WHERE booking_id=?",
                        (captured.get('id'), captured.get('method'), json.dumps(captured), now, booking_id)
                    )
                    conn.commit()
                    return self.send_json(200, {
                        'success': True,
                        'payment_status': 'paid',
                        'payment_id': captured.get('id'),
                        'payment_method': captured.get('method'),
                        'booking_id': booking_id
                    })

                failed = any(
                    p.get('status') == 'failed'
                    and p.get('order_id') == order_id
                    and int(p.get('amount') or 0) == amount_paise
                    for p in payments
                )
                return self.send_json(200, {
                    'success': True,
                    'payment_status': 'failed' if failed else 'pending',
                    'booking_id': booking_id
                })

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

            # POST /api/auth/meta
            elif path == '/api/auth/meta':
                access_token = payload.get('access_token', '').strip()
                if not access_token:
                    return self.send_json(400, {'error': 'Meta access token is required'})
                app_id = os.environ.get('META_APP_ID', '').strip()
                app_secret = os.environ.get('META_APP_SECRET', '').strip()
                if not app_id or not app_secret:
                    return self.send_json(503, {'error': 'Meta authentication is not configured on this server'})
                try:
                    app_token = f"{app_id}|{app_secret}"
                    debug_url = "https://graph.facebook.com/debug_token?" + urllib.parse.urlencode({'input_token': access_token, 'access_token': app_token})
                    with urllib.request.urlopen(debug_url, timeout=8) as resp:
                        debug = json.loads(resp.read().decode()).get('data', {})
                    if debug.get('is_valid') is not True or str(debug.get('app_id')) != app_id:
                        return self.send_json(401, {'error': 'Meta token verification rejected'})
                    user_url = "https://graph.facebook.com/me?" + urllib.parse.urlencode({'fields': 'id,name,email,picture.type(large)', 'access_token': access_token})
                    with urllib.request.urlopen(user_url, timeout=8) as resp:
                        profile = json.loads(resp.read().decode())
                    email = (profile.get('email') or '').strip().lower()
                    meta_id = str(profile.get('id') or '')
                    name = (profile.get('name') or 'Customer').strip()
                    avatar_url = (((profile.get('picture') or {}).get('data') or {}).get('url') or '').strip()
                    if not meta_id or not email:
                        return self.send_json(400, {'error': 'Meta account must provide an email address'})
                except Exception:
                    return self.send_json(401, {'error': 'Meta authentication failed'})
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE LOWER(email)=?", (email,))
                user = cursor.fetchone()
                if not user:
                    pw_hash = hash_password(secrets.token_urlsafe(32))
                    cursor.execute("""INSERT INTO users
                        (name,email,phone,password_hash,role,is_email_verified,is_mobile_verified,meta_id,avatar_url,created_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?)""",
                        (name,email,'',pw_hash,'customer',1,0,meta_id,avatar_url,now))
                    conn.commit()
                    user = cursor.execute("SELECT * FROM users WHERE id=?", (cursor.lastrowid,)).fetchone()
                else:
                    cursor.execute("UPDATE users SET meta_id=?, avatar_url=COALESCE(?,avatar_url), is_email_verified=1 WHERE id=?",
                                   (meta_id, avatar_url or None, user['id']))
                    conn.commit()
                    user = cursor.execute("SELECT * FROM users WHERE id=?", (user['id'],)).fetchone()
                token = create_user_session(conn, user['id'], user['role'], ip_addr, self.headers.get('User-Agent'))
                return self.send_json(200, {'success': True, 'token': token, 'user': dict(user)})

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
                response_data = {
                    'success': True,
                    'user': u_dict,
                    'token': token,
                    'requires_verification': True,
                    'mobile_delivered': m_delivered,
                    'email_delivered': e_delivered,
                    'mobile_challenge_id': m_challenge,
                    'email_challenge_id': e_challenge,
                    'message': 'Account created! Verification codes sent to your mobile and email.'
                }

                # Local/QA-only helper. OTPs are returned only when explicitly
                # enabled OR when the request is demonstrably local (localhost/loopback).
                # This keeps production deployments from exposing verification codes.
                test_mode_enabled = os.environ.get('SIRI_TEST_MODE', '').strip().lower() in ('1', 'true', 'yes')
                origin = self.headers.get('Origin', '')
                host = self.headers.get('Host', '')
                local_request = (
                    origin.startswith('http://localhost:')
                    or origin.startswith('http://127.0.0.1:')
                    or host.startswith('localhost:')
                    or host.startswith('127.0.0.1:')
                    or host == 'localhost'
                    or host == '127.0.0.1'
                )
                if test_mode_enabled or local_request:
                    response_data['test_mode'] = True
                    response_data['test_mobile_otp'] = m_code if m_challenge else None
                    response_data['test_email_otp'] = e_code

                return self.send_json(201, response_data)

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
                payment_method = str(payload.get('payment_method', 'cod')).lower().strip()
                if payment_method not in ('cod', 'razorpay', 'upi_qr'):
                    return self.send_json(400, {'error': 'Invalid payment method'})
                payment_status = 'pending'

                if not name or not phone or not service_date or not service_slot or not items:
                    return self.send_json(400, {'error': 'Missing required booking details'})
                if not validate_service_slot(service_date, service_slot):
                    return self.send_json(400, {'error': 'Invalid or unavailable service date/time slot'})
                normalized_phone = normalize_phone(phone)
                if len(normalized_phone) != 10 or not normalized_phone.isdigit() or normalized_phone[0] not in '6789':
                    return self.send_json(400, {'error': 'Enter a valid 10-digit Indian mobile number'})
                phone = normalized_phone

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
                            coupon_code, total_amount, payment_method, payment_status, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        booking_id, user_id, name, email, phone, json.dumps(address_data),
                        service_date, service_slot, subtotal, service_charge, tax, discount,
                        coupon_code, total_amount, payment_method, payment_status, notes, now, now
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
                if str(booking['payment_status'] or '').lower() == 'paid':
                    return self.send_json(409, {'error': 'This booking is already paid.'})

                key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
                if not key_id or not key_secret:
                    return self.send_json(503, {
                        'error': 'Online payment is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET; Cash on Delivery remains available.'
                    })

                amount_paise = int(round(float(booking['total_amount']) * 100))
                try:
                    order = create_razorpay_order(key_id, key_secret, amount_paise, booking_id)
                except ValueError as exc:
                    return self.send_json(400, {'error': str(exc)})
                except RuntimeError as exc:
                    message = str(exc)
                    status = 502
                    if message.startswith("Online payment is not configured"):
                        status = 503
                    elif "DNS could not resolve" in message:
                        status = 502
                    elif "timed out" in message.lower():
                        status = 504
                    return self.send_json(status, {'error': message})

                order_id = str(order.get('id')).strip()
                cursor.execute(
                    "UPDATE bookings SET payment_method='razorpay', payment_gateway_order_id=?, payment_status='created', updated_at=? WHERE id=?",
                    (order_id, now, booking_id)
                )
                cursor.execute(
                    """INSERT INTO payments(booking_id,provider,order_id,amount,currency,status,created_at,updated_at)
                       VALUES(?,?,?,?,?,?,?,?)
                       ON CONFLICT(booking_id) DO UPDATE SET
                         order_id=excluded.order_id,
                         amount=excluded.amount,
                         currency=excluded.currency,
                         status='created',
                         updated_at=excluded.updated_at""",
                    (booking_id, 'razorpay', order_id, float(booking['total_amount']), 'INR', 'created', now, now)
                )
                conn.commit()
                return self.send_json(200, {
                    'success': True,
                    'key_id': key_id,
                    'order_id': order_id,
                    'amount': amount_paise,
                    'currency': 'INR',
                    'booking_id': booking_id
                })

            # POST /api/payments/razorpay/qr
            elif path == '/api/payments/razorpay/qr':
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
                if str(booking['payment_status'] or '').lower() == 'paid':
                    return self.send_json(409, {'error': 'This booking is already paid.'})

                key_id = os.environ.get('RAZORPAY_KEY_ID', '').strip()
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
                if not key_id or not key_secret:
                    return self.send_json(503, {'error': 'Razorpay is not configured on the server.'})

                amount_paise = int(round(float(booking['total_amount']) * 100))
                existing_link = str(booking['payment_gateway_link_id'] or '').strip()

                # Razorpay Test Mode does not create UPI Payment Links for real QR payments.
                # Still render a deterministic local QR so QA can verify QR generation,
                # exact amount encoding and scanner recognition without charging money.
                if key_id.startswith('rzp_test_'):
                    try:
                        image_url = test_upi_qr_data_url(amount_paise, booking_id)
                    except Exception as exc:
                        return self.send_json(502, {'error': f'Could not generate the Test UPI QR locally: {exc}'})
                    return self.send_json(200, {
                        'success': True,
                        'qr_id': f'test_{booking_id}',
                        'image_url': image_url,
                        'payment_url': None,
                        'amount': amount_paise,
                        'currency': 'INR',
                        'booking_id': booking_id,
                        'qr_source': 'razorpay_test_upi_qr',
                        'test_mode': True,
                        'payment_status': 'simulation_only',
                    })

                try:
                    # QR checkout for Siri Sofa is backed by a Razorpay Payment Link.
                    # This deliberately avoids the Razorpay Dynamic QR API because
                    # that API returns HTTP 404 for the current merchant/test setup.
                    if existing_link:
                        link_status, link_data = razorpay_request_json(
                            "GET",
                            f"https://api.razorpay.com/v1/payment_links/{urllib.parse.quote(existing_link, safe='')}",
                            key_id,
                            key_secret,
                        )
                        if 200 <= link_status < 300:
                            existing_short_url = str(link_data.get('short_url') or '').strip()
                            existing_state = str(link_data.get('status') or '').lower()
                            existing_amount = int(link_data.get('amount') or 0)
                            if (
                                existing_short_url
                                and existing_state in ('created', 'partially_paid')
                                and existing_amount == amount_paise
                            ):
                                image_url = razorpay_payment_link_qr_data_url(existing_short_url)
                                return self.send_json(200, {
                                    'success': True,
                                    'qr_id': existing_link,
                                    'image_url': image_url,
                                    'payment_url': existing_short_url,
                                    'amount': amount_paise,
                                    'currency': 'INR',
                                    'booking_id': booking_id,
                                    'qr_source': 'razorpay_upi_payment_link'
                                })

                    link_status, link_data = razorpay_request_json(
                        "POST",
                        "https://api.razorpay.com/v1/payment_links",
                        key_id,
                        key_secret,
                        {
                            "amount": amount_paise,
                            "currency": "INR",
                            "upi_link": True,
                            "accept_partial": False,
                            "reference_id": booking_id,
                            "description": f"Siri Sofa Services booking {booking_id}",
                            "customer": {
                                "name": str(booking['customer_name'] or booking['name'] or 'Siri Sofa Customer'),
                                "email": str(booking['customer_email'] or booking['email'] or ''),
                                "contact": str(booking['customer_phone'] or booking['phone'] or ''),
                            },
                            "notify": {"sms": False, "email": False},
                            "reminder_enable": False,
                            "expire_by": int(time.time()) + 1800,
                            "notes": {
                                "booking_id": booking_id,
                                "source": "siri-sofa-upi-qr",
                            },
                        },
                    )
                except (RuntimeError, TimeoutError) as exc:
                    return self.send_json(502, {'error': str(exc)})

                if 200 <= link_status < 300:
                    link_id = str(link_data.get('id') or '').strip()
                    short_url = str(link_data.get('short_url') or '').strip()
                    returned_amount = int(link_data.get('amount') or 0)

                    if not link_id or not short_url:
                        return self.send_json(502, {
                            'error': 'Razorpay created the Payment Link but did not return its URL.'
                        })
                    if returned_amount != amount_paise:
                        return self.send_json(502, {
                            'error': 'Razorpay Payment Link amount did not match the booking amount.'
                        })

                    try:
                        image_url = razorpay_payment_link_qr_data_url(short_url)
                    except Exception as exc:
                        return self.send_json(502, {'error': f'Could not generate the UPI QR locally: {exc}'})

                    cursor.execute(
                        "UPDATE bookings SET payment_method='upi_qr', payment_status='created', payment_gateway_link_id=?, updated_at=? WHERE id=?",
                        (link_id, now, booking_id)
                    )
                    cursor.execute(
                        "UPDATE payments SET status='created', order_id=?, amount=?, currency='INR', raw_response=?, updated_at=? WHERE booking_id=?",
                        (link_id, float(booking['total_amount']), 'INR', json.dumps(link_data), now, booking_id)
                    )
                    conn.commit()

                    return self.send_json(200, {
                        'success': True,
                        'qr_id': link_id,
                        'image_url': image_url,
                        'payment_url': short_url,
                        'amount': amount_paise,
                        'currency': 'INR',
                        'booking_id': booking_id,
                        'qr_source': 'razorpay_upi_payment_link'
                    })

                provider_error = link_data.get('error') if isinstance(link_data, dict) else {}
                description = (
                    provider_error.get('description')
                    or provider_error.get('reason')
                    or f'Razorpay Payment Link creation returned HTTP {link_status}'
                )
                return self.send_json(502, {
                    'error': f'Razorpay UPI Payment Link could not be created: {description}'
                })

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
                key_id = os.environ.get('RAZORPAY_KEY_ID','').strip()
                key_secret = os.environ.get('RAZORPAY_KEY_SECRET','').strip()
                if not key_id or not key_secret:
                    return self.send_json(503, {'error':'Razorpay is not configured'})
                expected = hmac.new(key_secret.encode(), f"{order_id}|{payment_id}".encode(), __import__('hashlib').sha256).hexdigest()
                if not hmac.compare_digest(expected, signature):
                    return self.send_json(400, {'error':'Invalid payment signature'})

                status_code, gateway_payment = razorpay_request_json(
                    "GET",
                    f"https://api.razorpay.com/v1/payments/{urllib.parse.quote(payment_id, safe='')}",
                    key_id=key_id,
                    key_secret=key_secret,
                )
                if status_code < 200 or status_code >= 300:
                    return self.send_json(502, {'error':'Razorpay could not confirm the payment record.'})
                if gateway_payment.get('order_id') != order_id:
                    return self.send_json(400, {'error':'Razorpay payment order mismatch.'})
                if gateway_payment.get('status') != 'captured':
                    return self.send_json(400, {'error':'Payment has not been captured by Razorpay.'})
                if int(gateway_payment.get('amount') or 0) != int(round(float(booking['total_amount']) * 100)):
                    return self.send_json(400, {'error':'Payment amount does not match the booking total.'})
                if gateway_payment.get('currency') != 'INR':
                    return self.send_json(400, {'error':'Payment currency mismatch.'})

                cursor.execute("UPDATE bookings SET payment_status='paid', payment_gateway_payment_id=?, updated_at=? WHERE id=?",(payment_id,now,booking_id))
                cursor.execute("UPDATE payments SET payment_id=?,method=?,status='paid',raw_response=?,updated_at=? WHERE booking_id=?",
                               (payment_id, gateway_payment.get('method'), json.dumps(gateway_payment), now, booking_id))
                conn.commit()
                return self.send_json(200, {'success':True,'payment_status':'paid','booking_id':booking_id,'payment_method':gateway_payment.get('method')})

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
                    cursor.execute("SELECT total_amount FROM bookings WHERE payment_gateway_order_id=?", (order_id,))
                    matched_booking = cursor.fetchone()
                    if event == 'payment.captured' and matched_booking:
                        expected_amount = int(round(float(matched_booking['total_amount']) * 100))
                        actual_amount = int(entity.get('amount') or 0)
                        if actual_amount != expected_amount or entity.get('currency') != 'INR':
                            return self.send_json(400, {'error': 'Payment amount or currency mismatch'})
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
        except Exception as handler_error:
            # Never let an unexpected API exception become an HTML 500 response.
            # Returning JSON makes the real server-side failure visible to the frontend.
            error_type = type(handler_error).__name__
            error_message = str(handler_error).strip() or "unexpected backend error"
            return self.send_json(500, {
                'error': f'Backend exception ({error_type}): {error_message}'
            })
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
