"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, Star, CheckCircle, Zap } from "lucide-react";

interface HeroProps {
  onBookNow: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookNow, onExploreServices }) => {
  return (
    <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 overflow-hidden bg-[#FAF9F6]">
      {/* Subtle Cinematic Ambient Mesh Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#0C4A34]/8 via-[#EBF5F0]/60 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-[500px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Floating Ticker Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 border border-black/8 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C4A34]" />
            </span>
            <span className="text-[11px] font-black tracking-widest uppercase text-[#0C4A34]">
              ENGINEERED UPHOLSTERY HYGIENE • HYDERABAD
            </span>
            <span className="text-black/20">|</span>
            <span className="text-[11px] font-bold text-[#525D6C] hidden sm:inline">
              Same-Day Express Slots Open Today
            </span>
          </div>
        </div>

        {/* Center Main Editorial Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-5 mb-12">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#121820] tracking-tight leading-[1.02]">
            The Sanctuary of Your Home.<br />
            <span className="bg-gradient-to-r from-[#0C4A34] via-[#10B981] to-[#047857] bg-clip-text text-transparent italic font-serif tracking-normal">
              Purer Than Day One.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[#525D6C] max-w-2xl mx-auto leading-relaxed font-medium">
            Where your family gathers, rests, and makes memories. We deliver clinical-grade 12-bar thermal extraction cleaning directly to your doorstep across Hyderabad.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onBookNow}
              className="btn-primary text-sm py-4 px-9 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>BOOK A CLEANING</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExploreServices}
              className="btn-secondary text-sm py-4 px-8 shadow-sm hover:shadow-md transition-all"
            >
              Explore Services & Pricing
            </button>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-6 text-xs text-[#525D6C] font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#0C4A34]" />
              <span>99.9% Dust Mite Elimination</span>
            </div>
            <div className="h-3 w-px bg-black/15 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Ready & Dry in 2-3 Hours</span>
            </div>
            <div className="h-3 w-px bg-black/15 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
              <span className="text-[#121820] font-black">4.9/5</span>
              <span>(12k+ Homes)</span>
            </div>
          </div>
        </div>

        {/* Billion-Dollar Hero Showcase Image Display */}
        <div className="relative max-w-6xl mx-auto mt-6 rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/10 bg-white group">
          <div className="relative w-full h-[450px] sm:h-[600px]">
            <Image
              src="/images/billion_hero_penthouse.jpg"
              alt="Siri Sofa Services — Luxury Living Room Upholstery Restoration"
              fill
              priority
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-1000 ease-out"
            />

            {/* Subtle Vignette & Gradient Shadows */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

            {/* Floating Top Clean-Tech Chips */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
              <div className="glass-card px-4 py-2 rounded-full shadow-lg border border-white/60 flex items-center gap-2 pointer-events-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-[#0C4A34] tracking-wide">
                  HOSPITAL-GRADE EXTRACTION CERTIFIED
                </span>
              </div>

              <div className="hidden sm:flex glass-card px-4 py-2 rounded-full shadow-lg border border-white/60 items-center gap-2 pointer-events-auto text-xs font-bold text-[#121820]">
                <ShieldCheck className="w-4 h-4 text-[#0C4A34]" />
                <span>Zero Fabric Shrinkage Guarantee</span>
              </div>
            </div>

            {/* Floating Bottom Glass Spec Sheet */}
            <div className="absolute bottom-6 left-6 right-6 sm:left-10 sm:right-10 glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">
                    The Living Standard
                  </div>
                  <div className="font-extrabold text-lg text-[#121820] mt-0.5">
                    Architectural Fabric Care
                  </div>
                  <p className="text-xs text-[#525D6C] mt-1 leading-snug">
                    Designed for fine velvets, Italian bouclé, linen, and top-grain leather seating.
                  </p>
                </div>

                <div className="sm:border-l sm:border-black/8 sm:pl-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">
                    Extraction Power
                  </div>
                  <div className="font-extrabold text-lg text-[#121820] mt-0.5">
                    12-Bar Deep Thermal
                  </div>
                  <p className="text-xs text-[#525D6C] mt-1 leading-snug">
                    Reaches 3.5 inches into foam to remove embedded allergens and old food spills.
                  </p>
                </div>

                <div className="sm:border-l sm:border-black/8 sm:pl-6 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">
                      Doorstep Peace of Mind
                    </div>
                    <div className="font-extrabold text-lg text-[#121820] mt-0.5">
                      Pay After 100% Satisfaction
                    </div>
                  </div>
                  <button
                    onClick={onBookNow}
                    className="text-xs font-black text-[#0C4A34] hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                  >
                    <span>Check available slots in your area</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
