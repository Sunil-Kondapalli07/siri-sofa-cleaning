import os
import sys
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Add parent dir to path to reuse database functions
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database

app = FastAPI(
    title="Siri Sofa Services API",
    description="3D-First Home Services Booking & Business Management Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'frontend')

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Siri Sofa Services"}

# Re-use database queries for clean, high-performance endpoints
@app.get("/api/services")
def get_services():
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC")
        services = [dict(r) for r in cursor.fetchall()]
        for s in services:
            cursor.execute("SELECT * FROM service_variants WHERE service_id = ? ORDER BY sort_order ASC", (s['id'],))
            s['variants'] = [dict(v) for v in cursor.fetchall()]
        return {"services": services}
    finally:
        conn.close()

@app.get("/api/pricing")
def get_pricing():
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pricing_config WHERE id = 1")
        cfg = dict(cursor.fetchone() or {})
        cursor.execute("""
            SELECT sv.*, s.slug as service_slug, s.title as service_title
            FROM service_variants sv
            JOIN services s ON sv.service_id = s.id
            ORDER BY s.id ASC, sv.sort_order ASC
        """)
        variants = [dict(r) for r in cursor.fetchall()]
        return {"config": cfg, "variants": variants}
    finally:
        conn.close()

@app.put("/api/pricing")
def update_pricing(payload: Dict[str, Any]):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        config_data = payload.get("config")
        if config_data:
            cursor.execute("""
                UPDATE pricing_config 
                SET min_booking_amount = ?, service_charge = ?, gst_percentage = ?, updated_at = datetime('now')
                WHERE id = 1
            """, (
                config_data.get('min_booking_amount', 499.0),
                config_data.get('service_charge', 49.0),
                config_data.get('gst_percentage', 18.0)
            ))

        for v in payload.get("variants", []):
            cursor.execute("UPDATE service_variants SET base_price = ? WHERE id = ?", (v['base_price'], v['id']))

        conn.commit()
        return {"message": "Pricing updated successfully"}
    finally:
        conn.close()

@app.get("/api/slots/available")
def get_slots(date: str):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT service_slot, COUNT(*) as count 
            FROM bookings 
            WHERE service_date = ? AND status != 'cancelled'
            GROUP BY service_slot
        """, (date,))
        booked = {r['service_slot']: r['count'] for r in cursor.fetchall()}
        all_slots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
        slot_data = []
        for s in all_slots:
            count = booked.get(s, 0)
            slot_data.append({"slot": s, "available": count < 3, "remaining": max(0, 3 - count)})
        return {"date": date, "slots": slot_data}
    finally:
        conn.close()

@app.get("/api/bookings")
def get_bookings(user_id: Optional[int] = None, status: Optional[str] = None):
    conn = database.get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT b.*, t.name as technician_name, t.phone as technician_phone FROM bookings b LEFT JOIN technicians t ON b.technician_id = t.id"
        params = []
        clauses = []
        if user_id:
            clauses.append("b.user_id = ?")
            params.append(user_id)
        if status and status != 'all':
            clauses.append("b.status = ?")
            params.append(status)
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY b.created_at DESC"
        cursor.execute(query, params)
        bookings = []
        import json
        for r in cursor.fetchall():
            bd = dict(r)
            bd['address'] = json.loads(bd['address_json'])
            cursor.execute("SELECT * FROM booking_items WHERE booking_id = ?", (bd['id'],))
            bd['items'] = [dict(i) for i in cursor.fetchall()]
            bookings.append(bd)
        return {"bookings": bookings}
    finally:
        conn.close()

# Mount frontend
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
