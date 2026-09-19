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

class MockSocket:
    def __init__(self, raw_input: bytes):
        self.rfile = io.BytesIO(raw_input)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        return self.wfile

class DirectHandlerTest(unittest.TestCase):
    cust_token = None
    admin_token = None
    created_booking_id = None

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.test_db = os.path.join(cls.temp_dir.name, 'api_test.db')
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

        # Read line
        line = handler.rfile.readline().decode('utf-8')
        handler.requestline = line.strip()
        words = line.split()
        handler.command = words[0]
        handler.path = words[1]

        # Parse headers
        while True:
            hline = handler.rfile.readline().decode('utf-8')
            if hline in ('\r\n', '\n', ''):
                break
            if ':' in hline:
                k, v = hline.split(':', 1)
                handler.headers[k.strip()] = v.strip()

        # Suppress log output during tests
        handler.log_message = lambda format, *args: None

        # Dispatch
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

    def test_01_get_services(self):
        status, body = self.invoke_api('GET', '/api/services')
        self.assertEqual(status, 200)
        self.assertIn('services', body)
        self.assertGreaterEqual(len(body['services']), 4)
        first_service = body['services'][0]
        self.assertIn('variants', first_service)
        self.assertGreaterEqual(len(first_service['variants']), 1)

    def test_02_auth_customer_and_admin(self):
        # Register a new customer
        status, body = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Sunil Kumar',
            'email': 'sunil@example.com',
            'phone': '+91 98765 43210',
            'password': 'sunilpassword123'
        })
        self.assertEqual(status, 201)
        self.assertEqual(body['user']['role'], 'customer')
        self.assertIsNotNone(body['token'])
        # Ensure dev codes are NOT leaked in response
        self.assertNotIn('dev_mobile_code', body)
        self.assertNotIn('dev_email_code', body)

        # Test login
        status, l_body = self.invoke_api('POST', '/api/auth/login', {
            'email': 'sunil@example.com',
            'password': 'sunilpassword123'
        })
        self.assertEqual(status, 200)
        self.assertEqual(l_body['user']['role'], 'customer')
        self.assertEqual(l_body['user']['name'], 'Sunil Kumar')
        self.assertIsNotNone(l_body['token'])
        DirectHandlerTest.cust_token = l_body['token']

        # Test admin login
        status, a_body = self.invoke_api('POST', '/api/auth/login', {
            'email': 'admin@sirisofa.com',
            'password': 'admin123'
        })
        self.assertEqual(status, 200)
        self.assertEqual(a_body['user']['role'], 'admin')
        self.assertIsNotNone(a_body['token'])
        DirectHandlerTest.admin_token = a_body['token']

    def test_02b_auth_register(self):
        test_email = 'priya.sharma@example.com'
        test_phone = '+91 99887 76655'
        status, body = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Priya Sharma',
            'email': test_email,
            'phone': test_phone,
            'password': 'password123'
        })
        self.assertEqual(status, 201)
        self.assertIn('user', body)
        self.assertEqual(body['user']['name'], 'Priya Sharma')
        self.assertEqual(body['user']['email'], test_email)
        self.assertEqual(body['user']['role'], 'customer')
        self.assertTrue(body.get('requires_verification'))
        # Crucial security check: OTP plaintext MUST NOT be returned in API response
        self.assertNotIn('dev_mobile_code', body)
        self.assertNotIn('dev_email_code', body)
        self.assertIn('mobile_challenge_id', body)
        self.assertIn('email_challenge_id', body)

        # Check notifications_log to ensure PLAINTEXT OTP IS REDACTED from logs
        conn = database.get_connection(self.test_db)
        c = conn.cursor()
        c.execute("SELECT message FROM notifications_log WHERE recipient = ? ORDER BY id DESC LIMIT 1", (test_phone,))
        m_msg = c.fetchone()[0]
        self.assertIsNone(re.search(r'\b\d{6}\b', m_msg), "Security failure: OTP must not be logged in notifications_log")

        c.execute("SELECT message FROM notifications_log WHERE recipient = ? ORDER BY id DESC LIMIT 1", (test_email,))
        e_msg = c.fetchone()[0]
        self.assertIsNone(re.search(r'\b\d{6}\b', e_msg), "Security failure: OTP must not be logged in notifications_log")
        conn.close()

        # Retrieve test dispatched code from secure test memory hook
        mobile_otp = notifications.get_test_last_dispatched(test_phone)
        email_otp = notifications.get_test_last_dispatched(test_email)
        self.assertTrue(len(mobile_otp) == 6)
        self.assertTrue(len(email_otp) == 6)

        # Verify Mobile OTP using challenge_id
        status_m, res_m = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': body['mobile_challenge_id'],
            'otp_code': mobile_otp
        })
        self.assertEqual(status_m, 200)
        self.assertTrue(res_m['success'])

        # Verify Email OTP using challenge_id
        status_e, res_e = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': body['email_challenge_id'],
            'otp_code': email_otp
        })
        self.assertEqual(status_e, 200)
        self.assertTrue(res_e['success'])

        # Verify database user record now reflects both verified
        conn = database.get_connection(self.test_db)
        c = conn.cursor()
        c.execute("SELECT is_mobile_verified, is_email_verified FROM users WHERE id = ?", (body['user']['id'],))
        row = c.fetchone()
        conn.close()
        self.assertEqual(row[0], 1)
        self.assertEqual(row[1], 1)

        # Test duplicate registration rejection
        status, err_body = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Priya Duplicate',
            'email': test_email,
            'phone': test_phone,
            'password': 'password123'
        })
        self.assertEqual(status, 400)
        self.assertIn('already exists', err_body['error'])

    def test_02c_otp_send_and_verify(self):
        # 1. Send Mobile OTP
        status, body = self.invoke_api('POST', '/api/auth/otp/send', {
            'target': '+91 88776 65544',
            'type': 'mobile'
        })
        self.assertEqual(status, 200)
        self.assertTrue(body['success'])
        self.assertNotIn('dev_code', body)
        self.assertIn('challenge_id', body)
        challenge_id = body['challenge_id']

        # Verify notifications_log contains no plain 6-digit OTP
        conn = database.get_connection(self.test_db)
        c = conn.cursor()
        c.execute("SELECT message FROM notifications_log WHERE recipient = ? ORDER BY id DESC LIMIT 1", ('+91 88776 65544',))
        msg = c.fetchone()[0]
        conn.close()
        self.assertIsNone(re.search(r'\b\d{6}\b', msg))

        # Retrieve generated OTP via test hook
        generated_otp = notifications.get_test_last_dispatched('+91 88776 65544')

        # 2. Rate limit test (trying to send again immediately should fail with 429)
        status, r_body = self.invoke_api('POST', '/api/auth/otp/send', {
            'target': '+91 88776 65544',
            'type': 'mobile'
        })
        self.assertEqual(status, 429)

        # 3. Invalid OTP test
        status, err = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': challenge_id,
            'otp_code': '000000'
        })
        self.assertEqual(status, 400)
        self.assertIn('Incorrect code', err['error'])

        # 4. Valid OTP verification using challenge_id
        status, v_res = self.invoke_api('POST', '/api/auth/otp/verify', {
            'challenge_id': challenge_id,
            'otp_code': generated_otp
        })
        self.assertEqual(status, 200)
        self.assertTrue(v_res['success'])

    def test_03_slots_availability(self):
        status, body = self.invoke_api('GET', '/api/slots/available?date=2026-09-25')
        self.assertEqual(status, 200)
        self.assertIn('slots', body)
        self.assertEqual(len(body['slots']), 5)

    def test_04_create_booking_flow(self):
        _, s_body = self.invoke_api('GET', '/api/services')
        sofa_svc = [s for s in s_body['services'] if s['slug'] == 'sofa'][0]
        v_3seater = [v for v in sofa_svc['variants'] if '3 Seater' in v['name']][0]

        booking_payload = {
            'name': 'Sunil Kumar',
            'phone': '+91 98765 43210',
            'email': 'sunil@example.com',
            'address': {
                'house_flat': 'Flat 402',
                'street': 'Road 12',
                'area': 'Banjara Hills',
                'city': 'Hyderabad',
                'pincode': '500034',
                'lat': 17.4156,
                'lng': 78.4357
            },
            'service_date': '2026-09-27',
            'service_slot': '09:00 AM',
            'items': [
                {'variant_id': v_3seater['id'], 'quantity': 1}
            ],
            'coupon_code': 'FIRST100',
            'notes': 'Stain treatment requested'
        }

        # Must be authenticated with real session token
        status, body = self.invoke_api(
            'POST', 
            '/api/bookings', 
            booking_payload, 
            headers_dict={'Authorization': f'Bearer {self.cust_token}'}
        )
        self.assertEqual(status, 201)
        self.assertTrue(body['booking_id'].startswith('SIRI-'))
        new_booking_id = body['booking_id']
        DirectHandlerTest.created_booking_id = new_booking_id

        # Fetch booking details
        status, b_detail = self.invoke_api(
            'GET', 
            f'/api/bookings/{new_booking_id}',
            headers_dict={'Authorization': f'Bearer {self.cust_token}'}
        )
        self.assertEqual(status, 200)
        self.assertEqual(b_detail['booking']['status'], 'received')
        self.assertEqual(len(b_detail['booking']['items']), 1)
        self.assertEqual(b_detail['booking']['items'][0]['variant_name'], v_3seater['name'])
        self.assertEqual(b_detail['booking']['address']['lat'], 17.4156)
        self.assertEqual(b_detail['booking']['address']['lng'], 78.4357)

    def test_04b_unauthenticated_booking_rejected(self):
        # Guest user attempting to book without signing in must receive 401 Unauthorized
        guest_payload = {
            'name': 'Guest Stranger',
            'phone': '+91 99999 00000',
            'service_date': '2026-09-28',
            'service_slot': '11:30 AM',
            'items': [{'variant_id': 1, 'quantity': 1}]
        }
        status, body = self.invoke_api('POST', '/api/bookings', guest_payload)
        self.assertEqual(status, 401)
        self.assertIn('Sign in required', body['error'])

    def test_04c_customer_cross_booking_access_forbidden(self):
        # Register Customer C to get a distinct valid session token
        status, c_reg = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Customer C',
            'email': 'custc@example.com',
            'phone': '+91 91111 22222',
            'password': 'password123'
        })
        cust3_token = c_reg['token']
        booking_id = DirectHandlerTest.created_booking_id

        # Customer C attempting to access Customer A's booking by ID must receive 403 Forbidden
        status, body = self.invoke_api('GET', f'/api/bookings/{booking_id}', headers_dict={'Authorization': f'Bearer {cust3_token}'})
        self.assertEqual(status, 403)
        self.assertIn('Access denied', body['error'])

        # Owner accessing their own booking must succeed with 200
        status, body = self.invoke_api('GET', f'/api/bookings/{booking_id}', headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 200)
        self.assertEqual(body['booking']['id'], booking_id)

    def test_05_admin_pricing_and_assignment(self):
        _, p_body = self.invoke_api('GET', '/api/pricing')
        target_variant = p_body['variants'][0]
        new_price = target_variant['base_price'] + 100

        # 1. Unauthenticated request to PUT /api/pricing must fail with 401
        status, _ = self.invoke_api('PUT', '/api/pricing', {
            'variants': [{'id': target_variant['id'], 'base_price': new_price}]
        })
        self.assertEqual(status, 401)

        # 2. Customer token must be rejected with 403 Forbidden
        status, _ = self.invoke_api('PUT', '/api/pricing', {
            'variants': [{'id': target_variant['id'], 'base_price': new_price}]
        }, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 403)

        # 3. Admin token must succeed with 200
        status, res = self.invoke_api('PUT', '/api/pricing', {
            'variants': [{'id': target_variant['id'], 'base_price': new_price}]
        }, headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(status, 200)

        # Verify pricing actually updated
        _, p_check = self.invoke_api('GET', '/api/pricing')
        updated_variant = [v for v in p_check['variants'] if v['id'] == target_variant['id']][0]
        self.assertEqual(updated_variant['base_price'], new_price)

        # 4. Technician assignment requires admin
        target_b_id = getattr(DirectHandlerTest, 'created_booking_id', 'SIRI-TEST')
        status, _ = self.invoke_api('PUT', f'/api/bookings/{target_b_id}/assign', {
            'technician_id': 3
        }, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 403)

        status, res = self.invoke_api('PUT', f'/api/bookings/{target_b_id}/assign', {
            'technician_id': 3
        }, headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(status, 200)

        status, b_check = self.invoke_api('GET', f'/api/bookings/{target_b_id}', headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(b_check['booking']['status'], 'assigned')
        self.assertEqual(b_check['booking']['technician_name'], 'Mahesh Goud')

    def test_06_analytics(self):
        # Anonymous request blocked
        status, _ = self.invoke_api('GET', '/api/analytics')
        self.assertEqual(status, 401)

        # Customer token blocked
        status, _ = self.invoke_api('GET', '/api/analytics', headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 403)

        # Admin token succeeds
        status, body = self.invoke_api('GET', '/api/analytics', headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(status, 200)
        self.assertIn('metrics', body)
        self.assertIn('services_breakdown', body)
        self.assertGreater(body['metrics']['total_bookings'], 0)

    def test_07_customer_booking_isolation(self):
        # Unauthenticated listing all bookings without filter blocked
        status, _ = self.invoke_api('GET', '/api/bookings')
        self.assertEqual(status, 401)

        # Customer token can only see their own bookings
        status, body = self.invoke_api('GET', '/api/bookings', headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 200)
        self.assertGreater(len(body['bookings']), 0)

        # Admin can view all bookings across system
        status, body = self.invoke_api('GET', '/api/bookings', headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(status, 200)
        self.assertGreater(len(body['bookings']), 0)

    def test_08_forged_token_prevention(self):
        # A forged legacy token must be rejected because it is not in user_sessions
        forged_tokens = [
            'token_1_1700000000',
            'token_admin_super',
            'fake_random_session_token_1234567890'
        ]
        for token in forged_tokens:
            status, body = self.invoke_api('GET', '/api/analytics', headers_dict={'Authorization': f'Bearer {token}'})
            self.assertEqual(status, 401)
            self.assertIn('Authentication required', body['error'])

    def test_09_atomic_booking_slot_capacity(self):
        # Create bookings for slot 01:00 PM on 2026-10-15 until capacity (3) is reached
        test_date = '2026-10-15'
        test_slot = '01:00 PM'

        for i in range(3):
            payload = {
                'name': f'Slot Test User {i}',
                'phone': f'+91 90000 0000{i}',
                'service_date': test_date,
                'service_slot': test_slot,
                'items': [{'variant_id': 1, 'quantity': 1}]
            }
            status, res = self.invoke_api('POST', '/api/bookings', payload, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
            self.assertEqual(status, 201)

        # 4th booking on the same slot must be rejected with 409 Conflict
        overflow_payload = {
            'name': 'Overflow Customer',
            'phone': '+91 90000 00099',
            'service_date': test_date,
            'service_slot': test_slot,
            'items': [{'variant_id': 1, 'quantity': 1}]
        }
        status, err = self.invoke_api('POST', '/api/bookings', overflow_payload, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 409)
        self.assertIn('fully booked', err['error'])

    def test_10_reviews_authorization_and_duplicate_prevention(self):
        booking_id = DirectHandlerTest.created_booking_id

        # 1. Unauthenticated review fails with 401
        status, _ = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'comment': 'Good service'
        })
        self.assertEqual(status, 401)

        # 2. Non-completed booking cannot be reviewed (status is currently 'assigned')
        status, err = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'comment': 'Early review attempt'
        }, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 400)
        self.assertIn('completed', err['error'])

        # Mark booking as completed via admin
        status, _ = self.invoke_api('PUT', f'/api/bookings/{booking_id}/status', {
            'status': 'completed'
        }, headers_dict={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(status, 200)

        # 3. Valid review submission succeeds with 201
        status, res = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 5,
            'comment': 'Exceptional 6-step sofa extraction process!'
        }, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 201)

        # 4. Duplicate review on the same booking must fail with 400
        status, d_err = self.invoke_api('POST', '/api/reviews', {
            'booking_id': booking_id,
            'rating': 4,
            'comment': 'Second review attempt'
        }, headers_dict={'Authorization': f'Bearer {self.cust_token}'})
        self.assertEqual(status, 400)
        self.assertIn('already been submitted', d_err['error'])

    def test_11_logout_revokes_session(self):
        # Register a temporary user to test logout session revocation
        status, reg = self.invoke_api('POST', '/api/auth/register', {
            'name': 'Logout Tester',
            'email': 'logout.test@example.com',
            'phone': '+91 97777 88888',
            'password': 'password123'
        })
        temp_token = reg['token']

        # Confirm token works for addresses
        status, _ = self.invoke_api('GET', '/api/addresses', headers_dict={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(status, 200)

        # Logout
        status, l_res = self.invoke_api('POST', '/api/auth/logout', headers_dict={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(status, 200)
        self.assertTrue(l_res['success'])

        # Now token must be revoked and fail with 401
        status, _ = self.invoke_api('GET', '/api/addresses', headers_dict={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(status, 401)

if __name__ == '__main__':
    unittest.main()
