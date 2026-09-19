/**
 * Siri Sofa Services — API Client
 */const API_BASE = window.API_BASE 
  || window.localStorage.getItem('siri_api_base')
  || (window.location.port && window.location.port !== '8000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : '');

const ApiClient = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('siri_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed request`);
      }
      return data;
    } catch (err) {
      // Fallback ONLY for static hosting (e.g. GitHub Pages or file: protocol) where no Python backend can run
      const isStaticEnv = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
      if (isStaticEnv) {
        try {
          return this.handleStaticFallback(endpoint, options);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  _hashPassword(password) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < (password || '').length; i++) {
      hash ^= password.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return 'demo_pwd_' + (hash >>> 0).toString(16);
  },

  handleStaticFallback(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    if (endpoint === '/api/services') {
      return { services: typeof store !== 'undefined' && store.getFallbackServices ? store.getFallbackServices() : [] };
    }
    if (endpoint === '/api/pricing') {
      return { config: { min_booking_amount: 499, service_charge: 49, gst_percentage: 18 } };
    }
    if (endpoint.startsWith('/api/slots/available')) {
      return {
        date: new URLSearchParams(endpoint.split('?')[1] || '').get('date') || '2026-09-25',
        slots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:30 PM']
      };
    }
    if (endpoint === '/api/reviews') {
      return {
        reviews: [
          { id: 1, user_name: 'Vikram Reddy', rating: 5, comment: 'Technician Raj Kumar explained the 6-step hygiene process and showed remarkable before/after results on our 3-seater sofa.', service_type: 'Sofa Cleaning', created_at: '2026-08-20T14:30:00' },
          { id: 2, user_name: 'Ananya R.', rating: 5, comment: 'The 3D sofa selector made booking so straightforward. Pricing was clear and the dirt extraction was eye-opening!', service_type: 'Sofa Cleaning', created_at: '2026-09-02T09:15:00' },
          { id: 3, user_name: 'Dr. Arishetty', rating: 5, comment: 'Mattress and sofa sanitization done professionally. Very hygienic uniforms and sealed eco-friendly solutions.', service_type: 'Mattress Cleaning', created_at: '2026-09-12T16:00:00' }
        ]
      };
    }
    if (endpoint === '/api/coupons/validate') {
      const code = (body.code || '').toUpperCase();
      if (code === 'FRESH50') return { valid: true, discount: 150, message: '₹150 Flat Discount Applied' };
      if (code === 'FIRST100') return { valid: true, discount: 100, message: '₹100 First Order Discount Applied' };
      if (code === 'SIRI20') return { valid: true, discount_percent: 20, message: '20% Discount Applied' };
      throw new Error('Invalid coupon code');
    }
    if (endpoint === '/api/auth/register') {
      const users = JSON.parse(localStorage.getItem('siri_users') || '[]');
      const regEmail = (body.email || '').trim().toLowerCase();
      const regPhone = (body.phone || '').replace(/[^0-9]/g, '').slice(-10);

      if (!body.name || !regEmail || !body.password) {
        throw new Error('Name, email and password are required');
      }

      if (regEmail === 'admin@sirisofa.com' || users.some(u => (u.email || '').toLowerCase() === regEmail)) {
        throw new Error('User already exists with this email address. Please sign in instead.');
      }
      if (regPhone && (regPhone === '9800000000' || users.some(u => (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === regPhone))) {
        throw new Error('User already exists with this mobile number. Please sign in instead.');
      }

      const mCode = String(Math.floor(100000 + Math.random() * 900000));
      const eCode = String(Math.floor(100000 + Math.random() * 900000));
      const activeOtps = JSON.parse(localStorage.getItem('siri_active_otps') || '{}');
      if (body.phone) activeOtps[body.phone] = { code: mCode, attempts: 0, created_at: Date.now() };
      if (body.email) activeOtps[regEmail] = { code: eCode, attempts: 0, created_at: Date.now() };
      localStorage.setItem('siri_active_otps', JSON.stringify(activeOtps));

      const u = {
        id: Date.now(),
        name: body.name || 'Customer',
        email: body.email,
        phone: body.phone,
        password_hash: this._hashPassword(body.password),
        role: 'customer',
        is_email_verified: false,
        is_mobile_verified: false
      };
      users.push(u);
      localStorage.setItem('siri_users', JSON.stringify(users));

      return { 
        success: true, 
        user: u, 
        token: `demo_token_${u.id}_${Date.now()}`, 
        requires_verification: true,
        dev_mobile_code: mCode,
        dev_email_code: eCode,
        mobile_delivered: false,
        email_delivered: false,
        message: 'Account created! Verification codes dispatched.'
      };
    }
    if (endpoint === '/api/auth/login') {
      const email = (body.email || '').trim().toLowerCase();
      const pwd = body.password || '';
      const isAdmin = email === 'admin@sirisofa.com' && this._hashPassword(pwd) === this._hashPassword('admin123');
      const users = JSON.parse(localStorage.getItem('siri_users') || '[]');
      const foundUser = users.find(u => 
        (u.email && u.email.toLowerCase() === email) ||
        (u.phone && u.phone.replace(/[^0-9]/g, '').slice(-10) === email.replace(/[^0-9]/g, '').slice(-10))
      );

      if (!isAdmin && (!foundUser || foundUser.password_hash !== this._hashPassword(pwd))) {
        throw new Error('Invalid email or password. Please check your credentials or create an account.');
      }

      const u = isAdmin ? {
        id: 1,
        name: 'Siri Operations Admin',
        email: 'admin@sirisofa.com',
        phone: '+91 98000 00000',
        role: 'admin',
        is_email_verified: true,
        is_mobile_verified: true
      } : foundUser;

      return { success: true, user: u, token: `demo_token_${u.id}_${Date.now()}` };
    }
    if (endpoint === '/api/auth/logout') {
      return { success: true, message: 'Logged out successfully' };
    }
    if (endpoint === '/api/auth/otp/send') {
      const target = (body.target || '').trim();
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const activeOtps = JSON.parse(localStorage.getItem('siri_active_otps') || '{}');
      activeOtps[target] = { code: code, attempts: 0, created_at: Date.now() };
      if (target.includes('@')) activeOtps[target.toLowerCase()] = { code: code, attempts: 0, created_at: Date.now() };
      localStorage.setItem('siri_active_otps', JSON.stringify(activeOtps));
      return { 
        success: true, 
        message: `Verification code sent to ${target}`, 
        dev_code: code, 
        delivered: false 
      };
    }
    if (endpoint === '/api/auth/otp/verify') {
      const target = (body.target || '').trim();
      const submittedCode = String(body.otp_code || '').trim();
      const activeOtps = JSON.parse(localStorage.getItem('siri_active_otps') || '{}');
      const record = activeOtps[target] || (target.includes('@') ? activeOtps[target.toLowerCase()] : null);

      if (!record) {
        throw new Error('No active verification code found for this destination. Please request a new code.');
      }
      if (record.attempts >= 5) {
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }
      if (record.code !== submittedCode) {
        record.attempts = (record.attempts || 0) + 1;
        activeOtps[target] = record;
        localStorage.setItem('siri_active_otps', JSON.stringify(activeOtps));
        const remaining = Math.max(0, 5 - record.attempts);
        throw new Error(`Incorrect verification code. ${remaining} attempts remaining.`);
      }

      delete activeOtps[target];
      if (target.includes('@')) delete activeOtps[target.toLowerCase()];
      localStorage.setItem('siri_active_otps', JSON.stringify(activeOtps));

      // Update verification in demo storage
      const users = JSON.parse(localStorage.getItem('siri_users') || '[]');
      const userIndex = users.findIndex(u => 
        (body.user_id && u.id === body.user_id) || 
        (u.phone && u.phone === target) || 
        (u.email && u.email.toLowerCase() === target.toLowerCase())
      );
      if (userIndex !== -1) {
        if (body.type === 'mobile' || target.replace(/[^0-9]/g, '').length >= 10) {
          users[userIndex].is_mobile_verified = true;
        } else {
          users[userIndex].is_email_verified = true;
        }
        localStorage.setItem('siri_users', JSON.stringify(users));
      }

      return { success: true, message: 'Verified successfully' };
    }
    if (endpoint === '/api/bookings' && method === 'POST') {
      const curUser = this.getCurrentUser();
      if (!curUser && !body.user_id) {
        throw new Error('Sign in required. Please log in or create an account to book an appointment.');
      }
      const bookingId = 'SIRI-' + Math.floor(100000 + Math.random() * 900000);
      let addr = {};
      try {
        addr = typeof body.address === 'object' ? (body.address || {}) : JSON.parse(body.address || '{}');
      } catch (e) {
        addr = {};
      }
      const b = {
        id: bookingId,
        user_id: curUser ? curUser.id : (body.user_id || null),
        customer_name: body.customer_name || body.name || (curUser ? curUser.name : 'Customer'),
        customer_phone: body.customer_phone || body.phone || (curUser ? curUser.phone : '+91 98480 12345'),
        customer_email: body.customer_email || body.email || (curUser ? curUser.email : 'customer@example.com'),
        address: addr,
        address_json: JSON.stringify(addr),
        service_date: body.service_date || new Date().toISOString().split('T')[0],
        service_slot: body.service_slot || '10:30 AM',
        total_amount: body.total_amount || 1499,
        status: 'confirmed',
        technician_name: 'Raj Kumar',
        technician_phone: '+91 98480 11223',
        technician_rating: 4.9,
        created_at: new Date().toISOString(),
        items: (body.items && body.items.length) ? body.items : [
          { id: 1, variant_name: 'Sofa Deep Cleaning & Sanitization', service_name: 'Sofa Cleaning', quantity: 1, total_price: body.total_amount || 1499 }
        ]
      };
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      existing.unshift(b);
      localStorage.setItem('siri_bookings', JSON.stringify(existing));
      return { success: true, booking_id: bookingId, booking: b };
    }
    if (endpoint.includes('/reschedule')) {
      const bId = endpoint.split('/')[3];
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      const idx = existing.findIndex(x => x.id && x.id.toUpperCase() === (bId || '').toUpperCase());
      if (idx !== -1) {
        existing[idx].service_date = body.service_date;
        existing[idx].service_slot = body.service_slot;
        localStorage.setItem('siri_bookings', JSON.stringify(existing));
      }
      return { success: true, message: `Booking ${bId} rescheduled to ${body.service_date} at ${body.service_slot}` };
    }
    if (endpoint.includes('/status')) {
      const bId = endpoint.split('/')[3];
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      const idx = existing.findIndex(x => x.id && x.id.toUpperCase() === (bId || '').toUpperCase());
      if (idx !== -1) {
        existing[idx].status = body.status;
        localStorage.setItem('siri_bookings', JSON.stringify(existing));
      }
      return { success: true, message: 'Status updated' };
    }
    if (endpoint.includes('/assign')) {
      const bId = endpoint.split('/')[3];
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      const idx = existing.findIndex(x => x.id && x.id.toUpperCase() === (bId || '').toUpperCase());
      if (idx !== -1) {
        existing[idx].technician_id = body.technician_id;
        existing[idx].status = 'assigned';
        localStorage.setItem('siri_bookings', JSON.stringify(existing));
      }
      return { success: true, message: 'Technician assigned' };
    }
    if (endpoint === '/api/bookings' || endpoint.startsWith('/api/bookings?')) {
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      const curUser = this.getCurrentUser();
      const urlParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');
      const queryUserId = urlParams.get('user_id') || (curUser && curUser.role !== 'admin' ? curUser.id : null);
      if (queryUserId) {
        return { bookings: existing.filter(b => b.user_id && String(b.user_id) === String(queryUserId)) };
      }
      return { bookings: curUser && curUser.role === 'admin' ? existing : [] };
    }
    if (endpoint.startsWith('/api/bookings/')) {
      const bId = endpoint.split('/')[3];
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      let found = existing.find(x => x.id && x.id.toUpperCase() === (bId || '').toUpperCase());
      if (!found) {
        throw new Error(`Booking reference ${bId} not found`);
      }
      return { booking: found };
    }
    if (endpoint === '/api/technicians') {
      return {
        technicians: [
          { id: 1, name: 'Raj Kumar', phone: '+91 98480 11223', rating: 4.9, jobs_completed: 142, status: 'available' },
          { id: 2, name: 'Ravi Teja', phone: '+91 98480 22334', rating: 4.8, jobs_completed: 98, status: 'busy' }
        ]
      };
    }
    if (endpoint === '/api/analytics') {
      return {
        metrics: {
          total_revenue: 124500,
          total_bookings: 84,
          today_bookings: 6,
          completed_bookings: 72,
          average_order_value: 1482
        },
        services_breakdown: [
          { service_name: 'Sofa Cleaning', bookings_count: 52, service_revenue: 78900 },
          { service_name: 'Mattress Cleaning', bookings_count: 18, service_revenue: 26500 }
        ]
      };
    }
    return {};
  },

  // Auth
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.user && res.token) {
      localStorage.setItem('siri_token', res.token);
      localStorage.setItem('siri_user', JSON.stringify(res.user));
    }
    return res;
  },

  async register(name, email, phone, password) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password })
    });
    if (res.user && res.token) {
      localStorage.setItem('siri_token', res.token);
      localStorage.setItem('siri_user', JSON.stringify(res.user));
    }
    return res;
  },

  async sendOtp(target, type, userId = null) {
    return await this.request('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ target, type, user_id: userId })
    });
  },

  async verifyOtp(targetOrChallenge, type, otpCode, userId = null) {
    const payload = { otp_code: otpCode };
    if (typeof targetOrChallenge === 'object' && targetOrChallenge !== null) {
      Object.assign(payload, targetOrChallenge);
    } else if (targetOrChallenge && targetOrChallenge.length > 20) {
      payload.challenge_id = targetOrChallenge;
      if (type) payload.type = type;
      if (userId) payload.user_id = userId;
    } else {
      payload.target = targetOrChallenge;
      payload.type = type;
      if (userId) payload.user_id = userId;
    }
    return await this.request('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors during logout
    }
    localStorage.removeItem('siri_token');
    localStorage.removeItem('siri_user');
    localStorage.removeItem('siri_active_otps');
    localStorage.removeItem('siri_demo_otps');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('siri_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  // Services & Dynamic Pricing
  async getServices() {
    return await this.request('/api/services');
  },

  async getPricing() {
    return await this.request('/api/pricing');
  },

  async updatePricing(config, variants) {
    return await this.request('/api/pricing', {
      method: 'PUT',
      body: JSON.stringify({ config, variants })
    });
  },

  // Slot Availability
  async getAvailableSlots(dateStr) {
    return await this.request(`/api/slots/available?date=${encodeURIComponent(dateStr)}`);
  },

  // Bookings
  async createBooking(bookingData) {
    return await this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async getBookings(userId = null, status = null) {
    let url = '/api/bookings?';
    if (userId) url += `user_id=${encodeURIComponent(userId)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    return await this.request(url);
  },

  async getBookingById(bookingId) {
    return await this.request(`/api/bookings/${encodeURIComponent(bookingId)}`);
  },

  async updateBookingStatus(bookingId, status) {
    return await this.request(`/api/bookings/${encodeURIComponent(bookingId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async assignTechnician(bookingId, technicianId) {
    return await this.request(`/api/bookings/${encodeURIComponent(bookingId)}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ technician_id: technicianId })
    });
  },

  async rescheduleBooking(bookingId, serviceDate, serviceSlot) {
    return await this.request(`/api/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ service_date: serviceDate, service_slot: serviceSlot })
    });
  },

  // Technicians
  async getTechnicians() {
    return await this.request('/api/technicians');
  },

  async updateTechnician(id, status) {
    return await this.request(`/api/technicians/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Coupons
  async validateCoupon(code, subtotal) {
    return await this.request('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  // Analytics
  async getAnalytics() {
    return await this.request('/api/analytics');
  },

  // Reviews
  async getReviews() {
    return await this.request('/api/reviews');
  },

  async submitReview(reviewData) {
    return await this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Saved Addresses
  async getAddresses(userId) {
    return await this.request(`/api/addresses?user_id=${encodeURIComponent(userId)}`);
  }
};

window.ApiClient = ApiClient;
