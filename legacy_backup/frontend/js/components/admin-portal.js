/**
 * Admin Business Management Portal Component
 * Includes: KPI Dashboard, Booking Management, Dynamic Pricing Engine, Technician Dispatch & Analytics
 */

const AdminPortalComponent = {
  activeTab: 'dashboard', // 'dashboard', 'bookings', 'pricing', 'technicians', 'analytics'
  allBookings: [],
  technicians: [],
  analyticsData: null,
  pricingData: null,
  selectedBooking: null,

  render() {
    return `
      <section class="py-8 bg-slate-900 min-h-screen text-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Admin Navbar Header -->
          <div class="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-[#0C4A34] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-[#0C4A34]/40 border border-emerald-500/30">
                ⚡
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-black text-white">Siri Operations HQ</h1>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                    Admin Portal
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Centralized booking dispatch, live dynamic pricing & technician fleet</p>
              </div>
            </div>

            <!-- Admin Nav Tabs -->
            <div class="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-700/60 text-xs font-bold">
              <button onclick="AdminPortalComponent.switchTab('dashboard')" class="px-3 py-2 rounded-xl transition-all ${this.activeTab === 'dashboard' ? 'bg-[#0C4A34] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                Dashboard
              </button>
              <button onclick="AdminPortalComponent.switchTab('bookings')" class="px-3 py-2 rounded-xl transition-all ${this.activeTab === 'bookings' ? 'bg-[#0C4A34] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                Bookings
              </button>
              <button onclick="AdminPortalComponent.switchTab('pricing')" class="px-3 py-2 rounded-xl transition-all ${this.activeTab === 'pricing' ? 'bg-[#0C4A34] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                💰 Dynamic Pricing
              </button>
              <button onclick="AdminPortalComponent.switchTab('technicians')" class="px-3 py-2 rounded-xl transition-all ${this.activeTab === 'technicians' ? 'bg-[#0C4A34] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                👨‍🔧 Technicians
              </button>
              <button onclick="AdminPortalComponent.switchTab('analytics')" class="px-3 py-2 rounded-xl transition-all ${this.activeTab === 'analytics' ? 'bg-[#0C4A34] text-white shadow-sm' : 'text-slate-400 hover:text-white'}">
                📈 Analytics
              </button>
            </div>
          </div>

          <!-- Tab Content Host -->
          <div id="admin-tab-host">
            ${this.renderTabContent()}
          </div>

        </div>
      </section>
    `;
  },

  renderTabContent() {
    switch (this.activeTab) {
      case 'dashboard': return this.renderDashboard();
      case 'bookings': return this.renderBookings();
      case 'pricing': return this.renderPricing();
      case 'technicians': return this.renderTechnicians();
      case 'analytics': return this.renderAnalytics();
      default: return this.renderDashboard();
    }
  },

  // 1. Dashboard Tab: KPI Cards & Today's Schedule
  renderDashboard() {
    const m = this.analyticsData ? this.analyticsData.metrics : {
      today_bookings: 12,
      pending_bookings: 7,
      completed_bookings: 31,
      total_revenue: 84520,
      cancellation_rate: 3.2
    };

    const schedule = this.analyticsData ? this.analyticsData.recent_schedule : [];

    return `
      <div class="space-y-8">
        
        <!-- KPI Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <!-- Card 1 -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-400">Today's Bookings</span>
              <span class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black">📅</span>
            </div>
            <div class="text-3xl font-black text-white mt-3 font-display">${m.today_bookings}</div>
            <div class="text-xs text-blue-400 font-semibold mt-1 flex items-center gap-1">
              <span>+3 from yesterday</span>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-400">Pending Actions</span>
              <span class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-black">⏳</span>
            </div>
            <div class="text-3xl font-black text-amber-400 mt-3 font-display">${m.pending_bookings}</div>
            <div class="text-xs text-slate-400 font-medium mt-1">Requires dispatch or confirmation</div>
          </div>

          <!-- Card 3 -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-400">Completed Jobs</span>
              <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black">✓</span>
            </div>
            <div class="text-3xl font-black text-emerald-400 mt-3 font-display">${m.completed_bookings}</div>
            <div class="text-xs text-slate-400 font-medium mt-1">99.4% Customer Satisfaction</div>
          </div>

          <!-- Card 4 -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-400">Total Revenue</span>
              <span class="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-black">₹</span>
            </div>
            <div class="text-3xl font-black text-teal-400 mt-3 font-display">₹${m.total_revenue.toLocaleString('en-IN')}</div>
            <div class="text-xs text-teal-300 font-semibold mt-1">Avg Order Value: ₹${m.average_order_value || 1650}</div>
          </div>

        </div>

        <!-- Today's Schedule Timeline -->
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-black text-white">Today's Dispatch Schedule</h3>
              <p class="text-xs text-slate-400 mt-0.5">Real-time technician assignments and execution status</p>
            </div>
            <button onclick="AdminPortalComponent.switchTab('bookings')" class="text-xs font-bold text-teal-400 hover:text-teal-300">
              View All Bookings →
            </button>
          </div>

          <div class="divide-y divide-slate-700/60">
            ${schedule.length > 0 ? schedule.map(job => `
              <div class="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="flex items-center gap-4">
                  <div class="w-20 text-xs font-mono font-bold text-teal-400">${job.service_slot}</div>
                  <div>
                    <div class="font-bold text-white text-sm flex items-center gap-2">
                      <span>${job.customer_name}</span>
                      <span class="text-xs font-mono text-slate-400">(${job.id})</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">${job.service_summary || 'Deep Sofa Cleaning'}</div>
                  </div>
                </div>

                <div class="flex items-center gap-4 self-end sm:self-center">
                  <div class="text-right">
                    <div class="text-xs text-slate-300 font-semibold">${job.technician_name ? `👨‍🔧 ${job.technician_name}` : '⚠️ Unassigned'}</div>
                    <div class="text-xs font-bold text-teal-400">₹${job.total_amount}</div>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(job.status)}">
                    ${job.status.replace('_', ' ')}
                  </span>
                  <button onclick="AdminPortalComponent.openBookingModal('${job.id}')" class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="text-center py-8 text-slate-400 text-sm">No bookings scheduled for today.</div>
            `}
          </div>
        </div>

      </div>
    `;
  },

  // 2. Bookings Management Table
  renderBookings() {
    return `
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-xl font-black text-white">All Client Bookings</h3>
            <p class="text-xs text-slate-400 mt-0.5">Filter, inspect, assign technicians, or update job status</p>
          </div>

          <!-- Status Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <button onclick="AdminPortalComponent.filterBookings('all')" class="px-3 py-1.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600">All</button>
            <button onclick="AdminPortalComponent.filterBookings('received')" class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">Received</button>
            <button onclick="AdminPortalComponent.filterBookings('confirmed')" class="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">Confirmed</button>
            <button onclick="AdminPortalComponent.filterBookings('assigned')" class="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">Assigned</button>
            <button onclick="AdminPortalComponent.filterBookings('completed')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completed</button>
          </div>
        </div>

        <!-- Bookings Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
              <tr>
                <th class="py-3.5 px-4">Booking ID</th>
                <th class="py-3.5 px-4">Customer</th>
                <th class="py-3.5 px-4">Services</th>
                <th class="py-3.5 px-4">Date & Slot</th>
                <th class="py-3.5 px-4">Technician</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4 text-right">Amount</th>
                <th class="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60">
              ${this.allBookings.map(b => `
                <tr class="hover:bg-slate-700/30 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-teal-400">${b.id}</td>
                  <td class="py-3.5 px-4 font-bold text-white">
                    ${b.customer_name}<br>
                    <span class="text-[10px] text-slate-400 font-normal">${b.customer_phone}</span>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="max-w-[200px] truncate text-slate-200">
                      ${(b.items || []).map(i => `${i.variant_name} (${i.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    ${b.service_date}<br>
                    <span class="text-[10px] text-slate-400">${b.service_slot}</span>
                  </td>
                  <td class="py-3.5 px-4 font-semibold ${b.technician_name ? 'text-teal-300' : 'text-amber-400'}">
                    ${b.technician_name || 'Unassigned'}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(b.status)}">
                      ${b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right font-black text-white">₹${b.total_amount}</td>
                  <td class="py-3.5 px-4 text-center">
                    <button onclick="AdminPortalComponent.openBookingModal('${b.id}')" class="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. Dynamic Pricing Management Tab
  renderPricing() {
    const p = this.pricingData;
    if (!p) return `<div class="p-8 text-center text-slate-400">Loading pricing models...</div>`;

    return `
      <div class="space-y-6">
        
        <!-- Live Sync Status & Control Banner -->
        <div class="bg-gradient-to-r from-teal-950 via-slate-800 to-slate-900 border border-teal-500/40 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-mono font-bold uppercase text-emerald-400">Live Dynamic Pricing Engine</span>
            </div>
            <h4 class="text-xl font-black text-white mt-1">Admin Real-Time Price Controller</h4>
            <p class="text-xs text-slate-300 mt-0.5 max-w-xl">Edit any sofa, chair, mattress or carpet rate. When you click Save, the new rates are pushed instantly to the customer-facing 3D configurator and booking wizard.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="AdminPortalComponent.saveAllPricing()" class="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap">
              <span>💾 Save All Changes Live</span>
            </button>
            <button onclick="store.setView('services')" class="px-5 py-3 rounded-2xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs border border-teal-600 transition-colors whitespace-nowrap flex items-center gap-1.5">
              <span>👁️ Verify on Customer View</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        </div>

        <!-- Quick Rate Preset Buttons -->
        <div class="flex items-center gap-2 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs">
          <span class="text-slate-400 font-bold px-2">Quick Rate Presets:</span>
          <button onclick="AdminPortalComponent.applyPreset('monsoon')" class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold">
            🌧️ Monsoon Offer (-10%)
          </button>
          <button onclick="AdminPortalComponent.applyPreset('standard')" class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold">
            ⚖️ Standard Baseline
          </button>
          <button onclick="AdminPortalComponent.applyPreset('festive')" class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold">
            🎉 Festive Special
          </button>
        </div>

        <!-- Pricing Config Cards -->
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-black text-white">System Surcharges & Taxes</h3>
              <p class="text-xs text-slate-400 mt-0.5">Applied to all Hyderabad doorstep appointments</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1">Minimum Booking Order (₹)</label>
              <input type="number" id="p-min-order" value="${p.config.min_booking_amount}" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:ring-2 focus:ring-teal-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1">Standard Service Fee (₹)</label>
              <input type="number" id="p-service-charge" value="${p.config.service_charge}" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:ring-2 focus:ring-teal-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-1">GST / Tax Percentage (%)</label>
              <input type="number" id="p-gst" value="${p.config.gst_percentage}" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:ring-2 focus:ring-teal-500">
            </div>
          </div>
        </div>

        <!-- Variants Live Price Editor Table -->
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
          <div class="mb-6">
            <h3 class="text-xl font-black text-white">Service Variants Base Price Editor</h3>
            <p class="text-xs text-slate-400 mt-0.5">Changing prices here immediately updates what customers see in the 3D Selector and Booking Wizard.</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-700">
                <tr>
                  <th class="py-3.5 px-4">Category</th>
                  <th class="py-3.5 px-4">Variant Name</th>
                  <th class="py-3.5 px-4">Unit Type</th>
                  <th class="py-3.5 px-4">Est. Time</th>
                  <th class="py-3.5 px-4">Base Price (₹)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/60">
                ${p.variants.map(v => `
                  <tr class="hover:bg-slate-700/30">
                    <td class="py-3.5 px-4 font-bold text-teal-400">${v.service_title}</td>
                    <td class="py-3.5 px-4 font-bold text-white">${v.name}</td>
                    <td class="py-3.5 px-4 text-slate-400">${v.unit_type}</td>
                    <td class="py-3.5 px-4 text-slate-400">${v.estimated_minutes} min</td>
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-1">
                        <span class="text-teal-400 font-bold">₹</span>
                        <input type="number" id="v-price-${v.id}" value="${v.base_price}" data-vid="${v.id}" class="variant-price-input w-28 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-extrabold text-sm focus:ring-2 focus:ring-teal-500">
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  // 4. Technicians Fleet Tab
  renderTechnicians() {
    return `
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-black text-white">Certified Field Fleet</h3>
            <p class="text-xs text-slate-400 mt-0.5">Manage technician availability, ratings, and job capacity</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${this.technicians.map(t => {
            const isAvailable = t.status === 'available';
            const isBusy = t.status === 'busy';

            return `
              <div class="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 font-black text-xl flex items-center justify-center">
                      ${t.name.charAt(0)}
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (isBusy ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-400')}">
                      ${t.status}
                    </span>
                  </div>

                  <h4 class="font-bold text-white text-base">${t.name}</h4>
                  <div class="text-xs text-slate-400 font-mono mt-0.5">${t.phone}</div>

                  <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                    <span>Rating: <strong class="text-amber-400">★ ${t.rating}</strong></span>
                    <span>Jobs: <strong class="text-white">${t.jobs_completed}</strong></span>
                  </div>
                </div>

                <div class="mt-5 pt-3 border-t border-slate-800">
                  <label class="block text-[10px] text-slate-500 font-bold uppercase mb-1">Change Status</label>
                  <select onchange="AdminPortalComponent.updateTechStatus(${t.id}, this.value)" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                    <option value="available" ${isAvailable ? 'selected' : ''}>Available</option>
                    <option value="busy" ${isBusy ? 'selected' : ''}>Busy (On Job)</option>
                    <option value="off_duty" ${t.status === 'off_duty' ? 'selected' : ''}>Off Duty</option>
                  </select>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // 5. Analytics Tab
  renderAnalytics() {
    const a = this.analyticsData;
    if (!a) return `<div class="p-8 text-center text-slate-400">Loading analytics...</div>`;

    return `
      <div class="space-y-8">
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Services Breakdown Card -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
            <h3 class="text-xl font-black text-white mb-1">Most Booked Services</h3>
            <p class="text-xs text-slate-400 mb-6">Revenue and volume contribution by category</p>

            <div class="space-y-4">
              ${(a.services_breakdown || []).map(s => {
                const totalRev = a.metrics.total_revenue || 1;
                const pct = Math.min(100, Math.round((s.service_revenue / totalRev) * 100));
                return `
                  <div>
                    <div class="flex justify-between text-xs font-bold mb-1">
                      <span class="text-white">${s.service_name} (${s.bookings_count} orders)</span>
                      <span class="text-teal-400">₹${s.service_revenue.toLocaleString('en-IN')} (${pct}%)</span>
                    </div>
                    <div class="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style="width: ${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Key Operational Ratios -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8">
            <h3 class="text-xl font-black text-white mb-1">Operational Health</h3>
            <p class="text-xs text-slate-400 mb-6">Quality benchmarks and conversion efficiency</p>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
                <div class="text-xs text-slate-400">Cancellation Rate</div>
                <div class="text-2xl font-black text-emerald-400 mt-1">${a.metrics.cancellation_rate}%</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Industry avg: 8.5%</div>
              </div>

              <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
                <div class="text-xs text-slate-400">Average Booking Value</div>
                <div class="text-2xl font-black text-teal-400 mt-1">₹${a.metrics.average_order_value}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Across all cities</div>
              </div>

              <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
                <div class="text-xs text-slate-400">Repeat Customer Ratio</div>
                <div class="text-2xl font-black text-blue-400 mt-1">42.8%</div>
                <div class="text-[11px] text-slate-500 mt-0.5">30-day retention</div>
              </div>

              <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
                <div class="text-xs text-slate-400">Customer Rating</div>
                <div class="text-2xl font-black text-amber-400 mt-1">★ 4.92</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Based on 300+ reviews</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // Modal: Manage Booking (Confirm, Assign Technician, Complete, Reschedule, Cancel)
  openBookingModal(bookingId) {
    const b = this.allBookings.find(x => x.id === bookingId);
    if (!b) return;
    this.selectedBooking = b;

    const modalHtml = `
      <div id="admin-booking-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl">
          
          <div class="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
            <div>
              <span class="font-mono text-xl font-black text-teal-400">${b.id}</span>
              <div class="text-xs text-slate-400 mt-0.5">${b.service_date} at ${b.service_slot}</div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(b.status)}">
              ${b.status.replace('_', ' ')}
            </span>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <strong class="text-slate-400 block mb-1">Customer Information:</strong>
              <div class="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div class="font-bold text-white text-sm">${b.customer_name} (${b.customer_phone})</div>
                <div class="text-slate-300 mt-1">${b.address.house_flat}, ${b.address.street}, ${b.address.area}, ${b.address.city} - ${b.address.pincode}</div>
                ${b.notes ? `<div class="text-teal-400 mt-1">Note: ${b.notes}</div>` : ''}
              </div>
            </div>

            <div>
              <strong class="text-slate-400 block mb-1">Service Items & Total:</strong>
              <div class="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                ${(b.items || []).map(i => `
                  <div class="flex justify-between">
                    <span>${i.variant_name} × ${i.quantity}</span>
                    <span class="font-bold text-white">₹${i.total_price}</span>
                  </div>
                `).join('')}
                <div class="pt-2 border-t border-slate-700 flex justify-between font-black text-teal-400 text-sm">
                  <span>Grand Total:</span>
                  <span>₹${b.total_amount}</span>
                </div>
              </div>
            </div>

            <!-- Technician Assignment Dropdown -->
            <div>
              <strong class="text-slate-400 block mb-1">Assign Technician:</strong>
              <div class="flex gap-2">
                <select id="modal-tech-select" class="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs">
                  <option value="">-- Choose Field Specialist --</option>
                  ${this.technicians.map(t => `
                    <option value="${t.id}" ${b.technician_id === t.id ? 'selected' : ''}>
                      ${t.name} (${t.status} - ★ ${t.rating})
                    </option>
                  `).join('')}
                </select>
                <button onclick="AdminPortalComponent.assignTechnician('${b.id}')" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs">
                  Assign
                </button>
              </div>
            </div>

            <!-- Status Transition Buttons -->
            <div>
              <strong class="text-slate-400 block mb-2">Update Workflow Status:</strong>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button onclick="AdminPortalComponent.updateStatus('${b.id}', 'confirmed')" class="p-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-200 font-bold text-xs transition-colors">
                  Confirm
                </button>
                <button onclick="AdminPortalComponent.updateStatus('${b.id}', 'cleaning_started')" class="p-2 rounded-xl bg-amber-600/30 hover:bg-amber-600 border border-amber-500/40 text-amber-200 font-bold text-xs transition-colors">
                  Start Cleaning
                </button>
                <button onclick="AdminPortalComponent.updateStatus('${b.id}', 'completed')" class="p-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition-colors">
                  Mark Complete
                </button>
                <button onclick="AdminPortalComponent.updateStatus('${b.id}', 'cancelled')" class="p-2 rounded-xl bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-200 font-bold text-xs transition-colors">
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800 text-right">
            <button onclick="document.getElementById('admin-booking-modal').remove()" class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async assignTechnician(bookingId) {
    const sel = document.getElementById('modal-tech-select');
    if (!sel || !sel.value) {
      alert("Please select a technician");
      return;
    }

    try {
      await ApiClient.assignTechnician(bookingId, parseInt(sel.value));
      alert(`Technician assigned to booking ${bookingId}!`);
      document.getElementById('admin-booking-modal')?.remove();
      this.loadAdminData();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    }
  },

  async updateStatus(bookingId, newStatus) {
    try {
      await ApiClient.updateBookingStatus(bookingId, newStatus);
      alert(`Booking status set to ${newStatus}`);
      document.getElementById('admin-booking-modal')?.remove();
      this.loadAdminData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  },

  applyPreset(preset) {
    const inputs = document.querySelectorAll('.variant-price-input');
    inputs.forEach(inp => {
      let cur = parseFloat(inp.value);
      if (preset === 'monsoon') {
        inp.value = Math.round(cur * 0.9);
      } else if (preset === 'festive') {
        inp.value = Math.round(cur * 1.15);
      } else if (preset === 'standard') {
        const vid = parseInt(inp.getAttribute('data-vid'));
        const original = this.pricingData?.variants?.find(v => v.id === vid);
        if (original) inp.value = original.base_price;
      }
    });
    alert(`Preset '${preset}' applied to input table! Click 'Save All Changes Live' to persist.`);
  },

  async saveAllPricing() {
    const minOrder = parseFloat(document.getElementById('p-min-order')?.value) || 499;
    const serviceFee = parseFloat(document.getElementById('p-service-charge')?.value) || 49;
    const gst = parseFloat(document.getElementById('p-gst')?.value) || 18;

    const variantInputs = document.querySelectorAll('.variant-price-input');
    const variants = [];
    variantInputs.forEach(inp => {
      variants.push({
        id: parseInt(inp.getAttribute('data-vid')),
        base_price: parseFloat(inp.value)
      });
    });

    try {
      await ApiClient.updatePricing({
        min_booking_amount: minOrder,
        service_charge: serviceFee,
        gst_percentage: gst
      }, variants);

      // Refresh store catalog
      await store.loadInitialData();
      alert("✅ All prices and surcharges updated live across the entire system!");
      this.loadAdminData();
    } catch (err) {
      alert(`Pricing update failed: ${err.message}`);
    }
  },

  async updateTechStatus(techId, newStatus) {
    try {
      await ApiClient.updateTechnician(techId, newStatus);
      alert("Technician availability updated");
      this.loadAdminData();
    } catch (err) {
      alert(`Error updating technician: ${err.message}`);
    }
  },

  async filterBookings(status) {
    try {
      const res = await ApiClient.getBookings(null, status);
      this.allBookings = res.bookings || [];
      this.refresh();
    } catch (e) {
      console.error(e);
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.refresh();
  },

  async loadAdminData() {
    try {
      const [bRes, tRes, aRes, pRes] = await Promise.all([
        ApiClient.getBookings(),
        ApiClient.getTechnicians(),
        ApiClient.getAnalytics(),
        ApiClient.getPricing()
      ]);

      this.allBookings = bRes.bookings || [];
      this.technicians = tRes.technicians || [];
      this.analyticsData = aRes;
      this.pricingData = pRes;
      this.refresh();
    } catch (err) {
      console.error("Admin data loading failed", err);
      if (err.message && (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized'))) {
        store.setView('admin'); // Will render access denied or staff gateway
      }
    }
  },

  refresh() {
    const host = document.getElementById('admin-view-container');
    if (host) host.innerHTML = this.render();
  }
};

window.AdminPortalComponent = AdminPortalComponent;
