import { Service, Booking, AvailableSlot, User, Technician } from "@/types";
import { DEFAULT_SERVICES } from "./defaultData";

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    // Frontend is on port 3000, Backend API runs on port 8000
    const hostname = window.location.hostname || "localhost";
    return `${window.location.protocol}//${hostname}:8000`;
  }
  // SSR fallback
  return "http://127.0.0.1:8000";
};

async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const targetUrl = `${base}${endpoint}`;
  try {
    const res = await fetch(targetUrl, options);
    return res;
  } catch (err) {
    // Fallback via Next.js proxy if direct port 8000 fetch fails in unusual environments
    if (endpoint.startsWith("/api/")) {
      try {
        return await fetch(endpoint, options);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("siri_auth_token") ||
      localStorage.getItem("siri_token");
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
      const res = await fetchApi("/api/services", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      return (data.services && data.services.length > 0) ? data.services : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  },

  async getPricingConfig(): Promise<{ service_charge: number; gst_percentage: number }> {
    try {
      const res = await fetchApi("/api/pricing", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = await res.json();
      const cfg = data.config || data;
      return {
        service_charge: Number(cfg.service_charge) || 49,
        gst_percentage: Number(cfg.gst_percentage) || 18,
      };
    } catch {
      return { service_charge: 49, gst_percentage: 18 };
    }
  },

  // Available slots for a specific date
  async getSlots(dateStr: string): Promise<AvailableSlot[]> {
    try {
      const res = await fetchApi(`/api/slots/available?date=${encodeURIComponent(dateStr)}`, {
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
    const res = await fetchApi("/api/coupons/validate", {
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
    const res = await fetchApi("/api/bookings", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getBookingById(id: string): Promise<{ booking?: Booking; error?: string }> {
    const res = await fetchApi(`/api/bookings/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
    });
    return await res.json();
  },

  async getCustomerBookings(): Promise<Booking[]> {
    try {
      const res = await fetchApi("/api/bookings", {
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
    const res = await fetchApi("/api/bookings", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.bookings || [];
  },

  async getTechnicians(): Promise<Technician[]> {
    const res = await fetchApi("/api/technicians", {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.technicians || [];
  },

  async assignTechnician(bookingId: string, technicianId: number) {
    const res = await fetchApi(`/api/bookings/${encodeURIComponent(bookingId)}/assign`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ technician_id: technicianId }),
    });
    return await res.json();
  },

  // Authentication
  async login(emailOrPhone: string, password: string): Promise<{
    token?: string;
    user?: User;
    error?: string;
  }> {
    const res = await fetchApi("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOrPhone, password }),
    });
    const data = await res.json();
    if (data.token && data.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("siri_auth_token", data.token);
        localStorage.setItem("siri_token", data.token);
        localStorage.setItem("siri_user_profile", JSON.stringify(data.user));
        localStorage.setItem("siri_user", JSON.stringify(data.user));
      }
    }
    return data;
  },

  async register(data: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{
    success?: boolean;
    token?: string;
    user?: User;
    requires_verification?: boolean;
    mobile_challenge_id?: string;
    email_challenge_id?: string;
    dev_otp_hint?: string;
    dev_mobile_otp?: string;
    dev_email_otp?: string;
    error?: string;
  }> {
    const res = await fetchApi("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const dataRes = await res.json();
    if (dataRes.token && dataRes.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("siri_auth_token", dataRes.token);
        localStorage.setItem("siri_token", dataRes.token);
        localStorage.setItem("siri_user_profile", JSON.stringify(dataRes.user));
        localStorage.setItem("siri_user", JSON.stringify(dataRes.user));
      }
    }
    return dataRes;
  },

  async verifyOtp(challengeId: string, otp: string) {
    const res = await fetchApi("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge_id: challengeId,
        otp_code: otp,
        otp: otp,
      }),
    });
    return await res.json();
  },

  async logout() {
    try {
      await fetchApi("/api/auth/logout", {
        method: "POST",
        headers: getHeaders(),
      });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("siri_auth_token");
      localStorage.removeItem("siri_token");
      localStorage.removeItem("siri_user_profile");
      localStorage.removeItem("siri_user");
    }
  },
};
