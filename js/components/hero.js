/**
 * Siri Sofa Services — Next-Gen 3D WebGL Hero, Scrollytelling Journey & Value Propositions
 */

const HeroComponent = {
  viewerInstance: null,
  currentViewMode: '3d', // '3d' or 'photo'

  render() {
    return `
      <!-- 1. Hero Section with Live 3D WebGL Canvas Studio -->
      <section class="relative pt-8 pb-14 lg:pt-12 lg:pb-20 overflow-hidden bg-[#FAF9F6]">
        
        <!-- Ambient Warm Glow Background -->
        <div class="absolute top-0 right-1/4 w-[600px] h-[450px] bg-gradient-to-bl from-[#0C4A34]/8 via-[#F2F8F5] to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div class="absolute bottom-10 left-10 w-[400px] h-[350px] bg-gradient-to-tr from-[#EBF5F0]/70 to-transparent rounded-full blur-2xl -z-10 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            <!-- Left Column: Editorial Headline & Value Propositions -->
            <div class="lg:col-span-6 space-y-6 text-left">
              
              <!-- Eyebrow Badge -->
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-[#C2E2D3] text-[#0C4A34] text-[11px] font-extrabold tracking-wider uppercase shadow-xs">
                <span class="w-2 h-2 rounded-full bg-[#0C4A34] animate-pulse"></span>
                <span>SIRI SOFA SERVICES • NEXT-GEN 3D HYGIENE</span>
              </div>

              <!-- Main Editorial Headline -->
              <div class="space-y-1">
                <h1 class="hero-editorial-title text-[#121820]">
                  YOUR SOFA.<br>
                  <span class="text-[#0C4A34] italic font-serif tracking-normal">RESTORED.</span>
                </h1>
              </div>

              <!-- Supporting Text -->
              <p class="hero-subtitle max-w-lg leading-relaxed font-medium text-[#4A5568]">
                Hospital-grade sofa and upholstery deep steam extraction delivered directly to your doorstep. Interact with our real-time 3D model below and scroll to experience every step of restoration.
              </p>

              <!-- CTA Actions -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button onclick="store.setView('book')" class="btn-primary text-sm py-3.5 px-8 group">
                  <span>BOOK A CLEANING</span>
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
                <button onclick="store.setView('services')" class="btn-secondary text-sm py-3.5 px-7">
                  Explore Services & Pricing
                </button>
              </div>

              <!-- Social Proof & Rating Metrics -->
              <div class="pt-6 border-t border-black/8 flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                  <div class="flex -space-x-2">
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Customer">
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Customer">
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Customer">
                  </div>
                  <div>
                    <div class="flex items-center text-amber-500 text-xs font-black">
                      ★★★★★ <span class="text-[#121820] ml-1.5 font-bold">4.9 / 5.0</span>
                    </div>
                    <span class="text-[11px] text-[#6B7788] font-semibold">12,000+ Cleaned Homes</span>
                  </div>
                </div>

                <div class="h-6 w-px bg-black/10 hidden sm:block"></div>

                <div class="flex items-center gap-2 text-xs font-bold text-[#121820]">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Same-Day & Express Slots</span>
                </div>
              </div>

            </div>

            <!-- Right Column: Interactive 3D WebGL Studio & Material Customizer -->
            <div class="lg:col-span-6 relative">
              <div class="sofa-3d-viewport relative group">
                
                <!-- 3D WebGL Canvas Mount Container -->
                <div id="sofa-3d-canvas-container" class="w-full h-full"></div>

                <!-- Fallback / Toggleable High-Res Studio Photo -->
                <div id="hero-photo-container" class="absolute inset-0 hidden overflow-hidden">
                  <img src="images/hero_luxury_sofa.jpg" alt="Restored Luxury Emerald Velvet Sofa" class="w-full h-full object-cover object-center">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none"></div>
                </div>

                <!-- Top Controls & Badges Overlay -->
                <div class="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <!-- Drag / 3D Hint Badge -->
                  <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-black/5 text-[11px] font-bold text-[#0C4A34] flex items-center gap-2 pointer-events-auto">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🎮 3D Studio • Drag to Rotate 360°</span>
                  </div>

                  <!-- Dynamic Stage Pill -->
                  <div id="sofa-3d-stage-pill" class="bg-[#0C4A34] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md pointer-events-auto">
                    Phase 1 • 3D Showcase
                  </div>
                </div>

                <!-- Steam Simulation Status Toast -->
                <div id="cleaning-sim-status" class="hidden absolute top-16 left-4 right-4 z-20 mx-auto max-w-sm bg-[#0C4A34]/95 backdrop-blur-md text-white text-xs font-bold py-2 px-4 rounded-xl text-center shadow-xl transition-all">
                  ✨ Deep Steam Extraction in progress...
                </div>

                <!-- Bottom Glass Card: Material Swatches & Steam Simulation Trigger -->
                <div class="absolute bottom-4 left-4 right-4 z-20 glass-card rounded-2xl p-3.5 sm:p-4 shadow-xl border border-white/80">
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    <!-- Material Swatches -->
                    <div class="space-y-1.5 text-left">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-black uppercase tracking-wider text-[#525D6C]">3D Fabric Upholstery</span>
                        <span id="active-material-name" class="text-[11px] font-bold text-[#0C4A34]">Heritage Emerald Velvet</span>
                      </div>
                      
                      <div class="flex items-center gap-2.5">
                        <!-- Emerald -->
                        <button onclick="HeroComponent.setMaterial('emerald', this)" title="Heritage Emerald Velvet" class="swatch-btn swatch-active w-6 h-6 rounded-full bg-[#0C4A34] border border-white shadow-xs"></button>
                        <!-- Ivory -->
                        <button onclick="HeroComponent.setMaterial('ivory', this)" title="Tuscan Ivory Linen" class="swatch-btn w-6 h-6 rounded-full bg-[#E8E4D9] border border-black/10 shadow-xs"></button>
                        <!-- Navy -->
                        <button onclick="HeroComponent.setMaterial('navy', this)" title="Royal Sapphire Velvet" class="swatch-btn w-6 h-6 rounded-full bg-[#1B365D] border border-white shadow-xs"></button>
                        <!-- Leather -->
                        <button onclick="HeroComponent.setMaterial('leather', this)" title="Saddle Tan Heritage Leather" class="swatch-btn w-6 h-6 rounded-full bg-[#945D3B] border border-white shadow-xs"></button>
                        <!-- Charcoal -->
                        <button onclick="HeroComponent.setMaterial('charcoal', this)" title="Nordic Charcoal Tweed" class="swatch-btn w-6 h-6 rounded-full bg-[#2A2E35] border border-white shadow-xs"></button>
                      </div>
                    </div>

                    <!-- Interactive Action Buttons -->
                    <div class="flex items-center gap-2 pt-1 sm:pt-0">
                      <button onclick="HeroComponent.triggerDeepCleanEffect()" class="btn-primary text-[11px] py-2 px-3.5 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <span>✨ Simulate Steam</span>
                      </button>
                      <button onclick="HeroComponent.toggleViewMode()" title="Toggle 3D View / Studio Photo" class="btn-secondary text-[11px] py-2 px-2.5 shadow-xs">
                        <span id="view-mode-label">📸 Photo</span>
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- 1.5. Interactive 3D Scrollytelling Journey Guide -->
      <section class="py-8 bg-[#F4F2EC] border-y border-black/8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 text-left">
            <div>
              <span class="text-[10px] font-black uppercase tracking-widest text-[#0C4A34] bg-white px-3 py-1 rounded-full border border-black/8">
                Interactive Scrollytelling
              </span>
              <h2 class="text-xl sm:text-2xl font-black text-[#121820] mt-1.5">
                The 3D Anatomy of Upholstery Restoration
              </h2>
            </div>
            <div class="text-xs text-[#525D6C] max-w-md">
              Scroll through our page to see the 3D model automatically transition through each cleaning stage, or click below to inspect immediately.
            </div>
          </div>

          <!-- 5 Scrollytelling Phase Milestone Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            <!-- Phase 1 Card -->
            <button onclick="HeroComponent.scrollToPhase(1)" class="scrolly-phase-card active-phase text-left p-3.5 bg-white rounded-xl border border-black/8 shadow-xs hover:border-[#0C4A34]/40 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="phase-num text-[10px] font-black w-5 h-5 rounded-full bg-[#0C4A34] text-white flex items-center justify-center">1</span>
                <span class="text-[10px] font-bold text-[#6B7788]">0% Scroll</span>
              </div>
              <div class="font-bold text-xs text-[#121820]">3D Spatial Model</div>
              <div class="text-[10px] text-[#525D6C] mt-1">Full 360° geometry & cushion layout</div>
            </button>

            <!-- Phase 2 Card -->
            <button onclick="HeroComponent.scrollToPhase(2)" class="scrolly-phase-card text-left p-3.5 bg-white rounded-xl border border-black/8 shadow-xs hover:border-[#0C4A34]/40 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="phase-num text-[10px] font-black w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">2</span>
                <span class="text-[10px] font-bold text-[#6B7788]">25% Scroll</span>
              </div>
              <div class="font-bold text-xs text-[#121820]">Steam Extraction</div>
              <div class="text-[10px] text-[#525D6C] mt-1">Macro zoom & active particle suction</div>
            </button>

            <!-- Phase 3 Card -->
            <button onclick="HeroComponent.scrollToPhase(3)" class="scrolly-phase-card text-left p-3.5 bg-white rounded-xl border border-black/8 shadow-xs hover:border-[#0C4A34]/40 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="phase-num text-[10px] font-black w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">3</span>
                <span class="text-[10px] font-bold text-[#6B7788]">50% Scroll</span>
              </div>
              <div class="font-bold text-xs text-[#121820]">Cushion Hygiene</div>
              <div class="text-[10px] text-[#525D6C] mt-1">Exploded view of inner fabric layers</div>
            </button>

            <!-- Phase 4 Card -->
            <button onclick="HeroComponent.scrollToPhase(4)" class="scrolly-phase-card text-left p-3.5 bg-white rounded-xl border border-black/8 shadow-xs hover:border-[#0C4A34]/40 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="phase-num text-[10px] font-black w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">4</span>
                <span class="text-[10px] font-bold text-[#6B7788]">75% Scroll</span>
              </div>
              <div class="font-bold text-xs text-[#121820]">Custom Fabrics</div>
              <div class="text-[10px] text-[#525D6C] mt-1">Real-time velvet, linen & leather swatches</div>
            </button>

            <!-- Phase 5 Card -->
            <button onclick="HeroComponent.scrollToPhase(5)" class="scrolly-phase-card text-left p-3.5 bg-white rounded-xl border border-black/8 shadow-xs hover:border-[#0C4A34]/40 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="phase-num text-[10px] font-black w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">5</span>
                <span class="text-[10px] font-bold text-[#6B7788]">100% Scroll</span>
              </div>
              <div class="font-bold text-xs text-[#121820]">Room-Ready Fresh</div>
              <div class="text-[10px] text-[#525D6C] mt-1">Seamless booking & express dispatch</div>
            </button>

          </div>

        </div>
      </section>

      <!-- 2. How It Works Section (4-Step Animated Timeline) -->
      <section class="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3.5 py-1.5 rounded-full border border-[#C2E2D3]">
              Simple & Professional
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              How It Works
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              From instant online selection to a sparkling clean living room in four simple steps.
            </p>
          </div>

          <!-- 4-Step Horizontal Process on Desktop / Vertical on Mobile -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            <!-- Step 1 -->
            <div class="timeline-step-card text-left flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">01</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">Choose Service</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Select your sofa type, number of seats, dining chairs, mattress, or living room carpet from our transparent catalog.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Instant live pricing →
              </div>
            </div>

            <!-- Step 2 -->
            <div class="timeline-step-card text-left flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">02</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">Select Date & Time</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Pick your preferred day and time slot. We offer morning, afternoon, and evening slots with zero extra charge for weekends.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Flexible scheduling →
              </div>
            </div>

            <!-- Step 3 -->
            <div class="timeline-step-card text-left flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">03</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">Provide Location</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Enter your address in Hyderabad. Our live GPS dispatch allocates the closest specialist van equipped with extraction gear.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Doorstep dispatch →
              </div>
            </div>

            <!-- Step 4 -->
            <div class="timeline-step-card text-left flex flex-col justify-between">
              <div>
                <div class="timeline-num-badge">04</div>
                <h3 class="font-display font-bold text-lg text-[#121820]">We Clean Your Sofa</h3>
                <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                  Our certified specialist performs our 6-step deep steam extraction, inspecting fabric hygiene alongside you before payment.
                </p>
              </div>
              <div class="mt-4 pt-4 border-t border-black/5 text-[11px] font-bold text-[#0C4A34]">
                Pay after inspection →
              </div>
            </div>

          </div>

          <!-- Bottom CTA Prompt -->
          <div class="mt-12 text-center">
            <button onclick="store.setView('book')" class="btn-primary text-xs py-3 px-7 shadow-lg">
              <span>Start Your Booking Now</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>

        </div>
      </section>

      <!-- 3. Why Choose Siri Section -->
      <section class="py-16 lg:py-24 bg-[#F4F2EC] border-t border-black/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-white px-3.5 py-1.5 rounded-full border border-black/10">
              The Siri Advantage
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
              Why Choose Siri Sofa Services
            </h2>
            <p class="text-sm sm:text-base text-[#525D6C] mt-2">
              We combine hospital-grade extraction technology with vetted specialists for a peerless home cleaning standard.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Feature 1 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                👨‍🔧
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Professional Cleaning</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Trained and certified upholstery specialists with background verification, equipped with industrial-grade high-power extraction machinery.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🌿
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Safe Hypoallergenic Products</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Eco-safe enzyme detergents selected specifically for fabric longevity, zero harsh bleaches, completely safe for infants and household pets.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🛵
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Direct Doorstep Service</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                We arrive directly at your apartment, villa, or corporate office across Hyderabad with self-contained equipment. No moving required.
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🏷️
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Transparent Pricing</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Honest upfront pricing with itemized GST breakdown. No surprise arrival charges, hidden fees, or aggressive upselling at your door.
              </p>
            </div>

            <!-- Feature 5 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                📱
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Convenient Online Booking</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Simple, frictionless 2-minute booking with date/time slot selection, real-time OTP confirmation, and live specialist route tracking.
              </p>
            </div>

            <!-- Feature 6 -->
            <div class="bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                ✨
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Structured 6-Step Hygiene</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                A proven process including dry dust extraction, stain pre-treatment, foam agitation, hot extraction, deodorizing, and joint inspection.
              </p>
            </div>

          </div>

        </div>
      </section>
    `;
  },

  initViewer() {
    const container = document.getElementById('sofa-3d-canvas-container');
    if (!container) return;

    if (window.Sofa3DViewer) {
      this.viewerInstance = new Sofa3DViewer('sofa-3d-canvas-container');
    }

    // Connect scroll progress listener to update phase cards
    window.addEventListener('scroll', () => {
      if (!this.viewerInstance) return;
      const stage = this.viewerInstance.activeStage;
      const cards = document.querySelectorAll('.scrolly-phase-card');
      cards.forEach((card, idx) => {
        if (idx + 1 === stage) {
          card.classList.add('active-phase');
          const badge = card.querySelector('.phase-num');
          if (badge) {
            badge.classList.remove('bg-slate-200', 'text-slate-700');
            badge.classList.add('bg-[#0C4A34]', 'text-white');
          }
        } else {
          card.classList.remove('active-phase');
          const badge = card.querySelector('.phase-num');
          if (badge) {
            badge.classList.add('bg-slate-200', 'text-slate-700');
            badge.classList.remove('bg-[#0C4A34]', 'text-white');
          }
        }
      });
    }, { passive: true });
  },

  setMaterial(key, btnElement) {
    if (this.viewerInstance) {
      this.viewerInstance.setMaterial(key);
    }
    document.querySelectorAll('.swatch-btn').forEach(btn => btn.classList.remove('swatch-active'));
    if (btnElement) {
      btnElement.classList.add('swatch-active');
    }
  },

  triggerDeepCleanEffect() {
    if (this.viewerInstance) {
      this.viewerInstance.triggerSteamSimulation(4.5);
    }
  },

  toggleViewMode() {
    const canvasMount = document.getElementById('sofa-3d-canvas-container');
    const photoMount = document.getElementById('hero-photo-container');
    const label = document.getElementById('view-mode-label');

    if (this.currentViewMode === '3d') {
      this.currentViewMode = 'photo';
      if (canvasMount) canvasMount.classList.add('hidden');
      if (photoMount) photoMount.classList.remove('hidden');
      if (label) label.textContent = '🛋️ 3D View';
    } else {
      this.currentViewMode = '3d';
      if (photoMount) photoMount.classList.add('hidden');
      if (canvasMount) canvasMount.classList.remove('hidden');
      if (label) label.textContent = '📸 Photo';
      if (this.viewerInstance) {
        this.viewerInstance.handleResize();
      }
    }
  },

  scrollToPhase(phaseNumber) {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollMap = {
      1: 0,
      2: maxScroll * 0.15,
      3: maxScroll * 0.32,
      4: maxScroll * 0.48,
      5: maxScroll * 0.62
    };

    window.scrollTo({
      top: scrollMap[phaseNumber] || 0,
      behavior: 'smooth'
    });
  },

  // Backward compatibility safe stubs
  changeColor(key) { this.setMaterial(key); },
  changeConfig() {},
  switchHeroVisual() { this.toggleViewMode(); }
};

window.HeroComponent = HeroComponent;
