/**
 * Siri Sofa Services — Premium Motion Hero, How It Works & Why Choose Siri Components
 */

const HeroComponent = {
  viewerInstance: null,

  render() {
    return `
      <!-- 1. Hero Section -->
      <section class="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-[#FAF9F6]">
        
        <!-- Ambient Warm Glow Background -->
        <div class="absolute top-0 right-1/4 w-[600px] h-[450px] bg-gradient-to-bl from-[#0C4A34]/5 via-[#F2F8F5] to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div class="absolute bottom-10 left-10 w-[400px] h-[350px] bg-gradient-to-tr from-[#EBF5F0]/60 to-transparent rounded-full blur-2xl -z-10 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <!-- Left Column: Editorial Headline & Actions -->
            <div class="lg:col-span-6 space-y-7 text-left">
              
              <!-- Eyebrow Badge -->
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-[#C2E2D3] text-[#0C4A34] text-[11px] font-extrabold tracking-wider uppercase shadow-xs">
                <span class="w-2 h-2 rounded-full bg-[#0C4A34] animate-pulse"></span>
                <span>SIRI SOFA SERVICES • HYDERABAD</span>
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
                Professional sofa and chair deep extraction cleaning, delivered directly to your doorstep. Hospital-grade fabric sanitization eliminating stains, odors, and 99.9% of dust mites.
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

            <!-- Right Column: Interactive 3D Sofa Studio & Photography -->
            <div class="lg:col-span-6 relative">
              <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-black/8 bg-[#FAF9F6] group">
                
                <!-- View Mode Switcher Pills -->
                <div class="absolute top-4 left-4 z-30 flex items-center p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-black/8 shadow-md text-xs font-bold">
                  <button id="hero-tab-3d-btn" onclick="HeroComponent.switchHeroVisual('3d')" class="px-3 py-1.5 rounded-xl bg-[#0C4A34] text-white shadow-xs transition-all flex items-center gap-1.5">
                    <span>🎮 3D Studio</span>
                  </button>
                  <button id="hero-tab-photo-btn" onclick="HeroComponent.switchHeroVisual('photo')" class="px-3 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 transition-all flex items-center gap-1.5">
                    <span>📸 Restored Suite</span>
                  </button>
                </div>

                <!-- Live 3D Hint Badge -->
                <div class="absolute top-4 right-4 z-30 bg-[#0C4A34]/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Drag to Rotate 360°</span>
                </div>

                <!-- 1. 3D WebGL Canvas Container -->
                <div id="hero-3d-container" class="w-full h-[460px] sm:h-[500px] relative bg-gradient-to-b from-stone-100/70 to-stone-200/50">
                  <div id="hero-3d-sofa-canvas" class="w-full h-full cursor-grab active:cursor-grabbing"></div>

                  <!-- 3D Studio Control Toolbar -->
                  <div class="absolute bottom-4 left-4 right-4 z-30 glass-card rounded-2xl p-3 shadow-xl border border-white/60 flex flex-wrap items-center justify-between gap-2.5">
                    
                    <!-- Color Swatches -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold text-stone-500 uppercase font-mono mr-1 hidden sm:inline">Fabric:</span>
                      <button onclick="HeroComponent.changeColor(0x0C4A34)" class="w-6 h-6 rounded-full bg-[#0C4A34] border-2 border-white shadow-sm ring-1 ring-black/10 hover:scale-125 transition-transform" title="Forest Emerald Velvet"></button>
                      <button onclick="HeroComponent.changeColor(0x1E3A8A)" class="w-6 h-6 rounded-full bg-[#1E3A8A] border-2 border-white shadow-sm ring-1 ring-black/10 hover:scale-125 transition-transform" title="Royal Sapphire"></button>
                      <button onclick="HeroComponent.changeColor(0x9A3412)" class="w-6 h-6 rounded-full bg-[#9A3412] border-2 border-white shadow-sm ring-1 ring-black/10 hover:scale-125 transition-transform" title="Terracotta Rust"></button>
                      <button onclick="HeroComponent.changeColor(0x27272A)" class="w-6 h-6 rounded-full bg-[#27272A] border-2 border-white shadow-sm ring-1 ring-black/10 hover:scale-125 transition-transform" title="Charcoal Velvet"></button>
                      <button onclick="HeroComponent.changeColor(0xE7E5E4)" class="w-6 h-6 rounded-full bg-[#E7E5E4] border-2 border-white shadow-sm ring-1 ring-black/10 hover:scale-125 transition-transform" title="Warm Ivory"></button>
                    </div>

                    <!-- Config Morpher -->
                    <div class="flex items-center gap-1 bg-stone-100/90 p-0.5 rounded-xl border border-stone-200/80 text-[11px] font-bold">
                      <button onclick="HeroComponent.changeConfig('3-seater')" class="sofa-config-btn px-2 py-1 rounded-lg bg-white text-[#0C4A34] shadow-xs" data-config="3-seater">3-Seat</button>
                      <button onclick="HeroComponent.changeConfig('l-shape')" class="sofa-config-btn px-2 py-1 rounded-lg text-stone-600 hover:text-stone-900" data-config="l-shape">L-Shape</button>
                      <button onclick="HeroComponent.changeConfig('2-seater')" class="sofa-config-btn px-2 py-1 rounded-lg text-stone-600 hover:text-stone-900" data-config="2-seater">2-Seat</button>
                    </div>

                    <!-- Steam Simulation Action -->
                    <button id="hero-clean-spray-btn" onclick="HeroComponent.triggerDeepCleanEffect()" class="px-3.5 py-1.5 rounded-xl bg-[#0C4A34] hover:bg-[#083324] text-white text-xs font-bold shadow-md shadow-[#0C4A34]/20 flex items-center gap-1.5 transition-all transform hover:scale-103 active:scale-97">
                      <span>✨ Simulate Clean</span>
                    </button>
                  </div>
                </div>

                <!-- 2. Alternative Photo View (Hidden by default, toggleable) -->
                <div id="hero-photo-container" class="hidden w-full h-[460px] sm:h-[500px] relative">
                  <img src="images/hero_luxury_sofa.jpg" alt="Restored Luxury Green Velvet Sofa" class="w-full h-full object-cover object-center">
                  
                  <!-- Floating Glass Card Overlay -->
                  <div class="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-xs glass-card rounded-2xl p-4 shadow-xl text-left border border-white/40">
                    <div class="flex items-center gap-2.5 mb-1">
                      <div class="w-2.5 h-2.5 rounded-full bg-[#0C4A34] animate-pulse"></div>
                      <span class="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">Doorstep Deep Steam</span>
                    </div>
                    <div class="font-display font-extrabold text-sm text-[#121820]">Deep Fiber Extraction</div>
                    <p class="text-[11px] text-[#525D6C] mt-0.5 leading-snug">Hot-water injection vacuum extracting grime, stains, and micro-particles without residue.</p>
                  </div>
                </div>

              </div>
            </div>

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
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                👨‍🔧
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Professional Cleaning</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Trained and certified upholstery specialists with background verification, equipped with industrial-grade high-power extraction machinery.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🌿
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Safe Hypoallergenic Products</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Eco-safe enzyme detergents selected specifically for fabric longevity, zero harsh bleaches, completely safe for infants and household pets.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🛵
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Direct Doorstep Service</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                We arrive directly at your apartment, villa, or corporate office across Hyderabad with self-contained equipment. No moving required.
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                🏷️
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Transparent Pricing</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Honest upfront pricing with itemized GST breakdown. No surprise arrival charges, hidden fees, or aggressive upselling at your door.
              </p>
            </div>

            <!-- Feature 5 -->
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
              <div class="w-12 h-12 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center text-2xl mb-4 font-bold">
                📱
              </div>
              <h3 class="font-display font-bold text-lg text-[#121820]">Convenient Online Booking</h3>
              <p class="text-xs text-[#525D6C] mt-2 leading-relaxed">
                Simple, frictionless 2-minute booking with date/time slot selection, real-time OTP confirmation, and live specialist route tracking.
              </p>
            </div>

            <!-- Feature 6 -->
            <div class="card-3d-tilt bg-white p-7 rounded-2xl border border-black/5 shadow-xs hover:border-[#0C4A34]/25 transition-all">
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
    const canvasContainer = document.getElementById('hero-3d-sofa-canvas');
    if (!canvasContainer) return;

    try {
      if (typeof Sofa3DViewer !== 'undefined') {
        if (!this.viewerInstance) {
          this.viewerInstance = new Sofa3DViewer('hero-3d-sofa-canvas');
        } else if (this.viewerInstance.onResize) {
          this.viewerInstance.onResize();
        }
      }
    } catch (err) {
      console.warn("3D Sofa Viewer notice:", err);
    }
  },

  changeColor(hexColor) {
    if (this.viewerInstance && this.viewerInstance.setColor) {
      this.viewerInstance.setColor(hexColor);
    }
  },

  changeConfig(configType) {
    if (this.viewerInstance && this.viewerInstance.setConfig) {
      this.viewerInstance.setConfig(configType);
    }
    document.querySelectorAll('.sofa-config-btn').forEach(btn => {
      if (btn.getAttribute('data-config') === configType) {
        btn.className = 'sofa-config-btn px-2 py-1 rounded-lg bg-white text-[#0C4A34] shadow-xs';
      } else {
        btn.className = 'sofa-config-btn px-2 py-1 rounded-lg text-stone-600 hover:text-stone-900';
      }
    });
  },

  triggerDeepCleanEffect() {
    const btn = document.getElementById('hero-clean-spray-btn');
    if (btn) {
      btn.innerHTML = `<span class="animate-spin text-xs">⚡</span> <span>Extracting...</span>`;
      btn.disabled = true;
    }
    if (this.viewerInstance && this.viewerInstance.triggerCleaningDemo) {
      this.viewerInstance.triggerCleaningDemo(() => {
        if (btn) {
          btn.innerHTML = `<span>✨ Restored Clean!</span>`;
          btn.classList.remove('bg-[#0C4A34]');
          btn.classList.add('bg-emerald-600');
          setTimeout(() => {
            btn.innerHTML = `<span>✨ Simulate Clean</span>`;
            btn.classList.remove('bg-emerald-600');
            btn.classList.add('bg-[#0C4A34]');
            btn.disabled = false;
          }, 2000);
        }
      });
    }
  },

  switchHeroVisual(mode) {
    const container3d = document.getElementById('hero-3d-container');
    const containerPhoto = document.getElementById('hero-photo-container');
    const btn3d = document.getElementById('hero-tab-3d-btn');
    const btnPhoto = document.getElementById('hero-tab-photo-btn');

    if (mode === 'photo') {
      if (container3d) container3d.classList.add('hidden');
      if (containerPhoto) containerPhoto.classList.remove('hidden');
      if (btn3d) btn3d.className = 'px-3 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 transition-all flex items-center gap-1.5';
      if (btnPhoto) btnPhoto.className = 'px-3 py-1.5 rounded-xl bg-[#0C4A34] text-white shadow-xs transition-all flex items-center gap-1.5';
    } else {
      if (containerPhoto) containerPhoto.classList.add('hidden');
      if (container3d) container3d.classList.remove('hidden');
      if (btnPhoto) btnPhoto.className = 'px-3 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 transition-all flex items-center gap-1.5';
      if (btn3d) btn3d.className = 'px-3 py-1.5 rounded-xl bg-[#0C4A34] text-white shadow-xs transition-all flex items-center gap-1.5';
      if (this.viewerInstance && this.viewerInstance.onResize) {
        setTimeout(() => this.viewerInstance.onResize(), 60);
      }
    }
  }
};

window.HeroComponent = HeroComponent;
