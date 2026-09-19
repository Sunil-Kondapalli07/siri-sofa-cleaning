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
    print("🛋️  SIRI SOFA SERVICES — BACKEND REST API SERVER")
    print("=" * 60)
    print("⚡ Initializing SQLite Database & Seed Data...")
    init_db()
    print("🚀 Backend REST API Server listening on: http://localhost:8000")
    print("👉 API Health / Services: http://localhost:8000/api/services")
    print("👉 Modern React Web UI:   http://localhost:3000 (cd web && npm run dev)")
    print("=" * 60)
    run_server()
