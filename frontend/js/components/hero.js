/**
 * Siri Sofa Services — Premium Motion Hero with 3D Sofa Storytelling Mount
 * Adheres to Sections 9, 10, 11, and 70 of the 3D specification.
 */

const HeroComponent = {
  viewerInstance: null,

  render() {
    return `
      <section class="relative pt-6 pb-14 lg:pt-10 lg:pb-20 overflow-hidden bg-[#FAF9F6]">
        
        <!-- Ambient Warm Glow Background -->
        <div class="absolute top-0 right-1/4 w-[650px] h-[480px] bg-gradient-to-bl from-[#0C4A34]/10 via-[#F2F8F5] to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div class="absolute bottom-10 left-10 w-[450px] h-[380px] bg-gradient-to-tr from-[#EBF5F0]/80 to-transparent rounded-full blur-2xl -z-10 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            <!-- Left Column: Editorial Headline & Conversion CTAs -->
            <div class="lg:col-span-6 space-y-6 text-left">
              
              <!-- Eyebrow Badge -->
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-[#C2E2D3] text-[#0C4A34] text-[11px] font-extrabold tracking-wider uppercase shadow-xs">
                <span class="w-2 h-2 rounded-full bg-[#0C4A34] animate-pulse"></span>
                <span>SIRI SOFA SERVICES • HYDERABAD</span>
              </div>

              <!-- Main Headline (Section 11) -->
              <div class="space-y-1">
                <h1 class="hero-editorial-title text-[#121820]">
                  Your Sofa<br>
                  <span class="text-[#0C4A34] italic font-serif tracking-normal">Deserves</span><br>
                  A Deep Clean.
                </h1>
              </div>

              <!-- Supporting Subtitle (Section 11) -->
              <p class="hero-subtitle max-w-lg leading-relaxed font-medium text-[#4A5568]">
                Professional sofa and upholstery cleaning, delivered to your doorstep. Hospital-grade hot-water extraction eliminating embedded stains, body oils, and 99.9% of dust mites.
              </p>

              <!-- Conversion Actions -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button onclick="store.setView('book')" class="btn-primary text-sm py-4 px-8 group shadow-lg">
                  <span>BOOK A CLEANING</span>
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
                <button onclick="store.setView('services')" class="btn-secondary text-sm py-4 px-7">
                  Explore Services & Pricing
                </button>
              </div>

              <!-- Trust Attributes (Section 11) -->
              <div class="pt-6 border-t border-black/8 flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-2 text-xs font-bold text-[#121820]">
                  <span class="text-emerald-600">✓</span>
                  <span>Professional</span>
                </div>
                <div class="h-4 w-px bg-black/15"></div>
                <div class="flex items-center gap-2 text-xs font-bold text-[#121820]">
                  <span class="text-emerald-600">✓</span>
                  <span>Hygienic</span>
                </div>
                <div class="h-4 w-px bg-black/15"></div>
                <div class="flex items-center gap-2 text-xs font-bold text-[#121820]">
                  <span class="text-emerald-600">✓</span>
                  <span>Convenient Doorstep</span>
                </div>
              </div>

            </div>

            <!-- Right Column: Interactive 3D Sofa Storytelling Stage (Section 10) -->
            <div class="lg:col-span-6 relative">
              <div class="relative w-full h-[480px] sm:h-[530px] rounded-3xl overflow-hidden shadow-2xl border border-black/8 bg-gradient-to-b from-white via-[#F8F7F3] to-[#EDE9DE]">
                
                <!-- 3D WebGL Canvas Viewport -->
                <div id="sofa-story-canvas-container" class="w-full h-full"></div>

                <!-- Floating Top Badges -->
                <div class="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <!-- Interaction Hint -->
                  <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-black/5 text-[11px] font-bold text-[#0C4A34] flex items-center gap-2 pointer-events-auto">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🎮 Drag to Rotate 360° • Scroll to Clean</span>
                  </div>

                  <!-- Dynamic Phase Indicator -->
                  <div id="sofa-story-phase-badge" class="bg-[#0C4A34] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md pointer-events-auto">
                    01 • 3D Showcase
                  </div>
                </div>

                <!-- Floating Glass Card Overlay (Bottom) -->
                <div class="absolute bottom-4 left-4 right-4 z-20 glass-card rounded-2xl p-4 shadow-xl border border-white/70 text-left">
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-full bg-[#0C4A34] animate-pulse"></div>
                      <span class="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">Doorstep Deep Steam</span>
                    </div>
                    <span class="text-[11px] font-extrabold text-[#121820] bg-white/80 px-2.5 py-0.5 rounded-md shadow-xs">Dries in 2-3 Hrs</span>
                  </div>
                  <div class="font-display font-extrabold text-base text-[#121820]">Hospital-Grade Upholstery Restoration</div>
                  <p class="text-xs text-[#525D6C] mt-1 leading-snug">
                    Scroll down through the page to witness the step-by-step extraction of dust mites, stains, and odours in real-time 3D.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  },

  initViewer() {
    const container = document.getElementById('sofa-story-canvas-container');
    if (!container) return;

    if (window.ThreeSofaStoryEngine) {
      this.viewerInstance = new ThreeSofaStoryEngine('sofa-story-canvas-container');
    }
  },

  // Safe backward-compatibility stubs
  changeColor() {},
  changeConfig() {},
  triggerDeepCleanEffect() {},
  switchHeroVisual() {}
};

window.HeroComponent = HeroComponent;
