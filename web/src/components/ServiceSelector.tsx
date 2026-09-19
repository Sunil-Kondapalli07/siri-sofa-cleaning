"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Service, ServiceVariant, CartItem } from "@/types";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface ServiceSelectorProps {
  services: Service[];
  cart: CartItem[];
  pricingConfig: { service_charge: number; gst_percentage: number };
  onUpdateQuantity: (variant: ServiceVariant, newQty: number) => void;
  onProceedToBooking: () => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  cart,
  pricingConfig,
  onUpdateQuantity,
  onProceedToBooking,
}) => {
  const [activeSlug, setActiveSlug] = useState<string>("sofa");

  const serviceMeta: Record<
    string,
    { image: string; badge: string; tagline: string; startPrice: string }
  > = {
    sofa: {
      image: "/images/service_sofa.jpg",
      badge: "Top Booked in Hyderabad",
      startPrice: "₹499",
      tagline:
        "Deep shampoo injection & powerful 12-bar vacuum extraction for fabric, velvet, and leather seating.",
    },
    chair: {
      image: "/images/service_chair.jpg",
      badge: "Residential & Office",
      startPrice: "₹199",
      tagline:
        "Spot removal, steam deodorizing, and dust extraction for dining chairs and ergonomic office chairs.",
    },
    mattress: {
      image: "/images/service_mattress.jpg",
      badge: "Anti-Allergen Certified",
      startPrice: "₹899",
      tagline:
        "High-suction dust mite extraction, UV sanitization, and sweat stain elimination for pure, healthy sleep.",
    },
    carpet: {
      image: "/images/service_carpet.jpg",
      badge: "Deep Fiber Refresh",
      startPrice: "₹599",
      tagline:
        "Heavy-duty rotary scrubber extraction restoring brightness, soft texture, and fresh wool vibrancy.",
    },
  };

  const currentService =
    services.find((s) => s.slug === activeSlug) || services[0];

  // Calculate cart totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.variant.base_price * item.quantity,
    0
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const serviceCharge = totalItemCount > 0 ? (Number(pricingConfig?.service_charge) || 49) : 0;
  const gstRate = Number(pricingConfig?.gst_percentage) || 18;
  const taxable = Math.max(0, subtotal + serviceCharge);
  const tax = Math.round(taxable * (gstRate / 100));
  const estimatedTotal = Math.round(taxable + tax);

  const getItemQuantity = (variantId: number) => {
    const item = cart.find((i) => i.variant.id === variantId);
    return item ? item.quantity : 0;
  };

  return (
    <section id="services" className="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3.5 py-1.5 rounded-full border border-[#C2E2D3]">
              Doorstep Service Catalog
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              Our Professional Services
            </h2>
            <p className="text-sm sm:text-base text-[#525D6C] mt-2">
              Select a category to view live transparent rates and customize your configuration.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Interactive Primary Service Showcase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {services.map((s, idx) => {
            const meta = serviceMeta[s.slug] || {
              image: "/images/service_sofa.jpg",
              badge: "Professional Care",
              startPrice: "₹499",
              tagline: s.description,
            };
            const isSelected = s.slug === activeSlug;

            return (
              <ScrollReveal key={s.id} direction="up" delay={idx * 75}>
                <div
                  onClick={() => setActiveSlug(s.slug)}
                  className={`service-card cursor-pointer flex flex-col justify-between h-full ${
                    isSelected ? "ring-2 ring-[#0C4A34] shadow-xl" : ""
                  }`}
                >
                  <div>
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-black/5">
                      <Image
                        src={meta.image}
                        alt={s.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#0C4A34] tracking-wide uppercase border border-black/5 shadow-xs z-10">
                        {meta.badge}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="font-extrabold text-lg text-[#121820]">
                        {s.title}
                      </h3>
                      <p className="text-xs text-[#525D6C] leading-relaxed line-clamp-2 mt-1">
                        {meta.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-black/5 mt-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8490A0] block">
                        Starting from
                      </span>
                      <span className="font-extrabold text-base text-[#0C4A34]">
                        {meta.startPrice}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-bold ${
                        isSelected ? "text-[#0C4A34]" : "text-[#121820]"
                      }`}
                    >
                      <span>{isSelected ? "Selected" : "Configure"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Active Category Detailed Variants Customizer */}
        {currentService && (
          <ScrollReveal direction="up" delay={150}>
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-black/8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0C4A34]">
                    <span>Catalog Configuration</span>
                    <span>•</span>
                    <span>{currentService.title}</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#121820] mt-1">
                    Customize Your {currentService.title}
                  </h3>
                  <p className="text-xs text-[#525D6C] mt-0.5">
                    {currentService.description}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold text-emerald-700 bg-[#EBF5F0] px-3 py-1 rounded-full border border-[#C2E2D3]">
                    ✓ Verified Transparent Pricing
                  </span>
                </div>
              </div>

              {/* Variants Cards Grid with Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(currentService.variants || []).map((v) => {
                  const qty = getItemQuantity(v.id);
                  const isAdded = qty > 0;

                  return (
                    <div
                      key={v.id}
                      className={`p-5 rounded-2xl border ${
                        isAdded
                          ? "border-[#0C4A34] bg-[#EBF5F0]/25 shadow-sm"
                          : "border-black/8 bg-white hover:border-black/20"
                      } transition-all flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-base text-[#121820]">
                            {v.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#F4F2EC] text-[#525D6C] text-[10px] font-bold whitespace-nowrap">
                            ~{v.estimated_minutes} min
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-4">
                          <span className="text-xl font-black text-[#0C4A34]">
                            ₹{v.base_price}
                          </span>
                          <span className="text-xs text-[#8490A0] font-medium">
                            / {v.unit_type}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Control */}
                      <div className="flex items-center justify-between pt-4 border-t border-black/5">
                        <span className="text-xs font-semibold text-[#525D6C]">
                          Quantity
                        </span>
                        <div className="flex items-center gap-2.5 bg-[#F4F2EC] p-1 rounded-xl">
                          <button
                            onClick={() => onUpdateQuantity(v, qty - 1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg bg-white text-[#121820] font-bold text-sm flex items-center justify-center hover:bg-black/5 transition-colors shadow-xs disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-[#121820] text-sm">
                            {qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(v, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-[#0C4A34] text-white font-bold text-sm flex items-center justify-center hover:bg-[#083827] transition-colors shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Floating Sticky Booking Bar When Items Selected */}
        {totalItemCount > 0 && (
          <div className="fixed bottom-6 left-4 right-4 max-w-3xl mx-auto z-40 animate-fade-in">
            <div className="bg-[#121820] text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-extrabold text-lg">
                  {totalItemCount}
                </div>
                <div>
                  <div className="text-xs text-[#9AA5B4]">
                    Estimated Total (inc. GST & Service)
                  </div>
                  <div className="text-xl font-black text-white">
                    ₹{estimatedTotal}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onProceedToBooking}
                  className="btn-primary w-full sm:w-auto text-xs py-3 px-7 bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  <span>Continue to Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
