/**
 * Siri Sofa Services — Main Application Controller
 */

const App = {
  async init() {
    console.log("Initializing Siri Sofa Services App...");

    // 1. Load Initial Data (Services & Dynamic Pricing from Backend)
    await store.loadInitialData();

    // 2. Setup Subscriber
    store.subscribe((event, data) => {
      if (event === 'view_change') {
        this.renderView(data);
      } else if (event === 'user_change') {
        this.updateNav();
        if (store.currentView === 'customer') {
          CustomerPortalComponent.loadCustomerData();
        } else if (store.currentView === 'book') {
          BookingWizardComponent.refresh();
        }
      }
    });

    // 3. Initial Navigation based on Hash or Default
    const hash = window.location.hash.replace('#', '');
    const initialView = ['home', 'services', 'hygiene', 'book', 'track', 'customer', 'admin'].includes(hash) ? hash : 'home';
    store.currentView = initialView;

    // 4. Initial Render
    this.render();

    // 5. Setup Hash listener
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (['home', 'services', 'hygiene', 'book', 'track', 'customer', 'admin'].includes(h)) {
        if (store.currentView !== h) {
          store.setView(h);
        }
      }
    });
  },

  render() {
    const root = document.getElementById('app');
    if (!root) return;

    root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
        <!-- Navigation Bar -->
        <div id="nav-host">
          ${NavbarComponent.render()}
        </div>

        <!-- Dynamic Main Content View -->
        <main id="main-content" class="flex-1">
          <!-- Views will be dynamically injected here -->
        </main>

        <!-- Global Footer -->
        <footer class="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                    🛋️
                  </div>
                  <span class="font-display font-black text-xl text-white">Siri Sofa Services</span>
                </div>
                <p class="text-xs leading-relaxed text-slate-400">
                  Leading 3D-first residential & commercial upholstery deep cleaning platform. Hyderabad • Bengaluru • Mumbai • Pune.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3">Our Core Services</h4>
                <ul class="text-xs space-y-2">
                  <li><a href="#services" onclick="store.setView('services')" class="hover:text-teal-400 transition-colors">Fabric & Velvet Sofa Cleaning</a></li>
                  <li><a href="#services" onclick="store.setView('services')" class="hover:text-teal-400 transition-colors">Dining & Office Chair Shampoo</a></li>
                  <li><a href="#services" onclick="store.setView('services')" class="hover:text-teal-400 transition-colors">Anti-Allergen Mattress Sanitization</a></li>
                  <li><a href="#services" onclick="store.setView('services')" class="hover:text-teal-400 transition-colors">Living Room Carpet Deep Extraction</a></li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3">Customer Portals</h4>
                <ul class="text-xs space-y-2">
                  <li><a href="#track" onclick="store.setView('track')" class="hover:text-teal-400 transition-colors">Track Live Cleaning Dispatch</a></li>
                  <li><a href="#customer" onclick="store.setView('customer')" class="hover:text-teal-400 transition-colors">Customer Account & Past Invoices</a></li>
                  <li><a href="#hygiene" onclick="store.setView('hygiene')" class="hover:text-teal-400 transition-colors">6-Step Hospital Grade Process</a></li>
                  <li><a href="#services" onclick="store.setView('services')" class="hover:text-teal-400 transition-colors">Hyderabad Service Coverage</a></li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-3">Direct Support</h4>
                <div class="text-xs space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-teal-400">📞</span>
                    <span>+91 98000 00000</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-teal-400">✉️</span>
                    <span>support@sirisofa.com</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-teal-400">⏰</span>
                    <span>08:00 AM – 08:00 PM (Daily)</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-8 border-t border-slate-800 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>© 2026 Siri Sofa Services Pvt Ltd. All rights reserved. Hyderabad, Telangana.</div>
              <div class="flex items-center gap-4">
                <a href="javascript:void(0)" class="hover:text-slate-400">Privacy Policy</a>
                <a href="javascript:void(0)" class="hover:text-slate-400">Terms of Service</a>
                <a href="javascript:void(0)" class="hover:text-slate-400">Doorstep Hygiene Guarantee</a>
                <span class="text-slate-800">•</span>
                <a href="#admin" onclick="store.setView('admin')" class="hover:text-slate-400 text-slate-600 font-mono text-[11px] flex items-center gap-1">
                  <span>🔒 Staff Operations</span>
                </a>
              </div>
            </div>
          </div>
        </footer>

        <!-- Global Auth Modal -->
        ${this.renderAuthModal()}

        <!-- Global OTP Verification Modal (Single) -->
        ${this.renderOtpModal()}

        <!-- Global Dual OTP Verification Modal (Signup) -->
        ${this.renderSignupVerifyModal()}
      </div>
    `;

    this.renderView(store.currentView);
  },

  updateNav() {
    const host = document.getElementById('nav-host');
    if (host) host.innerHTML = NavbarComponent.render();
  },

  renderView(viewName) {
    window.location.hash = viewName;
    this.updateNav();

    const main = document.getElementById('main-content');
    if (!main) return;

    if (viewName === 'home') {
      main.innerHTML = `
        <div id="hero-view-container">${HeroComponent.render()}</div>
        <div id="hygiene-view-container">${HygieneProcessComponent.render()}</div>
        <div id="services-view-container">${ServiceSelectorComponent.render()}</div>
        <div id="reviews-view-container">${ReviewsFaqComponent.render()}</div>
      `;
      // Initialize 3D Hero, Before/After Slider, and Modern 3D Motion
      setTimeout(() => {
        try { HeroComponent.initViewer(); } catch (e) { console.warn("Hero 3D notice:", e); }
        try { HygieneProcessComponent.initSlider(); } catch (e) { console.warn("Slider notice:", e); }
        this.init3DMotionEffects();
      }, 70);

    } else if (viewName === 'services') {
      main.innerHTML = `
        <div id="services-view-container">${ServiceSelectorComponent.render()}</div>
        <div id="reviews-view-container">${ReviewsFaqComponent.render()}</div>
      `;
      setTimeout(() => this.init3DMotionEffects(), 70);

    } else if (viewName === 'hygiene') {
      main.innerHTML = `
        <div id="hygiene-view-container">${HygieneProcessComponent.render()}</div>
      `;
      setTimeout(() => {
        try { HygieneProcessComponent.initSlider(); } catch (e) { console.warn(e); }
        this.init3DMotionEffects();
      }, 70);

    } else if (viewName === 'book') {
      main.innerHTML = `
        <div id="booking-view-container">${BookingWizardComponent.render()}</div>
      `;
      if (store.wizard.step === 3) {
        setTimeout(() => BookingWizardComponent.initMap(), 80);
      }

    } else if (viewName === 'track') {
      main.innerHTML = `
        <div id="tracker-view-container">${BookingTrackerComponent.render()}</div>
      `;
      setTimeout(() => {
        if (store.trackingBookingId) {
          BookingTrackerComponent.loadBooking(store.trackingBookingId);
        } else {
          BookingTrackerComponent.reset();
        }
      }, 50);

    } else if (viewName === 'customer') {
      if (!store.currentUser) {
        main.innerHTML = this.renderCustomerLoginPrompt();
        return;
      }
      main.innerHTML = `
        <div id="customer-view-container">${CustomerPortalComponent.render()}</div>
      `;
      setTimeout(() => {
        CustomerPortalComponent.loadCustomerData();
      }, 50);

    } else if (viewName === 'admin') {
      // Security Route Guard: Prevent unauthorized customer/visitor access
      if (!store.currentUser) {
        main.innerHTML = this.renderAdminLoginGateway();
        return;
      }
      if (store.currentUser.role !== 'admin') {
        main.innerHTML = this.renderAccessDeniedView();
        return;
      }
      main.innerHTML = `
        <div id="admin-view-container">${AdminPortalComponent.render()}</div>
      `;
      setTimeout(() => {
        AdminPortalComponent.loadAdminData();
      }, 50);
    }
  },

  renderCustomerLoginPrompt() {
    return `
      <section class="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50">
        <div class="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 text-center">
          <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 text-3xl font-black">
            👤
          </div>
          <h2 class="text-2xl font-black text-slate-900">Customer Account</h2>
          <p class="text-xs text-slate-500 mt-1 mb-6">
            Please sign in to view your upcoming bookings, past service invoices, and manage saved Hyderabad addresses.
          </p>
          <div class="space-y-3">
            <button onclick="NavbarComponent.openAuthModal('login')" class="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all">
              Sign In to My Account
            </button>
            <button onclick="NavbarComponent.openAuthModal('signup')" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors">
              Create New Customer Account (Sign Up)
            </button>
            <button onclick="store.setView('home')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors">
              ← Return to Home Page
            </button>
          </div>
        </div>
      </section>
    `;
  },

  renderAccessDeniedView() {
    const user = store.currentUser || { name: 'Customer' };
    return `
      <section class="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div class="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5 text-3xl">
            🛡️
          </div>
          
          <span class="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-mono font-bold uppercase tracking-wider">
            403 • Access Denied
          </span>
          
          <h2 class="text-2xl font-black text-white mt-3 mb-2">Administrative Privileges Required</h2>
          
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            You are currently signed in as <strong class="text-slate-200">${user.name}</strong> (<span class="text-teal-400">Customer Account</span>). 
            Access to the Siri Operations HQ, technician fleet dispatch, and live dynamic pricing engine is strictly restricted to authorized staff administrators.
          </p>

          <div class="space-y-2.5">
            <button onclick="store.setView('customer')" class="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-teal-600/20">
              ← Return to My Customer Dashboard
            </button>
            <button onclick="store.setView('home')" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700">
              Go to Home Page
            </button>
            <button onclick="NavbarComponent.handleLogout(); store.setView('admin');" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-red-400 text-xs font-semibold transition-colors">
              Sign Out & Switch to Staff Account
            </button>
          </div>
        </div>
      </section>
    `;
  },

  renderAdminLoginGateway() {
    return `
      <section class="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div class="text-center mb-6">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-3 text-2xl font-black">
              🔒
            </div>
            <span class="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-mono font-bold uppercase tracking-wider">
              Staff & Operations HQ
            </span>
            <h2 class="text-2xl font-black text-white mt-2">Authorized Staff Login</h2>
            <p class="text-xs text-slate-400 mt-1">Please authenticate with your administrative credentials to manage dispatch and dynamic pricing.</p>
          </div>

          <form id="staff-login-form" onsubmit="App.handleStaffLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Staff Email</label>
              <input type="email" id="staff-email" required placeholder="admin@sirisofa.com" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" id="staff-password" required placeholder="••••••••" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-teal-500">
            </div>

            <div id="staff-login-error" class="hidden p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium"></div>

            <button type="submit" id="staff-login-submit-btn" class="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-teal-600/25">
              Authenticate & Open Operations HQ
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-slate-800 text-center">
            <button onclick="store.setView('home')" class="text-xs text-slate-500 hover:text-teal-400 transition-colors font-medium">
              ← Return to Siri Sofa Customer Website
            </button>
          </div>
        </div>
      </section>
    `;
  },

  async handleStaffLogin(evt) {
    evt.preventDefault();
    const email = document.getElementById('staff-email')?.value.trim();
    const password = document.getElementById('staff-password')?.value;
    const errBox = document.getElementById('staff-login-error');
    const btn = document.getElementById('staff-login-submit-btn');

    if (errBox) errBox.classList.add('hidden');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errBox) {
        errBox.innerText = 'Please enter a valid staff email address (e.g. admin@sirisofa.com).';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (!password || password.length < 4) {
      if (errBox) {
        errBox.innerText = 'Please enter your staff password (at least 4 characters).';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Verifying staff credentials...';
    }

    try {
      const res = await ApiClient.login(email, password);
      if (res.user.role !== 'admin') {
        throw new Error('Access Denied: The specified account does not possess administrator privileges.');
      }
      store.setUser(res.user);
      store.setView('admin');
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Staff authentication failed';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Authenticate & Open Operations HQ';
      }
    }
  },

  init3DMotionEffects() {
    // 3D card tilt removed in favor of sleek, professional CSS hover animations
  },

  authTab: 'login', // 'login' or 'signup'

  renderAuthModal() {
    return `
      <div id="auth-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#0C4A34]/10 relative max-h-[90vh] overflow-y-auto">
          
          <button onclick="document.getElementById('auth-modal').classList.add('hidden')" class="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1 text-2xl font-bold leading-none transition-colors">
            &times;
          </button>

          <!-- Brand Icon & Header -->
          <div class="text-center mb-6">
            <div class="w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0C4A34] to-[#165B40] text-white flex items-center justify-center mx-auto mb-3 text-xl font-black shadow-lg shadow-[#0C4A34]/20">
              ✨
            </div>
            <h3 class="text-2xl font-extrabold text-stone-900 tracking-tight" id="auth-modal-title">Welcome to Siri Sofa</h3>
            <p class="text-xs text-stone-500 mt-1 font-medium">Premier Doorstep Upholstery Care • Hyderabad</p>
          </div>

          <!-- Auth Tab Switcher (Sign In vs Create Account) -->
          <div class="flex items-center p-1 bg-stone-100 rounded-2xl mb-6 border border-stone-200/80">
            <button id="auth-tab-login-btn" onclick="App.switchAuthTab('login')" class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#0C4A34] text-white shadow-sm">
              Sign In
            </button>
            <button id="auth-tab-signup-btn" onclick="App.switchAuthTab('signup')" class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-stone-600 hover:text-stone-900">
              Create Account
            </button>
          </div>

          <!-- 1. SIGN IN FORM -->
          <div id="auth-login-view" class="${this.authTab === 'login' ? 'block' : 'hidden'}">
            <form onsubmit="App.handleLogin(event)" class="space-y-4" novalidate>
              <div id="auth-login-error" class="hidden p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"></div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1.5">Email or Mobile Number *</label>
                <input type="text" id="auth-email" class="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="name@example.com or 9876543210">
                <div id="auth-email-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1.5">Password *</label>
                <input type="password" id="auth-password" class="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="••••••••">
                <div id="auth-password-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
              </div>

              <button type="submit" id="auth-submit-btn" class="w-full py-3.5 rounded-xl bg-[#0C4A34] hover:bg-[#083324] text-white font-black text-sm shadow-lg shadow-[#0C4A34]/25 transition-all transform hover:-translate-y-0.5">
                Sign In to Account
              </button>

              <div class="text-center pt-2">
                <span class="text-xs text-stone-500">Don't have an account yet?</span>
                <button type="button" onclick="App.switchAuthTab('signup')" class="text-xs font-bold text-[#0C4A34] hover:underline ml-1">
                  Create Account
                </button>
              </div>
            </form>
          </div>

          <!-- 2. SIGN UP (REGISTRATION) FORM -->
          <div id="auth-signup-view" class="${this.authTab === 'signup' ? 'block' : 'hidden'}">
            <form onsubmit="App.handleRegister(event)" class="space-y-3.5" novalidate>
              <div id="auth-signup-error" class="hidden p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold mb-2"></div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1.5">Full Name *</label>
                <input type="text" id="reg-name" class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="e.g. Ramesh Reddy">
                <div id="reg-name-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1.5">Mobile (+91) *</label>
                  <input type="text" id="reg-phone" class="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="98480 99887">
                  <div id="reg-phone-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1.5">Hyderabad Area *</label>
                  <select id="reg-area" class="w-full px-2.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none bg-white">
                    <option value="Banjara Hills">Banjara Hills</option>
                    <option value="Jubilee Hills">Jubilee Hills</option>
                    <option value="Gachibowli">Gachibowli</option>
                    <option value="Madhapur (Hitec City)">Madhapur</option>
                    <option value="Kondapur">Kondapur</option>
                    <option value="Kukatpally">Kukatpally</option>
                    <option value="Secunderabad">Secunderabad</option>
                    <option value="Manikonda">Manikonda</option>
                  </select>
                  <div id="reg-area-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1.5">Email Address *</label>
                <input type="email" id="reg-email" class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="ramesh@example.com">
                <div id="reg-email-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1.5">Create Password *</label>
                <input type="password" id="reg-password" minlength="6" class="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#0C4A34] focus:border-[#0C4A34] focus:outline-none transition-all" placeholder="At least 6 characters">
                <div id="reg-password-err" class="hidden text-xs text-red-600 font-bold mt-1"></div>
              </div>

              <div class="text-[11px] text-stone-500 leading-relaxed">
                By creating an account, you agree to our 100% Doorstep Hygiene Guarantee in Hyderabad.
              </div>

              <button type="submit" id="reg-submit-btn" class="w-full py-3.5 rounded-xl bg-[#0C4A34] hover:bg-[#083324] text-white font-black text-sm shadow-lg shadow-[#0C4A34]/25 transition-all transform hover:-translate-y-0.5">
                Create My Account & Continue
              </button>

              <div class="text-center pt-1">
                <span class="text-xs text-stone-500">Already registered?</span>
                <button type="button" onclick="App.switchAuthTab('login')" class="text-xs font-bold text-[#0C4A34] hover:underline ml-1">
                  Sign In
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;
  },

  switchAuthTab(tab) {
    this.authTab = tab;
    const loginView = document.getElementById('auth-login-view');
    const signupView = document.getElementById('auth-signup-view');
    const loginBtn = document.getElementById('auth-tab-login-btn');
    const signupBtn = document.getElementById('auth-tab-signup-btn');
    const title = document.getElementById('auth-modal-title');

    if (tab === 'signup') {
      if (loginView) loginView.classList.add('hidden');
      if (signupView) signupView.classList.remove('hidden');
      if (loginBtn) loginBtn.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-stone-600 hover:text-stone-900';
      if (signupBtn) signupBtn.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#0C4A34] text-white shadow-sm';
      if (title) title.innerText = 'Create Siri Sofa Account';
    } else {
      if (signupView) signupView.classList.add('hidden');
      if (loginView) loginView.classList.remove('hidden');
      if (signupBtn) signupBtn.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-stone-600 hover:text-stone-900';
      if (loginBtn) loginBtn.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#0C4A34] text-white shadow-sm';
      if (title) title.innerText = 'Welcome to Siri Sofa';
    }
  },

  switchToLoginWithIdentifier(identifier) {
    this.switchAuthTab('login');
    const authInput = document.getElementById('auth-email');
    if (authInput && identifier) {
      authInput.value = identifier;
      const passInput = document.getElementById('auth-password');
      if (passInput) passInput.focus();
    }
  },

  renderOtpModal() {
    return `
      <div id="otp-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#0C4A34]/15 relative text-center">
          
          <button onclick="App.closeOtpModal()" class="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1 text-2xl font-bold leading-none transition-colors">
            &times;
          </button>

          <div class="w-14 h-14 rounded-2xl bg-[#0C4A34]/10 text-[#0C4A34] flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-inner border border-[#0C4A34]/15">
            🔐
          </div>

          <span class="px-3.5 py-1 rounded-full bg-[#0C4A34]/10 border border-[#0C4A34]/20 text-[#0C4A34] text-[11px] font-mono font-bold uppercase tracking-widest">
            Identity Verification
          </span>

          <h3 class="text-2xl font-extrabold text-stone-900 mt-2.5 mb-1 tracking-tight" id="otp-modal-title">Verify Your Account</h3>
          <p class="text-xs text-stone-500 mb-4 leading-relaxed">
            Enter the 6-digit verification code sent to <strong id="otp-target-display" class="text-stone-900 font-bold"></strong>
          </p>

          <!-- Secure Dispatch Notice -->
          <div class="mb-5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left flex items-start gap-3">
            <span class="text-lg">🛡️</span>
            <div class="text-xs text-stone-700 leading-tight">
              <div class="font-bold text-stone-900">Encrypted Delivery</div>
              <p class="text-[11px] text-stone-500 mt-0.5">Your one-time passkey has been securely transmitted. Check your inbox or SMS.</p>
            </div>
          </div>

          <!-- 6-Digit Auto-Focus Input Grid -->
          <div class="flex items-center justify-center gap-2 sm:gap-2.5 my-5">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="0">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="1">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="2">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="3">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="4">
            <input type="text" maxlength="1" inputmode="numeric" class="otp-box w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black font-mono text-stone-900 rounded-2xl border-2 border-stone-200 focus:border-[#0C4A34] focus:ring-4 focus:ring-[#0C4A34]/15 focus:outline-none transition-all" data-idx="5">
          </div>

          <div id="otp-error-msg" class="hidden text-xs font-bold text-red-600 mb-3"></div>

          <button type="button" id="otp-verify-btn" onclick="App.submitOtpVerification()" class="w-full py-3.5 rounded-2xl bg-[#0C4A34] hover:bg-[#083324] text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-[#0C4A34]/25 transform hover:-translate-y-0.5">
            Verify & Confirm
          </button>

          <!-- Resend Cooldown Countdown -->
          <div class="mt-4 text-xs text-stone-500">
            <span>Didn't receive the code?</span>
            <button type="button" id="otp-resend-btn" onclick="App.resendOtp()" disabled class="font-bold text-[#0C4A34] disabled:text-stone-400 disabled:cursor-not-allowed hover:underline ml-1">
              Resend in <span id="otp-timer">30</span>s
            </button>
          </div>

        </div>
      </div>
    `;
  },

  activeOtpData: null,
  otpTimerInterval: null,

  async triggerOtpFlow(target, type, userId = null, onComplete = null) {
    this.activeOtpData = { target, type, userId, onComplete };
    const modal = document.getElementById('otp-modal');
    const targetDisp = document.getElementById('otp-target-display');
    const title = document.getElementById('otp-modal-title');
    const errBox = document.getElementById('otp-error-msg');

    if (errBox) errBox.classList.add('hidden');
    if (targetDisp) targetDisp.innerText = target;
    if (title) title.innerText = type === 'mobile' ? 'Verify Mobile Number' : 'Verify Email Address';

    // Clear inputs
    const inputs = document.querySelectorAll('.otp-box');
    inputs.forEach(inp => inp.value = '');

    if (modal) modal.classList.remove('hidden');

    // Request real-time OTP from backend
    try {
      await ApiClient.sendOtp(target, type, userId);
      this.startOtpTimer(30);
      setTimeout(() => inputs[0]?.focus(), 100);
      this.setupOtpInputListeners();
    } catch (e) {
      if (errBox) {
        errBox.innerText = e.message;
        errBox.classList.remove('hidden');
      }
    }
  },

  setupOtpInputListeners() {
    const inputs = document.querySelectorAll('.otp-box');
    inputs.forEach((input, index) => {
      input.oninput = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val ? val.charAt(val.length - 1) : '';
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      };

      input.onkeydown = (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      };

      input.onpaste = (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        pasteData.split('').forEach((char, i) => {
          if (inputs[i]) inputs[i].value = char;
        });
        if (pasteData.length === 6) {
          App.submitOtpVerification();
        }
      };
    });
  },

  startOtpTimer(seconds = 30) {
    clearInterval(this.otpTimerInterval);
    let remaining = seconds;
    const resendBtn = document.getElementById('otp-resend-btn');
    const timerDisp = document.getElementById('otp-timer');
    if (resendBtn) resendBtn.disabled = true;

    this.otpTimerInterval = setInterval(() => {
      remaining -= 1;
      if (timerDisp) timerDisp.innerText = remaining;
      if (remaining <= 0) {
        clearInterval(this.otpTimerInterval);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.innerText = 'Resend Code Now';
        }
      }
    }, 1000);
  },

  async resendOtp() {
    if (!this.activeOtpData) return;
    const resendBtn = document.getElementById('otp-resend-btn');
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.innerText = 'Sending...';
    }
    await this.triggerOtpFlow(
      this.activeOtpData.target, 
      this.activeOtpData.type, 
      this.activeOtpData.userId, 
      this.activeOtpData.onComplete
    );
  },

  async submitOtpVerification() {
    if (!this.activeOtpData) return;
    const inputs = document.querySelectorAll('.otp-box');
    let code = '';
    inputs.forEach(inp => code += inp.value);

    const errBox = document.getElementById('otp-error-msg');
    const btn = document.getElementById('otp-verify-btn');

    if (code.length < 6) {
      if (errBox) {
        errBox.innerText = 'Please enter all 6 digits.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Verifying Code...';
    }

    try {
      const res = await ApiClient.verifyOtp(
        this.activeOtpData.target, 
        this.activeOtpData.type, 
        code, 
        this.activeOtpData.userId
      );

      // Update current user state in store
      if (store.currentUser) {
        if (this.activeOtpData.type === 'mobile') {
          store.currentUser.is_mobile_verified = true;
        } else {
          store.currentUser.is_email_verified = true;
        }
        localStorage.setItem('siri_user', JSON.stringify(store.currentUser));
        store.notify('user_change', store.currentUser);
      }

      this.closeOtpModal();
      alert(`✅ ${this.activeOtpData.type.toUpperCase()} verified successfully!`);

      if (this.activeOtpData.onComplete) {
        this.activeOtpData.onComplete();
      }
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Invalid verification code';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Verify & Confirm';
      }
    }
  },

  closeOtpModal() {
    clearInterval(this.otpTimerInterval);
    document.getElementById('otp-modal')?.classList.add('hidden');
  },

  renderSignupVerifyModal() {
    return `
      <div id="signup-verify-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#0C4A34]/15 relative max-h-[90vh] overflow-y-auto">
          
          <button onclick="App.closeSignupVerifyModal()" class="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-1 text-2xl font-bold leading-none transition-colors" title="Close">
            &times;
          </button>

          <div class="text-center mb-6">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0C4A34]/10 border border-[#0C4A34]/20 text-[#0C4A34] text-[11px] font-mono font-bold uppercase tracking-wider">
              <span>🛡️</span> Security Verification
            </span>
            <h3 class="text-2xl font-extrabold text-stone-900 mt-2 mb-1 tracking-tight">Verify Mobile & Email</h3>
            <p class="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
              Real-world hygiene appointments require 2-factor identity confirmation. Please confirm your mobile and email codes below.
            </p>
          </div>

          <!-- Real-Time Delivery Notice -->
          <div id="signup-notice-box" class="mb-5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left flex items-start gap-3">
            <span class="text-lg">📩</span>
            <div class="text-xs text-stone-700 leading-tight">
              <div class="font-bold text-stone-900">Separate Secure Passcodes Sent</div>
              <p class="text-[11px] text-stone-500 mt-0.5">
                Check your SMS inbox for the mobile code and your email inbox for the email verification code.
              </p>
            </div>
          </div>

          <!-- 1. MOBILE VERIFICATION CARD -->
          <div id="signup-mobile-card" class="mb-4 p-4 rounded-2xl border border-stone-200 bg-stone-50/70 transition-all">
            <div class="flex items-center justify-between mb-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#0C4A34]/10 text-[#0C4A34] flex items-center justify-center font-bold text-sm">
                  📱
                </div>
                <div>
                  <div class="text-xs font-bold text-stone-900">Mobile SMS Code</div>
                  <div id="signup-mobile-target" class="text-[11px] text-stone-500 font-mono">+91 --</div>
                </div>
              </div>
              <span id="signup-mobile-badge" class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <span>⏳</span> Pending
              </span>
            </div>

            <div id="signup-mobile-input-section" class="mt-3">
              <div class="flex items-center gap-2">
                <input type="text" id="signup-mobile-otp" maxlength="6" inputmode="numeric" placeholder="6-digit SMS OTP" 
                  onkeydown="if(event.key==='Enter') App.verifySignupMobile()"
                  class="flex-1 px-3.5 py-2.5 text-center font-mono tracking-widest text-base font-bold text-stone-900 bg-white rounded-xl border border-stone-200 focus:border-[#0C4A34] focus:ring-2 focus:ring-[#0C4A34]/20 focus:outline-none transition-all">
                <button type="button" id="signup-mobile-btn" onclick="App.verifySignupMobile()" 
                  class="px-4 py-2.5 rounded-xl bg-[#0C4A34] hover:bg-[#083324] text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-[#0C4A34]/20 whitespace-nowrap">
                  Verify Mobile
                </button>
              </div>
              <div id="signup-mobile-err" class="hidden text-xs font-bold text-red-600 mt-2"></div>
              <div class="mt-2.5 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Didn't get SMS?</span>
                <button type="button" id="signup-mobile-resend-btn" onclick="App.resendSignupOtp('mobile')" disabled 
                  class="font-bold text-[#0C4A34] disabled:text-stone-400 disabled:cursor-not-allowed hover:underline">
                  Resend SMS in <span id="signup-mobile-timer">30</span>s
                </button>
              </div>
            </div>
          </div>

          <!-- 2. EMAIL VERIFICATION CARD -->
          <div id="signup-email-card" class="mb-5 p-4 rounded-2xl border border-stone-200 bg-stone-50/70 transition-all">
            <div class="flex items-center justify-between mb-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#0C4A34]/10 text-[#0C4A34] flex items-center justify-center font-bold text-sm">
                  ✉️
                </div>
                <div>
                  <div class="text-xs font-bold text-stone-900">Email Address Code</div>
                  <div id="signup-email-target" class="text-[11px] text-stone-500 font-mono">--</div>
                </div>
              </div>
              <span id="signup-email-badge" class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <span>⏳</span> Pending
              </span>
            </div>

            <div id="signup-email-input-section" class="mt-3">
              <div class="flex items-center gap-2">
                <input type="text" id="signup-email-otp" maxlength="6" inputmode="numeric" placeholder="6-digit Email OTP" 
                  onkeydown="if(event.key==='Enter') App.verifySignupEmail()"
                  class="flex-1 px-3.5 py-2.5 text-center font-mono tracking-widest text-base font-bold text-stone-900 bg-white rounded-xl border border-stone-200 focus:border-[#0C4A34] focus:ring-2 focus:ring-[#0C4A34]/20 focus:outline-none transition-all">
                <button type="button" id="signup-email-btn" onclick="App.verifySignupEmail()" 
                  class="px-4 py-2.5 rounded-xl bg-[#0C4A34] hover:bg-[#083324] text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-[#0C4A34]/20 whitespace-nowrap">
                  Verify Email
                </button>
              </div>
              <div id="signup-email-err" class="hidden text-xs font-bold text-red-600 mt-2"></div>
              <div class="mt-2.5 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Didn't get Email?</span>
                <button type="button" id="signup-email-resend-btn" onclick="App.resendSignupOtp('email')" disabled 
                  class="font-bold text-[#0C4A34] disabled:text-stone-400 disabled:cursor-not-allowed hover:underline">
                  Resend Email in <span id="signup-email-timer">30</span>s
                </button>
              </div>
            </div>
          </div>

          <!-- 3. COMPLETION CTA -->
          <button type="button" id="signup-complete-btn" onclick="App.completeSignupActivation()" disabled
            class="w-full py-3.5 rounded-2xl bg-stone-200 text-stone-400 font-black text-sm tracking-wide transition-all cursor-not-allowed flex items-center justify-center gap-2">
            <span>🔒 Verify Both Mobile & Email to Complete</span>
          </button>

          <div class="text-center mt-3">
            <button type="button" onclick="App.closeSignupVerifyModal()" class="text-xs text-stone-400 hover:text-stone-600">
              Cancel and verify later
            </button>
          </div>

        </div>
      </div>
    `;
  },

  signupPending: null,

  launchSignupDualVerification(user, phone, email, res = {}) {
    this.signupPending = {
      user: user,
      phone: phone,
      email: email,
      mobileVerified: false,
      emailVerified: false,
      mobileInterval: null,
      emailInterval: null,
      challenges: {
        mobile: res.mobile_challenge_id || null,
        email: res.email_challenge_id || null
      }
    };

    const modal = document.getElementById('signup-verify-modal');
    const mTarget = document.getElementById('signup-mobile-target');
    const eTarget = document.getElementById('signup-email-target');
    const mInput = document.getElementById('signup-mobile-otp');
    const eInput = document.getElementById('signup-email-otp');
    const mErr = document.getElementById('signup-mobile-err');
    const eErr = document.getElementById('signup-email-err');
    const noticeBox = document.getElementById('signup-notice-box');

    if (mTarget) mTarget.innerText = phone ? `+91 ${phone}` : 'No phone provided';
    if (eTarget) eTarget.innerText = email;
    if (mInput) mInput.value = '';
    if (eInput) eInput.value = '';
    if (mErr) mErr.classList.add('hidden');
    if (eErr) eErr.classList.add('hidden');

    if (noticeBox) {
      if (res.mobile_delivered === false || res.email_delivered === false) {
        noticeBox.className = 'mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-3';
        noticeBox.innerHTML = `
          <span class="text-xl">⚠️</span>
          <div class="text-xs text-amber-900 leading-tight flex-1">
            <div class="font-bold text-slate-900">Verification delivery needs attention</div>
            <p class="text-[11px] text-amber-800 mt-1">Check your SMS/email provider configuration. Verification codes are never displayed in this application.</p>
          </div>
        `;
      } else {
        noticeBox.className = 'mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-start gap-3';
        noticeBox.innerHTML = `
          <span class="text-xl text-emerald-600">✅</span>
          <div class="text-xs text-emerald-900 leading-tight">
            <div class="font-bold text-emerald-950">Live 2-Factor Codes Dispatched!</div>
            <p class="text-[11px] text-emerald-700 mt-0.5">
              Live codes have been sent to <strong>+91 ${phone}</strong> and <strong>${email}</strong>. Please check your SMS and Email.
            </p>
          </div>
        `;
      }
    }

    this.resetSignupVerificationUI();

    if (modal) modal.classList.remove('hidden');

    // Start 30s countdowns for both channels
    this.startSignupCooldown('mobile', 30);
    this.startSignupCooldown('email', 30);

    setTimeout(() => {
      if (mInput) mInput.focus();
    }, 150);
  },

  resetSignupVerificationUI() {
    const mBadge = document.getElementById('signup-mobile-badge');
    const eBadge = document.getElementById('signup-email-badge');
    const mCard = document.getElementById('signup-mobile-card');
    const eCard = document.getElementById('signup-email-card');
    const mInputSec = document.getElementById('signup-mobile-input-section');
    const eInputSec = document.getElementById('signup-email-input-section');
    const completeBtn = document.getElementById('signup-complete-btn');

    if (mBadge) {
      mBadge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1';
      mBadge.innerHTML = '<span>⏳</span> Pending';
    }
    if (eBadge) {
      eBadge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1';
      eBadge.innerHTML = '<span>⏳</span> Pending';
    }
    if (mCard) mCard.className = 'mb-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/60 transition-all';
    if (eCard) eCard.className = 'mb-5 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/60 transition-all';
    if (mInputSec) mInputSec.style.display = 'block';
    if (eInputSec) eInputSec.style.display = 'block';

    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.className = 'w-full py-3.5 rounded-2xl bg-slate-200 text-slate-400 font-black text-sm tracking-wide transition-all cursor-not-allowed flex items-center justify-center gap-2';
      completeBtn.innerHTML = '<span>🔒 Verify Both Mobile & Email to Complete</span>';
    }
  },

  startSignupCooldown(channel, seconds = 30) {
    const btn = document.getElementById(`signup-${channel}-resend-btn`);
    const timerDisp = document.getElementById(`signup-${channel}-timer`);
    if (!btn) return;

    btn.disabled = true;
    let remaining = seconds;
    if (timerDisp) timerDisp.innerText = remaining;

    const intervalKey = `${channel}Interval`;
    if (this.signupPending && this.signupPending[intervalKey]) {
      clearInterval(this.signupPending[intervalKey]);
    }

    const interval = setInterval(() => {
      remaining -= 1;
      if (timerDisp) timerDisp.innerText = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        if (btn) {
          btn.disabled = false;
          btn.innerText = `Resend ${channel === 'mobile' ? 'SMS' : 'Email'} Now`;
        }
      }
    }, 1000);

    if (this.signupPending) {
      this.signupPending[intervalKey] = interval;
    }
  },

  async resendSignupOtp(channel) {
    if (!this.signupPending) return;
    const target = channel === 'mobile' ? this.signupPending.phone : this.signupPending.email;
    const btn = document.getElementById(`signup-${channel}-resend-btn`);
    const errBox = document.getElementById(`signup-${channel}-err`);
    if (errBox) errBox.classList.add('hidden');

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Sending...';
    }

    try {
      const res = await ApiClient.sendOtp(target, channel, this.signupPending.user?.id);
      this.signupPending.challenges[channel] = res.challenge_id;
      this.startSignupCooldown(channel, 30);

    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Failed to resend code';
        errBox.classList.remove('hidden');
      }
      if (btn) {
        btn.disabled = false;
        btn.innerText = `Resend ${channel === 'mobile' ? 'SMS' : 'Email'} Now`;
      }
    }
  },

  async verifySignupMobile() {
    if (!this.signupPending) return;
    const input = document.getElementById('signup-mobile-otp');
    const code = input?.value.trim();
    const btn = document.getElementById('signup-mobile-btn');
    const errBox = document.getElementById('signup-mobile-err');
    const badge = document.getElementById('signup-mobile-badge');
    const card = document.getElementById('signup-mobile-card');
    const inputSec = document.getElementById('signup-mobile-input-section');

    if (errBox) errBox.classList.add('hidden');

    if (!code || code.length < 6) {
      if (errBox) {
        errBox.innerText = 'Please enter all 6 digits of the SMS code.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Verifying...';
    }

    try {
      await ApiClient.verifyOtp(this.signupPending.challenges.mobile, 'mobile', code);
      this.signupPending.mobileVerified = true;

      // Update UI for Mobile card
      if (badge) {
        badge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1';
        badge.innerHTML = '<span>✓</span> Mobile Verified';
      }
      if (card) {
        card.className = 'mb-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 transition-all';
      }
      if (inputSec) {
        inputSec.innerHTML = `<div class="text-xs font-bold text-emerald-800 flex items-center gap-1.5 py-1"><span>✅</span> Mobile number verified successfully!</div>`;
      }

      this.checkSignupCompletion();
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Invalid SMS verification code.';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btn && !this.signupPending.mobileVerified) {
        btn.disabled = false;
        btn.innerText = 'Verify Mobile';
      }
    }
  },

  async verifySignupEmail() {
    if (!this.signupPending) return;
    const input = document.getElementById('signup-email-otp');
    const code = input?.value.trim();
    const btn = document.getElementById('signup-email-btn');
    const errBox = document.getElementById('signup-email-err');
    const badge = document.getElementById('signup-email-badge');
    const card = document.getElementById('signup-email-card');
    const inputSec = document.getElementById('signup-email-input-section');

    if (errBox) errBox.classList.add('hidden');

    if (!code || code.length < 6) {
      if (errBox) {
        errBox.innerText = 'Please enter all 6 digits of the Email code.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Verifying...';
    }

    try {
      await ApiClient.verifyOtp(this.signupPending.challenges.email, 'email', code);
      this.signupPending.emailVerified = true;

      // Update UI for Email card
      if (badge) {
        badge.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1';
        badge.innerHTML = '<span>✓</span> Email Verified';
      }
      if (card) {
        card.className = 'mb-5 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 transition-all';
      }
      if (inputSec) {
        inputSec.innerHTML = `<div class="text-xs font-bold text-emerald-800 flex items-center gap-1.5 py-1"><span>✅</span> Email address verified successfully!</div>`;
      }

      this.checkSignupCompletion();
    } catch (err) {
      if (errBox) {
        errBox.innerText = err.message || 'Invalid Email verification code.';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btn && !this.signupPending.emailVerified) {
        btn.disabled = false;
        btn.innerText = 'Verify Email';
      }
    }
  },

  checkSignupCompletion() {
    if (!this.signupPending) return;
    const completeBtn = document.getElementById('signup-complete-btn');

    if (this.signupPending.mobileVerified && this.signupPending.emailVerified) {
      if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.className = 'w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-teal-600/30 cursor-pointer flex items-center justify-center gap-2';
        completeBtn.innerHTML = '<span>🎉 All Verified — Enter Siri Sofa Services &rarr;</span>';
      }
    }
  },

  completeSignupActivation() {
    if (!this.signupPending || !this.signupPending.mobileVerified || !this.signupPending.emailVerified) {
      alert('Please verify both your mobile number and email before proceeding.');
      return;
    }

    const user = {
      ...this.signupPending.user,
      is_mobile_verified: true,
      is_email_verified: true
    };

    store.setUser(user);
    this.closeSignupVerifyModal();

    alert(`🎉 Account fully activated, ${user.name}! Welcome to Siri Sofa Services Hyderabad.`);
    if (store.currentView === 'book') {
      BookingWizardComponent.refresh();
    } else {
      store.setView('customer');
    }
  },

  closeSignupVerifyModal() {
    if (this.signupPending) {
      if (this.signupPending.mobileInterval) clearInterval(this.signupPending.mobileInterval);
      if (this.signupPending.emailInterval) clearInterval(this.signupPending.emailInterval);
      this.signupPending = null;
    }
    document.getElementById('signup-verify-modal')?.classList.add('hidden');
  },

  async handleRegister(e) {
    e.preventDefault();
    const nameInput = document.getElementById('reg-name');
    const phoneInput = document.getElementById('reg-phone');
    const emailInput = document.getElementById('reg-email');
    const passInput = document.getElementById('reg-password');
    const areaInput = document.getElementById('reg-area');
    const btn = document.getElementById('reg-submit-btn');

    const errSummary = document.getElementById('auth-signup-error');
    const nameErr = document.getElementById('reg-name-err');
    const phoneErr = document.getElementById('reg-phone-err');
    const emailErr = document.getElementById('reg-email-err');
    const passErr = document.getElementById('reg-password-err');
    const areaErr = document.getElementById('reg-area-err');

    const resetField = (input, errEl) => {
      if (input) input.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
      if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
    };
    resetField(nameInput, nameErr);
    resetField(phoneInput, phoneErr);
    resetField(emailInput, emailErr);
    resetField(passInput, passErr);
    resetField(areaInput, areaErr);
    if (errSummary) errSummary.classList.add('hidden');

    const name = nameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const password = passInput?.value || '';
    const area = areaInput?.value || '';

    let hasError = false;
    let firstErrorInput = null;

    const setError = (input, errEl, msg) => {
      hasError = true;
      if (input) {
        input.classList.add('border-red-500', 'ring-2', 'ring-red-200');
        if (!firstErrorInput) firstErrorInput = input;
      }
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
      }
    };

    if (!name || name.length < 2) {
      setError(nameInput, nameErr, 'Please enter your full name (at least 2 letters).');
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      setError(nameInput, nameErr, 'Name must contain only alphabetic characters.');
    }

    const rawPhone = phone.replace(/^(\+91|91|0)/, '').replace(/[\s-]/g, '');
    if (!rawPhone) {
      setError(phoneInput, phoneErr, 'Mobile number is required.');
    } else if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      setError(phoneInput, phoneErr, 'Enter a valid 10-digit Indian mobile number (e.g. 9848012345).');
    }

    if (!email) {
      setError(emailInput, emailErr, 'Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailInput, emailErr, 'Please enter a valid email format (e.g. name@example.com).');
    }

    if (!password) {
      setError(passInput, passErr, 'Password is required.');
    } else if (password.length < 6) {
      setError(passInput, passErr, 'Password must be at least 6 characters.');
    }

    if (!area) {
      setError(areaInput, areaErr, 'Please select your Hyderabad area.');
    }

    if (hasError) {
      if (errSummary) {
        errSummary.textContent = 'Please correct the errors in the form before proceeding.';
        errSummary.classList.remove('hidden');
      }
      if (firstErrorInput) firstErrorInput.focus();
      return;
    }

    if (btn) {
      btn.innerHTML = `<span class="animate-spin">⏳</span> Creating Account & Dispatching OTPs...`;
      btn.disabled = true;
    }

    try {
      const res = await ApiClient.register(name, email, rawPhone, password);
      store.wizard.address.area = area || 'Banjara Hills';
      store.wizard.address.city = 'Hyderabad';

      document.getElementById('auth-modal')?.classList.add('hidden');
      this.launchSignupDualVerification(res.user, rawPhone, email, res);
    } catch (err) {
      const errMsg = err.message || 'Registration failed';
      const isAlreadyExists = errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('already registered');

      if (isAlreadyExists) {
        if (errMsg.toLowerCase().includes('email')) {
          if (emailInput) {
            emailInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            emailInput.focus();
          }
          if (emailErr) {
            emailErr.textContent = 'User already exists with this email. Please sign in instead.';
            emailErr.classList.remove('hidden');
          }
        } else if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('phone')) {
          if (phoneInput) {
            phoneInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            phoneInput.focus();
          }
          if (phoneErr) {
            phoneErr.textContent = 'User already exists with this mobile number. Please sign in instead.';
            phoneErr.classList.remove('hidden');
          }
        }

        if (errSummary) {
          errSummary.innerHTML = `
            <div class="flex items-start gap-2.5">
              <span class="text-amber-600 text-base">⚠️</span>
              <div class="flex-1">
                <div class="font-bold text-red-800 text-xs">User Already Exists</div>
                <div class="text-[11px] text-red-700 mt-0.5">${errMsg}</div>
                <button type="button" onclick="App.switchToLoginWithIdentifier('${email || phone}')" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs transition-colors shadow-sm">
                  👉 Click here to Sign In
                </button>
              </div>
            </div>
          `;
          errSummary.classList.remove('hidden');
        } else {
          alert(`User already exists: ${errMsg}`);
        }
      } else {
        if (errSummary) {
          errSummary.textContent = `Registration failed: ${errMsg}`;
          errSummary.classList.remove('hidden');
        } else {
          alert(`Registration failed: ${errMsg}`);
        }
      }
    } finally {
      if (btn) {
        btn.innerHTML = `Create My Account & Continue`;
        btn.disabled = false;
      }
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const loginErr = document.getElementById('auth-login-error');
    const emailErr = document.getElementById('auth-email-err');
    const passErr = document.getElementById('auth-password-err');
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const btn = document.getElementById('auth-submit-btn');

    if (loginErr) loginErr.classList.add('hidden');
    if (emailErr) emailErr.classList.add('hidden');
    if (passErr) passErr.classList.add('hidden');
    if (emailInput) emailInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
    if (passInput) passInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');

    const emailOrPhone = emailInput?.value.trim() || '';
    const password = passInput?.value || '';

    let hasError = false;

    // Check if input is a valid email or a valid 10-digit phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);
    const rawDigits = emailOrPhone.replace(/^(\+91|91|0)/, '').replace(/[\s-]/g, '');
    const isPhone = /^[6-9]\d{9}$/.test(rawDigits);

    if (!emailOrPhone) {
      if (emailErr) { emailErr.textContent = 'Please enter your registered email or mobile number.'; emailErr.classList.remove('hidden'); }
      if (emailInput) emailInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      hasError = true;
    } else if (!isEmail && !isPhone) {
      if (emailErr) { emailErr.textContent = 'Please enter a valid email address or 10-digit Indian mobile number.'; emailErr.classList.remove('hidden'); }
      if (emailInput) emailInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      hasError = true;
    }

    if (!password) {
      if (passErr) { passErr.textContent = 'Please enter your password.'; passErr.classList.remove('hidden'); }
      if (passInput) passInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      hasError = true;
    } else if (password.length < 4) {
      if (passErr) { passErr.textContent = 'Password must be at least 4 characters.'; passErr.classList.remove('hidden'); }
      if (passInput) passInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      hasError = true;
    }

    if (hasError) return;

    if (btn) {
      btn.innerHTML = `<span class="animate-spin">⏳</span> Authenticating...`;
      btn.disabled = true;
    }

    try {
      const res = await ApiClient.login(emailOrPhone, password);
      store.setUser(res.user);
      document.getElementById('auth-modal')?.classList.add('hidden');
      
      if (res.user.role === 'admin') {
        store.setView('admin');
      } else if (store.currentView === 'book') {
        BookingWizardComponent.refresh();
      } else {
        store.setView('customer');
      }
    } catch (err) {
      if (loginErr) {
        loginErr.textContent = err.message || 'Authentication failed. Please check your credentials.';
        loginErr.classList.remove('hidden');
      } else {
        alert(`Login failed: ${err.message}`);
      }
    } finally {
      if (btn) {
        btn.innerHTML = `Sign In to Account`;
        btn.disabled = false;
      }
    }
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
