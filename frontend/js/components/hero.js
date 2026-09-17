/**
 * Hero Component with 3D Sofa Showcase & Particle Effects
 */

const HeroComponent = {
  viewerInstance: null,

  render() {
    return `
      <section class="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden">
        <!-- Background Ambient Glow -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-teal-200/40 via-emerald-100/30 to-transparent blur-3xl -z-10 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            <!-- Left Column: Copy & CTAs -->
            <div class="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold tracking-wide uppercase shadow-sm">
                <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                📍 Exclusively Serving Hyderabad & Cyberabad
              </div>

              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Your Sofa Deserves a <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">Fresh Start.</span>
              </h1>

              <p class="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Professional doorstep sofa, chair, mattress & carpet deep-cleaning across Banjara Hills, Jubilee Hills, Gachibowli, Hitec City, Kondapur, Kukatpally & Secunderabad. Hospital-grade 6-step extraction process eliminating 99.9% of dust mites, allergens, and deep stains.
              </p>

              <!-- CTA Buttons -->
              <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button onclick="store.setView('book')" class="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-xl shadow-teal-600/25 transform hover:-translate-y-0.5 transition-all text-base flex items-center justify-center gap-2 group">
                  <span>Book a Cleaning</span>
                  <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
                <button onclick="store.setView('services')" class="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-base">
                  Explore Services & Pricing
                </button>
              </div>

              <!-- Customer Trust Proof Stack -->
              <div class="flex items-center justify-center lg:justify-start gap-3 pt-2">
                <div class="flex -space-x-2 overflow-hidden">
                  <img class="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Customer">
                  <img class="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Customer">
                  <img class="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="Customer">
                  <img class="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="Customer">
                </div>
                <div class="text-left text-xs">
                  <div class="flex items-center text-amber-500 font-black">★★★★★ <span class="text-slate-900 ml-1.5 font-bold">4.92 / 5.0</span></div>
                  <span class="text-slate-500 font-semibold">15,000+ Sofas Cleaned in Hyderabad</span>
                </div>
              </div>

              <!-- Trust Indicators Checklist -->
              <div class="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200/80">
                <div class="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                  <span>100% Hygienic Process</span>
                </div>
                <div class="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                  <span>Trained & Verified Pros</span>
                </div>
                <div class="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                  <span>Eco-Safe Enzyme Wash</span>
                </div>
                <div class="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  </div>
                  <span>Transparent Live Pricing</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive 3D Sofa Viewer -->
            <div class="lg:col-span-6">
              <div class="relative bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                
                <!-- 3D Header Controls Bar -->
                <div class="flex items-center justify-between pb-3 px-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive 3D Preview</span>
                    <span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">360° Rotate</span>
                  </div>
                  
                  <!-- Clean Mist Animation Trigger -->
                  <button id="hero-clean-spray-btn" onclick="HeroComponent.triggerDeepCleanEffect()" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all border border-teal-200">
                    <svg class="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.294a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/></svg>
                    <span>Simulate Cleaning</span>
                  </button>
                </div>

                <!-- WebGL 3D Canvas Host -->
                <div id="hero-3d-sofa-canvas" class="three-canvas-wrapper my-3 cursor-grab active:cursor-grabbing">
                  <!-- Overlay Controls floating on Canvas -->
                  <div class="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-lg">
                    
                    <!-- Sofa Shape Selector -->
                    <div class="flex items-center gap-1">
                      <button onclick="HeroComponent.changeConfig('1-seater')" class="sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors text-slate-600 hover:bg-slate-100" data-config="1-seater">1S</button>
                      <button onclick="HeroComponent.changeConfig('2-seater')" class="sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors text-slate-600 hover:bg-slate-100" data-config="2-seater">2S</button>
                      <button onclick="HeroComponent.changeConfig('3-seater')" class="sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors bg-teal-700 text-white shadow-sm" data-config="3-seater">3S</button>
                      <button onclick="HeroComponent.changeConfig('l-shape')" class="sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors text-slate-600 hover:bg-slate-100" data-config="l-shape">L-Shape</button>
                    </div>

                    <!-- Color Swatches -->
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-semibold text-slate-500 hidden sm:inline">Fabric:</span>
                      <button onclick="HeroComponent.changeColor(0x0d9488)" class="w-6 h-6 rounded-full bg-teal-600 ring-2 ring-offset-2 ring-teal-600 transition-all shadow-sm" title="Ocean Teal"></button>
                      <button onclick="HeroComponent.changeColor(0x475569)" class="w-6 h-6 rounded-full bg-slate-600 hover:ring-2 hover:ring-offset-2 hover:ring-slate-500 transition-all shadow-sm" title="Slate Grey"></button>
                      <button onclick="HeroComponent.changeColor(0xd97706)" class="w-6 h-6 rounded-full bg-amber-600 hover:ring-2 hover:ring-offset-2 hover:ring-amber-500 transition-all shadow-sm" title="Mustard Ochre"></button>
                      <button onclick="HeroComponent.changeColor(0x1e293b)" class="w-6 h-6 rounded-full bg-slate-900 hover:ring-2 hover:ring-offset-2 hover:ring-slate-800 transition-all shadow-sm" title="Midnight Navy"></button>
                    </div>
                  </div>
                </div>

                <!-- Footer Hint -->
                <div class="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
                  <span>Drag to rotate • Scroll to zoom</span>
                  <span class="text-teal-600 font-semibold">Real-time WebGL Engine</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  },

  initViewer() {
    const canvasContainer = document.getElementById('hero-3d-sofa-canvas');
    if (!canvasContainer) return;

    if (!this.viewerInstance) {
      this.viewerInstance = new Sofa3DViewer('hero-3d-sofa-canvas');
    }
  },

  changeColor(hexColor) {
    if (this.viewerInstance) {
      this.viewerInstance.setColor(hexColor);
    }
  },

  changeConfig(configType) {
    if (this.viewerInstance) {
      this.viewerInstance.setConfig(configType);
    }
    // Update active button state
    document.querySelectorAll('.sofa-config-btn').forEach(btn => {
      if (btn.getAttribute('data-config') === configType) {
        btn.className = 'sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors bg-teal-700 text-white shadow-sm';
      } else {
        btn.className = 'sofa-config-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-colors text-slate-600 hover:bg-slate-100';
      }
    });
  },

  triggerDeepCleanEffect() {
    const btn = document.getElementById('hero-clean-spray-btn');
    if (btn) {
      btn.innerHTML = `<span class="animate-spin mr-1">⚡</span> Cleaning in progress...`;
      btn.disabled = true;
    }
    if (this.viewerInstance) {
      this.viewerInstance.triggerCleaningDemo(() => {
        if (btn) {
          btn.innerHTML = `✨ Sparkling Fresh!`;
          setTimeout(() => {
            btn.innerHTML = `
              <svg class="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.294a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/></svg>
              <span>Simulate Cleaning</span>
            `;
            btn.disabled = false;
          }, 1800);
        }
      });
    }
  }
};

window.HeroComponent = HeroComponent;
