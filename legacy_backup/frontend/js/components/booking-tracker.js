/**
 * Booking Tracking Component with Visual Timeline
 */

const BookingTrackerComponent = {
  currentBooking: null,
  isLoading: false,

  reset() {
    this.currentBooking = null;
    this.isLoading = false;
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn("Tracker map cleanup notice", e);
      }
      this.map = null;
    }
    const input = document.getElementById('track-id-input');
    if (input) input.value = '';
    const errEl = document.getElementById('track-search-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
    const host = document.getElementById('tracker-content-host');
    if (host) {
      host.innerHTML = this.renderInitialSearchPrompt();
    }
    document.getElementById('invoice-modal')?.remove();
    document.getElementById('reschedule-modal')?.remove();
  },

  render() {
    return `
      <section class="py-12 bg-slate-50 min-h-screen">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          
          <!-- Search Header Bar -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md shadow-slate-200/40 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-teal-700">Real-time Service Dispatch</span>
              <h2 class="text-2xl font-black text-slate-900">Track Your Booking</h2>
            </div>

            <!-- Booking Search Input -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div class="relative flex-1 sm:w-56">
                <input type="text" id="track-id-input" value="${store.trackingBookingId || ''}" 
                  onkeydown="if(event.key==='Enter') BookingTrackerComponent.searchBooking()"
                  placeholder="Enter SIRI-XXXXXX" 
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none">
                <div id="track-search-error" class="hidden absolute top-full left-0 mt-1 text-[11px] text-red-600 font-bold bg-white px-2 py-0.5 rounded shadow-md border border-red-200 z-10 whitespace-nowrap"></div>
              </div>
              <button onclick="BookingTrackerComponent.searchBooking()" class="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition-colors flex-shrink-0">
                Track
              </button>
            </div>
          </div>

          <!-- Dynamic Booking Detail Container -->
          <div id="tracker-content-host">
            ${store.trackingBookingId ? BookingTrackerComponent.renderLoadingState() : BookingTrackerComponent.renderInitialSearchPrompt()}
          </div>

        </div>
      </section>
    `;
  },

  renderInitialSearchPrompt() {
    return `
      <div class="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-md">
        <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
          🧭
        </div>
        <h3 class="text-2xl font-black text-slate-900">Live Technician GPS & Status Tracking</h3>
        <p class="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
          Enter your unique Booking Reference ID above (e.g. <strong class="font-mono text-teal-800">SIRI-XXXXXX</strong>) to track technician dispatch, transit route, and live hygiene progress in Hyderabad.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <button onclick="store.setView('book')" class="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all">
            Schedule New Cleaning
          </button>
          <button onclick="store.setView('customer')" class="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors">
            View My Past Bookings
          </button>
        </div>
      </div>
    `;
  },

  renderLoadingState() {
    return `
      <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <div class="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-500 font-medium text-sm">Fetching real-time dispatch coordinates & technician status...</p>
      </div>
    `;
  },

  sanitizeBooking(b) {
    if (!b) return null;
    let addr = b.address;
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch (e) { addr = {}; }
    } else if (!addr && b.address_json) {
      try { addr = JSON.parse(b.address_json); } catch (e) { addr = {}; }
    }
    b.address = addr || {};
    if (!b.address.house_flat) b.address.house_flat = '';
    if (!b.address.street) b.address.street = '';
    if (!b.address.area) b.address.area = 'Hyderabad';
    if (!b.address.city) b.address.city = 'Hyderabad';
    if (!b.address.pincode) b.address.pincode = '500034';
    if (!Array.isArray(b.items)) b.items = [];
    if (!b.status) b.status = 'confirmed';
    return b;
  },

  renderBookingDetails(rawB) {
    const b = this.sanitizeBooking(rawB);
    if (!b) return this.renderInitialSearchPrompt();

    const statuses = [
      { key: 'received', title: 'Booking Received', desc: 'Order details recorded in system' },
      { key: 'confirmed', title: 'Booking Confirmed', desc: 'Equipment & inventory allocated' },
      { key: 'assigned', title: 'Professional Assigned', desc: 'Verified technician dispatched' },
      { key: 'cleaning_started', title: 'Cleaning Started', desc: '6-step hygiene process underway' },
      { key: 'completed', title: 'Cleaning Completed', desc: 'Sanitized & inspected with customer' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === b.status);
    const isCancelled = b.status === 'cancelled';

    return `
      <div class="space-y-6">
        
        <!-- Status Banner Card -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-200/50">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xl font-black text-slate-900">${b.id}</span>
                <span class="px-3 py-0.5 rounded-full text-xs font-bold uppercase ${BookingTrackerComponent.getStatusBadgeClass(b.status)}">
                  ${b.status.replace('_', ' ')}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">Booked on ${new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-2">
              <button onclick="BookingTrackerComponent.openInvoice('${b.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>View Invoice</span>
              </button>
              ${b.status !== 'completed' && b.status !== 'cancelled' ? `
                <button onclick="BookingTrackerComponent.openRescheduleModal('${b.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors">
                  Reschedule
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Visual Timeline Progress -->
          ${isCancelled ? `
            <div class="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2">
              <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
              <span>This booking has been cancelled. For refunds or rebooking, please contact support.</span>
            </div>
          ` : `
            <div class="pt-8 pb-4">
              <div class="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                
                ${statuses.map((st, idx) => {
                  const isDone = idx < currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;
                  const isFuture = idx > currentStatusIndex;

                  return `
                    <div class="flex-1 relative flex md:flex-col items-start md:items-center text-left md:text-center group">
                      
                      <!-- Timeline Node Dot -->
                      <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all flex-shrink-0 ${isDone ? 'bg-teal-600 text-white shadow-md' : (isCurrent ? 'bg-teal-700 text-white ring-4 ring-teal-200 pulse-node' : 'bg-slate-100 text-slate-400 border border-slate-200')}">
                        ${isDone ? `
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        ` : (idx + 1)}
                      </div>

                      <!-- Node Label -->
                      <div class="ml-4 md:ml-0 md:mt-3">
                        <div class="font-extrabold text-sm ${isCurrent ? 'text-teal-900 font-display' : (isDone ? 'text-slate-800' : 'text-slate-400')}">
                          ${st.title}
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5 max-w-[140px] leading-tight">
                          ${st.desc}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}

              </div>
            </div>
          `}
        </div>

        <!-- Live Hyderabad Transit Map (100% Free OpenStreetMap) -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">Live Hyderabad Transit Route</h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">Free Live GPS</span>
            </div>
            <div class="text-xs text-slate-500">
              ${b.technician_name ? `Specialist <strong>${b.technician_name}</strong> en route with high-pressure kit` : 'Technician dispatch route will appear once assigned'}
            </div>
          </div>

          <div id="booking-tracking-live-map" style="height: 240px; border-radius: 14px; z-index: 1;" class="w-full shadow-inner border border-slate-200"></div>

          <div class="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-3 border-t border-slate-100 text-slate-600">
            <div>
              <span class="font-bold text-slate-800">Doorstep:</span> ${b.address?.house_flat ? b.address.house_flat + ', ' : ''}${b.address?.street ? b.address.street + ', ' : ''}${b.address?.area || 'Hyderabad'}, ${b.address?.city || 'Hyderabad'}${b.address?.pincode ? ' - ' + b.address.pincode : ''}
            </div>
            <div class="font-mono text-teal-700 font-bold">
              Scheduled Slot: ${b.service_date} (${b.service_slot})
            </div>
          </div>
        </div>

        <!-- Two Columns: Assigned Technician + Appointment Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Technician Card -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Assigned Cleaning Specialist</h4>
            
            ${b.technician_name ? `
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-teal-700/20">
                  ${b.technician_name.charAt(0)}
                </div>
                <div>
                  <h5 class="text-lg font-black text-slate-900">${b.technician_name}</h5>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="flex items-center text-amber-500 text-xs font-bold">
                      ★ 4.9 <span class="text-slate-400 ml-1 font-normal">(140+ jobs)</span>
                    </span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span class="text-xs font-semibold text-teal-700">Verified Specialist</span>
                  </div>
                  <div class="text-xs font-mono font-medium text-slate-500 mt-1">${b.technician_phone || '+91 98480 11223'}</div>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <span class="text-teal-600">🛡️</span>
                  <span>Police Verified</span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <span class="text-teal-600">🧴</span>
                  <span>Hospital-Grade Kit</span>
                </div>
              </div>

              <div class="mt-4">
                <a href="tel:${b.technician_phone || '+919848011223'}" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2">
                  <svg class="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>Call Technician Directly</span>
                </a>
              </div>
            ` : `
              <div class="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 text-center">
                <div class="text-amber-700 font-bold text-sm mb-1">Technician Dispatch Pending</div>
                <p class="text-xs text-amber-800/80">Our service supervisor is reviewing current team routes to assign the nearest certified technician to your location.</p>
              </div>
            `}
          </div>

          <!-- Appointment Summary -->
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Appointment Details</h4>
            
            <div class="flex items-center justify-between py-2 border-b border-slate-100">
              <span class="text-xs text-slate-500">Service Date & Time</span>
              <span class="text-sm font-black text-slate-900">${b.service_date} at ${b.service_slot}</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-slate-100">
              <span class="text-xs text-slate-500">Service Location</span>
              <span class="text-xs font-semibold text-slate-800 text-right max-w-[220px]">
                ${b.address?.house_flat ? b.address.house_flat + ', ' : ''}${b.address?.street ? b.address.street + ', ' : ''}${b.address?.area || 'Hyderabad'}, ${b.address?.city || 'Hyderabad'}${b.address?.pincode ? ' - ' + b.address.pincode : ''}
              </span>
            </div>

            <div class="py-2 border-b border-slate-100">
              <div class="text-xs text-slate-500 mb-1.5">Selected Items</div>
              <div class="space-y-1">
                ${(b.items || []).map(it => `
                  <div class="flex justify-between text-xs font-bold text-slate-800">
                    <span>${it.variant_name} × ${it.quantity}</span>
                    <span>₹${it.total_price}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-xs font-bold text-slate-700">Total Payable</span>
              <span class="text-lg font-black text-teal-700">₹${b.total_amount}</span>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'received': return 'badge-status-received';
      case 'confirmed': return 'badge-status-confirmed';
      case 'assigned': return 'badge-status-assigned';
      case 'cleaning_started': return 'badge-status-cleaning_started';
      case 'completed': return 'badge-status-completed';
      case 'cancelled': return 'badge-status-cancelled';
      default: return 'bg-slate-100 text-slate-700';
    }
  },

  async loadBooking(bookingId) {
    const host = document.getElementById('tracker-content-host');
    const input = document.getElementById('track-id-input');
    const errEl = document.getElementById('track-search-error');
    if (input && bookingId) input.value = bookingId;
    if (errEl) errEl.classList.add('hidden');
    if (host) host.innerHTML = BookingTrackerComponent.renderLoadingState();

    try {
      const res = await ApiClient.getBookingById(bookingId);
      const sanitized = this.sanitizeBooking(res.booking);
      this.currentBooking = sanitized;
      if (host) host.innerHTML = BookingTrackerComponent.renderBookingDetails(sanitized);
      setTimeout(() => {
        BookingTrackerComponent.initTrackingMap(sanitized);
      }, 80);
    } catch (err) {
      if (host) {
        host.innerHTML = `
          <div class="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <div class="text-3xl mb-2">🔍</div>
            <h4 class="text-lg font-bold text-slate-900">Booking ${bookingId} not found</h4>
            <p class="text-xs text-slate-500 mt-1">Please double check your booking reference code (e.g. SIRI-123456) or create a new booking.</p>
          </div>
        `;
      }
    }
  },

  searchBooking() {
    const input = document.getElementById('track-id-input');
    const errEl = document.getElementById('track-search-error');
    if (!input) return;
    let id = input.value.trim().toUpperCase();
    if (!id) {
      if (errEl) {
        errEl.textContent = 'Please enter a Booking ID (e.g. SIRI-123456)';
        errEl.classList.remove('hidden');
      }
      input.focus();
      return;
    }
    // Auto prefix SIRI- if 6 digits or raw alphanumeric without prefix
    if (/^\d{6}$/.test(id)) {
      id = 'SIRI-' + id;
      input.value = id;
    } else if (!id.startsWith('SIRI-') && /^[A-Z0-9]+$/.test(id)) {
      id = 'SIRI-' + id;
      input.value = id;
    }
    if (errEl) errEl.classList.add('hidden');
    store.trackingBookingId = id;
    this.loadBooking(id);
  },

  openInvoice(bookingId) {
    if (!this.currentBooking) return;
    const b = this.currentBooking;
    const subtotal = b.subtotal || b.total_amount || 0;
    const discount = b.discount || 0;
    const serviceCharge = b.service_charge || 49;
    const tax = b.tax || Math.round(subtotal * 0.18);
    const totalAmount = b.total_amount || (subtotal - discount + serviceCharge + tax);
    
    const invoiceHtml = `
      <div id="invoice-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100">
          <div class="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
            <div>
              <h3 class="text-xl font-black text-slate-900">TAX INVOICE</h3>
              <div class="text-xs text-teal-700 font-bold">Siri Sofa Services Pvt. Ltd.</div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">GSTIN: 36AAACS1234F1Z8</div>
            </div>
            <div class="text-right">
              <div class="font-mono font-bold text-sm text-slate-800">${b.id}</div>
              <div class="text-xs text-slate-400">${b.service_date}</div>
            </div>
          </div>

          <div class="text-xs text-slate-600 mb-4">
            <strong>Billed To:</strong> ${b.customer_name} (${b.customer_phone})<br>
            ${b.address?.house_flat ? b.address.house_flat + ', ' : ''}${b.address?.street ? b.address.street + ', ' : ''}${b.address?.area || 'Hyderabad'}, ${b.address?.city || 'Hyderabad'}${b.address?.pincode ? ' - ' + b.address.pincode : ''}
          </div>

          <table class="w-full text-xs text-left border-collapse mb-4">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400">
                <th class="py-1">Description</th>
                <th class="py-1 text-center">Qty</th>
                <th class="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${(b.items || []).map(it => `
                <tr>
                  <td class="py-2 font-medium">${it.variant_name} (${it.service_name || 'Cleaning'})</td>
                  <td class="py-2 text-center">${it.quantity}</td>
                  <td class="py-2 text-right font-bold">₹${it.total_price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
            <div class="flex justify-between"><span>Subtotal:</span><span>₹${subtotal}</span></div>
            ${discount > 0 ? `<div class="flex justify-between text-emerald-600"><span>Discount:</span><span>− ₹${discount}</span></div>` : ''}
            <div class="flex justify-between"><span>Service Fee:</span><span>₹${serviceCharge}</span></div>
            <div class="flex justify-between"><span>GST (18%):</span><span>₹${tax}</span></div>
            <div class="flex justify-between font-black text-sm text-slate-900 pt-2 border-t">
              <span>Total Paid / Payable:</span>
              <span class="text-teal-700">₹${totalAmount}</span>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="window.print()" class="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors">
              Print / Save PDF
            </button>
            <button onclick="document.getElementById('invoice-modal').remove()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', invoiceHtml);
  },

  openRescheduleModal(bookingId) {
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = (this.currentBooking && this.currentBooking.service_date && this.currentBooking.service_date >= today) 
      ? this.currentBooking.service_date 
      : (store.getDefaultDate() || today);

    const modalHtml = `
      <div id="reschedule-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
          <h3 class="text-xl font-black text-slate-900 mb-1">Reschedule Cleaning</h3>
          <p class="text-xs text-slate-500 mb-4">Choose a new service date and preferred inspection slot.</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">New Service Date *</label>
              <input type="date" id="reschedule-date" min="${today}" value="${defaultDate}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <div id="reschedule-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">New Time Slot *</label>
              <select id="reschedule-slot" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none">
                <option value="09:00 AM">09:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="BookingTrackerComponent.confirmReschedule('${bookingId}')" class="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors">
              Confirm Reschedule
            </button>
            <button onclick="document.getElementById('reschedule-modal').remove()" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async confirmReschedule(bookingId) {
    const newDate = document.getElementById('reschedule-date')?.value;
    const newSlot = document.getElementById('reschedule-slot')?.value;
    const errEl = document.getElementById('reschedule-err');
    if (errEl) errEl.classList.add('hidden');

    const today = new Date().toISOString().split('T')[0];
    if (!newDate) {
      if (errEl) { errEl.textContent = "Please choose a valid service date."; errEl.classList.remove('hidden'); }
      return;
    }
    if (newDate < today) {
      if (errEl) { errEl.textContent = "Service date cannot be in the past."; errEl.classList.remove('hidden'); }
      return;
    }
    if (!newSlot) {
      if (errEl) { errEl.textContent = "Please select a preferred time slot."; errEl.classList.remove('hidden'); }
      return;
    }

    try {
      await ApiClient.rescheduleBooking(bookingId, newDate, newSlot);
      alert("✅ Booking successfully rescheduled!");
      document.getElementById('reschedule-modal')?.remove();
      this.loadBooking(bookingId);
    } catch (err) {
      if (errEl) {
        errEl.textContent = `Reschedule failed: ${err.message}`;
        errEl.classList.remove('hidden');
      } else {
        alert(`Reschedule failed: ${err.message}`);
      }
    }
  },

  map: null,

  initTrackingMap(b) {
    const mapEl = document.getElementById('booking-tracking-live-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn("Tracker map cleanup notice", e);
      }
      this.map = null;
    }
    if (mapEl._leaflet_id) {
      mapEl._leaflet_id = null;
    }

    const hydAreaCoords = {
      'banjara hills': [17.4156, 78.4357],
      'jubilee hills': [17.4319, 78.4073],
      'gachibowli': [17.4401, 78.3489],
      'madhapur': [17.4483, 78.3813],
      'kondapur': [17.4699, 78.3578],
      'kukatpally': [17.4938, 78.4018],
      'secunderabad': [17.4399, 78.4983],
      'begumpet': [17.4447, 78.4664],
      'somajiguda': [17.4260, 78.4550],
      'manikonda': [17.3995, 78.3769],
      'financial district': [17.4168, 78.3414],
      'tellapur': [17.4722, 78.2974],
      'nallagandla': [17.4789, 78.3188],
      'mehdipatnam': [17.3916, 78.4398],
      'dilsukhnagar': [17.3688, 78.5247],
      'lb nagar': [17.3457, 78.5522],
      'ameerpet': [17.4375, 78.4482],
      'sr nagar': [17.4437, 78.4439],
      'uppal': [17.4018, 78.5602]
    };

    let destLat = (b.address && b.address.lat) ? Number(b.address.lat) : 17.4156;
    let destLng = (b.address && b.address.lng) ? Number(b.address.lng) : 78.4357;

    if ((!b.address || !b.address.lat) && b.address && b.address.area) {
      const cleanArea = b.address.area.toLowerCase().trim();
      for (const [key, coords] of Object.entries(hydAreaCoords)) {
        if (cleanArea.includes(key)) {
          destLat = coords[0];
          destLng = coords[1];
          break;
        }
      }
    }

    // Position technician slightly offset (~1.4 km) in transit
    const techLat = destLat + 0.011;
    const techLng = destLng - 0.013;

    try {
      this.map = L.map('booking-tracking-live-map', {
        center: [destLat, destLng],
        zoom: 14,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      // Customer Doorstep Marker
      const doorstepIcon = L.divIcon({
        className: 'custom-doorstep-pin',
        html: `
          <div style="background: #0f172a; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15,23,42,0.5); border: 2.5px solid white; font-size: 16px;">
            🏠
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([destLat, destLng], { icon: doorstepIcon })
        .addTo(this.map)
        .bindPopup(`<b>Your Doorstep</b><br>${b.address?.house_flat || ''}, ${b.address?.area || 'Hyderabad'}`)
        .openPopup();

      // Technician Marker
      const techIcon = L.divIcon({
        className: 'custom-tech-pin',
        html: `
          <div style="background: linear-gradient(135deg, #0d9488, #059669); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(13,148,136,0.6); border: 2.5px solid white; font-size: 18px;">
            🛵
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([techLat, techLng], { icon: techIcon })
        .addTo(this.map)
        .bindPopup(`<b>${b.technician_name || 'Service Specialist'}</b><br>Equipped with extraction machines`);

      // Draw dashed transit polyline
      L.polyline([[techLat, techLng], [destLat, destLng]], {
        color: '#0d9488',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(this.map);

      this.map.fitBounds([[techLat, techLng], [destLat, destLng]], { padding: [40, 40] });

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 150);
    } catch (e) {
      console.error("Tracker map init failed:", e);
    }
  }
};

window.BookingTrackerComponent = BookingTrackerComponent;
