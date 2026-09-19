/**
 * Siri Sofa Services — Storytelling Sections
 * Implements Sections 13 (The Problem), 14 (Deep Cleaning), 17 (Before/After Slider),
 * 18 (Hygiene), 19 (How It Works), and 20 (Why Choose Siri).
 */

const StorySectionsComponent = {
  sliderPos: 50,
  isDraggingSlider: false,

  render() {
    return `
      <!-- 1. The Problem Section (Section 13) -->
      <section class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
              Fabric Reality Check
            </span>
            <h2 class="text-3xl sm:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              Your Sofa Looks Clean.<br>
              <span class="text-[#0C4A34] font-serif italic font-normal">But Is It?</span>
            </h2>
            <p class="text-base text-[#525D6C] mt-3 leading-relaxed">
              Household sofas accumulate up to 200 grams of unseen microscopic residue every month. Normal surface dusting only removes what sits on top.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <!-- Problem Card 1 -->
            <div class="bg-white p-7 rounded-2xl border border-black/6 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all text-left">
              <div class="w-12 h-12 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-2xl mb-4 font-bold text-[#121820]">
                🔬
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Embedded Dust & Mites</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Microscopic dust mites and microscopic debris settle 3 to 5 inches deep into foam cushions beyond ordinary vacuum reach.
              </p>
            </div>

            <!-- Problem Card 2 -->
            <div class="bg-white p-7 rounded-2xl border border-black/6 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all text-left">
              <div class="w-12 h-12 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-2xl mb-4 font-bold text-[#121820]">
                ☕
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Deep Stains & Spills</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Coffee, food oils, milk, and tea oxidize over time, binding to fabric fibers and causing discolouration and fabric hardening.
              </p>
            </div>

            <!-- Problem Card 3 -->
            <div class="bg-white p-7 rounded-2xl border border-black/6 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all text-left">
              <div class="w-12 h-12 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-2xl mb-4 font-bold text-[#121820]">
                💨
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Trapped Odours</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Body sweat, moisture, cooking grease, and pet dander become trapped in foam, generating persistent stale living-room odors.
              </p>
            </div>

            <!-- Problem Card 4 -->
            <div class="bg-white p-7 rounded-2xl border border-black/6 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all text-left">
              <div class="w-12 h-12 rounded-xl bg-[#F4F2EC] flex items-center justify-center text-2xl mb-4 font-bold text-[#121820]">
                🛡️
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Allergen Build-up</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Uncleaned upholstery triggers sneezing, skin sensitivity, and morning congestion for children and family members with allergies.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- 2. Cinematic Deep Cleaning Process (Section 14) -->
      <section class="py-16 lg:py-24 bg-[#111827] text-white relative overflow-hidden">
        
        <!-- Ambient Deep Glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#0C4A34]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-800/60">
              Extraction Technology
            </span>
            <h2 class="text-3xl sm:text-5xl font-black text-white mt-3 tracking-tight">
              The 5-Stage Deep Extraction Journey
            </h2>
            <p class="text-base text-slate-300 mt-3 leading-relaxed">
              Industrial hot-water injection vacuuming lifts contaminants from the core without saturating or damaging sensitive fabrics.
            </p>
          </div>

          <!-- 5-Step Process Sequence -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left">
            
            <!-- Step 1 -->
            <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="text-xs font-mono font-bold text-emerald-400 mb-3">STAGE 01</div>
              <div class="text-3xl mb-3">🔍</div>
              <h3 class="font-display font-bold text-lg text-white">Fabric Inspection</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Identification of weave type (velvet, linen, cotton, leatherette) to calibrate safe enzyme pH levels.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="text-xs font-mono font-bold text-emerald-400 mb-3">STAGE 02</div>
              <div class="text-3xl mb-3">🌪️</div>
              <h3 class="font-display font-bold text-lg text-white">Dry Industrial Vacuum</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                High-power cyclonic extraction extracting loose dust, breadcrumbs, pet fur, and dry surface contaminants.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="text-xs font-mono font-bold text-emerald-400 mb-3">STAGE 03</div>
              <div class="text-3xl mb-3">🧴</div>
              <h3 class="font-display font-bold text-lg text-white">Enzyme Agitation</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Eco-safe plant-derived foaming agents break down grease, tannin stains, and deeply bound sweat rings.
              </p>
            </div>

            <!-- Step 4 -->
            <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="text-xs font-mono font-bold text-emerald-400 mb-3">STAGE 04</div>
              <div class="text-3xl mb-3">✨</div>
              <h3 class="font-display font-bold text-lg text-white">Hot Steam Extraction</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Pressurized hot-water injection vacuum immediately flushing out grime while vacuuming 95% of moisture.
              </p>
            </div>

            <!-- Step 5 -->
            <div class="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="text-xs font-mono font-bold text-emerald-400 mb-3">STAGE 05</div>
              <div class="text-3xl mb-3">🌬️</div>
              <h3 class="font-display font-bold text-lg text-white">Rapid 2-3h Dry & Fresh</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Antiseptic deodorization leaving your sofa fresh, hygienic, and ready to enjoy within 2 to 3 hours.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- 3. Interactive Draggable Before / After Comparison Slider (Section 17) -->
      <section class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-12">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
              Visual Proof
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              Before & After Restoration
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              Drag the interactive slider below to reveal the actual difference our deep steam extraction achieves.
            </p>
          </div>

          <!-- Draggable Before / After Container -->
          <div class="max-w-4xl mx-auto">
            <div id="before-after-slider-box" class="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 select-none cursor-ew-resize h-[360px] sm:h-[480px]">
              
              <!-- After (Background Image - Pristine Restored Velvet) -->
              <img src="images/hero_luxury_sofa.jpg" alt="After Deep Cleaning - Siri Sofa Services" class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none">
              
              <div class="absolute top-5 right-5 z-10 bg-[#0C4A34]/90 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                ✨ AFTER: Restored & Sanitized
              </div>

              <!-- Before (Foreground Image Clipped) -->
              <div id="before-clip-layer" class="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" alt="Before Cleaning" class="absolute inset-0 w-[896px] max-w-none h-full object-cover object-center filter saturate-50 contrast-85 brightness-90">
                
                <div class="absolute top-5 left-5 z-10 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                  ⚠️ BEFORE: Dull, Stained & Dusty
                </div>
              </div>

              <!-- Draggable Divider Bar -->
              <div id="slider-divider-bar" class="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 left-1/2 pointer-events-none">
                <!-- Center Handle Grip Button -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-[#0C4A34] shadow-2xl border-2 border-[#0C4A34] flex items-center justify-center font-bold text-xs pointer-events-auto cursor-ew-resize">
                  ↔
                </div>
              </div>

            </div>

            <div class="mt-4 text-center text-xs text-[#6B7788] font-semibold">
              ← Drag slider left or right to inspect fabric details →
            </div>
          </div>

        </div>
      </section>

      <!-- 4. Hygiene Standards (Section 18) -->
      <section class="py-16 lg:py-24 bg-[#F4F2EC] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-white px-4 py-1.5 rounded-full border border-black/8">
              Certified Care
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              More Than Clean. Properly Cared For.
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              We treat your fine furniture with professional textile equipment ensuring maximum longevity.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="text-3xl mb-3">⚙️</div>
              <h3 class="font-display font-bold text-base text-[#121820]">Professional Equipment</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Industrial multi-chamber vacuum extractors designed specifically for residential upholstery care.
              </p>
            </div>

            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="text-3xl mb-3">💧</div>
              <h3 class="font-display font-bold text-base text-[#121820]">Controlled Moisture</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Precision water delivery preventing water-logging, internal rust, and spring decay inside wooden frames.
              </p>
            </div>

            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="text-3xl mb-3">🌿</div>
              <h3 class="font-display font-bold text-base text-[#121820]">Non-Toxic Detergents</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                pH-balanced, biodegradable formulas safe for infants, household pets, and family members with allergies.
              </p>
            </div>

            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="text-3xl mb-3">🔍</div>
              <h3 class="font-display font-bold text-base text-[#121820]">Joint Post-Inspection</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Our certified technician reviews every cushion alongside you before any payment is collected.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- 5. How It Works (Section 19) -->
      <section class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
              Frictionless Experience
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              How It Works
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              From online selection to a pristine living room in four simple, transparent steps.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            
            <div class="timeline-step-card flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">01</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">Book in 2 Mins</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Select your sofa type, number of seats, or mattress and pick your preferred time slot online.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Instant price preview →
              </div>
            </div>

            <div class="timeline-step-card flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">02</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">We Arrive On Time</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Our background-verified specialist arrives equipped at your doorstep across Hyderabad.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Live dispatch tracking →
              </div>
            </div>

            <div class="timeline-step-card flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">03</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">We Deep Clean</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Our 5-stage hot steam extraction removes stains, dust mites, and odors without mess or fuss.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Hospital-grade extraction →
              </div>
            </div>

            <div class="timeline-step-card flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">04</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">You Relax & Inspect</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Inspect your refreshed sofa together with the technician. Pay securely only after your complete satisfaction.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Pay after inspection →
              </div>
            </div>

          </div>

          <div class="mt-12 text-center">
            <button onclick="store.setView('book')" class="btn-primary text-xs py-3.5 px-8 shadow-lg">
              <span>Book Your Cleaning Appointment</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>

        </div>
      </section>

      <!-- 6. Why Choose Siri Sofa Services (Section 20) -->
      <section class="py-16 lg:py-24 bg-[#F4F2EC] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-white px-4 py-1.5 rounded-full border border-black/8">
              Genuine Business Values
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              Why Siri Sofa Services
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              Factual, reliable standards built around customer trust and transparent service delivery.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                👨‍🔧
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Verified Specialists</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                All technicians are directly employed, police-verified, and trained specifically in fabric safety and extraction equipment.
              </p>
            </div>

            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🏷️
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Transparent Pricing</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Clear per-seat pricing with zero surprise arrival charges, hidden transit fees, or pressure upselling at your home.
              </p>
            </div>

            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🛵
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Doorstep Convenience</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Self-contained vans bringing all machinery and power supplies to your apartment or villa across Hyderabad.
              </p>
            </div>

            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                📱
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Frictionless Booking</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Instant time slot reservation with real-time OTP confirmation, booking reschedule options, and live dispatch tracking.
              </p>
            </div>

            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🌿
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Eco-Safe Hypoallergenic Products</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Enzymatic detergents chosen for fabric preservation and infant/pet safety with zero caustic chemical residues.
              </p>
            </div>

            <div class="why-card bg-white p-7 rounded-2xl border border-black/5 shadow-xs">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🤝
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Dedicated Customer Support</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Direct phone and WhatsApp support from 8:00 AM to 8:00 PM daily for rescheduling, questions, and after-service care.
              </p>
            </div>

          </div>

        </div>
      </section>
    `;
  },

  initSlider() {
    const box = document.getElementById('before-after-slider-box');
    const clip = document.getElementById('before-clip-layer');
    const divider = document.getElementById('slider-divider-bar');
    if (!box || !clip || !divider) return;

    let isDown = false;

    const move = (clientX) => {
      const rect = box.getBoundingClientRect();
      let pos = ((clientX - rect.left) / rect.width) * 100;
      pos = Math.max(0, Math.min(100, pos));
      clip.style.width = `${pos}%`;
      divider.style.left = `${pos}%`;
    };

    box.addEventListener('mousedown', (e) => {
      isDown = true;
      move(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      move(e.clientX);
    });

    // Mobile touch
    box.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDown = true;
        move(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDown = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDown || e.touches.length !== 1) return;
      move(e.touches[0].clientX);
    }, { passive: true });
  }
};

window.StorySectionsComponent = StorySectionsComponent;
