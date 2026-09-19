"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceVariant, CartItem, User } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { ServiceSelector } from "@/components/ServiceSelector";
import { HygieneProcess } from "@/components/HygieneProcess";
import { Features } from "@/components/Features";
import { ReviewsFaq } from "@/components/ReviewsFaq";
import { Footer } from "@/components/Footer";
import { BookingWizardModal } from "@/components/BookingWizardModal";
import { BookingTrackerModal } from "@/components/BookingTrackerModal";
import { AuthModal } from "@/components/AuthModal";
import { AdminModal } from "@/components/AdminModal";

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
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
  const [trackingId, setTrackingId] = useState<string>("");

  useEffect(() => {
    // 1. Fetch initial services and pricing
    api.getServices().then((svcs) => {
      if (svcs && svcs.length > 0) setServices(svcs);
    });
    api.getPricingConfig().then((cfg) => {
      if (cfg) setPricingConfig(cfg);
    });

    // 2. Check existing session
    const savedUser = localStorage.getItem("siri_user_profile");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
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
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("siri_auth_token");
    localStorage.removeItem("siri_user_profile");
  };

  const handleBookingSuccess = (bookingId: string) => {
    setTrackingId(bookingId);
    setCart([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      {/* Navigation Bar */}
      <Navbar
        user={user}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenTracking={() => setIsTrackerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Editorial Luxury Hero */}
        <Hero
          onBookNow={() => setIsBookingOpen(true)}
          onExploreServices={() => {
            document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Interactive Before & After Comparison Slider */}
        <BeforeAfterSlider />

        {/* Interactive Dynamic Services Catalog & Customizer */}
        <ServiceSelector
          services={services}
          cart={cart}
          pricingConfig={pricingConfig}
          onUpdateQuantity={handleUpdateQuantity}
          onProceedToBooking={() => setIsBookingOpen(true)}
        />

        {/* 6-Step Hospital-Grade Hygiene Process */}
        <HygieneProcess />

        {/* How It Works & Why Choose Siri */}
        <Features />

        {/* Customer Reviews & Accordion FAQs */}
        <ReviewsFaq />
      </main>

      {/* Footer */}
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
        onBookingSuccess={handleBookingSuccess}
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

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
