/**
 * Customer Portal Component
 */

const CustomerPortalComponent = {
  customerBookings: [],
  activeTab: 'dashboard', // 'dashboard', 'bookings', 'addresses', 'profile'
  isLoading: false,

  render() {
    const user = store.currentUser || { name: 'Customer', email: '', phone: '' };
    const upcoming = this.customerBookings.find(b => b.status !== 'completed' && b.status !== 'cancelled') || this.customerBookings[0];

    return `
      <section class="py-10 bg-slate-50 min-h-screen">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Top Welcome Header -->
          <div class="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-display font-black text-2xl border border-teal-400/30">
                ${user.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <span class="text-xs text-teal-400 font-bold uppercase tracking-wider">Customer Portal</span>
                <h1 class="text-2xl sm:text-3xl font-extrabold mt-0.5">Welcome, ${user.name || 'Valued Customer'} 👋</h1>
                <p class="text-xs text-slate-300 mt-1">${user.email || 'No email provided'} • ${user.phone || 'Hyderabad'}</p>
                
                <!-- Live Verification Status Badges -->
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  ${user.is_email_verified ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ✉️ Email Verified ✓
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      ✉️ Email Unverified
                      ${user.email ? `<button onclick="App.triggerOtpFlow('${user.email}', 'email', () => CustomerPortalComponent.loadCustomerData())" class="underline hover:text-white font-black ml-0.5">Verify Now</button>` : ''}
                    </span>
                  `}

                  ${user.is_mobile_verified ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      📱 Mobile Verified ✓
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      📱 Mobile Unverified
                      ${user.phone ? `<button onclick="App.triggerOtpFlow('${user.phone}', 'mobile', () => CustomerPortalComponent.loadCustomerData())" class="underline hover:text-white font-black ml-0.5">Verify Now</button>` : ''}
                    </span>
                  `}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button onclick="store.setView('book')" class="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2">
                <span>Book New Service</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
          </div>

          <!-- Customer Navigation Tabs -->
          <div class="flex items-center gap-2 border-b border-slate-200 mb-8 pb-3 overflow-x-auto">
            <button onclick="CustomerPortalComponent.switchTab('dashboard')" class="px-4 py-2 rounded-xl text-sm font-bold transition-colors ${this.activeTab === 'dashboard' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              Overview Dashboard
            </button>
            <button onclick="CustomerPortalComponent.switchTab('bookings')" class="px-4 py-2 rounded-xl text-sm font-bold transition-colors ${this.activeTab === 'bookings' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              My Bookings (${this.customerBookings.length})
            </button>
            <button onclick="CustomerPortalComponent.switchTab('addresses')" class="px-4 py-2 rounded-xl text-sm font-bold transition-colors ${this.activeTab === 'addresses' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              Saved Addresses
            </button>
            <button onclick="CustomerPortalComponent.switchTab('profile')" class="px-4 py-2 rounded-xl text-sm font-bold transition-colors ${this.activeTab === 'profile' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              Profile & Support
            </button>
          </div>

          <!-- Tab Content Host -->
          <div id="customer-tab-content">
            ${this.renderTabContent(upcoming, user)}
          </div>

        </div>
      </section>
    `;
  },

  renderTabContent(upcoming, user) {
    if (this.activeTab === 'dashboard') {
      return this.renderDashboardTab(upcoming);
    } else if (this.activeTab === 'bookings') {
      return this.renderBookingsTab();
    } else if (this.activeTab === 'addresses') {
      return this.renderAddressesTab(user);
    } else {
      return this.renderProfileTab(user);
    }
  },

  renderDashboardTab(upcoming) {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Left Column: Upcoming Booking Spotlight -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-teal-700">Priority Spotlight</span>
                <h3 class="text-xl font-black text-slate-900 mt-0.5">Upcoming Booking</h3>
              </div>
              ${upcoming ? `
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(upcoming.status)}">
                  ${upcoming.status.replace('_', ' ')}
                </span>
              ` : ''}
            </div>

            ${upcoming ? `
              <div class="py-6 space-y-4">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="text-2xl font-mono font-black text-slate-900">${upcoming.id}</div>
                    <div class="text-sm font-bold text-slate-700 mt-1">
                      ${(upcoming.items || []).map(i => `${i.variant_name} × ${i.quantity}`).join(', ') || 'Sofa Cleaning'}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-slate-400">Total</div>
                    <div class="text-xl font-black text-teal-700">₹${upcoming.total_amount}</div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="text-[11px] text-slate-400">Date & Slot</div>
                    <div class="text-sm font-bold text-slate-800">${upcoming.service_date} (${upcoming.service_slot})</div>
                  </div>
                  <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="text-[11px] text-slate-400">Location</div>
                    <div class="text-sm font-bold text-slate-800 truncate">${(upcoming.address && upcoming.address.area) || 'Hyderabad'}, ${(upcoming.address && upcoming.address.city) || 'Hyderabad'}</div>
                  </div>
                </div>

                <div class="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs font-medium text-teal-900">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                    ${upcoming.technician_name ? `Specialist ${upcoming.technician_name} assigned` : 'Routing nearby specialist'}
                  </span>
                  <span class="font-bold">Doorstep Service</span>
                </div>
              </div>

              <div class="pt-2 flex gap-3">
                <button onclick="CustomerPortalComponent.viewBooking('${upcoming.id}')" class="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
                  <span>Track Live Status</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
                <button onclick="BookingTrackerComponent.openInvoice('${upcoming.id}')" class="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors">
                  Invoice
                </button>
              </div>
            ` : `
              <div class="text-center py-12">
                <div class="text-4xl mb-2">🛋️</div>
                <h4 class="font-bold text-slate-800 text-base">No active upcoming bookings</h4>
                <p class="text-xs text-slate-500 mt-1 mb-4">Your furniture is waiting for a fresh start!</p>
                <button onclick="store.setView('book')" class="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs">
                  Book Your First Service
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Right Column: Account Stats & Quick Perks -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Membership Privileges</h4>
            
            <div class="space-y-3">
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  🛡️
                </div>
                <div>
                  <div class="text-sm font-bold text-slate-900">7-Day Freshness Guarantee</div>
                  <div class="text-xs text-slate-500">Free touch-up if any stain re-emerges</div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                  🎟️
                </div>
                <div>
                  <div class="text-sm font-bold text-slate-900">Loyalty Coupon: FRESH50</div>
                  <div class="text-xs text-slate-500">₹150 off on all future cleanings</div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                  📱
                </div>
                <div>
                  <div class="text-sm font-bold text-slate-900">Direct WhatsApp Dispatch</div>
                  <div class="text-xs text-slate-500">Immediate technician coordination</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  renderBookingsTab() {
    return `
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <h3 class="text-xl font-black text-slate-900 mb-6">All Bookings History</h3>

        ${this.customerBookings.length > 0 ? `
          <div class="divide-y divide-slate-100">
            ${this.customerBookings.map(b => `
              <div class="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-black text-slate-900 text-base">${b.id}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(b.status)}">
                      ${b.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div class="text-sm font-bold text-slate-700 mt-1">
                    ${(b.items || []).map(i => `${i.variant_name} × ${i.quantity}`).join(', ')}
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    ${b.service_date} at ${b.service_slot} • ${(b.address && b.address.area) || 'Hyderabad'}
                  </div>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-center">
                  <div class="text-right mr-2">
                    <div class="text-xs text-slate-400 font-medium">Amount</div>
                    <div class="text-base font-black text-teal-700">₹${b.total_amount}</div>
                  </div>
                  <button onclick="CustomerPortalComponent.viewBooking('${b.id}')" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-colors">
                    Track
                  </button>
                  <button onclick="BookingTrackerComponent.openInvoice('${b.id}')" class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="Invoice">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-10 text-slate-500 text-sm">
            No booking history found.
          </div>
        `}
      </div>
    `;
  },

  renderAddressesTab(user) {
    // Extract unique addresses from previous bookings
    const savedAddresses = [];
    const seen = new Set();
    (this.customerBookings || []).forEach(b => {
      let addr = b.address;
      if (typeof addr === 'string') {
        try { addr = JSON.parse(addr); } catch(e) { addr = {}; }
      }
      if (addr && addr.house_flat && addr.area) {
        const key = `${addr.house_flat}-${addr.area}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          savedAddresses.push(addr);
        }
      }
    });

    return `
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <h3 class="text-xl font-black text-slate-900 mb-2">Saved Delivery Locations</h3>
        <p class="text-xs text-slate-500 mb-6">Manage residential addresses for 1-click booking checkout across Hyderabad.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          ${savedAddresses.length > 0 ? savedAddresses.map((addr, idx) => `
            <div class="border-2 border-teal-600 bg-teal-50/20 p-5 rounded-2xl relative">
              ${idx === 0 ? `<span class="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">PRIMARY</span>` : ''}
              <div class="font-bold text-slate-900 text-sm">${addr.house_flat}</div>
              <div class="text-xs text-slate-600 mt-1 leading-relaxed">
                ${addr.street ? addr.street + '<br>' : ''}
                ${addr.area}, Hyderabad - ${addr.pincode || '500001'}
              </div>
              ${addr.instructions ? `<div class="text-[11px] text-teal-700 font-medium mt-3">Notes: ${addr.instructions}</div>` : ''}
            </div>
          `).join('') : `
            <div class="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <div class="text-3xl mb-2">📍</div>
              <h4 class="text-sm font-bold text-slate-700">No saved addresses yet</h4>
              <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">When you schedule your first cleaning via our live GPS map, your Hyderabad doorstep will automatically appear here for fast re-booking.</p>
            </div>
          `}

          <div class="border border-dashed border-slate-300 p-5 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 hover:border-teal-500 hover:text-teal-700 cursor-pointer transition-colors" onclick="store.setView('book')">
            <span class="text-2xl mb-1">+</span>
            <span class="text-xs font-bold">Add Address via Booking Wizard</span>
          </div>
        </div>
      </div>
    `;
  },

  renderProfileTab(user) {
    return `
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md max-w-xl">
        <h3 class="text-xl font-black text-slate-900 mb-2">Account Profile & Verification</h3>
        <p class="text-xs text-slate-500 mb-6">Manage personal credentials and security verification statuses.</p>

        <div class="space-y-5 text-sm">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
            <input type="text" value="${user.name || ''}" readonly class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold">
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-500">Email Address</label>
              ${user.is_email_verified ? `
                <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-1">✓ Verified</span>
              ` : `
                <button onclick="App.triggerOtpFlow('${user.email}', 'email', () => CustomerPortalComponent.loadCustomerData())" class="text-[11px] font-bold text-teal-700 hover:underline bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Verify Email
                </button>
              `}
            </div>
            <input type="email" value="${user.email || ''}" readonly class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold">
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-500">Primary Phone</label>
              ${user.is_mobile_verified ? `
                <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-1">✓ Verified</span>
              ` : `
                <button onclick="App.triggerOtpFlow('${user.phone}', 'mobile', () => CustomerPortalComponent.loadCustomerData())" class="text-[11px] font-bold text-teal-700 hover:underline bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Verify Mobile
                </button>
              `}
            </div>
            <input type="text" value="${user.phone || ''}" readonly class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold">
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button onclick="NavbarComponent.handleLogout()" class="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Sign Out of Account</span>
          </button>
          <a href="https://wa.me/919800000000" target="_blank" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm">
            <span>WhatsApp Dispatch Support</span>
          </a>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.refresh();
  },

  viewBooking(bookingId) {
    store.trackingBookingId = bookingId;
    store.setView('track');
  },

  async loadCustomerData() {
    const user = store.currentUser;
    if (!user) {
      this.customerBookings = [];
      this.refresh();
      return;
    }
    try {
      const res = await ApiClient.getBookings(user.id);
      const all = res.bookings || [];
      // Strict user-isolation: ensure customers only see their own bookings
      this.customerBookings = all.filter(b => b.user_id ? String(b.user_id) === String(user.id) : (user.role === 'admin'));
      this.refresh();
    } catch (e) {
      console.error("Failed to load customer bookings", e);
      this.customerBookings = [];
      this.refresh();
    }
  },

  refresh() {
    const host = document.getElementById('customer-view-container');
    if (host) host.innerHTML = this.render();
  }
};

window.CustomerPortalComponent = CustomerPortalComponent;
