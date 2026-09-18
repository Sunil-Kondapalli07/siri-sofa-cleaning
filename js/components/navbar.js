/**
 * Navbar Component
 */

const NavbarComponent = {
  render() {
    const user = store.currentUser;
    const currentView = store.currentView;

    return `
      <header class="sticky top-0 z-50 glass-panel border-b border-slate-200/80 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <!-- Brand Logo -->
            <div class="flex items-center gap-3 cursor-pointer" onclick="store.setView('home')">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-700/20 transform hover:scale-105 transition-transform">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <span class="font-display font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-1.5">
                  Siri <span class="text-teal-600">Sofa</span> Services
                </span>
                <p class="text-xs font-medium text-slate-500 tracking-wide uppercase">Fresh Sofa. Fresh Home.</p>
              </div>
            </div>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center gap-1 lg:gap-2">
              <button onclick="store.setView('home')" class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${currentView === 'home' ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
                Home
              </button>
              <button onclick="store.setView('services')" class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${currentView === 'services' ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
                Services & Pricing
              </button>
              <button onclick="store.setView('hygiene')" class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${currentView === 'hygiene' ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
                Hygiene Process
              </button>
              <button onclick="store.setView('track')" class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${currentView === 'track' ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
                <span class="flex items-center gap-1.5">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  Track Booking
                </span>
              </button>
              <button onclick="store.setView('book')" class="px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${currentView === 'book' ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
                Book Cleaning
              </button>
            </nav>

            <!-- Actions & Auth -->
            <div class="flex items-center gap-3">
              ${user ? `
                <div class="relative flex items-center gap-2">
                  ${user.role === 'admin' ? `
                    <button onclick="store.setView('admin')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-teal-600 bg-teal-800 text-white hover:bg-teal-700 transition-all shadow-sm">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span class="text-xs font-bold">⚡ Operations HQ</span>
                    </button>
                  ` : `
                    <button onclick="store.setView('customer')" class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-sm">
                      <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                        ${user.name.charAt(0)}
                      </div>
                      <div class="text-left hidden lg:block">
                        <div class="text-xs font-bold text-slate-800 leading-tight">${user.name}</div>
                        <div class="text-[10px] text-teal-600 font-semibold">My Account</div>
                      </div>
                    </button>
                  `}
                  <button onclick="NavbarComponent.handleLogout()" title="Logout" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                  </button>
                </div>
              ` : `
                <span class="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  📍 Hyderabad Only
                </span>
                <button onclick="NavbarComponent.openAuthModal('login')" class="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200 transition-colors">
                  Sign In
                </button>
                <button onclick="NavbarComponent.openAuthModal('signup')" class="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-900 hover:text-white hover:bg-slate-900 border border-slate-300 transition-all">
                  Sign Up
                </button>
                <button onclick="store.setView('book')" class="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-md shadow-teal-600/20 transform hover:-translate-y-0.5 transition-all">
                  Book Now
                </button>
              `}
            </div>
          </div>
        </div>
      </header>
    `;
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
