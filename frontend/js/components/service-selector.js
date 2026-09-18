/**
 * Siri Sofa Services — Premium Interactive Service Showcase & Dynamic Catalog
 */

const ServiceSelectorComponent = {
  activeTab: 'sofa', // 'sofa', 'chair', 'mattress', 'carpet'

  render() {
    const services = store.services || [];
    const cartCalc = store.getCartCalculations();
    const currentService = services.find(s => s.slug === this.activeTab) || services[0];

    const serviceMeta = {
      'sofa': {
        img: 'images/service_sofa.jpg',
        badge: 'Top Booked in Hyderabad',
        startPrice: '₹499',
        tagline: 'Deep shampoo injection & powerful 12-bar vacuum extraction for fabric, velvet, and leather seating.'
      },
      'chair': {
        img: 'images/service_chair.jpg',
        badge: 'Residential & Office',
        startPrice: '₹199',
        tagline: 'Spot removal, steam deodorizing, and dust extraction for dining chairs and ergonomic office chairs.'
      },
      'mattress': {
        img: 'images/service_mattress.jpg',
        badge: 'Anti-Allergen UV Certified',
        startPrice: '₹899',
        tagline: 'High-suction dust mite extraction, UV sanitization, and sweat stain elimination for pure, healthy sleep.'
      },
      'carpet': {
        img: 'images/service_carpet.jpg',
        badge: 'Deep Fiber Refresh',
        startPrice: '₹599',
        tagline: 'Heavy-duty rotary scrubber extraction restoring brightness, soft texture, and fresh wool vibrancy.'
      }
    };

    return `
      <section id="services-section" class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Section Header -->
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3.5 py-1.5 rounded-full border border-[#C2E2D3]">
              Doorstep Service Catalog
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              Our Professional Services
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              Select a category to view live transparent rates and customize your configuration.
            </p>
          </div>

          <!-- 4 Interactive Primary Service Showcase Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            ${services.map(s => {
              const meta = serviceMeta[s.slug] || {
                img: 'images/service_sofa.jpg',
                badge: 'Professional Service',
                startPrice: '₹499',
                tagline: s.description
              };
              const isSelected = s.slug === this.activeTab;

              return `
                <div onclick="ServiceSelectorComponent.selectTab('${s.slug}')" class="service-card card-3d-tilt cursor-pointer flex flex-col justify-between ${isSelected ? 'ring-2 ring-[#0C4A34] shadow-xl' : ''}">
                  <div>
                    <!-- Card Image with Zoom Effect -->
                    <div class="service-img-wrap relative h-48 sm:h-52 w-full overflow-hidden bg-black/5">
                      <img src="${meta.img}" alt="${s.title}" class="w-full h-full object-cover">
                      <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#0C4A34] tracking-wide uppercase border border-black/5 shadow-xs">
                        ${meta.badge}
                      </span>
                    </div>

                    <!-- Card Body -->
                    <div class="p-5">
                      <div class="flex items-baseline justify-between gap-2 mb-1">
                        <h3 class="font-display font-extrabold text-lg text-[#121820]">${s.title}</h3>
                      </div>
                      <p class="text-xs text-[#525D6C] leading-relaxed line-clamp-2 mt-1">
                        ${meta.tagline}
                      </p>
                    </div>
                  </div>

                  <div class="p-5 pt-0 flex items-center justify-between border-t border-black/5 mt-2">
                    <div>
                      <span class="text-[10px] uppercase font-bold text-[#8490A0] block">Starting from</span>
                      <span class="font-display font-extrabold text-base text-[#0C4A34]">${meta.startPrice}</span>
                    </div>
                    <div class="flex items-center gap-1 text-xs font-bold ${isSelected ? 'text-[#0C4A34]' : 'text-[#121820]'} group">
                      <span>${isSelected ? 'Selected' : 'Configure'}</span>
                      <svg class="w-4 h-4 arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Active Category Detailed Variants Customizer -->
          ${currentService ? `
            <div id="service-detail-customizer" class="bg-white rounded-3xl p-6 sm:p-10 border border-black/8 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 mb-8">
                <div>
                  <div class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0C4A34]">
                    <span>Catalog Configuration</span>
                    <span>•</span>
                    <span>${currentService.title}</span>
                  </div>
                  <h3 class="text-2xl font-black text-[#121820] mt-1">Customize Your ${currentService.title}</h3>
                  <p class="text-xs text-[#525D6C] mt-0.5">${currentService.description}</p>
                </div>
                <div class="text-left sm:text-right">
                  <span class="text-[11px] font-bold text-emerald-700 bg-[#EBF5F0] px-3 py-1 rounded-full border border-[#C2E2D3]">
                    ✓ Real-time Pricing Sync
                  </span>
                </div>
              </div>

              <!-- Variants Cards Grid with Clean Counter Buttons -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${(currentService.variants || []).map(v => {
                  const qty = store.getItemQuantity(v.id);
                  const isAdded = qty > 0;

                  return `
                    <div class="p-5 rounded-2xl border ${isAdded ? 'border-[#0C4A34] bg-[#EBF5F0]/25 shadow-sm' : 'border-black/8 bg-white hover:border-black/20'} transition-all flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-2 mb-1.5">
                          <h4 class="font-display font-bold text-base text-[#121820]">${v.name}</h4>
                          <span class="px-2 py-0.5 rounded-full bg-[#F4F2EC] text-[#525D6C] text-[10px] font-bold whitespace-nowrap">
                            ~${v.estimated_minutes} min
                          </span>
                        </div>
                        <div class="flex items-baseline gap-1.5 mb-4">
                          <span class="text-xl font-black text-[#0C4A34] font-display">₹${v.base_price}</span>
                          <span class="text-xs text-[#8490A0] font-medium">/ ${v.unit_type}</span>
                        </div>
                      </div>

                      <!-- Stepper Control -->
                      <div class="flex items-center justify-between pt-4 border-t border-black/5">
                        <span class="text-xs font-semibold text-[#525D6C]">Quantity</span>
                        <div class="flex items-center gap-2.5 bg-[#F4F2EC] p-1 rounded-xl">
                          <button onclick="ServiceSelectorComponent.updateQty(${v.id}, ${qty - 1})" class="w-7 h-7 rounded-lg bg-white text-[#121820] font-bold text-sm flex items-center justify-center hover:bg-black/5 transition-colors shadow-xs disabled:opacity-30 cursor-pointer" ${qty === 0 ? 'disabled' : ''}>
                            −
                          </button>
                          <span class="w-6 text-center font-bold text-[#121820] text-sm">${qty}</span>
                          <button onclick="ServiceSelectorComponent.updateQty(${v.id}, ${qty + 1})" class="w-7 h-7 rounded-lg bg-[#0C4A34] text-white font-bold text-sm flex items-center justify-center hover:bg-[#083827] transition-colors shadow-xs cursor-pointer">
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

          <!-- Floating Sticky Booking Bar When Items Selected -->
          ${cartCalc.itemCount > 0 ? `
            <div class="fixed bottom-6 left-4 right-4 max-w-3xl mx-auto z-40 animate-fade-in">
              <div class="bg-[#121820] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <div class="w-11 h-11 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-display font-extrabold text-lg">
                    ${cartCalc.itemCount}
                  </div>
                  <div>
                    <div class="text-xs text-[#9AA5B4]">Estimated Total (inc. GST & Service)</div>
                    <div class="text-xl font-display font-black text-white">₹${cartCalc.total}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <button onclick="store.setView('book')" class="btn-primary w-full sm:w-auto text-xs py-3 px-7 bg-emerald-600 hover:bg-emerald-500 shadow-md">
                    <span>Continue to Schedule</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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
    const host = document.getElementById('services-section');
    if (host) {
      host.outerHTML = this.render();
      document.getElementById('service-detail-customizer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  updateQty(variantId, newQty) {
    let variantObj = null;
    for (const svc of store.services) {
      const v = (svc.variants || []).find(it => it.id === variantId);
      if (v) {
        variantObj = v;
        break;
      }
    }
    if (!variantObj) return;
    store.setItemQuantity(variantObj, newQty);
    const host = document.getElementById('services-section');
    if (host) {
      host.outerHTML = this.render();
    }
  }
};

window.ServiceSelectorComponent = ServiceSelectorComponent;
