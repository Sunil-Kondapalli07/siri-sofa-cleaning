/**
 * 5-Step Booking Wizard Component
 */

const BookingWizardComponent = {
  slotsCache: [],
  isSubmitting: false,

  render() {
    const step = store.wizard.step;
    const calc = store.getCartCalculations();

    return `
      <section class="py-12 bg-slate-50 min-h-screen">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          
          <!-- Wizard Card Container -->
          <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
            
            <!-- Stepper Progress Bar Header -->
            <div class="bg-slate-900 text-white p-6 sm:p-8">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-teal-400 font-bold text-xs uppercase tracking-wider">Step ${step} of 5</span>
                  <h2 class="text-2xl font-black text-white mt-0.5">${BookingWizardComponent.getStepTitle(step)}</h2>
                </div>
                <div class="text-right hidden sm:block">
                  <div class="text-xs text-slate-400">Estimated Total</div>
                  <div class="text-xl font-extrabold text-teal-400">₹${calc.total}</div>
                </div>
              </div>

              <!-- Stepper Indicator -->
              <div class="flex items-center gap-2">
                ${[1, 2, 3, 4, 5].map(s => {
                  const isDone = s < step;
                  const isCurrent = s === step;
                  return `
                    <div class="flex-1 flex flex-col items-center">
                      <div class="w-full h-2 rounded-full transition-all ${isDone ? 'bg-teal-400' : (isCurrent ? 'bg-teal-500 ring-2 ring-teal-300' : 'bg-slate-700')}"></div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Wizard Step Body -->
            <div class="p-6 sm:p-10">
              ${BookingWizardComponent.renderStepContent(step, calc)}
            </div>

            <!-- Wizard Step Navigation Buttons -->
            <div class="bg-slate-50 border-t border-slate-200/80 px-6 sm:px-10 py-5 flex items-center justify-between">
              ${step > 1 ? `
                <button onclick="BookingWizardComponent.prevStep()" class="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors text-sm flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  <span>Back</span>
                </button>
              ` : `<div></div>`}

              ${step < 5 ? `
                <button onclick="BookingWizardComponent.nextStep()" class="px-7 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 transition-all text-sm flex items-center gap-2">
                  <span>Continue</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              ` : (store.currentUser ? `
                <button id="confirm-booking-btn" onclick="BookingWizardComponent.submitBooking()" class="px-8 py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-teal-600/25 transition-all text-base flex items-center gap-2">
                  <span>Confirm & Schedule Cleaning</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </button>
              ` : `
                <button id="confirm-booking-btn" onclick="BookingWizardComponent.promptAuthBeforeBooking()" class="px-8 py-3.5 rounded-xl font-black text-white bg-amber-600 hover:bg-amber-500 shadow-xl shadow-amber-600/25 transition-all text-base flex items-center gap-2">
                  <span>🔒 Sign In to Confirm Appointment</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </button>
              `)}
            </div>

          </div>
        </div>
      </section>
    `;
  },

  getStepTitle(step) {
    switch (step) {
      case 1: return "Select Cleaning Categories";
      case 2: return "Customize Quantities & Items";
      case 3: return "Service Location & Contact";
      case 4: return "Pick Date & Inspection Slot";
      case 5: return "Review & Confirm Booking";
      default: return "Booking Wizard";
    }
  },

  renderStepContent(step, calc) {
    switch (step) {
      case 1: return BookingWizardComponent.renderStep1();
      case 2: return BookingWizardComponent.renderStep2(calc);
      case 3: return BookingWizardComponent.renderStep3();
      case 4: return BookingWizardComponent.renderStep4();
      case 5: return BookingWizardComponent.renderStep5(calc);
    }
  },

  // Step 1: Categories Multi-select
  renderStep1() {
    const categories = [
      { slug: 'sofa', icon: '🛋️', title: 'Sofa Cleaning', desc: 'Fabric, velvet, leather, recliners, sectional sets' },
      { slug: 'chair', icon: '🪑', title: 'Chair Cleaning', desc: 'Dining chairs, ergonomic office chairs, armchairs' },
      { slug: 'mattress', icon: '🛏️', title: 'Mattress Sanitization', desc: 'Anti-mite steam shampoo for Single, Queen, King' },
      { slug: 'carpet', icon: '🧶', title: 'Carpet & Rug Cleaning', desc: 'Rotary scrubber extraction for all rug sizes' }
    ];

    return `
      <div>
        <p class="text-slate-600 text-sm mb-6">What items would you like deep-cleaned? You can select multiple:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${categories.map(cat => {
            const isSelected = store.wizard.selectedCategories.includes(cat.slug);
            return `
              <div onclick="BookingWizardComponent.toggleCategory('${cat.slug}')" class="cursor-pointer border-2 ${isSelected ? 'border-teal-600 bg-teal-50/30' : 'border-slate-200 hover:border-slate-300'} rounded-2xl p-5 transition-all flex items-start justify-between">
                <div class="flex items-start gap-3.5">
                  <span class="text-3xl">${cat.icon}</span>
                  <div>
                    <h4 class="font-bold text-slate-900 text-base">${cat.title}</h4>
                    <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${cat.desc}</p>
                  </div>
                </div>
                <div class="w-6 h-6 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}">
                  ${isSelected ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Step 2: Quantities of Selected Categories
  renderStep2(calc) {
    const selectedSlugs = store.wizard.selectedCategories;
    const services = store.services.filter(s => selectedSlugs.includes(s.slug));

    return `
      <div class="space-y-8">
        <p class="text-slate-600 text-sm">Specify the number of seats or units. Prices are calculated dynamically based on verified rates.</p>

        ${services.map(svc => `
          <div class="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
            <h4 class="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <span>${ServiceSelectorComponent.getIcon(svc.slug)}</span>
              <span>${svc.title}</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${(svc.variants || []).map(v => {
                const qty = store.getItemQuantity(v.id);
                return `
                  <div class="bg-white p-4 rounded-xl border ${qty > 0 ? 'border-teal-500 shadow-sm' : 'border-slate-200'} flex items-center justify-between">
                    <div>
                      <div class="font-bold text-slate-800 text-sm">${v.name}</div>
                      <div class="text-xs font-extrabold text-teal-700">₹${v.base_price} <span class="font-normal text-slate-400">/ ${v.unit_type}</span></div>
                    </div>

                    <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <button onclick="BookingWizardComponent.updateQty(${v.id}, ${qty - 1})" class="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-sm" ${qty === 0 ? 'disabled' : ''}>−</button>
                      <span class="w-5 text-center font-bold text-xs">${qty}</span>
                      <button onclick="BookingWizardComponent.updateQty(${v.id}, ${qty + 1})" class="w-7 h-7 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}

        <!-- Subtotal Preview -->
        <div class="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
          <div class="text-xs text-teal-900">
            <span class="font-bold">${calc.itemCount} items selected</span> • Subtotal: ₹${calc.subtotal}
          </div>
          <div class="text-sm font-black text-teal-900">
            Estimated Total: ₹${calc.total}
          </div>
        </div>
      </div>
    `;
  },

  // Step 3: Location Details with Free Live OpenStreetMap & GPS
  renderStep3() {
    const user = store.currentUser || {};
    const addr = store.wizard.address;
    const nameVal = addr.name || user.name || '';
    const phoneVal = addr.phone || user.phone || '';
    const emailVal = addr.email || user.email || '';

    return `
      <div class="space-y-5">
        ${!store.currentUser ? `
          <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-left">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🔒</span>
              <div>
                <div class="text-xs font-bold text-amber-900">Sign in for faster booking & saved addresses</div>
                <p class="text-[11px] text-amber-700">Account sign in is required before confirming your cleaning appointment.</p>
              </div>
            </div>
            <button type="button" onclick="NavbarComponent.openAuthModal('login')" class="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shrink-0">
              Sign In
            </button>
          </div>
        ` : `
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-left">
            <div class="flex items-center gap-2">
              <span class="text-base text-emerald-600 font-bold">✓</span>
              <span class="text-xs text-emerald-900 font-bold">Logged in as: <strong>${store.currentUser.name}</strong> (${store.currentUser.phone || store.currentUser.email})</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified Account</span>
          </div>
        `}
        
        <!-- Free Live OpenStreetMap & GPS Geolocation Card -->
        <div class="rounded-2xl p-4 bg-slate-100/70 border border-slate-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span class="text-xs font-bold text-slate-800">Hyderabad Doorstep Live Map</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">100% Free Live GPS</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5" id="gps-status-msg">Click anywhere on the map or tap Detect GPS to pin your building</p>
            </div>
            <button type="button" id="detect-gps-btn" onclick="BookingWizardComponent.detectGpsLocation()" class="text-xs font-bold text-teal-800 hover:text-white hover:bg-teal-700 flex items-center gap-1.5 bg-teal-100/80 px-3.5 py-2 rounded-xl border border-teal-300 transition-all shadow-sm flex-shrink-0">
              <svg class="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Detect My Live GPS Location</span>
            </button>
          </div>

          <!-- Leaflet Map Container -->
          <div id="booking-location-map" style="height: 220px; border-radius: 12px; z-index: 1;" class="w-full shadow-inner border border-slate-200"></div>
        </div>

        <div id="w-step3-err" class="hidden p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"></div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input type="text" id="w-name" value="${nameVal}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. Rahul Sharma">
            <div id="w-name-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
            <input type="text" id="w-phone" value="${phoneVal}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. 9876543210">
            <div id="w-phone-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input type="email" id="w-email" value="${emailVal}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. rahul@example.com">
            <div id="w-email-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">House / Flat / Villa No. *</label>
            <input type="text" id="w-flat" value="${addr.house_flat || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Flat 402, Tower B">
            <div id="w-flat-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Street / Building *</label>
            <input type="text" id="w-street" value="${addr.street || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Road No. 12, Jubilee Enclave">
            <div id="w-street-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Hyderabad Locality / Area *</label>
            <input list="hyderabad-areas" id="w-area" value="${addr.area || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Select or type (e.g. Banjara Hills, Gachibowli)">
            <datalist id="hyderabad-areas">
              <option value="Banjara Hills">
              <option value="Jubilee Hills">
              <option value="Gachibowli">
              <option value="Madhapur (Hitec City)">
              <option value="Kondapur">
              <option value="Kukatpally">
              <option value="Miyapur">
              <option value="Begumpet">
              <option value="Secunderabad">
              <option value="Somajiguda">
              <option value="Manikonda">
              <option value="Financial District">
              <option value="Tellapur">
              <option value="Nallagandla">
              <option value="Mehdipatnam">
              <option value="Dilsukhnagar">
              <option value="LB Nagar">
              <option value="Ameerpet">
              <option value="SR Nagar">
              <option value="Tarnaka">
              <option value="Uppal">
              <option value="Bowenpally">
              <option value="Trimulgherry">
            </datalist>
            <div id="w-area-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">City (Only Hyderabad) *</label>
              <div class="relative">
                <input type="text" id="w-city" value="Hyderabad" readonly class="w-full px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/50 text-teal-900 text-sm font-black cursor-not-allowed">
                <span class="absolute right-3 top-2.5 text-xs text-teal-600 font-bold">📍 Active</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
              <input type="text" id="w-pincode" value="${addr.pincode || ''}" maxlength="6" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. 500034">
              <div id="w-pincode-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Additional Instructions (e.g. Pet at home, Lift access)</label>
            <input type="text" id="w-instructions" value="${addr.instructions || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Optional notes for technician">
          </div>
        </div>
      </div>
    `;
  },

  // Step 4: Date & Slot Selection with Real-time Backend Check
  renderStep4() {
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = (store.wizard.serviceDate && store.wizard.serviceDate >= today) 
      ? store.wizard.serviceDate 
      : (store.getDefaultDate() || today);
    const selectedSlot = store.wizard.serviceSlot;

    return `
      <div class="space-y-6">
        <div id="w-step4-err" class="hidden p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"></div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-2">Select Service Date *</label>
          <input type="date" id="w-date" min="${today}" value="${selectedDate}" onchange="BookingWizardComponent.onDateChanged(this.value)" class="w-full sm:w-64 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-2">Choose Time Slot (Real-time Availability) *</label>
          <div id="slots-container" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${BookingWizardComponent.renderSlotsHtml(selectedSlot)}
          </div>
        </div>

        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          <p class="text-xs text-amber-800 leading-relaxed">
            Our technician will arrive promptly within the 30-minute arrival window of your selected slot with all required specialized machinery.
          </p>
        </div>
      </div>
    `;
  },

  renderSlotsHtml(selectedSlot) {
    const slots = BookingWizardComponent.slotsCache.length > 0 
      ? BookingWizardComponent.slotsCache 
      : [
          { slot: "09:00 AM", available: true, remaining: 3 },
          { slot: "11:00 AM", available: true, remaining: 2 },
          { slot: "01:00 PM", available: true, remaining: 3 },
          { slot: "03:00 PM", available: true, remaining: 1 },
          { slot: "05:00 PM", available: true, remaining: 3 }
        ];

    return slots.map(s => {
      const isSelected = s.slot === selectedSlot;
      return `
        <button onclick="BookingWizardComponent.selectSlot('${s.slot}')" class="p-4 rounded-xl border text-left transition-all ${!s.available ? 'opacity-40 bg-slate-100 cursor-not-allowed border-slate-200' : (isSelected ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500' : 'border-slate-200 hover:border-slate-300 bg-white')}" ${!s.available ? 'disabled' : ''}>
          <div class="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>${s.slot}</span>
            ${s.available ? `<span class="w-2 h-2 rounded-full bg-emerald-500"></span>` : `<span class="text-[10px] text-red-500 uppercase font-bold">Full</span>`}
          </div>
          <div class="text-[11px] text-slate-500 mt-1">${s.available ? `${s.remaining} slots available` : 'Capacity reached'}</div>
        </button>
      `;
    }).join('');
  },

  // Step 5: Confirmation & Summary
  renderStep5(calc) {
    const addr = store.wizard.address;

    return `
      <div class="space-y-6">
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h4 class="font-bold text-slate-900 text-base mb-3 flex items-center justify-between">
            <span>Selected Cleaning Services</span>
            <span class="text-xs text-teal-700 font-semibold">${calc.itemCount} items</span>
          </h4>

          <div class="divide-y divide-slate-200">
            ${calc.items.map(item => `
              <div class="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span class="font-bold text-slate-800">${item.variant.name}</span>
                  <span class="text-xs text-slate-400 ml-1">× ${item.quantity}</span>
                </div>
                <div class="font-extrabold text-slate-900">₹${item.variant.base_price * item.quantity}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Appointment & Location Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="text-xs text-slate-400 font-medium">Service Schedule</div>
            <div class="font-bold text-slate-900 text-sm mt-1">${store.wizard.serviceDate} at ${store.wizard.serviceSlot}</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="text-xs text-slate-400 font-medium">Customer & Address</div>
            <div class="font-bold text-slate-900 text-sm mt-1">${addr.name} (${addr.phone})</div>
            <div class="text-xs text-slate-500">${addr.house_flat ? addr.house_flat + ', ' : ''}${addr.street ? addr.street + ', ' : ''}${addr.area || ''}, ${addr.city || 'Hyderabad'}${addr.pincode ? ' - ' + addr.pincode : ''}</div>
          </div>
        </div>

        <!-- Coupon Code Box -->
        <div>
          <div class="flex items-center gap-2">
            <input type="text" id="w-coupon" placeholder="Coupon Code (e.g. FRESH50, FIRST100)" value="${store.wizard.couponCode}" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none">
            <button onclick="BookingWizardComponent.applyCoupon()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-colors">
              Apply
            </button>
          </div>
          <div id="w-coupon-msg" class="hidden text-xs font-bold mt-1.5"></div>
        </div>

        <!-- Authentication Verification Card -->
        ${store.currentUser ? `
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-left">
            <div class="flex items-center gap-2">
              <span class="text-base text-emerald-600 font-bold">✓</span>
              <span class="text-emerald-950 font-bold">Authenticated as: <strong>${store.currentUser.name}</strong> (${store.currentUser.phone || store.currentUser.email})</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">Ready to Schedule</span>
          </div>
        ` : `
          <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-left">
            <div class="flex items-start gap-3">
              <span class="text-2xl">🔒</span>
              <div class="flex-1">
                <h5 class="text-sm font-black text-amber-900">Sign In Required to Complete Booking</h5>
                <p class="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  To guarantee technician dispatch, live GPS tracking, and our 100% doorstep hygiene warranty, please sign in or register before confirming.
                </p>
                <div class="mt-3.5 flex flex-wrap items-center gap-2.5">
                  <button type="button" onclick="NavbarComponent.openAuthModal('login')" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm">
                    Sign In to Existing Account
                  </button>
                  <button type="button" onclick="NavbarComponent.openAuthModal('signup')" class="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 transition-all shadow-sm shadow-teal-600/20">
                    Create Verified Account (2-Min)
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- Price Breakdown Table -->
        <div class="border-t border-slate-200 pt-4 space-y-2 text-sm">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span class="font-semibold">₹${calc.subtotal}</span>
          </div>
          ${calc.discount > 0 ? `
            <div class="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon Discount (${store.wizard.couponCode})</span>
              <span>− ₹${calc.discount}</span>
            </div>
          ` : ''}
          <div class="flex justify-between text-slate-600">
            <span>Standard Sanitization & Service Charge</span>
            <span class="font-semibold">₹${calc.serviceCharge}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>GST (${calc.gstPct}%)</span>
            <span class="font-semibold">₹${calc.tax}</span>
          </div>
          <div class="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-200">
            <span>Total Payable Amount</span>
            <span class="text-teal-700">₹${calc.total}</span>
          </div>
        </div>
      </div>
    `;
  },

  // Actions
  toggleCategory(slug) {
    const list = store.wizard.selectedCategories;
    const idx = list.indexOf(slug);
    if (idx > -1) {
      if (list.length > 1) list.splice(idx, 1);
    } else {
      list.push(slug);
    }
    this.refresh();
  },

  updateQty(variantId, qty) {
    ServiceSelectorComponent.updateQty(variantId, qty);
    this.refresh();
  },

  map: null,
  marker: null,

  initMap() {
    const mapEl = document.getElementById('booking-location-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn("Leaflet cleanup notice", e);
      }
      this.map = null;
    }
    if (mapEl._leaflet_id) {
      mapEl._leaflet_id = null;
    }

    // Default Hyderabad center coordinates (Banjara Hills / Hitec City corridor)
    const initialLat = store.wizard.address.lat || 17.4156;
    const initialLng = store.wizard.address.lng || 78.4357;

    try {
      this.map = L.map('booking-location-map', {
        center: [initialLat, initialLng],
        zoom: 14,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="background: linear-gradient(135deg, #0d9488, #0f766e); color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(13,148,136,0.5); border: 2.5px solid white;">
            <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32]
      });

      this.marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customPinIcon
      }).addTo(this.map);

      this.marker.bindPopup('<b>Cleaning Destination</b><br>Drag pin or click map to adjust doorstep').openPopup();

      this.marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        BookingWizardComponent.updateLocationFromCoords(pos.lat, pos.lng, false);
      });

      this.map.on('click', (e) => {
        if (this.marker) this.marker.setLatLng(e.latlng);
        BookingWizardComponent.updateLocationFromCoords(e.latlng.lat, e.latlng.lng, false);
      });

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 150);
    } catch (err) {
      console.error("Map initialization failed:", err);
    }
  },

  async detectGpsLocation() {
    const btn = document.getElementById('detect-gps-btn');
    const statusEl = document.getElementById('gps-status-msg');

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-70');
    }
    if (statusEl) {
      statusEl.className = 'text-xs text-teal-700 font-medium animate-pulse';
      statusEl.textContent = 'Acquiring high-accuracy GPS coordinates...';
    }

    if (!navigator.geolocation) {
      if (statusEl) {
        statusEl.className = 'text-xs text-amber-700 font-medium';
        statusEl.textContent = 'Geolocation not supported by this browser. Please pin on map or select area.';
      }
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-70');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await BookingWizardComponent.updateLocationFromCoords(lat, lng, true);
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-70');
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        if (statusEl) {
          statusEl.className = 'text-xs text-amber-700 font-medium';
          statusEl.textContent = 'Location access prompt closed or unavailable. Tap on the map to set your pin.';
        }
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-70');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  },

  async updateLocationFromCoords(lat, lng, isGps = false) {
    const statusEl = document.getElementById('gps-status-msg');
    store.wizard.address.lat = lat;
    store.wizard.address.lng = lng;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    }
    if (this.map) {
      this.map.panTo([lat, lng]);
    }

    // Hyderabad geo-fencing check (approx 17.15 to 17.65 N, 78.15 to 78.75 E)
    const isInsideHyd = (lat >= 17.15 && lat <= 17.65 && lng >= 78.15 && lng <= 78.75);
    if (!isInsideHyd && isGps) {
      if (statusEl) {
        statusEl.className = 'text-xs text-amber-800 font-medium';
        statusEl.textContent = `📍 GPS detected outside Hyderabad (${lat.toFixed(4)}, ${lng.toFixed(4)}). Siri Sofa operates exclusively within Hyderabad.`;
      }
      return;
    }

    if (statusEl) {
      statusEl.className = 'text-xs text-teal-700 font-medium animate-pulse';
      statusEl.textContent = 'Reverse-geocoding Hyderabad street and pincode...';
    }

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (resp.ok) {
        const data = await resp.json();
        const a = data.address || {};
        const road = a.road || a.pedestrian || a.suburb || '';
        const suburb = a.suburb || a.neighbourhood || a.residential || a.city_district || a.quarter || '';
        const postcode = a.postcode || '';

        const streetInput = document.getElementById('w-street');
        const areaInput = document.getElementById('w-area');
        const pincodeInput = document.getElementById('w-pincode');

        if (streetInput && road && !streetInput.value) {
          streetInput.value = road;
          store.wizard.address.street = road;
        }
        if (areaInput && suburb) {
          areaInput.value = suburb;
          store.wizard.address.area = suburb;
        }
        if (pincodeInput && postcode) {
          pincodeInput.value = postcode;
          store.wizard.address.pincode = postcode;
        }

        if (statusEl) {
          statusEl.className = 'text-xs text-emerald-700 font-bold';
          statusEl.textContent = `✓ Pinned: ${suburb || road || 'Hyderabad'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
        return;
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }

    if (statusEl) {
      statusEl.className = 'text-xs text-emerald-700 font-bold';
      statusEl.textContent = `✓ Pinned at (${lat.toFixed(4)}, ${lng.toFixed(4)}) in Hyderabad`;
    }
  },

  async onDateChanged(newDate) {
    store.wizard.serviceDate = newDate;
    try {
      const res = await ApiClient.getAvailableSlots(newDate);
      this.slotsCache = res.slots || [];
    } catch (e) {
      console.error("Slot fetch error", e);
    }
    this.refresh();
  },

  selectSlot(slot) {
    store.wizard.serviceSlot = slot;
    this.refresh();
  },

  async applyCoupon() {
    const input = document.getElementById('w-coupon');
    const msgEl = document.getElementById('w-coupon-msg');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) {
      if (msgEl) {
        msgEl.textContent = 'Please enter a coupon code (e.g. FRESH50, FIRST100)';
        msgEl.className = 'text-xs font-bold text-amber-700 mt-1.5 block';
      }
      return;
    }

    const calc = store.getCartCalculations();
    try {
      const res = await ApiClient.validateCoupon(code, calc.subtotal);
      if (res.valid) {
        store.wizard.couponCode = code;
        store.wizard.discount = res.discount || Math.round((calc.subtotal * (res.discount_percent || 0)) / 100);
        if (msgEl) {
          msgEl.textContent = `✅ Coupon ${code} applied! Saved ₹${store.wizard.discount}`;
          msgEl.className = 'text-xs font-bold text-emerald-700 mt-1.5 block';
        }
        this.refresh();
      }
    } catch (err) {
      if (msgEl) {
        msgEl.textContent = `❌ ${err.message || 'Invalid coupon code'}`;
        msgEl.className = 'text-xs font-bold text-red-600 mt-1.5 block';
      } else {
        alert(err.message || 'Invalid coupon code');
      }
    }
  },

  validateStep1() {
    if (!store.wizard.selectedCategories || store.wizard.selectedCategories.length === 0) {
      alert("Please select at least one cleaning service category.");
      return false;
    }
    return true;
  },

  validateStep2(calc) {
    if (calc.itemCount === 0) {
      alert("Please specify at least 1 item or seat quantity.");
      return false;
    }
    const minOrder = (store.pricingConfig && store.pricingConfig.min_booking_amount) || 499;
    if (calc.subtotal < minOrder) {
      alert(`Minimum booking amount for doorstep service is ₹${minOrder}. Current total is ₹${calc.subtotal}. Please add items or seats to continue.`);
      return false;
    }
    return true;
  },

  validateStep3() {
    const errSummary = document.getElementById('w-step3-err');
    if (errSummary) errSummary.classList.add('hidden');

    const fields = [
      { id: 'w-name', errId: 'w-name-err' },
      { id: 'w-phone', errId: 'w-phone-err' },
      { id: 'w-email', errId: 'w-email-err' },
      { id: 'w-flat', errId: 'w-flat-err' },
      { id: 'w-street', errId: 'w-street-err' },
      { id: 'w-area', errId: 'w-area-err' },
      { id: 'w-pincode', errId: 'w-pincode-err' }
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const errEl = document.getElementById(f.errId);
      if (input) input.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('hidden');
      }
    });

    const name = document.getElementById('w-name')?.value.trim() || '';
    const phone = document.getElementById('w-phone')?.value.trim() || '';
    const email = document.getElementById('w-email')?.value.trim() || '';
    const flat = document.getElementById('w-flat')?.value.trim() || '';
    const street = document.getElementById('w-street')?.value.trim() || '';
    const area = document.getElementById('w-area')?.value.trim() || '';
    const city = document.getElementById('w-city')?.value || 'Hyderabad';
    const pincode = document.getElementById('w-pincode')?.value.trim() || '';
    const inst = document.getElementById('w-instructions')?.value.trim() || '';

    let hasError = false;
    let firstErrorInput = null;

    const setError = (inputId, errId, msg) => {
      hasError = true;
      const input = document.getElementById(inputId);
      const errEl = document.getElementById(errId);
      if (input) {
        input.classList.add('border-red-500', 'ring-2', 'ring-red-200');
        if (!firstErrorInput) firstErrorInput = input;
      }
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
      }
    };

    if (!name || name.length < 2) {
      setError('w-name', 'w-name-err', 'Please enter your full name (at least 2 letters).');
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      setError('w-name', 'w-name-err', 'Name must contain only alphabetical characters.');
    }

    const rawPhone = phone.replace(/^(\+91|91|0)/, '').replace(/[\s-]/g, '');
    if (!rawPhone) {
      setError('w-phone', 'w-phone-err', 'Mobile number is required.');
    } else if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      setError('w-phone', 'w-phone-err', 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('w-email', 'w-email-err', 'Please enter a valid email address (e.g. name@example.com).');
    }

    if (!flat || flat.length < 2) {
      setError('w-flat', 'w-flat-err', 'House / Flat / Villa number is required.');
    }

    if (!street || street.length < 3) {
      setError('w-street', 'w-street-err', 'Street or building name is required (minimum 3 characters).');
    }

    if (!area || area.length < 2) {
      setError('w-area', 'w-area-err', 'Please select or enter your Hyderabad locality.');
    }

    if (!pincode) {
      setError('w-pincode', 'w-pincode-err', 'Pincode is required.');
    } else if (!/^\d{6}$/.test(pincode)) {
      setError('w-pincode', 'w-pincode-err', 'Enter a valid 6-digit postal code.');
    }

    if (hasError) {
      if (errSummary) {
        errSummary.textContent = 'Please fill in all required location details correctly before continuing.';
        errSummary.classList.remove('hidden');
      }
      if (firstErrorInput) firstErrorInput.focus();
      return false;
    }

    store.wizard.address = {
      name, phone: rawPhone, email, house_flat: flat, street, area, city, pincode, instructions: inst
    };
    return true;
  },

  validateStep4() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('w-date');
    const selectedDate = dateInput?.value || store.wizard.serviceDate;
    const selectedSlot = store.wizard.serviceSlot;
    const errBox = document.getElementById('w-step4-err');

    if (errBox) errBox.classList.add('hidden');

    if (!selectedDate) {
      if (errBox) {
        errBox.textContent = 'Please select a valid service date.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please select a valid service date.');
      }
      return false;
    }

    if (selectedDate < today) {
      if (errBox) {
        errBox.textContent = 'Service date cannot be in the past. Please select today or an upcoming date.';
        errBox.classList.remove('hidden');
      } else {
        alert('Service date cannot be in the past. Please select today or an upcoming date.');
      }
      return false;
    }

    if (!selectedSlot) {
      if (errBox) {
        errBox.textContent = 'Please select a preferred arrival time slot.';
        errBox.classList.remove('hidden');
      } else {
        alert('Please select a preferred arrival time slot.');
      }
      return false;
    }

    store.wizard.serviceDate = selectedDate;
    return true;
  },

  nextStep() {
    const s = store.wizard.step;
    const calc = store.getCartCalculations();

    if (s === 1) {
      if (!this.validateStep1()) return;
      if (calc.itemCount === 0) {
        const sofaSvc = store.services.find(x => x.slug === 'sofa');
        if (sofaSvc && sofaSvc.variants && sofaSvc.variants.length > 2) {
          store.setItemQuantity(sofaSvc.variants[2], 1);
        }
      }
    } else if (s === 2) {
      if (!this.validateStep2(calc)) return;
    } else if (s === 3) {
      if (!this.validateStep3()) return;
    } else if (s === 4) {
      if (!this.validateStep4()) return;
    }

    store.wizard.step = Math.min(5, s + 1);
    this.refresh();
  },

  prevStep() {
    store.wizard.step = Math.max(1, store.wizard.step - 1);
    this.refresh();
  },

  promptAuthBeforeBooking() {
    alert("🔒 Please sign in or create an account to confirm your cleaning appointment. Your booking details are safely preserved!");
    NavbarComponent.openAuthModal('login');
  },

  async submitBooking() {
    if (!store.currentUser) {
      this.promptAuthBeforeBooking();
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = document.getElementById('confirm-booking-btn');
    if (btn) {
      btn.innerHTML = `<span class="animate-spin">⏳</span> Processing Booking...`;
      btn.disabled = true;
    }

    try {
      const calc = store.getCartCalculations();
      const bookingPayload = {
        user_id: store.currentUser.id,
        name: store.wizard.address.name || store.currentUser.name,
        phone: store.wizard.address.phone || store.currentUser.phone,
        email: store.wizard.address.email || store.currentUser.email,
        address: store.wizard.address,
        service_date: store.wizard.serviceDate,
        service_slot: store.wizard.serviceSlot,
        items: calc.items.map(it => ({
          variant_id: it.variant.id,
          quantity: it.quantity
        })),
        coupon_code: store.wizard.couponCode,
        notes: store.wizard.address.instructions
      };

      const res = await ApiClient.createBooking(bookingPayload);
      store.wizard.lastCreatedBookingId = res.booking_id;

      // Reset wizard and present confirmation modal
      store.resetWizard();
      BookingWizardComponent.renderSuccessModal(res.booking_id, res.total_amount);

    } catch (err) {
      alert(`Booking failed: ${err.message}`);
    } finally {
      this.isSubmitting = false;
    }
  },

  renderSuccessModal(bookingId, total) {
    const modalHtml = `
      <div id="booking-success-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-slate-100">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce-short">
            🎉
          </div>
          <h3 class="text-2xl font-black text-slate-900">Booking Confirmed!</h3>
          <p class="text-slate-500 text-sm mt-1">Your professional cleaning appointment has been scheduled.</p>
          
          <div class="my-6 p-4 rounded-2xl bg-teal-50 border border-teal-200">
            <div class="text-xs text-teal-800 font-semibold uppercase">Booking Tracking ID</div>
            <div class="text-2xl font-mono font-black text-teal-900 tracking-wider mt-1">${bookingId}</div>
            <div class="text-xs text-teal-700 font-bold mt-2">Total Amount: ₹${total} (Cash/UPI upon completion)</div>
          </div>

          <div class="space-y-3">
            <button onclick="BookingWizardComponent.closeSuccessModalAndTrack('${bookingId}')" class="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2">
              <span>Track Live Booking Status</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
            <button onclick="document.getElementById('booking-success-modal').remove(); store.trackingBookingId = null; store.setView('home');" class="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  closeSuccessModalAndTrack(bookingId) {
    const modal = document.getElementById('booking-success-modal');
    if (modal) modal.remove();
    store.trackingBookingId = bookingId;
    store.setView('track');
  },

  refresh() {
    const host = document.getElementById('booking-view-container');
    if (host) host.innerHTML = this.render();
    if (store.wizard.step === 3) {
      setTimeout(() => this.initMap(), 80);
    }
  }
};

window.BookingWizardComponent = BookingWizardComponent;
