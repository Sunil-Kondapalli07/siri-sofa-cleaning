"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Star, Sparkles } from "lucide-react";

interface HeroProps {
  onBookNow: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookNow, onExploreServices }) => {
  return (
    <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-[#FAF9F6]">
      {/* Ambient Warm Glow Accents */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[450px] bg-gradient-to-bl from-[#0C4A34]/8 via-[#F2F8F5] to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[350px] bg-gradient-to-tr from-[#EBF5F0]/80 to-transparent rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 space-y-7 text-left">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-[#C2E2D3] text-[#0C4A34] text-[11px] font-extrabold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0C4A34] animate-pulse" />
              <span>SIRI SOFA SERVICES • HYDERABAD</span>
            </div>

            {/* Main Editorial Headline */}
            <div className="space-y-1">
              <h1 className="hero-editorial-title text-[#121820]">
                YOUR SOFA.<br />
                <span className="text-[#0C4A34] italic font-serif tracking-normal">RESTORED.</span>
              </h1>
            </div>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg max-w-lg leading-relaxed font-medium text-[#4A5568]">
              Professional sofa and chair deep extraction cleaning, delivered directly to your doorstep. Hospital-grade fabric sanitization eliminating stains, odors, and 99.9% of dust mites.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={onBookNow}
                className="btn-primary text-sm py-4 px-8 group shadow-lg"
              >
                <span>BOOK A CLEANING</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onExploreServices}
                className="btn-secondary text-sm py-4 px-7"
              >
                Explore Services & Pricing
              </button>
            </div>

            {/* Social Proof & Rating Metrics */}
            <div className="pt-6 border-t border-black/8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Customer"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                    alt="Customer"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                    alt="Customer"
                  />
                </div>
                <div>
                  <div className="flex items-center text-amber-500 text-xs font-black">
                    <span className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </span>
                    <span className="text-[#121820] ml-1.5 font-bold">4.9 / 5.0</span>
                  </div>
                  <span className="text-[11px] text-[#6B7788] font-semibold">12,000+ Cleaned Homes</span>
                </div>
              </div>

              <div className="h-6 w-px bg-black/10 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs font-bold text-[#121820]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Same-Day & Express Slots</span>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#121820]">
                <CheckCircle2 className="w-4 h-4 text-[#0C4A34] shrink-0" />
                <span>Doorstep In 2h</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#121820]">
                <CheckCircle2 className="w-4 h-4 text-[#0C4A34] shrink-0" />
                <span>Zero Fabric Damage</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#121820]">
                <CheckCircle2 className="w-4 h-4 text-[#0C4A34] shrink-0" />
                <span>Pay Post Clean</span>
              </div>
            </div>

          </div>

          {/* Right Column: Premium Hero Architectural Photography & Highlights */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/8 bg-white group">
              
              <div className="w-full h-[460px] sm:h-[500px] relative overflow-hidden">
                <Image
                  src="/images/hero_luxury_sofa.jpg"
                  alt="Restored Luxury Emerald Velvet Sofa - Siri Sofa Services"
                  fill
                  priority
                  className="object-cover object-center transform group-hover:scale-102 transition-transform duration-700 ease-out"
                />
                
                {/* Soft Vignette & Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

                {/* Top Right Hygiene Certification Badge */}
                <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-black/5 flex items-center gap-2 text-[11px] font-bold text-[#0C4A34]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>99.9% Sanitized</span>
                </div>

                {/* Top Left Process Pill */}
                <div className="absolute top-4 left-4 z-20 bg-[#0C4A34]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg text-[11px] font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  <span>High-Extraction Steam</span>
                </div>

                {/* Floating Glass Card Overlay (Bottom) */}
                <div className="absolute bottom-5 left-5 right-5 z-20 glass-card rounded-2xl p-4 sm:p-5 shadow-2xl text-left border border-white/60">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0C4A34] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">
                        Doorstep Deep Steam
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#121820] bg-white/80 px-2.5 py-0.5 rounded-md shadow-xs">
                      Dries in 2-3 Hrs
                    </span>
                  </div>
                  <div className="font-extrabold text-base text-[#121820]">
                    Hospital-Grade Upholstery Restoration
                  </div>
                  <p className="text-xs text-[#525D6C] mt-1 leading-snug">
                    Industrial hot-water injection vacuum extracting embedded allergens, oil, food spills, and pet odors without fabric shrinkage.
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
