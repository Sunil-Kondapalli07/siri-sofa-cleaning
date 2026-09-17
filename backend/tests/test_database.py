import unittest
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from database import init_db, get_connection, hash_password

class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, 'test.db')
        init_db(self.db_path)
        self.conn = get_connection(self.db_path)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_users_seeded(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = 'admin@sirisofa.com'")
        admin = cursor.fetchone()
        self.assertIsNotNone(admin)
        self.assertEqual(admin['role'], 'admin')
        self.assertEqual(admin['is_email_verified'], 1)
        self.assertEqual(admin['is_mobile_verified'], 1)

    def test_services_and_variants(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM services")
        service_count = cursor.fetchone()[0]
        self.assertGreaterEqual(service_count, 4)

        cursor.execute("SELECT COUNT(*) FROM service_variants")
        variant_count = cursor.fetchone()[0]
        self.assertGreaterEqual(variant_count, 10)

    def test_technicians_seeded(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM technicians WHERE name = 'Raj Kumar'")
        tech = cursor.fetchone()
        self.assertIsNotNone(tech)
        self.assertEqual(tech['status'], 'available')

    def test_verification_tables_and_clean_bookings(self):
        cursor = self.conn.cursor()
        # Clean initial bookings
        cursor.execute("SELECT COUNT(*) FROM bookings")
        self.assertEqual(cursor.fetchone()[0], 0)

        # Verification OTPs table exists
        cursor.execute("INSERT INTO verification_otps (target, target_type, otp_code, expires_at, created_at) VALUES ('test@example.com', 'email', '123456', '2026-09-20', '2026-09-17')")
        self.conn.commit()
        cursor.execute("SELECT COUNT(*) FROM verification_otps")
        self.assertEqual(cursor.fetchone()[0], 1)

if __name__ == '__main__':
    unittest.main()
