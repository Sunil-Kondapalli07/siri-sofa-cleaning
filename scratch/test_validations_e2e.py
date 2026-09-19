import urllib.request
import json
import time

def post(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {'raw': body}

def get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        return response.getcode(), response.read().decode('utf-8')

def main():
    print("Testing services...")
    code, _ = get("http://localhost:8000/api/services")
    assert code == 200, f"Backend failed with {code}"
    print("✓ Backend port 8000 alive")

    code, _ = get("http://localhost:3000")
    assert code == 200, f"Frontend failed with {code}"
    print("✓ Frontend port 3000 alive")

    unique_suffix = int(time.time())
    test_email = f"validation_user_{unique_suffix}@example.com"
    test_phone = f"98{str(unique_suffix)[-8:]}"
    print(f"Registering test user: {test_email} / {test_phone}")

    # 1. Register
    status, reg_data = post("http://localhost:8000/api/auth/register", {
        "name": "Validation Test User",
        "email": test_email,
        "phone": test_phone,
        "password": "initial_password_123"
    })
    assert status == 201, f"Expected 201, got {status}: {reg_data}"
    print("✓ User registered successfully")

    # 2. Duplicate registration test (checks user already exists message & user_exists flag)
    status, dup_data = post("http://localhost:8000/api/auth/register", {
        "name": "Impostor Duplicate",
        "email": test_email,
        "phone": test_phone,
        "password": "some_other_password"
    })
    assert status == 400, f"Expected 400, got {status}: {dup_data}"
    assert "already exists" in dup_data.get("error", "").lower(), f"Unexpected error: {dup_data}"
    assert dup_data.get("user_exists") is True, f"Expected user_exists: True, got {dup_data}"
    print(f"✓ Duplicate user detected with exact message: {dup_data['error']}")

    # 3. Forgot Password Request
    status, reset_req = post("http://localhost:8000/api/auth/password/reset-request", {
        "target": test_email
    })
    assert status == 200, f"Expected 200, got {status}: {reset_req}"
    challenge_id = reset_req.get("challenge_id")
    otp_code = reset_req.get("dev_otp_hint")
    assert challenge_id and otp_code, f"Missing challenge_id or dev_otp_hint in {reset_req}"
    print(f"✓ Password reset request created. Challenge: {challenge_id[:8]}..., Dev OTP: {otp_code}")

    # 4. Password Reset with invalid OTP
    status, bad_otp_res = post("http://localhost:8000/api/auth/password/reset", {
        "challenge_id": challenge_id,
        "otp_code": "000000",
        "new_password": "updated_password_456"
    })
    assert status == 400, f"Expected 400 for bad OTP, got {status}: {bad_otp_res}"
    print("✓ Bad OTP correctly rejected")

    # 5. Password Reset with correct OTP
    status, good_reset_res = post("http://localhost:8000/api/auth/password/reset", {
        "challenge_id": challenge_id,
        "otp_code": otp_code,
        "new_password": "updated_password_456"
    })
    assert status == 200, f"Expected 200, got {status}: {good_reset_res}"
    assert good_reset_res.get("success") is True
    print("✓ Password successfully reset")

    # 6. Login with new password
    status, login_res = post("http://localhost:8000/api/auth/login", {
        "email": test_email,
        "password": "updated_password_456"
    })
    assert status == 200, f"Expected 200, got {status}: {login_res}"
    user_token = login_res.get("token")
    assert user_token, "No token in login response"
    print(f"✓ Login with new password succeeded! Token: {user_token[:10]}...")

    # 7. Google Sign In
    g_email = f"google_tester_{unique_suffix}@gmail.com"
    status, g_res = post("http://localhost:8000/api/auth/google", {
        "email": g_email,
        "name": "Google Tester Hyderabad"
    })
    assert status == 200, f"Expected 200, got {status}: {g_res}"
    assert g_res.get("success") is True
    assert g_res.get("user", {}).get("is_email_verified") is True
    print(f"✓ Google Sign In succeeded! Verified User: {g_res['user']['name']} ({g_res['user']['email']})")

    print("\n🎉 ALL FORM VALIDATION, DUPLICATE DETECTION, FORGOT PASSWORD & GOOGLE SIGN IN TESTS PASSED 100%!")

if __name__ == "__main__":
    main()
