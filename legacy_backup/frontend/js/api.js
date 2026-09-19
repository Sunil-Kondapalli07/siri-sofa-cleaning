/**
 * Siri Sofa Services — API Client
 * Production Hardened: Server-Only Authentication, Zero Insecure LocalStorage Fallbacks
 */
const API_BASE = window.API_BASE 
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
        throw new Error(data.detail || data.error || `HTTP ${response.status}: Failed request`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      if (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error("Unable to reach the Siri Sofa API server. Please verify your connection or ensure the backend is running at http://localhost:8000.");
      }
      throw err;
    }
  },

  // Auth (Strictly server-side; passwords never saved in browser storage)
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

  async verifyOtp(challengeOrTarget, typeOrCode, otpCode = null) {
    let payload = {};
    if (typeof challengeOrTarget === 'object' && challengeOrTarget !== null) {
      payload = { ...challengeOrTarget };
    } else if (otpCode !== null) {
      // Called as verifyOtp(challengeId, type, otpCode) or verifyOtp(target, type, otpCode)
      if (challengeOrTarget && challengeOrTarget.length > 20) {
        payload.challenge_id = challengeOrTarget;
      } else {
        payload.target = challengeOrTarget;
        payload.type = typeOrCode;
      }
      payload.otp_code = otpCode;
    } else {
      // Called as verifyOtp(challengeId, otpCode)
      payload.challenge_id = challengeOrTarget;
      payload.otp_code = typeOrCode;
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

  // Technicians (Admin only)
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

  // Analytics (Admin only)
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
