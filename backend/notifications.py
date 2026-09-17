"""
Siri Sofa Services — Real-Time Notification Dispatch Engine
Supports real SMTP (Gmail, Outlook, Brevo, AWS SES) and real SMS gateways (Fast2SMS, Twilio).
Loads configuration from .env automatically without external dependencies.
"""

import os
import sys
import json
import ssl
import smtplib
import urllib.request
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def load_dotenv():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(root_dir, '.env')
    if not os.path.exists(env_path):
        return

    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
    except Exception as e:
        print(f"Notice: Failed loading .env file: {e}")

load_dotenv()


def send_real_email(recipient: str, code: str, user_name: str = "Customer") -> tuple[bool, str, str]:
    """
    Sends real HTML & plain-text verification email using SMTP.
    Returns (success: bool, provider: str, message: str)
    """
    load_dotenv()
    smtp_host = os.environ.get('SMTP_HOST', '').strip()
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '').strip()
    smtp_pass = os.environ.get('SMTP_PASSWORD', '').strip()
    from_email = os.environ.get('SMTP_FROM_EMAIL', smtp_user or 'noreply@sirisofa.com').strip()
    from_name = os.environ.get('SMTP_FROM_NAME', 'Siri Sofa Services').strip()

    is_configured = (
        smtp_host and smtp_user and smtp_pass and 
        'your-email' not in smtp_user.lower() and 
        'your-16-char' not in smtp_pass.lower()
    )

    if not is_configured:
        # Development fallback notice
        print("=" * 70)
        print(f"📬 [SIMULATED EMAIL DISPATCH] (Configure SMTP_USER in .env for real inbox delivery)")
        print(f"   To:       {recipient}")
        print(f"   Subject:  Verify your Siri Sofa Services Account")
        print(f"   OTP Code: {code}")
        print("=" * 70)
        return False, "terminal_log", "SMTP credentials not configured in .env; logged to server console"

    subject = f"{code} is your Siri Sofa Services verification code"
    text_content = f"""Hello {user_name},

Thank you for choosing Siri Sofa Services!

Your 6-digit verification code is: {code}

This code is valid for 10 minutes. Please enter it in the website verification prompt to activate your account.
If you did not request this code, please ignore this email.

Best regards,
Siri Sofa Services Team
Hyderabad, Telangana
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">🛋️ Siri Sofa Services</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #99f6e4; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Fresh Sofa. Fresh Home. • Hyderabad</p>
    </div>
    <div style="padding: 32px 28px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #0f172a;">Account Verification</h2>
      <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
        Hello <strong>{user_name}</strong>, use the 6-digit code below to verify your email address and activate your account.
      </p>
      <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f766e;">{code}</span>
      </div>
      <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; text-align: center;">
        ⏱️ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
      </p>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        Siri Sofa Services Pvt. Ltd. • Hyderabad Doorstep Upholstery Hygiene<br>
        Banjara Hills • Jubilee Hills • Gachibowli • Hitec City
      </div>
    </div>
  </div>
</body>
</html>
"""

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = recipient
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        if smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=12) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [recipient], msg.as_string())

        print(f"✅ [REAL EMAIL DELIVERED] Dispatched to {recipient} via {smtp_host}")
        return True, "smtp", f"Email delivered to {recipient}"
    except Exception as err:
        print(f"❌ [SMTP ERROR] Failed sending to {recipient}: {err}")
        return False, "smtp_error", str(err)


def send_real_sms(phone: str, code: str) -> tuple[bool, str, str]:
    """
    Sends real SMS verification to Indian mobile number (+91) using Fast2SMS, Twilio, or Webhook.
    Returns (success: bool, provider: str, message: str)
    """
    load_dotenv()
    fast2sms_key = os.environ.get('FAST2SMS_API_KEY', '').strip()
    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID', '').strip()
    twilio_auth = os.environ.get('TWILIO_AUTH_TOKEN', '').strip()
    twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER', '').strip()
    sms_webhook = os.environ.get('SMS_WEBHOOK_URL', '').strip()

    # Clean phone digits
    clean_digits = ''.join(c for c in phone if c.isdigit())
    if clean_digits.startswith('91') and len(clean_digits) == 12:
        phone_10 = clean_digits[2:]
        e164 = f"+{clean_digits}"
    elif len(clean_digits) == 10:
        phone_10 = clean_digits
        e164 = f"+91{clean_digits}"
    else:
        phone_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
        e164 = f"+91{phone_10}"

    msg_text = f"Your Siri Sofa Services verification code is {code}. Valid for 10 minutes. Fresh Sofa. Fresh Home."

    # 1. Fast2SMS Provider (India DLT/Quick OTP route)
    if fast2sms_key:
        try:
            req_data = json.dumps({
                "variables_values": code,
                "route": "otp",
                "numbers": phone_10
            }).encode('utf-8')
            req = urllib.request.Request(
                "https://www.fast2sms.com/dev/bulkV2",
                data=req_data,
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json",
                    "User-Agent": "SiriSofaPlatform/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_data = json.loads(resp.read().decode('utf-8'))
                if resp_data.get('return') is True:
                    print(f"✅ [FAST2SMS DELIVERED] Dispatched to {phone_10}")
                    return True, "fast2sms", "SMS dispatched successfully"
                else:
                    return False, "fast2sms_error", str(resp_data.get('message'))
        except Exception as e:
            print(f"❌ [FAST2SMS FAILED] {e}")

    # 2. Twilio Provider
    if twilio_sid and twilio_auth and twilio_phone:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            post_data = urllib.parse.urlencode({
                "From": twilio_phone,
                "To": e164,
                "Body": msg_text
            }).encode('utf-8')
            auth_str = f"{twilio_sid}:{twilio_auth}"
            import base64
            b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            req = urllib.request.Request(
                url,
                data=post_data,
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"✅ [TWILIO SMS DELIVERED] Dispatched to {e164}")
                return True, "twilio", "SMS dispatched successfully via Twilio"
        except Exception as e:
            print(f"❌ [TWILIO SMS FAILED] {e}")

    # 3. Custom SMS Webhook
    if sms_webhook:
        try:
            req_data = json.dumps({"phone": e164, "code": code, "message": msg_text}).encode('utf-8')
            req = urllib.request.Request(sms_webhook, data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return True, "webhook", "SMS dispatched via webhook"
        except Exception as e:
            print(f"❌ [SMS WEBHOOK FAILED] {e}")

    # Fallback to server terminal notice
    print("=" * 70)
    print(f"📱 [SIMULATED SMS DISPATCH] (Configure FAST2SMS_API_KEY in .env for real SMS delivery)")
    print(f"   To:      {phone} ({e164})")
    print(f"   Message: {msg_text}")
    print("=" * 70)
    return False, "terminal_log", "SMS Gateway not configured in .env; logged to server console"


def dispatch_verification_code(target: str, target_type: str, code: str, user_name: str = "Customer") -> dict:
    """
    Main entrypoint for sending real-time verification codes.
    """
    if target_type.lower() == 'email':
        success, provider, msg = send_real_email(target, code, user_name)
    else:
        success, provider, msg = send_real_sms(target, code)

    return {
        "delivered": success,
        "provider": provider,
        "message": msg
    }
