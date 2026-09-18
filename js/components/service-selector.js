/**
 * Service & Variant Selector Component with Dynamic Pricing
 */

const ServiceSelectorComponent = {
  activeTab: 'sofa', // 'sofa', 'chair', 'mattress', 'carpet'

  render() {
    const services = store.services;
    const cartCalc = store.getCartCalculations();
    const currentService = services.find(s => s.slug === this.activeTab) || services[0];

    return `
      <section id="services-section" class="py-16 bg-slate-50 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Section Heading -->
          <div class="text-center max-w-3xl mx-auto mb-12">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>⚡ Live Dynamic Pricing: Synced with Siri HQ Admin Engine</span>
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 mb-3">
              Choose Your Hyderabad Cleaning Service
            </h2>
            <p class="text-slate-600 text-base">
              Customize your seating configuration and see immediate itemized pricing. Any price adjusted by our admin operations reflects here live in real-time.
            </p>
          </div>

          <!-- Service Category Tabs -->
          <div class="flex items-center justify-center gap-2 sm:gap-4 mb-10 overflow-x-auto pb-2">
            ${services.map(s => {
              const isActive = s.slug === this.activeTab;
              return `
                <button onclick="ServiceSelectorComponent.selectTab('${s.slug}')" class="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${isActive ? 'bg-teal-700 text-white shadow-teal-700/20' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
                  <span>${ServiceSelectorComponent.getIcon(s.slug)}</span>
                  <span>${s.title}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Active Service Content & Variants Grid -->
          ${currentService ? `
            <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg shadow-slate-200/40 mb-12">
              <div class="max-w-xl mb-8">
                <div class="inline-flex items-center gap-2 text-teal-700 font-bold text-sm mb-1">
                  ${ServiceSelectorComponent.getIcon(currentService.slug)} ${currentService.subtitle || currentService.title}
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-2">${currentService.title} Catalog</h3>
                <p class="text-slate-500 text-sm leading-relaxed">${currentService.description}</p>
              </div>

              <!-- Variants Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${(currentService.variants || []).map(v => {
                  const qty = store.getItemQuantity(v.id);
                  return `
                    <div class="border ${qty > 0 ? 'border-teal-500 bg-teal-50/20 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'} rounded-2xl p-5 transition-all flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-2 mb-2">
                          <h4 class="font-bold text-slate-900 text-base">${v.name}</h4>
                          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                            ~${v.estimated_minutes} min
                          </span>
                        </div>
                        <div class="flex items-baseline gap-1 mb-4">
                          <span class="text-2xl font-extrabold text-teal-700 font-display">₹${v.base_price}</span>
                          <span class="text-xs text-slate-400 font-medium">/ ${v.unit_type}</span>
                        </div>
                      </div>

                      <!-- Quantity Controls -->
                      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span class="text-xs font-semibold text-slate-500">Quantity</span>
                        <div class="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                          <button onclick="ServiceSelectorComponent.updateQty(${v.id}, ${qty - 1})" class="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors shadow-sm disabled:opacity-40" ${qty === 0 ? 'disabled' : ''}>
                            −
                          </button>
                          <span class="w-6 text-center font-bold text-slate-900 text-sm">${qty}</span>
                          <button onclick="ServiceSelectorComponent.updateQty(${v.id}, ${qty + 1})" class="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center transition-colors shadow-sm">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Floating / Sticky Quick Cart Bar -->
          ${cartCalc.itemCount > 0 ? `
            <div class="fixed bottom-6 left-4 right-4 max-w-4xl mx-auto z-40 animate-bounce-short">
              <div class="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
                    ${cartCalc.itemCount}
                  </div>
                  <div>
                    <div class="text-xs text-slate-400 font-medium">Estimated Cleaning Total</div>
                    <div class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span>₹${cartCalc.total}</span>
                      <span class="text-xs font-normal text-teal-300">(incl. ₹${cartCalc.serviceCharge} service + ${cartCalc.gstPct}% GST)</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <button onclick="store.setView('book')" class="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all text-sm flex items-center justify-center gap-2">
                    <span>Continue to Booking Wizard</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ` : ''}

        </div>
      </section>
    `;
  },

  selectTab(slug) {
    this.activeTab = slug;
    // Re-render
    const host = document.getElementById('services-view-container');
    if (host) host.innerHTML = this.render();
  },

  getIcon(slug) {
    switch (slug) {
      case 'sofa': return '🛋️';
      case 'chair': return '🪑';
      case 'mattress': return '🛏️';
      case 'carpet': return '🧶';
      default: return '✨';
    }
  },

  updateQty(variantId, newQty) {
    // Find variant across all services
    let targetVariant = null;
    for (const s of store.services) {
      for (const v of s.variants || []) {
        if (v.id === variantId) {
          targetVariant = v;
          break;
        }
      }
      if (targetVariant) break;
    }

    if (targetVariant) {
      store.setItemQuantity(targetVariant, newQty);
    }

    // Refresh view
    const host = document.getElementById('services-view-container');
    if (host) host.innerHTML = this.render();
  }
};

window.ServiceSelectorComponent = ServiceSelectorComponent;
