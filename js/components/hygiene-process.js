/**
 * Siri Sofa Services — Interactive Before / After Comparison & 6-Step Hygiene Process
 */

const HygieneProcessComponent = {
  isDragging: false,
  splitPercentage: 50,

  render() {
    return `
      <section class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Section Header -->
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3.5 py-1.5 rounded-full border border-[#C2E2D3]">
              Visible Transformation
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              Before & After Cleaning
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              Slide to see how our hospital-grade hot extraction dissolves deeply embedded stains, allergens, and restores original fabric vibrancy.
            </p>
          </div>

          <!-- Interactive Before / After Split Slider Container -->
          <div class="ba-comparison-wrapper mb-20">
            <div id="ba-slider-box" class="ba-image-container cursor-ew-resize">
              
              <!-- Clean "AFTER" Image (Full Width Base) -->
              <img src="images/sofa_clean_after.jpg" alt="Restored Clean Sofa Fabric" class="ba-after-img">
              
              <!-- Dirty "BEFORE" Image (Clipped Left Layer) -->
              <div id="ba-clip-layer" class="ba-after-clip" style="width: 50%;">
                <img src="images/sofa_dirty_before.jpg" alt="Stained Sofa Fabric Before Cleaning" class="ba-before-img" style="width: 100%; height: 100%;">
              </div>

              <!-- Draggable Divider Line & Handle -->
              <div id="ba-divider" class="ba-divider-line" style="left: 50%;">
                <div class="ba-handle-thumb">
                  <svg class="w-5 h-5 text-[#0C4A34]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l-4 3 4 3m8-6l4 3-4 3"/>
                  </svg>
                </div>
              </div>

              <!-- Overlay Floating Badges -->
              <span class="ba-badge ba-badge-before">
                Before Cleaning
              </span>
              <span class="ba-badge ba-badge-after">
                After Siri Clean
              </span>

            </div>

            <!-- Slider Instruction Hint -->
            <div class="p-3 bg-white border-t border-black/5 text-center text-xs font-bold text-[#6B7788] flex items-center justify-center gap-2">
              <span>← Drag slider left or right to compare fabric restoration →</span>
            </div>
          </div>

          <!-- 6-Step Hospital-Grade Hygiene Process -->
          <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3.5 py-1.5 rounded-full border border-[#C2E2D3]">
              Proven Methodology
            </span>
            <h3 class="text-2xl sm:text-3xl font-black text-[#121820] mt-3 tracking-tight">
              Our 6-Step Scientific Hygiene Standard
            </h3>
            <p class="text-xs sm:text-sm text-[#525D6C] mt-1.5">
              We do not simply vacuum the surface. We thoroughly decontaminate, extract, and sanitize deep upholstery layers.
            </p>
          </div>

          <!-- 6 Steps Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            
            <!-- Step 1 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">01</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">Fabric Audit</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">Inspection & Fiber Analysis</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Specialist assesses fiber composition (velvet, chenille, linen, or faux leather), color fastness, and identifies target wine, coffee, or pet stains.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">02</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">Dry HEPA</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">High-Velocity Dry Vacuuming</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Industrial 2400W dual-motor suction extracts dry dirt, pet hair, allergen flakes, and crumbs buried deep inside seams and seat crevices.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">03</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">Eco-Enzyme</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">Targeted Pre-Treatment Spray</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Application of non-toxic, baby-safe botanical enzyme solutions that break down grease, food residues, and body perspiration bonds.
              </p>
            </div>

            <!-- Step 4 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">04</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">Soft Rotary</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">Rotary Foam Agitation</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Counter-rotating soft fiber bristles gently brush the shampoo into the fabric pile, lifting embedded soil without abrading sensitive threads.
              </p>
            </div>

            <!-- Step 5 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">05</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">12-Bar Suction</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">Hot Water Injection-Extraction</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Clear-head vacuum wand injects fresh rinse water while simultaneously pulling out liquefied grime, leaving zero chemical residue behind.
              </p>
            </div>

            <!-- Step 6 -->
            <div class="bg-white p-6 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 transition-all">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-black text-[#0C4A34] font-display">06</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#0C4A34]">Joint Signoff</span>
              </div>
              <h4 class="font-display font-bold text-base text-[#121820] mb-1.5">Deodorizing & Final Inspection</h4>
              <p class="text-xs text-[#525D6C] leading-relaxed">
                Subtle natural eucalyptus freshener mist applied. Technician inspects fabric under illumination alongside you before booking signoff.
              </p>
            </div>

          </div>

          <!-- Bottom Action -->
          <div class="text-center pt-4">
            <button onclick="store.setView('book')" class="btn-primary text-xs py-3 px-8 shadow-md">
              <span>Schedule Your Sofa Restoration</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>

        </div>
      </section>
    `;
  },

  initSlider() {
    const box = document.getElementById('ba-slider-box');
    const clip = document.getElementById('ba-clip-layer');
    const divider = document.getElementById('ba-divider');
    if (!box || !clip || !divider) return;

    const setPosition = (clientX) => {
      const rect = box.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      clip.style.width = `${percentage}%`;
      divider.style.left = `${percentage}%`;
    };

    let active = false;

    const onStart = (e) => {
      active = true;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    };

    const onMove = (e) => {
      if (!active) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    };

    const onEnd = () => {
      active = false;
    };

    box.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    box.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }
};

window.HygieneProcessComponent = HygieneProcessComponent;
