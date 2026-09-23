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
