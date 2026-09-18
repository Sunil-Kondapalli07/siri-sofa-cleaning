/**
 * Hygiene & Cleaning Process Component
 * 6-Step Scientific Cleaning Workflow + Interactive Before & After Slider
 */

const HygieneProcessComponent = {
  render() {
    return `
      <section class="py-16 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <!-- Ambient Background glow -->
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <!-- Section Header -->
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="px-3.5 py-1.5 rounded-full bg-teal-950 border border-teal-800 text-teal-400 text-xs font-bold uppercase tracking-wider">
              Scientific Hygiene Standard
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-4 mb-4">
              Our 6-Step <span class="text-teal-400">Hygiene Process</span>
            </h2>
            <p class="text-slate-400 text-base sm:text-lg">
              We don't just wipe the surface. Our hospital-grade multi-stage sanitization restores fabric texture, removes 99.9% of dust mites, and revives original colors.
            </p>
          </div>

          <!-- 6 Steps Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            
            <!-- Step 1 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">01</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Inspection & Fabric Audit</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Technician thoroughly assesses the fabric weave, color-fastness, and pinpoints stubborn grease, tea, wine, or pet stains.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Equipment: UV Diagnostic Scanner
              </div>
            </div>

            <!-- Step 2 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">02</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Dry Vacuuming</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Industrial HEPA high-suction vacuuming removes embedded hair, crumbs, dead skin, and dust mite colonies from deep crevices.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Suction: 2400W Industrial Turbine
              </div>
            </div>

            <!-- Step 3 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">03</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Pre-Treatment Spray</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Application of pH-balanced eco-safe enzyme solutions that emulsify oils, perspiration, and deep stains without fading fabric.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Chemicals: 100% Biodegradable & Baby-Safe
              </div>
            </div>

            <!-- Step 4 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">04</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Deep Scrubbing</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Mechanized dual rotary soft-bristle agitation works the shampoo deep into fabric fibers to break stubborn chemical bonds.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Action: Dual Rotary Gentle Agitation
              </div>
            </div>

            <!-- Step 5 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">05</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">High-Power Extraction</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                Injection-extraction machine injects warm water and immediately suctions out muddy slurry, dissolved bacteria, and 95% of moisture.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Recovery: Transparent Sight Tube Verification
              </div>
            </div>

            <!-- Step 6 -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 hover:border-teal-500/50 hover:bg-slate-800 transition-all group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl font-black text-teal-400 font-display">06</span>
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Drying & Sanitization</h3>
              <p class="text-slate-400 text-sm leading-relaxed">
                High-velocity airflow blowers accelerate dry time to just 2-3 hours, followed by natural anti-bacterial lemon-mint misting.
              </p>
              <div class="mt-4 pt-4 border-t border-slate-700/60 text-xs text-teal-400/80 font-medium">
                Result: 99.9% Germ Shield & Fresh Fragrance
              </div>
            </div>

          </div>

          <!-- Interactive Before & After Transformation Showcase -->
          <div class="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 lg:p-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-5 space-y-4">
                <span class="text-teal-400 text-xs font-bold uppercase tracking-wider">Visible Proof</span>
                <h3 class="text-2xl sm:text-3xl font-extrabold text-white">Before & After Transformation</h3>
                <p class="text-slate-300 text-sm leading-relaxed">
                  See the dramatic difference our deep extraction makes on embedded stains, sweat marks, and dull faded fibers. Drag the slider to compare.
                </p>
                
                <div class="space-y-3 pt-2">
                  <div class="flex items-center gap-3 text-sm text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span><strong>Before:</strong> Stains, dust accumulation, allergy triggers</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-slate-300">
                    <span class="w-3 h-3 rounded-full bg-teal-400 flex-shrink-0"></span>
                    <span><strong>After:</strong> Sanitized, vibrant fiber texture, fresh scent</span>
                  </div>
                </div>

                <div class="pt-4">
                  <button onclick="store.setView('book')" class="px-6 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/20 transition-all text-sm inline-flex items-center gap-2">
                    <span>Schedule Your Sofa Revival</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>

              <!-- Interactive Slider Container -->
              <div class="lg:col-span-7">
                <div id="ba-slider" class="ba-container h-80 sm:h-96 relative shadow-2xl border border-slate-700 cursor-ew-resize overflow-hidden">
                  
                  <!-- Clean Side (Right Background - After Image) -->
                  <div class="absolute inset-0 bg-cover bg-center flex items-end p-6" style="background-image: linear-gradient(to top, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.2)), url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80');">
                    <div class="space-y-1.5 z-10">
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-md">
                        <span>✓</span>
                        <span>AFTER CLEANING (PRISTINE VELVET)</span>
                      </div>
                      <h4 class="text-xl sm:text-2xl font-black text-white">Sanitized, Restored & Sealed</h4>
                      <p class="text-xs text-teal-200">100% Odor & Microscopic Bacteria Eliminated • Deep Color Revival</p>
                    </div>
                  </div>

                  <!-- Dirty Side (Left Overlay - Before Image) -->
                  <div id="ba-overlay-box" class="ba-overlay w-1/2 bg-cover bg-left flex items-end p-6 border-r-4 border-teal-400" style="background-image: linear-gradient(to top, rgba(20, 15, 10, 0.92), rgba(20, 15, 10, 0.55)), url('https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80'); filter: contrast(1.15) brightness(0.72) sepia(0.35);">
                    <div class="space-y-1.5 min-w-[280px] z-10">
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 text-white font-black text-xs shadow-md">
                        <span>⚠️</span>
                        <span>BEFORE CLEANING (SOILED)</span>
                      </div>
                      <h4 class="text-xl sm:text-2xl font-black text-amber-200">Stains, Grease & Dust Mites</h4>
                      <p class="text-xs text-amber-100">Deep spills, stubborn pet dander, and embedded dirt</p>
                    </div>
                  </div>

                  <!-- Draggable Slider Handle -->
                  <div id="ba-handle" class="ba-slider-handle" style="left: 50%;">
                    <div class="ba-slider-button">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
                    </div>
                  </div>

                </div>
                <div class="flex justify-between items-center text-xs text-slate-400 mt-2.5 px-1">
                  <span class="flex items-center gap-1">
                    <span class="text-teal-400 font-bold">←</span> Drag split slider left or right
                  </span>
                  <span class="text-teal-400 font-semibold font-mono">Actual Doorstep Results</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
    `;
  },

  initSlider() {
    const container = document.getElementById('ba-slider');
    const overlay = document.getElementById('ba-overlay-box');
    const handle = document.getElementById('ba-handle');
    if (!container || !overlay || !handle) return;

    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0.05, Math.min(0.95, pos));
      const pct = pos * 100;
      overlay.style.width = `${pct}%`;
      handle.style.left = `${pct}%`;
    };

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support for mobile
    container.addEventListener('touchstart', (e) => {
      isDragging = true;
      if (e.touches.length > 0) updateSlider(e.touches[0].clientX);
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      if (e.touches.length > 0) updateSlider(e.touches[0].clientX);
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });
  }
};

window.HygieneProcessComponent = HygieneProcessComponent;
