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

                  <!-- Right Column: Premium Hero Photography & Highlights -->
            <div class="lg:col-span-6 relative">
              <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-black/8 bg-white group">
                
                <!-- Main Architectural Hero Photography -->
                <div class="w-full h-[460px] sm:h-[500px] relative overflow-hidden">
                  <img src="images/hero_luxury_sofa.jpg" alt="Restored Luxury Emerald Velvet Sofa - Siri Sofa Services" class="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700 ease-out">
                  
                  <!-- Soft Vignette & Gradient Overlays -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none"></div>

                  <!-- Top Right Hygiene Certification Badge -->
                  <div class="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-black/5 flex items-center gap-2 text-[11px] font-bold text-[#0C4A34]">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>99.9% Sanitized</span>
                  </div>

                  <!-- Top Left Process Pill -->
                  <div class="absolute top-4 left-4 z-20 bg-[#0C4A34]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg text-[11px] font-bold text-white flex items-center gap-2">
                    <span>✨ High-Extraction Steam</span>
                  </div>

                  <!-- Floating Glass Card Overlay (Bottom) -->
                  <div class="absolute bottom-5 left-5 right-5 z-20 glass-card rounded-2xl p-4 sm:p-5 shadow-2xl text-left border border-white/60">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                      <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full bg-[#0C4A34] animate-pulse"></div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">Doorstep Deep Steam</span>
                      </div>
                      <span class="text-[11px] font-extrabold text-[#121820] bg-white/80 px-2.5 py-0.5 rounded-md shadow-xs">Dries in 2-3 Hrs</span>
                    </div>
                    <div class="font-display font-extrabold text-base text-[#121820]">Hospital-Grade Upholstery Restoration</div>
                    <p class="text-xs text-[#525D6C] mt-1 leading-snug">Industrial hot-water injection vacuum extracting embedded allergens, oil, food spills, and pet odors without fabric shrinkage.</p>
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

  // Backward compatibility safe stubs
  initViewer() {},
  changeColor() {},
  changeConfig() {},
  triggerDeepCleanEffect() {},
  switchHeroVisual() {}
};

window.HeroComponent = HeroComponent;
