#!/usr/bin/env python3
"""
Siri Sofa Services — Main Entrypoint
Starts the zero-dependency REST and static web server, opening the 3D-first application.
"""

import sys
import os

# Set root dir in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT_DIR, 'backend'))

from database import init_db
from server import run_server

if __name__ == '__main__':
    print("=" * 60)
    print("🛋️  SIRI SOFA SERVICES — \"Fresh Sofa. Fresh Home.\"")
    print("=" * 60)
    print("⚡ Initializing SQLite Database & Seed Data...")
    init_db()
    print("🚀 Starting Web & REST API Server...")
    print("👉 Open your browser at: http://localhost:8000")
    print("👉 Admin Portal:  admin@sirisofa.com / admin123")
    print("👉 New Customers: Instant live signup with real-time OTP verification")
    print("=" * 60)
    run_server()
