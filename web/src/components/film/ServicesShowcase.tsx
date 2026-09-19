"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Service, ServiceVariant, CartItem } from "@/types";
import { Plus, Minus, ArrowRight, CheckCircle2 } from "lucide-react";

interface ServicesShowcaseProps {
  services: Service[];
  cart: CartItem[];
  pricingConfig: { service_charge: number; gst_percentage: number };
  onUpdateQuantity: (variant: ServiceVariant, newQty: number) => void;
  onProceedToBooking: () => void;
}

export const ServicesShowcase: React.FC<ServicesShowcaseProps> = ({
  services,
  cart,
  pricingConfig,
  onUpdateQuantity,
  onProceedToBooking,
}) => {
  const [activeSlug, setActiveSlug] = useState<string>("sofa");

  const serviceVisuals: Record<
    string,
    { image: string; tag: string; description: string }
  > = {
    sofa: {
      image: "/images/cinematic_hero.jpg",
      tag: "Living Room Seating",
      description:
        "Deep foam injection and moisture extraction for fabric, linen, velvet, and leather seating.",
    },
    chair: {
      image: "/images/service_chair.jpg",
      tag: "Dining & Ergonomic",
      description:
        "Targeted spot cleaning and dust extraction for upholstered dining chairs and office seating.",
    },
    mattress: {
      image: "/images/service_mattress.jpg",
      tag: "Deep Bed Sanitization",
      description:
        "High-suction dust and sweat stain extraction for single, double, and king mattresses.",
    },
    carpet: {
      image: "/images/service_carpet.jpg",
      tag: "Area Rugs & Floor Carpets",
      description:
        "Deep fiber wash and extraction restoring brightness, soft texture, and fresh wool vibrancy.",
    },
  };

  const currentService =
    services.find((s) => s.slug === activeSlug) || services[0];

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

  return (
    <section id="services" className="py-20 lg:py-28 bg-[#FAF9F6] border-t border-black/8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
            Siri Services Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#121820] tracking-tight">
            Select Your Cleaning Needs
          </h2>
          <p className="text-sm sm:text-base text-[#525D6C]">
            Live transparent pricing directly from our Hyderabad operational team. Pay only after joint inspection.
          </p>
        </div>

        {/* 4 Service Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          {services.map((svc) => {
            const isSelected = svc.slug === activeSlug;
            return (
              <button
                key={svc.id}
                onClick={() => setActiveSlug(svc.slug)}
                className={`py-3.5 px-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0C4A34] text-white border-[#0C4A34] shadow-md"
                    : "bg-white text-[#121820] border-black/8 hover:border-black/20"
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                  {serviceVisuals[svc.slug]?.tag || "Doorstep"}
                </div>
                <div className="font-extrabold text-sm sm:text-base mt-0.5">
                  {svc.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Service Configuration Card */}
        {currentService && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-black/8 shadow-xl max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-black/8">
              <div className="lg:col-span-5 relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-black/5">
                <Image
                  src={serviceVisuals[currentService.slug]?.image || "/images/cinematic_hero.jpg"}
                  alt={currentService.title}
                  fill
                  className="object-cover object-center"
                />
              </div>

              <div className="lg:col-span-7 space-y-3 text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Doorstep Service across Hyderabad</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#121820]">
                  {currentService.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#525D6C] leading-relaxed">
                  {serviceVisuals[currentService.slug]?.description || currentService.description}
                </p>
                <div className="pt-2 text-[11px] text-[#8490A0] font-medium flex items-center gap-4">
                  <span>✓ Eco-Friendly Shampoos</span>
                  <span>✓ 2-3 Hour Air Dry</span>
                  <span>✓ No Hidden Charges</span>
                </div>
              </div>
            </div>

            {/* Variants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
              {(currentService.variants || []).map((v) => {
                const qty = getItemQuantity(v.id);
                const isAdded = qty > 0;

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isAdded
                        ? "border-[#0C4A34] bg-[#EBF5F0]/30 shadow-xs"
                        : "border-black/8 bg-[#FAF9F6] hover:border-black/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-sm text-[#121820]">{v.name}</h4>
                        <span className="text-[10px] font-mono text-[#8490A0]">
                          ~{v.estimated_minutes} min
                        </span>
                      </div>
                      <div className="text-base font-black text-[#0C4A34] mb-3">
                        ₹{v.base_price}{" "}
                        <span className="text-xs text-[#8490A0] font-normal">
                          / {v.unit_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                      <span className="text-xs text-[#525D6C] font-semibold">Quantity</span>
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-black/10 shadow-xs">
                        <button
                          onClick={() => onUpdateQuantity(v, qty - 1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg bg-[#FAF9F6] text-[#121820] font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-[#121820]">
                          {qty}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(v, qty + 1)}
                          className="w-7 h-7 rounded-lg bg-[#0C4A34] text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Booking Summary Bar */}
        {totalItemCount > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 animate-fade-in">
            <div className="bg-[#121820] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-extrabold text-base">
                  {totalItemCount}
                </div>
                <div>
                  <div className="text-[11px] text-[#9AA5B4]">Estimated Total (inc. Tax)</div>
                  <div className="text-lg font-black text-white">₹{estimatedTotal}</div>
                </div>
              </div>

              <button
                onClick={onProceedToBooking}
                className="btn-primary text-xs py-3 px-6 bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-2"
              >
                <span>Continue to Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
