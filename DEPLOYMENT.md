# Siri Sofa Services — Production Deployment Guide

This guide covers deploying the full-stack Siri Sofa application across modern hosting providers (Railway, VPS, Docker, Render, AWS, and DigitalOcean).

Because this application includes a Python backend (with REST endpoints, OTP verification, database persistence, and rate limiting) along with the frontend, it requires a host that can execute Python 3 or run Docker containers.

---

## Architecture Overview

- **Backend & Web Server:** Python 3 (`run.py`), serving REST APIs and static frontend files.
- **Database:** SQLite located in `/app/data/siri_sofa.db` (requires persistent volume / storage).
- **Port:** Dynamically reads `PORT` environment variable (defaults to `8000`).
- **Dependencies:** 100% Python Standard Library (zero external pip packages required).

---

## Option 1: Railway (Recommended - Fastest PaaS)

Railway automatically detects the `Dockerfile` or `Procfile` and provides automated HTTPS.

1. Create an account at [railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository (`siri-sofa-cleaning`).
4. Under **Settings** → **Environment Variables**, add:
   - `ADMIN_EMAIL` = `admin@sirisofa.com`
   - `ADMIN_PASSWORD` = `<strong-secure-password>`
   - `SMTP_USER` / `SMTP_PASSWORD` / `FAST2SMS_API_KEY` (if using live OTP/SMS)
5. Under **Volumes**, attach a persistent volume:
   - Mount Path: `/app/data` (This keeps your SQLite bookings intact across redeployments).
6. Click **Generate Domain** under **Networking** to get your public `https://*.up.railway.app` URL.

---

## Option 2: VPS / Cloud Server (Ubuntu / Debian / DigitalOcean Droplet / AWS EC2)

Deploy directly on an Ubuntu/Debian server using Systemd and Nginx with free SSL certificates via Let's Encrypt.

### 1. Server Setup
```bash
sudo apt update && sudo apt install -y python3 python3-pip git nginx certbot python3-certbot-nginx
```

### 2. Clone the Project
```bash
sudo mkdir -p /var/www/siri-sofa
cd /var/www/siri-sofa
git clone https://github.com/<your-username>/siri-sofa-cleaning.git .
mkdir -p data
```

### 3. Create a Systemd Service
Create `/etc/systemd/system/siri-sofa.service`:
```ini
[Unit]
Description=Siri Sofa Services App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/siri-sofa
ExecStart=/usr/bin/python3 /var/www/siri-sofa/run.py
Restart=always
RestartSec=5
Environment=PORT=8000
Environment=ADMIN_EMAIL=admin@sirisofa.com
Environment=ADMIN_PASSWORD=your_secure_password_here

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo chown -R www-data:www-data /var/www/siri-sofa
sudo systemctl daemon-reload
sudo systemctl enable siri-sofa
sudo systemctl start siri-sofa
```

### 4. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/sirisofa.com`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and configure SSL:
```bash
sudo ln -s /etc/nginx/sites-available/sirisofa.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 3: Docker & Docker Compose (Any Server / Portainer / Coolify)

To run the application anywhere with Docker:

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/siri-sofa-cleaning.git
cd siri-sofa-cleaning

# 2. Configure .env
cp .env.example .env
# Edit .env with your configuration

# 3. Build & launch
docker compose up -d
```

The app will be running on port `8000`. The `./data` volume is mounted to preserve your database and bookings permanently.

---

## Option 4: Render

1. Connect your GitHub repository to [render.com](https://render.com/).
2. Render will automatically detect [`render.yaml`](file:///Users/sunilkumarkondapalli/Siri%20sofa%20solutions/siri-sofa-cleaning/render.yaml) in the repository root.
3. In the Render Dashboard, add a **Disk / Persistent Disk** mounted at `/app/data` (1 GB) to keep the SQLite database persistent.

---

## Option 5: AWS (App Runner / Lightsail)

- **AWS Lightsail Containers or Instance:**
  - Create a $3.50/mo or $5/mo Ubuntu Lightsail instance.
  - Follow the **VPS (Ubuntu)** steps above, or deploy the Docker container using Lightsail Containers.
- **AWS App Runner:**
  - Connect your GitHub repo, select **Dockerfile** deployment type, and set port to `8000`.

---

## Health Check & Verification

Once deployed, verify your installation:

1. **Frontend:** Open `https://your-domain.com/` in your browser.
2. **REST API Health:** Query `https://your-domain.com/api/services`.
3. **Admin Portal:** Navigate to `https://your-domain.com/#admin` and log in with your configured admin credentials.
