/**
 * Siri Sofa Services — State Management Store
 */

class AppStore {
  constructor() {
    this.currentUser = ApiClient.getCurrentUser();
    this.currentView = 'home'; // 'home', 'services', 'hygiene', 'book', 'track', 'customer', 'admin'
    this.services = [];
    this.pricingConfig = {
      min_booking_amount: 499,
      service_charge: 49,
      gst_percentage: 18
    };

    // Booking Wizard State
    this.wizard = {
      step: 1, // 1 to 5
      selectedCategories: ['sofa'], // 'sofa', 'chair', 'mattress', 'carpet'
      items: {}, // { variant_id: { variant, quantity } }
      address: {
        name: this.currentUser ? this.currentUser.name : '',
        phone: this.currentUser ? this.currentUser.phone : '',
        email: this.currentUser ? this.currentUser.email : '',
        house_flat: '',
        street: '',
        area: '',
        city: 'Hyderabad',
        pincode: '',
        instructions: ''
      },
      serviceDate: this.getDefaultDate(),
      serviceSlot: '10:30 AM',
      couponCode: '',
      discount: 0,
      notes: '',
      lastCreatedBookingId: null
    };

    // Tracking state
    this.trackingBookingId = null;
    this.trackedBooking = null;

    // Listeners
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach(cb => {
      try {
        cb(event, data);
      } catch (err) {
        console.error("Subscriber notification error:", err);
      }
    });
  }

  getDefaultDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow by default
    return d.toISOString().split('T')[0];
  }

  setView(viewName) {
    this.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify('view_change', viewName);
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      this.wizard.address.name = user.name || '';
      this.wizard.address.email = user.email || '';
      this.wizard.address.phone = user.phone || '';
    }
    this.notify('user_change', user);
  }

  async loadInitialData() {
    try {
      const data = await ApiClient.getServices();
      this.services = data.services || [];

      const pData = await ApiClient.getPricing();
      if (pData.config) {
        this.pricingConfig = pData.config;
      }

      this.notify('services_loaded', this.services);
    } catch (e) {
      console.error("Failed to load initial services & pricing:", e);
    }
  }

  // Booking Cart Management
  setItemQuantity(variant, quantity) {
    const q = Math.max(0, parseInt(quantity) || 0);
    if (q === 0) {
      delete this.wizard.items[variant.id];
    } else {
      this.wizard.items[variant.id] = {
        variant: variant,
        quantity: q
      };
    }
    this.notify('cart_updated', this.wizard.items);
  }

  getItemQuantity(variantId) {
    return this.wizard.items[variantId]?.quantity || 0;
  }

  getCartCalculations() {
    let subtotal = 0;
    const itemsList = Object.values(this.wizard.items);
    itemsList.forEach(item => {
      subtotal += item.variant.base_price * item.quantity;
    });

    const serviceCharge = itemsList.length > 0 ? (this.pricingConfig.service_charge || 49) : 0;
    const discount = Math.min(this.wizard.discount || 0, subtotal);
    const taxable = Math.max(0, subtotal - discount + serviceCharge);
    const gstPct = this.pricingConfig.gst_percentage || 18;
    const tax = Math.round(taxable * (gstPct / 100.0) * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;

    return {
      itemCount: itemsList.reduce((acc, it) => acc + it.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      serviceCharge: serviceCharge,
      discount: discount,
      tax: tax,
      gstPct: gstPct,
      total: total,
      items: itemsList
    };
  }

  resetWizard() {
    this.wizard.step = 1;
    this.wizard.items = {};
    this.wizard.couponCode = '';
    this.wizard.discount = 0;
    this.wizard.notes = '';
    this.notify('cart_updated', this.wizard.items);
  }
}

window.store = new AppStore();
