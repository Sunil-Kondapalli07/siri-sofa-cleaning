import { Service, Booking, AvailableSlot, User, Technician } from "@/types";

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("siri_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  // Services & Pricing
  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      return data.services || [];
    } catch {
      return [];
    }
  },

  async getPricingConfig(): Promise<{ service_charge: number; gst_percentage: number }> {
    try {
      const res = await fetch("/api/pricing", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pricing");
      return await res.json();
    } catch {
      return { service_charge: 49, gst_percentage: 18 };
    }
  },

  // Available slots for a specific date
  async getSlots(dateStr: string): Promise<AvailableSlot[]> {
    try {
      const res = await fetch(`/api/slots/available?date=${encodeURIComponent(dateStr)}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.slots || [];
    } catch {
      return [];
    }
  },

  // Coupon validation
  async validateCoupon(code: string, subtotal: number) {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code, subtotal }),
    });
    return await res.json();
  },

  // Bookings
  async createBooking(payload: Record<string, unknown>): Promise<{
    success: boolean;
    booking_id: string;
    total_amount: number;
    error?: string;
  }> {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getBookingById(id: string): Promise<{ booking?: Booking; error?: string }> {
    const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    return await res.json();
  },

  async getCustomerBookings(): Promise<Booking[]> {
    try {
      const res = await fetch("/api/bookings", {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.bookings || [];
    } catch {
      return [];
    }
  },

  // Admin Bookings
  async getAdminBookings(): Promise<Booking[]> {
    const res = await fetch("/api/bookings", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.bookings || [];
  },

  async getTechnicians(): Promise<Technician[]> {
    const res = await fetch("/api/technicians", {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.technicians || [];
  },

  async assignTechnician(bookingId: string, technicianId: number) {
    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/assign`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ technician_id: technicianId }),
    });
    return await res.json();
  },

  // Authentication
  async login(email: string, password: string): Promise<{
    token?: string;
    user?: User;
    error?: string;
  }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  },

  async register(data: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async verifyOtp(challengeId: string, otp: string) {
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: challengeId, otp }),
    });
    return await res.json();
  },
};
