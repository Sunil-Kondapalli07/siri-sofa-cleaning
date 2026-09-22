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
      serviceSlot: '09:00 AM',
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
    const previousUserId = this.currentUser ? this.currentUser.id : null;
    this.currentUser = user;
    if (user) {
      this.wizard.address.name = user.name || '';
      this.wizard.address.email = user.email || '';
      this.wizard.address.phone = user.phone || '';
      // If user switched accounts, isolate tracking state
      if (previousUserId && previousUserId !== user.id) {
        this.trackingBookingId = null;
        this.trackedBooking = null;
        if (window.BookingTrackerComponent && typeof window.BookingTrackerComponent.reset === 'function') {
          window.BookingTrackerComponent.reset();
        }
      }
    } else {
      // Complete state cleanup upon logout
      this.trackingBookingId = null;
      this.trackedBooking = null;
      this.wizard.address = {
        name: '',
        phone: '',
        email: '',
        house_flat: '',
        street: '',
        area: '',
        city: 'Hyderabad',
        pincode: '',
        instructions: ''
      };
      this.wizard.lastCreatedBookingId = null;
      this.resetWizard();
      if (window.BookingTrackerComponent && typeof window.BookingTrackerComponent.reset === 'function') {
        window.BookingTrackerComponent.reset();
      }
      if (window.CustomerPortalComponent) {
        window.CustomerPortalComponent.customerBookings = [];
      }
    }
    this.notify('user_change', user);
  }

  async loadInitialData() {
    try {
      const data = await ApiClient.getServices();
      if (data && data.services && data.services.length > 0) {
        this.services = data.services;
      } else {
        this.services = this.getFallbackServices();
      }

      const pData = await ApiClient.getPricing();
      if (pData && pData.config) {
        this.pricingConfig = pData.config;
      }

      this.notify('services_loaded', this.services);
    } catch (e) {
      console.warn("Backend API not reachable (using static catalog fallback):", e);
      this.services = this.getFallbackServices();
      this.notify('services_loaded', this.services);
    }
  }

  getFallbackServices() {
    return [
      {
        id: 1,
        slug: 'sofa',
        title: 'Sofa Cleaning',
        subtitle: 'Deep cleaning & sanitization',
        description: 'Eco-friendly deep shampoo extraction for fabric, velvet, leather, and faux leather sofas.',
        icon: 'couch',
        variants: [
          { id: 1, service_id: 1, name: '1 Seater Sofa', base_price: 499.0, unit_type: 'seat', estimated_minutes: 30 },
          { id: 2, service_id: 1, name: '2 Seater Sofa', base_price: 899.0, unit_type: 'seat', estimated_minutes: 45 },
          { id: 3, service_id: 1, name: '3 Seater Sofa', base_price: 1299.0, unit_type: 'seat', estimated_minutes: 60 },
          { id: 4, service_id: 1, name: '4 Seater Sofa', base_price: 1699.0, unit_type: 'seat', estimated_minutes: 75 },
          { id: 5, service_id: 1, name: 'L Shape Sectional', base_price: 2199.0, unit_type: 'sofa', estimated_minutes: 90 },
          { id: 6, service_id: 1, name: 'Recliner Sofa', base_price: 849.0, unit_type: 'seat', estimated_minutes: 40 },
          { id: 7, service_id: 1, name: 'Cushion Deep Clean (Set of 5)', base_price: 349.0, unit_type: 'set', estimated_minutes: 20 }
        ]
      },
      {
        id: 2,
        slug: 'chair',
        title: 'Chair Cleaning',
        subtitle: 'Dining & office seating refresh',
        description: 'Spot removal, steam deodorizing, and dust extraction for all types of residential & office chairs.',
        icon: 'chair',
        variants: [
          { id: 8, service_id: 2, name: 'Dining Chair', base_price: 199.0, unit_type: 'chair', estimated_minutes: 15 },
          { id: 9, service_id: 2, name: 'Office Ergonomic Chair', base_price: 299.0, unit_type: 'chair', estimated_minutes: 20 },
          { id: 10, service_id: 2, name: 'Arm Chair / Accent Chair', base_price: 399.0, unit_type: 'chair', estimated_minutes: 25 },
          { id: 11, service_id: 2, name: 'Recliner Single Chair', base_price: 599.0, unit_type: 'chair', estimated_minutes: 35 },
          { id: 12, service_id: 2, name: 'Fabric Stool / Ottoman', base_price: 179.0, unit_type: 'chair', estimated_minutes: 15 }
        ]
      },
      {
        id: 3,
        slug: 'mattress',
        title: 'Mattress Cleaning',
        subtitle: 'Anti-allergen & dust mite elimination',
        description: 'High-suction extraction and UV-safe sanitization to ensure pure, hygienic, allergy-free sleep.',
        icon: 'bed',
        variants: [
          { id: 13, service_id: 3, name: 'Single Bed Mattress', base_price: 899.0, unit_type: 'mattress', estimated_minutes: 45 },
          { id: 14, service_id: 3, name: 'Queen Size Mattress', base_price: 1299.0, unit_type: 'mattress', estimated_minutes: 60 },
          { id: 15, service_id: 3, name: 'King Size Mattress', base_price: 1599.0, unit_type: 'mattress', estimated_minutes: 75 }
        ]
      },
      {
        id: 4,
        slug: 'carpet',
        title: 'Carpet Cleaning',
        subtitle: 'Deep fiber restoration',
        description: 'Heavy-duty rotary scrubber extraction restoring brightness, texture, and deep fiber freshness.',
        icon: 'layers',
        variants: [
          { id: 16, service_id: 4, name: 'Small Accent Rug (< 25 sq ft)', base_price: 599.0, unit_type: 'rug', estimated_minutes: 30 },
          { id: 17, service_id: 4, name: 'Medium Living Room Carpet (up to 60 sq ft)', base_price: 1199.0, unit_type: 'carpet', estimated_minutes: 50 },
          { id: 18, service_id: 4, name: 'Large Hall Carpet (up to 120 sq ft)', base_price: 1899.0, unit_type: 'carpet', estimated_minutes: 80 }
        ]
      }
    ];
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
