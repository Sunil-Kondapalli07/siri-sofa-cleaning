/**
 * Siri Sofa Services — API Client
 */

const API_BASE = ''; // Same origin

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
      // Fallback for static hosting (e.g. GitHub Pages) where backend server is not hosted
      if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:' || (err.message && (err.message.includes('404') || err.message.includes('Failed to fetch')))) {
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
      const u = {
        id: Date.now(),
        name: body.name || 'Customer',
        email: body.email,
        phone: body.phone,
        role: 'customer',
        is_email_verified: false,
        is_mobile_verified: false
      };
      return { success: true, user: u, token: 'static_demo_token', requires_verification: true };
    }
    if (endpoint === '/api/auth/login') {
      const isAdmin = body.email === 'admin@sirisofa.com' && body.password === 'admin123';
      const u = {
        id: isAdmin ? 1 : Date.now(),
        name: isAdmin ? 'Siri Operations Admin' : (body.email?.split('@')[0] || 'Customer'),
        email: body.email,
        phone: '+91 98480 12345',
        role: isAdmin ? 'admin' : 'customer',
        is_email_verified: true,
        is_mobile_verified: true
      };
      return { success: true, user: u, token: 'static_demo_token' };
    }
    if (endpoint === '/api/auth/otp/send') {
      return { success: true, message: 'Verification code dispatched' };
    }
    if (endpoint === '/api/auth/otp/verify') {
      return { success: true, message: 'Verified successfully' };
    }
    if (endpoint === '/api/bookings' && method === 'POST') {
      const bookingId = 'SIRI-' + Math.floor(100000 + Math.random() * 900000);
      const b = {
        id: bookingId,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        address_json: typeof body.address === 'string' ? body.address : JSON.stringify(body.address || {}),
        service_date: body.service_date,
        service_slot: body.service_slot,
        total_amount: body.total_amount,
        status: 'confirmed',
        created_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      existing.unshift(b);
      localStorage.setItem('siri_bookings', JSON.stringify(existing));
      return { success: true, booking_id: bookingId, booking: b };
    }
    if (endpoint.startsWith('/api/bookings/')) {
      const bId = endpoint.split('/')[3];
      const existing = JSON.parse(localStorage.getItem('siri_bookings') || '[]');
      const found = existing.find(x => x.id === bId) || {
        id: bId || 'SIRI-928412',
        customer_name: 'Sunil Kumar',
        customer_phone: '+91 98480 12345',
        service_date: '2026-09-25',
        service_slot: '10:30 AM',
        status: 'in_transit',
        total_amount: 1499,
        address_json: JSON.stringify({ area: 'Banjara Hills', city: 'Hyderabad', lat: 17.4156, lng: 78.4357, street: 'Road No 12' })
      };
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

  async verifyOtp(target, type, otpCode, userId = null) {
    return await this.request('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ target, type, otp_code: otpCode, user_id: userId })
    });
  },

  logout() {
    localStorage.removeItem('siri_token');
    localStorage.removeItem('siri_user');
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
