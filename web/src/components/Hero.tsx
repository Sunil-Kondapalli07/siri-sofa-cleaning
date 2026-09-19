"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Star,
  CheckCircle,
  Zap,
  Flame,
  Droplets,
  Microscope,
  X,
  Eye,
} from "lucide-react";
import { AtmosphereCanvas } from "./AtmosphereCanvas";

interface HeroProps {
  onBookNow: () => void;
  onExploreServices: () => void;
}

interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metric: string;
  icon: React.ElementType;
  position: { top: string; left: string };
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "thermal-jet",
    title: "12-Bar Thermal Jet",
    subtitle: "140°C Deep Injection",
    description:
      "Forces pressurized heated water 3.5 inches deep into high-density foam, breaking down sweat salts and pet oils instantly.",
    metric: "140°C / 12 BAR",
    icon: Flame,
    position: { top: "48%", left: "42%" },
  },
  {
    id: "bio-enzymes",
    title: "Bio-Enzyme Shield",
    subtitle: "Plant-Based Chemistry",
    description:
      "Zero petrochemicals. Active plant enzymes safely consume coffee, wine, ink, and dust-mite allergen proteins.",
    metric: "99.9% Hypoallergenic",
    icon: Droplets,
    position: { top: "34%", left: "74%" },
  },
  {
    id: "moisture-recovery",
    title: "Negative-Pressure Extraction",
    subtitle: "Hyper-Dry Suction",
    description:
      "Dual vacuum turbines extract 92% of moisture on contact, allowing sofas to dry naturally in 2 to 3 hours with zero mildew risk.",
    metric: "92% Water Recovery",
    icon: Zap,
    position: { top: "68%", left: "28%" },
  },
];

export const Hero: React.FC<HeroProps> = ({ onBookNow, onExploreServices }) => {
  const [viewMode, setViewMode] = useState<"sanctuary" | "xray">("sanctuary");
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // 3D Parallax Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <section id="hero" className="relative pt-8 pb-20 lg:pt-14 lg:pb-28 overflow-hidden bg-[#FAF9F6]">
      {/* Interactive Micro-Particle Atmosphere Canvas */}
      <AtmosphereCanvas className="opacity-70" />

      {/* Subtle Cinematic Ambient Mesh Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-[#0C4A34]/10 via-[#EBF5F0]/60 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-[550px] h-[450px] bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
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
        <div className="text-center max-w-4xl mx-auto space-y-5 mb-10">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
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
              className="btn-secondary text-sm py-4 px-8 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <span>Explore Services & Pricing</span>
            </button>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-xs text-[#525D6C] font-semibold">
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

        {/* Interactive View Mode Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#525D6C] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#0C4A34]" />
              <span>Interactive Showcase</span>
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex p-1 rounded-full bg-white/95 border border-black/10 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setViewMode("sanctuary")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === "sanctuary"
                  ? "bg-[#0C4A34] text-white shadow-sm"
                  : "text-[#525D6C] hover:text-[#121820]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sanctuary View</span>
            </button>

            <button
              onClick={() => setViewMode("xray")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === "xray"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#525D6C] hover:text-[#121820]"
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>Clinical X-Ray Scanner</span>
            </button>
          </div>
        </div>

        {/* 3D Perspective Card Showcase */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="relative max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/10 bg-white group select-none"
        >
          <div className="relative w-full h-[480px] sm:h-[620px]">
            {/* Base Showcase Image */}
            <Image
              src="/images/billion_hero_penthouse.jpg"
              alt="Siri Sofa Services — Luxury Living Room Upholstery Restoration"
              fill
              priority
              className={`object-cover object-center transition-all duration-700 ${
                viewMode === "xray" ? "brightness-75 contrast-125 saturate-50" : ""
              }`}
            />

            {/* X-Ray Laser Scanner Overlay when in Clinical Mode */}
            {viewMode === "xray" && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Emerald/Cyan UV diagnostic tint */}
                <div className="absolute inset-0 bg-emerald-950/40 mix-blend-color-dodge" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-emerald-500/10 to-transparent" />

                {/* Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser" />

                {/* Clinical Analysis HUD Stamp */}
                <div className="absolute top-8 right-8 glass-card px-4 py-3 rounded-2xl border border-cyan-400/40 bg-black/60 text-white backdrop-blur-md shadow-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[10px] font-black tracking-widest text-cyan-300 uppercase">
                      THERMAL FOAM SPECTRUM
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-100">
                    Target Depth: <span className="font-bold text-white">88mm (3.5 in)</span>
                  </div>
                  <div className="text-xs font-mono text-cyan-100">
                    Bacterial Clearance: <span className="font-bold text-emerald-400">99.9%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtle Vignette & Gradient Shadows */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

            {/* Top Clean-Tech Chips */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
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

            {/* Interactive Science Hotspot Beacons */}
            {HOTSPOTS.map((hotspot) => {
              const isSelected = activeHotspot?.id === hotspot.id;
              const Icon = hotspot.icon;

              return (
                <div
                  key={hotspot.id}
                  style={{ top: hotspot.position.top, left: hotspot.position.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  {/* Pulsing Target Radar Pin */}
                  <button
                    onClick={() => setActiveHotspot(isSelected ? null : hotspot)}
                    onMouseEnter={() => setActiveHotspot(hotspot)}
                    aria-label={`Inspect ${hotspot.title}`}
                    className="relative flex items-center justify-center group/pin"
                  >
                    <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400/80 opacity-75" />
                    <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/95 border-2 border-[#0C4A34] shadow-xl text-[#0C4A34] hover:scale-110 hover:bg-[#0C4A34] hover:text-white transition-all">
                      <Icon className="w-3.5 h-3.5" />
                    </span>

                    {/* Quick Hover Tooltip Label */}
                    <span className="hidden md:inline-block absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-black/80 text-white text-[11px] font-bold backdrop-blur-md opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none shadow-lg">
                      {hotspot.title}
                    </span>
                  </button>

                  {/* Expanded Science Spec Popover Card */}
                  {isSelected && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-72 sm:w-80 glass-card rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/90 z-40 animate-in fade-in zoom-in-95 duration-200 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#0C4A34]">
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {hotspot.metric}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHotspot(null);
                          }}
                          className="text-black/40 hover:text-black p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-black text-base text-[#121820] mt-1">
                        {hotspot.title}
                      </div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1.5">
                        {hotspot.subtitle}
                      </div>
                      <p className="text-xs text-[#525D6C] leading-relaxed">
                        {hotspot.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-black/8 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-black/40">
                          Clinical Protocol #04
                        </span>
                        <button
                          onClick={() => {
                            setActiveHotspot(null);
                            onBookNow();
                          }}
                          className="text-xs font-black text-[#0C4A34] hover:underline flex items-center gap-1"
                        >
                          <span>Reserve Slot</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Floating Bottom Glass Spec Sheet */}
            <div className="absolute bottom-6 left-6 right-6 sm:left-10 sm:right-10 glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 text-left z-20">
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
