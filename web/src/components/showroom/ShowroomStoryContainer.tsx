"use client";

import React, { useState, useEffect, useRef } from "react";
import { Service, ServiceVariant, CartItem, User } from "@/types";
import { SofaShowroomCanvas } from "./SofaShowroomCanvas";
import { MagneticButton } from "./MagneticButton";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Flame,
  Star,
  Plus,
  Minus,
  ChevronDown,
} from "lucide-react";

interface ShowroomStoryContainerProps {
  services: Service[];
  cart: CartItem[];
  pricingConfig: { service_charge: number; gst_percentage: number };
  onUpdateQuantity: (variant: ServiceVariant, newQty: number) => void;
  onOpenBooking: () => void;
  onOpenTracking: () => void;
  user?: User | null;
}

export const ShowroomStoryContainer: React.FC<ShowroomStoryContainerProps> = ({
  services,
  cart,
  pricingConfig,
  onUpdateQuantity,
  onOpenBooking,
  onOpenTracking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Showroom Catalog State
  const [activeCategory, setActiveCategory] = useState<string>("sofa");

  // Track Mouse Position (-1 to 1)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Track Scroll Progress through the 650vh container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.min(1, Math.max(0, scrolled / containerHeight));
      setScrollProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth lerp on scroll progress for buttery 60fps WebGL transitions
  useEffect(() => {
    let animId: number;
    const lerpProgress = () => {
      setSmoothProgress((prev) => {
        const diff = scrollProgress - prev;
        if (Math.abs(diff) < 0.0005) return scrollProgress;
        return prev + diff * 0.12;
      });
      animId = requestAnimationFrame(lerpProgress);
    };

    animId = requestAnimationFrame(lerpProgress);
    return () => cancelAnimationFrame(animId);
  }, [scrollProgress]);

  // Cart summary
  const subtotal = cart.reduce(
    (sum, item) => sum + item.variant.base_price * item.quantity,
    0
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const serviceCharge = totalItemCount > 0 ? pricingConfig.service_charge : 0;
  const taxable = Math.max(0, subtotal + serviceCharge);
  const tax = Math.round(taxable * (pricingConfig.gst_percentage / 100));
  const estimatedTotal = Math.round(taxable + tax);

  const getItemQuantity = (variantId: number) => {
    const item = cart.find((i) => i.variant.id === variantId);
    return item ? item.quantity : 0;
  };

  const currentService =
    services.find((s) => s.slug === activeCategory) || services[0];

  return (
    <div ref={containerRef} className="relative h-[650vh] bg-[#080B0F]">
      {/* Sticky Fullscreen 3D Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        
        {/* 3D WebGL Canvas Layer */}
        <SofaShowroomCanvas progress={smoothProgress} mousePos={mousePos} />

        {/* Top Floating Mini Status Pill */}
        <div className="relative z-30 pt-6 px-6 sm:px-10 flex items-center justify-between pointer-events-none">
          <div className="glass-card px-4 py-1.5 rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md flex items-center gap-2 pointer-events-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono">
              {smoothProgress < 0.35
                ? "3D SHOWROOM • ACT I"
                : smoothProgress < 0.65
                ? "EXTRACTION IN PROGRESS • ACT II"
                : "SANCTUARY RESTORED • ACT III"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
            <span className="text-xs text-white/50 font-mono">
              {Math.round(smoothProgress * 100)}%
            </span>
            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${smoothProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ----------------- NARRATIVE TEXT LAYERS (SCROLL SYNCHRONIZED) ----------------- */}

        {/* ACT 1: 0% - 15% (Cinematic Opening) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            smoothProgress < 0.16
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-12 pointer-events-none"
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-black tracking-widest uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIRI SOFA SERVICES • DIGITAL SHOWROOM</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04]">
              A cleaner home begins with<br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent italic font-serif">
                a cleaner sofa.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
              Where your family gathers, rests, and makes memories. Scroll down to experience the clinical restoration journey.
            </p>
            <div className="pt-4 flex items-center justify-center gap-2 text-xs font-bold text-white/40 tracking-wider">
              <span>SCROLL TO EXPLORE THE TRANSFORMATION</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ACT 2: 16% - 30% (Sofa Emergence) */}
        <div
          className={`absolute inset-0 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.16 && smoothProgress < 0.32
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-md space-y-3 bg-black/60 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              The Living Standard
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              4.2 Hours of Intimate Contact Daily.
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Your family spends more waking hours touching living room seating than any other surface in your home. It deserves clinical hygiene.
            </p>
          </div>
        </div>

        {/* ACT 3: 32% - 46% (The Problem: What Looks Clean... Is It Always Clean?) */}
        <div
          className={`absolute inset-0 flex flex-col justify-center items-end px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.32 && smoothProgress < 0.46
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-md space-y-3 bg-black/70 p-6 sm:p-8 rounded-3xl border border-amber-500/30 backdrop-blur-md text-left shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Microscopic Reality</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              What looks clean... is it always clean?
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Natural body sweat, cooking fumes, pet dander, and microscopic dust mites burrow up to 3.5 inches deep into foam cores. Ordinary surface wiping leaves 90% behind.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-amber-300">
              <span>• 200,000+ Allergen Particles</span>
              <span>• Oxidized Body Oils</span>
            </div>
          </div>
        </div>

        {/* ACT 4: 46% - 66% (12-Bar Extraction Wave in Motion) */}
        <div
          className={`absolute inset-0 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.46 && smoothProgress < 0.66
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-md space-y-3 bg-black/75 p-6 sm:p-8 rounded-3xl border border-cyan-400/40 backdrop-blur-md text-left shadow-[0_0_35px_rgba(34,211,238,0.2)]">
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5" />
              <span>12-Bar Thermal Extraction</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              140°C Precision Steam Injection.
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              European bio-enzymes break stain bonds at the molecular level, while our aerospace dual-turbine vacuum pulls 92% of moisture out instantly.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
                <div className="text-lg font-mono font-bold text-cyan-300">12 BAR</div>
                <div className="text-[10px] text-white/60">Foam Penetration</div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
                <div className="text-lg font-mono font-bold text-emerald-300">92% DRY</div>
                <div className="text-[10px] text-white/60">Moisture Recovered</div>
              </div>
            </div>
          </div>
        </div>

        {/* ACT 5: 66% - 78% (The Sanctuary Result) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.66 && smoothProgress < 0.78
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-3 p-8 rounded-3xl bg-white/95 border border-black/10 backdrop-blur-lg shadow-2xl text-[#121820]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-[#0C4A34] text-xs font-black uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sanctuary Restored</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Fresh. Sterile. Ready in 2 Hours.
            </h2>
            <p className="text-xs sm:text-base text-[#525D6C] leading-relaxed">
              Zero chemical fumes. Safe for toddlers, newborn skin, and pets. Ready for relaxation before your evening begins.
            </p>
          </div>
        </div>

        {/* ACT 6: 78% - 92% (Interactive 3D Showroom & Catalog Customizer) */}
        <div
          className={`absolute inset-0 flex flex-col justify-end lg:justify-center lg:items-end px-4 sm:px-8 lg:px-16 pb-16 lg:pb-0 transition-all duration-700 ${
            smoothProgress >= 0.78 && smoothProgress < 0.93
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-full max-w-xl bg-white/95 border border-black/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-left max-h-[82vh] overflow-y-auto">
            {/* Category Selector Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">
                  Interactive Showroom
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#121820]">
                  Configure Your Service
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Hyderabad Doorstep
              </span>
            </div>

            {/* Category Pills */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {services.map((svc) => (
                <button
                  key={svc.slug}
                  onClick={() => setActiveCategory(svc.slug)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                    activeCategory === svc.slug
                      ? "bg-[#0C4A34] text-white shadow-sm"
                      : "bg-[#F4F2EC] text-[#525D6C] hover:text-[#121820]"
                  }`}
                >
                  {svc.title.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Variants Steppers */}
            <div className="space-y-3 mb-6">
              {(currentService?.variants || []).map((variant) => {
                const qty = getItemQuantity(variant.id);
                return (
                  <div
                    key={variant.id}
                    className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#121820]">
                        {variant.name}
                      </div>
                      <div className="text-xs text-[#0C4A34] font-black mt-0.5">
                        ₹{variant.base_price}{" "}
                        <span className="text-[10px] text-[#8490A0] font-normal">
                          / {variant.unit_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-black/10">
                      <button
                        onClick={() => onUpdateQuantity(variant, qty - 1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-lg bg-[#FAF9F6] text-[#121820] font-bold text-sm flex items-center justify-center disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-[#121820] text-sm">
                        {qty}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(variant, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-[#0C4A34] text-white font-bold text-sm flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Showroom Booking Bar */}
            <div className="pt-3 border-t border-black/8 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8490A0] block">
                  {totalItemCount > 0
                    ? `${totalItemCount} item${totalItemCount > 1 ? "s" : ""} selected`
                    : "No items selected"}
                </span>
                <span className="text-xl font-black text-[#0C4A34]">
                  ₹{estimatedTotal > 0 ? estimatedTotal : "499"}
                  <span className="text-[10px] text-[#8490A0] font-normal">
                    {" "}
                    est. inc tax
                  </span>
                </span>
              </div>

              <MagneticButton
                onClick={onOpenBooking}
                className="btn-primary text-xs py-3 px-6 shadow-xl"
              >
                <span>Book This Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* ACT 7: 93% - 100% (The Grand Final Call to Sanctuary) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 ${
            smoothProgress >= 0.93
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-6 p-8 sm:p-12 rounded-[2.5rem] bg-white/95 border border-black/10 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-[#0C4A34] text-xs font-black uppercase">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>Ready For A Fresh Start?</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#121820] tracking-tight leading-tight">
              Give Your Living Room<br />
              <span className="text-[#0C4A34] italic font-serif">
                The Sanctuary Treatment.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#525D6C] max-w-lg mx-auto">
              Join 12,000+ families across Jubilee Hills, Gachibowli, and Banjara Hills who trust Siri Sofa Services for hospital-grade upholstery care.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                onClick={onOpenBooking}
                className="btn-primary text-sm py-4 px-10 shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>BOOK YOUR CLEANING NOW</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <button
                onClick={onOpenTracking}
                className="btn-secondary text-sm py-4 px-7 shadow-xs hover:bg-[#F4F2EC]"
              >
                Track Existing Booking
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-[#525D6C] font-semibold border-t border-black/5">
              <span>✓ Pay After Inspection</span>
              <span>✓ 2-3 Hour Rapid Dry</span>
              <span>✓ Eco-Friendly Shampoos</span>
            </div>
          </div>
        </div>

        {/* Bottom Hint Pill */}
        <div className="relative z-30 pb-6 px-6 flex items-center justify-between text-[11px] text-white/40 pointer-events-none">
          <span className="font-mono">SIRI SOFA SERVICES • CINEMATIC EXPERIENCE</span>
          <span className="font-mono">HYDERABAD, TELANGANA</span>
        </div>

      </div>
    </div>
  );
};
