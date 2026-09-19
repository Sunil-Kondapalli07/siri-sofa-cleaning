import unittest
import os
import sys
import io
import json
import re
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import database
import server
import notifications
from rate_limiter import SlidingWindowRateLimiter

class MockSocket:
    def __init__(self, raw_input: bytes):
        self.rfile = io.BytesIO(raw_input)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        return self.wfile

class SecurityHardeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.test_db = os.path.join(cls.temp_dir.name, 'security_test.db')
        database.init_db(cls.test_db)
        server.get_connection = lambda: database.get_connection(cls.test_db)

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def invoke_api(self, method: str, path: str, body_dict: dict = None, headers_dict: dict = None):
        body_bytes = json.dumps(body_dict).encode('utf-8') if body_dict else b""
        raw_req = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\n"
        if headers_dict:
            for k, v in headers_dict.items():
                raw_req += f"{k}: {v}\r\n"
        if body_dict:
            raw_req += f"Content-Type: application/json\r\nContent-Length: {len(body_bytes)}\r\n"
        raw_req += "\r\n"
        raw_req_bytes = raw_req.encode('utf-8') + body_bytes

        mock_sock = MockSocket(raw_req_bytes)
        handler = server.SiriSofaHandler.__new__(server.SiriSofaHandler)
        handler.rfile = mock_sock.rfile
        handler.wfile = mock_sock.wfile
        handler.headers = {}
        handler.client_address = ('127.0.0.1', 54321)
        handler.close_connection = True
        handler.request_version = 'HTTP/1.1'
        handler.server_version = 'SiriSofa/1.0'
        handler.sys_version = 'Python/3.14'

        line = handler.rfile.readline().decode('utf-8')
        handler.requestline = line.strip()
        words = line.split()
        handler.command = words[0]
        handler.path = words[1]

        while True:
            hline = handler.rfile.readline().decode('utf-8')
            if hline in ('\r\n', '\n', ''):
                break
            if ':' in hline:
                k, v = hline.split(':', 1)
                handler.headers[k.strip()] = v.strip()

        handler.log_message = lambda format, *args: None

        if method == 'GET':
            handler.do_GET()
        elif method == 'POST':
            handler.do_POST()
        elif method == 'PUT':
            handler.do_PUT()

        raw_resp = mock_sock.wfile.getvalue().decode('utf-8', errors='replace')
        parts = raw_resp.split('\r\n\r\n', 1)
        headers_part = parts[0]
        body_part = parts[1] if len(parts) > 1 else ""

        status_line = headers_part.split('\r\n')[0]
        status_code = int(status_line.split()[1])
        json_data = json.loads(body_part) if body_part else {}
        return status_code, json_data

    # --- P0: Static Fallback Elimination ---
    def test_p0_static_fallback_completely_removed(self):
        legacy_api_js = os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_backup', 'frontend', 'js', 'api.js')
        web_api_ts = os.path.join(os.path.dirname(__file__), '..', '..', 'web', 'src', 'lib', 'api.ts')

        paths = [p for p in (legacy_api_js, web_api_ts) if os.path.exists(p)]
        self.assertTrue(len(paths) > 0, "api client must exist in web or legacy_backup")
        for path in paths:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.assertNotIn('handleStaticFallback', content, f"Insecure fallback detected in {path}")
            self.assertNotIn('siri_bookings', content, f"Insecure localStorage bookings detected in {path}")
            self.assertNotIn('password: body.password', content, f"Plaintext password storage in {path}")
            self.assertNotIn('github.io', content, f"Static hostname bypass detected in {path}")

    # --- P0: Challenge-Bound OTP Verification & HMAC Salt ---
    def test_p0_challenge_bound_otp_and_hmac_salting(self):
        phone = '+91 91000 22222'
        status, send_res = self.invoke_api('POST', '/api/auth/otp/send', {
            'target': phone,
            'type': 'mobile'
        })
        self.assertEqual(status, 200)
        self.assertIn('challenge_id', send_res)
        challenge_id = send_res['challenge_id']

        # Verify OTP is NOT in the response
        self.assertNotIn('dev_code', send_res)
        self.assertNotIn('otp_code', send_res)

        # Verify notification logs do NOT contain the plaintext OTP
        conn = database.get_connection(self.test_db)
        c = conn.cursor()
        c.execute("SELECT message FROM notifications_log WHERE recipient = ? ORDER BY id DESC LIMIT 1", (phone,))
        msg = c.fetchone()[0]
        self.assertIsNone(re.search(r'\b\d{6}\b', msg), "Plaintext OTP leaked into notifications_log!")

        # Verify challenge record stores HMAC hash, NOT plain code
        c.execute("SELECT otp_hash, otp_code FROM verification_otps WHERE challenge_id = ?", (challenge_id,))
        otp_row = c.fetchone()
        conn.close()
        self.assertIsNotNone(otp_row['otp_hash'])
        self.assertNotEqual(otp_row['otp_code'], notifications.get_test_last_dispatched(phone))

        real_code = notifications.get_test_last_dispatched(phone)

        # Attempt verification with tampered challenge ID -> Must reject
        status, bad_res = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': 'tampered_fake_challenge_123',
            'otp_code': real_code
        })
        self.assertEqual(status, 400)

        # Attempt verification with wrong code -> Must increment attempt count
        status, wrong_res = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': challenge_id,
            'otp_code': '000000'
        })
        self.assertEqual(status, 400)
        self.assertIn('attempts remaining', wrong_res['error'])

        # Successful verification using exact challenge_id + code
        status, ok_res = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': challenge_id,
            'otp_code': real_code
        })
        self.assertEqual(status, 200)
        self.assertTrue(ok_res['success'])

        # Re-use of verified challenge must fail
        status, reuse_res = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': challenge_id,
            'otp_code': real_code
        })
        self.assertEqual(status, 400)

    # --- P0: Strict RBAC Enforcement ---
    def test_p0_rbac_enforcement_on_all_admin_endpoints(self):
        # Register normal customer
        cust_email = "customer.rbac@test.com"
        status, reg = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Customer RBAC',
            'email': cust_email,
            'password': 'customerPassword123'
        })
        self.assertEqual(status, 201)
        cust_token = reg['token']
        cust_headers = {'Authorization': f'Bearer {cust_token}'}

        # 1. GET /api/analytics (Admin only)
        status, _ = self.invoke_api('GET', '/api/analytics', headers_dict=cust_headers)
        self.assertEqual(status, 403)
        status, _ = self.invoke_api('GET', '/api/analytics')
        self.assertEqual(status, 401)

        # 2. GET /api/technicians (Admin only)
        status, _ = self.invoke_api('GET', '/api/technicians', headers_dict=cust_headers)
        self.assertEqual(status, 403)
        status, _ = self.invoke_api('GET', '/api/technicians')
        self.assertEqual(status, 401)

        # 3. PUT /api/pricing (Admin only)
        status, _ = self.invoke_api('PUT', '/api/pricing', {'config': {'min_booking_amount': 200}}, headers_dict=cust_headers)
        self.assertEqual(status, 403)
        status, _ = self.invoke_api('PUT', '/api/pricing', {'config': {'min_booking_amount': 200}})
        self.assertEqual(status, 401)

        # 4. PUT /api/bookings/<id>/assign (Admin only)
        status, _ = self.invoke_api('PUT', '/api/bookings/SIRI-123456/assign', {'technician_id': 1}, headers_dict=cust_headers)
        self.assertEqual(status, 403)

        # 5. PUT /api/bookings/<id>/status (Admin only)
        status, _ = self.invoke_api('PUT', '/api/bookings/SIRI-123456/status', {'status': 'completed'}, headers_dict=cust_headers)
        self.assertEqual(status, 403)

    # --- P1: Atomic Slot Reservation & Concurrency Limit (Max 3) ---
    def test_p1_atomic_slot_reservation_limit(self):
        # Register a test customer
        status, reg = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Slot Tester',
            'email': 'slot.tester@test.com',
            'phone': '+91 99000 11111',
            'password': 'slotPassword123'
        })
        cust_token = reg['token']
        headers = {'Authorization': f'Bearer {cust_token}'}

        test_date = '2026-10-15'
        test_slot = '09:00 AM'
        booking_payload = {
            'service_date': test_date,
            'service_slot': test_slot,
            'address': {'house_flat': '401', 'street': 'Road 36', 'area': 'Jubilee Hills'},
            'items': [{'variant_id': 1, 'quantity': 1}]
        }

        # Booking 1 (Slot 1) -> Success
        status1, b1 = self.invoke_api('POST', '/api/bookings', booking_payload, headers_dict=headers)
        self.assertEqual(status1, 201)

        # Booking 2 (Slot 2) -> Success
        status2, b2 = self.invoke_api('POST', '/api/bookings', booking_payload, headers_dict=headers)
        self.assertEqual(status2, 201)

        # Booking 3 (Slot 3) -> Success
        status3, b3 = self.invoke_api('POST', '/api/bookings', booking_payload, headers_dict=headers)
        self.assertEqual(status3, 201)

        # Booking 4 (Exceeds capacity of 3) -> MUST FAIL WITH 409 Conflict
        status4, b4 = self.invoke_api('POST', '/api/bookings', booking_payload, headers_dict=headers)
        self.assertEqual(status4, 409)
        self.assertIn('fully booked', b4['error'])

        # Verify physical slot_reservations table contains exactly 3 entries for this date/slot
        conn = database.get_connection(self.test_db)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM slot_reservations WHERE service_date = ? AND service_slot = ?", (test_date, test_slot))
        count = c.fetchone()[0]
        self.assertEqual(count, 3)

        # Now cancel Booking 1 using Admin credentials
        status_login, admin_auth = self.invoke_api('POST', '/api/auth/login', {'email': 'admin@sirisofa.com', 'password': 'admin123'})
        admin_headers = {'Authorization': f"Bearer {admin_auth['token']}"}

        status_cancel, _ = self.invoke_api('PUT', f"/api/bookings/{b1['booking_id']}/status", {'status': 'cancelled'}, headers_dict=admin_headers)
        self.assertEqual(status_cancel, 200)

        # Check slot_reservations: freed up to 2
        c.execute("SELECT COUNT(*) FROM slot_reservations WHERE service_date = ? AND service_slot = ?", (test_date, test_slot))
        new_count = c.fetchone()[0]
        conn.close()
        self.assertEqual(new_count, 2)

        # Now 4th booking retry succeeds because slot was freed!
        status_retry, b_retry = self.invoke_api('POST', '/api/bookings', booking_payload, headers_dict=headers)
        self.assertEqual(status_retry, 201)

    # --- P1: Rate Limiter Unit Tests ---
    def test_p1_sliding_window_rate_limiter(self):
        lim = SlidingWindowRateLimiter()
        key = "test_user_rate"

        # 3 requests allowed in 10-second window
        for i in range(3):
            allowed, _ = lim.check(key, max_requests=3, window_seconds=10)
            self.assertTrue(allowed)

        # 4th request within window must be rejected
        allowed, retry_sec = lim.check(key, max_requests=3, window_seconds=10)
        self.assertFalse(allowed)
        self.assertGreater(retry_sec, 0)

        # Resetting key permits new request
        lim.reset(key)
        allowed, _ = lim.check(key, max_requests=3, window_seconds=10)
        self.assertTrue(allowed)

    # --- P1: Review Protection (Completed Only, One per Booking, IDOR Protected) ---
    def test_p1_review_anti_fraud_protections(self):
        # Create a booking
        status, reg = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Reviewer',
            'email': 'reviewer@test.com',
            'phone': '+91 99000 33333',
            'password': 'reviewerPass123'
        })
        cust_token = reg['token']
        headers = {'Authorization': f'Bearer {cust_token}'}

        status_b, b_res = self.invoke_api('POST', '/api/bookings', {
            'service_date': '2026-11-01',
            'service_slot': '11:00 AM',
            'address': {'house_flat': '101', 'street': 'Road 1', 'area': 'Banjara Hills'},
            'items': [{'variant_id': 1, 'quantity': 1}]
        }, headers_dict=headers)
        self.assertEqual(status_b, 201)
        booking_id = b_res['booking_id']

        # Attempt review while booking is status 'received' -> Must fail with 400
        status_r1, err1 = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 5,
            'comment': 'Premature review attempt'
        }, headers_dict=headers)
        self.assertEqual(status_r1, 400)
        self.assertIn('completed', err1['error'])

        # Another customer tries to review this booking -> Must fail with 403 Access Denied
        status, reg2 = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Impostor',
            'email': 'impostor@test.com',
            'password': 'impostorPass123'
        })
        impostor_headers = {'Authorization': f"Bearer {reg2['token']}"}
        status_idor, err_idor = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 5,
            'comment': 'IDOR review attempt'
        }, headers_dict=impostor_headers)
        self.assertEqual(status_idor, 403)

        # Mark booking completed as Admin
        status_login, admin_auth = self.invoke_api('POST', '/api/auth/login', {'email': 'admin@sirisofa.com', 'password': 'admin123'})
        admin_headers = {'Authorization': f"Bearer {admin_auth['token']}"}
        self.invoke_api('PUT', f"/api/bookings/{booking_id}/status", {'status': 'completed'}, headers_dict=admin_headers)

        # Now legitimate customer submits review -> Success
        status_ok, res_ok = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 5,
            'comment': 'Exceptional cleaning of our velvet sofa!'
        }, headers_dict=headers)
        self.assertEqual(status_ok, 201)

        # Submitting second review for same booking -> Must fail (one review per booking constraint)
        status_dup, err_dup = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 4,
            'comment': 'Trying duplicate review'
        }, headers_dict=headers)
        self.assertEqual(status_dup, 400)
        self.assertIn('already been submitted', err_dup['error'])

if __name__ == '__main__':
    unittest.main()
