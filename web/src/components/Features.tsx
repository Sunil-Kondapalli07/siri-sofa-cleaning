"use client";

import React from "react";
import { Clock, ShieldCheck, MapPin, Sparkles, Award, ThumbsUp } from "lucide-react";

export const Features: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Book in 2 Mins",
      desc: "Select your sofa type, number of seats, or mattress and pick your preferred time slot online with instant transparent pricing.",
    },
    {
      num: "02",
      title: "We Arrive On Time",
      desc: "Our background-verified specialist arrives fully equipped at your doorstep across Hyderabad with industrial-grade machinery.",
    },
    {
      num: "03",
      title: "We Deep Clean",
      desc: "5-stage hot steam extraction removes stains, dust mites, and odors without any living room mess or water spills.",
    },
    {
      num: "04",
      title: "Inspect & Relax",
      desc: "Inspect every cushion alongside our technician. Pay via UPI, card, or cash only after 100% satisfaction.",
    },
  ];

  const benefits = [
    {
      icon: <Award className="w-6 h-6 text-[#0C4A34]" />,
      title: "Verified Specialists",
      desc: "Police-verified, background-checked technicians with 500+ hours of professional upholstery training.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#0C4A34]" />,
      title: "Transparent Pricing",
      desc: "No hidden charges or surprise doorstep add-ons. Standardized rate card with 18% GST invoice provided.",
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#0C4A34]" />,
      title: "Hyderabad Doorstep Service",
      desc: "Serving all localities including Banjara Hills, Jubilee Hills, Gachibowli, Hitec City, Kondapur, and Kukatpally.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#0C4A34]" />,
      title: "Eco-Safe & Non-Toxic",
      desc: "Pet-friendly and infant-safe biodegradable European shampoos that leave zero harsh chemical smells.",
    },
  ];

  return (
    <div className="border-t border-black/5">
      {/* 1. How It Works */}
      <section className="py-16 lg:py-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
              Frictionless Service
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-[#525D6C] mt-2">
              From online booking to a pristine living room in four simple, transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-bold text-sm mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-extrabold text-lg text-[#121820] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#525D6C] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Why Siri Sofa Services */}
      <section className="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
              Trust & Quality
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
              Why Choose Siri Sofa Services
            </h2>
            <p className="text-sm sm:text-base text-[#525D6C] mt-2">
              We treat your fine furniture with professional textile equipment ensuring maximum longevity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs hover:border-[#0C4A34]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EBF5F0] flex items-center justify-center mb-4">
                  {b.icon}
                </div>
                <h3 className="font-extrabold text-lg text-[#121820] mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-[#525D6C] leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
