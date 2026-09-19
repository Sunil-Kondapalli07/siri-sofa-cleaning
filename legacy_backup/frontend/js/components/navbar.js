/**
 * Siri Sofa Services — Modern Sticky Luxury Navigation Bar
 */

const NavbarComponent = {
  mobileMenuOpen: false,

  render() {
    const user = store.currentUser;
    const currentView = store.currentView;

    return `
      <header id="main-header" class="sticky top-0 z-50 glass-nav transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            
            <!-- Brand Logo -->
            <div class="flex items-center gap-3 cursor-pointer group" onclick="store.setView('home')">
              <div class="w-11 h-11 rounded-2xl bg-[#0C4A34] flex items-center justify-center text-white shadow-md shadow-[#0C4A34]/20 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6 text-[#EBF5F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-display font-black text-xl sm:text-2xl tracking-tight text-[#121820]">
                    SIRI SOFA
                  </span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#0C4A34]"></span>
                </div>
                <span class="text-[10px] font-bold text-[#6B7788] tracking-widest uppercase -mt-0.5">
                  Doorstep Hygiene
                </span>
              </div>
            </div>

            <!-- Desktop Navigation Links -->
            <nav class="hidden md:flex items-center gap-1 lg:gap-1.5">
              <button onclick="store.setView('home')" class="px-3.5 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'home' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#4A5568] hover:text-[#121820] hover:bg-black/5'}">
                Home
              </button>
              <button onclick="store.setView('services')" class="px-3.5 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'services' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#4A5568] hover:text-[#121820] hover:bg-black/5'}">
                Services & Pricing
              </button>
              <button onclick="store.setView('hygiene')" class="px-3.5 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'hygiene' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#4A5568] hover:text-[#121820] hover:bg-black/5'}">
                Before / After
              </button>
              <button onclick="store.setView('track')" class="px-3.5 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'track' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#4A5568] hover:text-[#121820] hover:bg-black/5'}">
                <span class="inline-flex items-center gap-1.5">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0C4A34] opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-[#0C4A34]"></span>
                  </span>
                  Track Booking
                </span>
              </button>
            </nav>

            <!-- Actions & Auth Controls -->
            <div class="hidden sm:flex items-center gap-3">
              ${user ? `
                <div class="flex items-center gap-2">
                  ${user.role === 'admin' ? `
                    <button onclick="store.setView('admin')" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121820] text-white hover:bg-black transition-all shadow-sm text-xs font-bold">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>HQ Operations</span>
                    </button>
                  ` : `
                    <button onclick="store.setView('customer')" class="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/10 bg-white hover:border-[#0C4A34]/40 transition-all shadow-sm">
                      <div class="w-6 h-6 rounded-full bg-[#EBF5F0] text-[#0C4A34] font-bold flex items-center justify-center text-xs">
                        ${(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span class="text-xs font-bold text-[#121820] max-w-[100px] truncate">${user.name || 'Account'}</span>
                    </button>
                  `}
                  <button onclick="NavbarComponent.handleLogout()" title="Sign Out" class="p-2 text-[#8490A0] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                  </button>
                </div>
              ` : `
                <button onclick="NavbarComponent.openAuthModal('login')" class="px-4 py-2 text-xs font-bold text-[#121820] hover:text-[#0C4A34] transition-colors">
                  Sign In
                </button>
                <button onclick="store.setView('book')" class="btn-primary text-xs py-2 px-5">
                  <span>Book Cleaning</span>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              `}
            </div>

            <!-- Mobile Hamburger Button -->
            <div class="flex items-center gap-2 md:hidden">
              <button onclick="NavbarComponent.toggleMobileMenu()" class="p-2.5 rounded-xl border border-black/10 text-[#121820] hover:bg-black/5 focus:outline-none transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>

          </div>
        </div>

        <!-- Mobile Drawer Menu -->
        <div id="mobile-nav-drawer" class="hidden md:hidden border-t border-black/5 bg-[#FAF9F6]/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fade-in">
          <button onclick="store.setView('home'); NavbarComponent.toggleMobileMenu(false);" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${currentView === 'home' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#121820]'}">
            Home
          </button>
          <button onclick="store.setView('services'); NavbarComponent.toggleMobileMenu(false);" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${currentView === 'services' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#121820]'}">
            Services & Pricing
          </button>
          <button onclick="store.setView('hygiene'); NavbarComponent.toggleMobileMenu(false);" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${currentView === 'hygiene' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#121820]'}">
            Before / After Comparison
          </button>
          <button onclick="store.setView('track'); NavbarComponent.toggleMobileMenu(false);" class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${currentView === 'track' ? 'text-[#0C4A34] bg-[#EBF5F0]' : 'text-[#121820]'}">
            Track Booking
          </button>
          <div class="pt-2 border-t border-black/5 flex flex-col gap-2">
            ${user ? `
              <button onclick="store.setView('${user.role === 'admin' ? 'admin' : 'customer'}'); NavbarComponent.toggleMobileMenu(false);" class="w-full py-2.5 rounded-xl bg-white border border-black/10 text-center text-sm font-bold text-[#121820]">
                ${user.role === 'admin' ? '⚡ Operations HQ' : 'My Account Dashboard'}
              </button>
              <button onclick="NavbarComponent.handleLogout(); NavbarComponent.toggleMobileMenu(false);" class="w-full py-2.5 rounded-xl text-center text-sm font-bold text-red-600 bg-red-50">
                Sign Out
              </button>
            ` : `
              <button onclick="NavbarComponent.openAuthModal('login'); NavbarComponent.toggleMobileMenu(false);" class="w-full py-2.5 rounded-xl bg-white border border-black/10 text-center text-sm font-bold text-[#121820]">
                Sign In
              </button>
              <button onclick="store.setView('book'); NavbarComponent.toggleMobileMenu(false);" class="w-full py-3 rounded-full bg-[#0C4A34] text-center text-sm font-bold text-white shadow-md">
                Book Cleaning Service
              </button>
            `}
          </div>
        </div>
      </header>
    `;
  },

  toggleMobileMenu(forceState) {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer) return;
    if (typeof forceState === 'boolean') {
      this.mobileMenuOpen = forceState;
    } else {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    }
    if (this.mobileMenuOpen) {
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  },

  handleLogout() {
    ApiClient.logout();
    store.setUser(null);
    store.trackingBookingId = null;
    store.trackedBooking = null;
    if (window.BookingTrackerComponent && typeof window.BookingTrackerComponent.reset === 'function') {
      window.BookingTrackerComponent.reset();
    }
    if (window.CustomerPortalComponent) {
      window.CustomerPortalComponent.customerBookings = [];
    }
    // Dismiss any orphaned dialogs/modals
    document.getElementById('booking-success-modal')?.remove();
    document.getElementById('invoice-modal')?.remove();
    document.getElementById('reschedule-modal')?.remove();
    store.setView('home');
  },

  openAuthModal(initialTab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.App && window.App.switchAuthTab) {
        window.App.switchAuthTab(initialTab);
      }
    }
  }
};

window.NavbarComponent = NavbarComponent;
