"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceVariant, CartItem, User } from "@/types";
import { api } from "@/lib/api";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Navbar } from "@/components/Navbar";
import { CinematicBrandFilm } from "@/components/film/CinematicBrandFilm";
import { ServicesShowcase } from "@/components/film/ServicesShowcase";
import { HygieneProcess } from "@/components/HygieneProcess";
import { ReviewsFaq } from "@/components/ReviewsFaq";
import { Footer } from "@/components/Footer";
import { BookingWizardModal } from "@/components/BookingWizardModal";
import { BookingTrackerModal } from "@/components/BookingTrackerModal";
import { AuthModal } from "@/components/AuthModal";
import { AdminModal } from "@/components/AdminModal";
import { DEFAULT_SERVICES } from "@/lib/defaultData";
import { getSavedLocation, requestAndSaveCurrentLocation } from "@/lib/location";
import { MyOrdersModal } from "@/components/MyOrdersModal";

export default function Home() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [pricingConfig, setPricingConfig] = useState({
    service_charge: 49,
    gst_percentage: 18,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationPromptMessage, setLocationPromptMessage] = useState("");
  const [trackingId, setTrackingId] = useState<string>("");

  useEffect(() => {
    const savedUser = localStorage.getItem("siri_user_profile") || localStorage.getItem("siri_user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {
        localStorage.removeItem("siri_user_profile");
        localStorage.removeItem("siri_user");
      }
    }

    // 1. Fetch initial services and pricing from Python backend proxy
    api.getServices().then((svcs) => {
      if (svcs && svcs.length > 0) setServices(svcs);
    });
    api.getPricingConfig().then((cfg) => {
      if (cfg) setPricingConfig(cfg);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setLocationPromptOpen(false);
      return;
    }
    if (getSavedLocation()) {
      setLocationPromptOpen(false);
      return;
    }
    // Do not call geolocation automatically here. Browsers can suppress or race
    // permission prompts unless the request is made from a user gesture.
    setLocationPromptMessage("Allow location so we can pre-fill your service address.");
    setLocationPromptOpen(true);
  }, [user]);

  const handleUpdateQuantity = (variant: ServiceVariant, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.variant.id !== variant.id);
      }
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { variant, quantity: newQty }];
    });
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("siri_user_profile", JSON.stringify(loggedInUser));
    localStorage.setItem("siri_user", JSON.stringify(loggedInUser));
    if (!getSavedLocation()) {
      setLocationPromptOpen(true);
      setLocationPromptMessage("Allow location so we can pre-fill your service address.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    api.logout();
  };

  const handleBookingSuccess = (bookingId: string) => {
    setTrackingId(bookingId);
    setCart([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] selection:bg-[#0C4A34] selection:text-white relative">
      {/* Top Scroll Reading Depth Progress Bar */}
      <ScrollProgress />

      {/* Navigation Bar */}
      <Navbar
        user={user}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenTracking={() => setIsTrackerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onLogout={handleLogout}
      />

      {user && locationPromptOpen && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[55] w-[min(92vw,560px)] rounded-2xl border border-[#C2E2D3] bg-white shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] flex items-center justify-center text-lg shrink-0">📍</div>
            <div className="flex-1">
              <div className="font-black text-sm text-[#121820]">Allow location for faster booking</div>
              <p className="text-[11px] text-[#525D6C] mt-1">We’ll use your current location to pre-fill your service address. You can change it before booking.</p>
              {locationPromptMessage && <p className="text-[11px] font-semibold text-[#0C4A34] mt-2">{locationPromptMessage}</p>}
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => {
                  setLocationPromptMessage("Requesting your current location...");
                  void requestAndSaveCurrentLocation()
                    .then((saved) => {
                      if (saved) {
                        setLocationPromptMessage("Location captured. Your address will be filled automatically.");
                        setLocationPromptOpen(false);
                      }
                    })
                    .catch((error) => {
                      setLocationPromptMessage(
                        error instanceof Error ? error.message : "Unable to detect location. You can enter your address manually."
                      );
                    });
                }} className="btn-primary text-[11px] py-2.5 px-4">Allow Location</button>
                <button type="button" onClick={() => setLocationPromptOpen(false)} className="text-[11px] font-bold text-[#8490A0] px-3">Enter manually</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Experience Flow */}
      <main className="flex-1">
        {/* 1. Photorealistic 7-Act Cinematic Brand Film */}
        <CinematicBrandFilm
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenTracking={() => setIsTrackerOpen(true)}
        />

        {/* 2. Interactive Backend-Driven Service Catalog & Customizer */}
        <ServicesShowcase
          services={services}
          cart={cart}
          pricingConfig={pricingConfig}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToBooking={() => setIsBookingOpen(true)}
        />

        {/* 3. Standardized 6-Step Professional Process */}
        <HygieneProcess />

        {/* 4. Verified Customer Reviews & FAQs */}
        <ReviewsFaq />
      </main>

      {/* Global Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracking={() => setIsTrackerOpen(true)}
      />

      {/* Interactive Modals */}
      <BookingWizardModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
        cart={cart}
        pricingConfig={pricingConfig}
        user={user}
        onUpdateQuantity={handleUpdateQuantity}
        onBookingSuccess={handleBookingSuccess}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTrackingWithId={(id) => {
          setTrackingId(id);
          setIsTrackerOpen(true);
        }}
      />

      <BookingTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialBookingId={trackingId}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
