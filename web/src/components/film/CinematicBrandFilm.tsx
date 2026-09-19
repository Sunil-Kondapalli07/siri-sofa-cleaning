"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, ChevronDown } from "lucide-react";

interface CinematicBrandFilmProps {
  onOpenBooking: () => void;
  onOpenTracking: () => void;
}

export const CinematicBrandFilm: React.FC<CinematicBrandFilmProps> = ({
  onOpenBooking,
  onOpenTracking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);

  // Interactive extraction scrubber in Scene 4
  const [scrubberPos, setScrubberPos] = useState(50);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const scrubberContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll position
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

  // Smooth lerp for buttery transitions
  useEffect(() => {
    let animId: number;
    const lerp = () => {
      setSmoothProgress((prev) => {
        const diff = scrollProgress - prev;
        if (Math.abs(diff) < 0.001) return scrollProgress;
        return prev + diff * 0.1;
      });
      animId = requestAnimationFrame(lerp);
    };
    animId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animId);
  }, [scrollProgress]);

  // Handle interactive extraction wipe in Scene 4
  const handleScrubberMove = (clientX: number) => {
    if (!scrubberContainerRef.current) return;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setScrubberPos(pct);
  };

  // Scene Opacities based on normalized progress
  // Scene 1: 0.00 - 0.18
  // Scene 2: 0.18 - 0.38
  // Scene 3: 0.38 - 0.58
  // Scene 4: 0.58 - 0.78
  // Scene 5: 0.78 - 0.92
  // Scene 6: 0.92 - 1.00

  const getSceneOpacity = (sceneIdx: number) => {
    const ranges = [
      [0.0, 0.2],    // Scene 1 (Hero living room)
      [0.18, 0.4],   // Scene 2 (Macro fabric dust)
      [0.38, 0.6],   // Scene 3 (Technician inspection)
      [0.58, 0.8],   // Scene 4 (Extraction in action)
      [0.78, 1.0],   // Scene 5 (Restored living room)
    ];
    const [start, end] = ranges[sceneIdx];
    const center = (start + end) / 2;
    const span = (end - start) / 2;
    const dist = Math.abs(smoothProgress - center);
    if (dist >= span) return 0;
    return Math.cos((dist / span) * (Math.PI / 2));
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="relative h-[550vh] bg-[#0A0D12]">
      {/* Pinned 100vh Visual Canvas Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        
        {/* Layer 1: Background Photographic Film Frames */}
        <div className="absolute inset-0 z-0">
          
          {/* Frame 1: Natural Living Room Hero */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: getSceneOpacity(0),
              transform: `scale(${1 + smoothProgress * 0.15})`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <Image
              src="/images/cinematic_hero.jpg"
              alt="Natural luxury Indian living room with cream woven fabric sofa"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
          </div>

          {/* Frame 2: Macro Fabric Inspection */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: getSceneOpacity(1),
              transform: `scale(${1 + (smoothProgress - 0.2) * 0.15})`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <Image
              src="/images/cinematic_macro.jpg"
              alt="Extreme macro close up of woven fabric weave with trapped dust"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none" />
          </div>

          {/* Frame 3: Technician Arrival & Room Preparation */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: getSceneOpacity(2),
              transform: `scale(${1 + (smoothProgress - 0.4) * 0.12})`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <Image
              src="/images/cinematic_technician.jpg"
              alt="Professional technician carefully inspecting sofa fabric"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
          </div>

          {/* Frame 4: The Hero Extraction Moment (With Interactive Wipe) */}
          <div
            ref={scrubberContainerRef}
            onMouseDown={() => setIsDraggingScrubber(true)}
            onMouseUp={() => setIsDraggingScrubber(false)}
            onMouseLeave={() => setIsDraggingScrubber(false)}
            onMouseMove={(e) => {
              if (isDraggingScrubber) handleScrubberMove(e.clientX);
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1) handleScrubberMove(e.touches[0].clientX);
            }}
            className="absolute inset-0 transition-opacity duration-300 ease-out cursor-ew-resize"
            style={{ opacity: getSceneOpacity(3) }}
          >
            <Image
              src="/images/cinematic_extraction.jpg"
              alt="Transparent upholstery extraction wand pulling dirty water from cushion"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

            {/* Interactive Scrubber Line overlay when hovering/dragging */}
            {smoothProgress >= 0.55 && smoothProgress <= 0.8 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
                style={{ left: `${scrubberPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-black/80 text-white border border-white/40 text-[11px] font-mono tracking-wider backdrop-blur-md whitespace-nowrap shadow-xl">
                  ↔ DRAG EXTRACTION
                </div>
              </div>
            )}
          </div>

          {/* Frame 5: Restored Living Room Sanctuary */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: getSceneOpacity(4),
              transform: `scale(${1 + (smoothProgress - 0.8) * 0.1})`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <Image
              src="/images/cinematic_restored.jpg"
              alt="Naturally restored modern living room with pristine cream sofa"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
          </div>

        </div>

        {/* Top Status & Brand Header Bar */}
        <div className="relative z-30 pt-6 px-6 sm:px-10 flex items-center justify-between pointer-events-none">
          <div className="glass-card px-4 py-1.5 rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md flex items-center gap-2 pointer-events-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono">
              {smoothProgress < 0.2
                ? "SCENE 01 • THE HOME"
                : smoothProgress < 0.4
                ? "SCENE 02 • THE INVISIBLE"
                : smoothProgress < 0.6
                ? "SCENE 03 • SIRI ARRIVES"
                : smoothProgress < 0.8
                ? "SCENE 04 • EXTRACTION"
                : "SCENE 05 • RENEWED"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
            <button
              onClick={scrollToServices}
              className="text-xs font-bold text-white/70 hover:text-white transition-colors"
            >
              Skip to Services ↓
            </button>
          </div>
        </div>

        {/* ----------------- NARRATIVE CINEMATIC TYPOGRAPHY LAYERS ----------------- */}

        {/* ACT 1: 0% - 18% (This is more than a sofa) */}
        <div
          className={`relative z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            smoothProgress < 0.18
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-8"
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-black tracking-widest uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SIRI SOFA SERVICES • HYDERABAD</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04]">
              This is more than a sofa.<br />
              <span className="italic font-serif font-normal text-emerald-200">
                It is where life happens.
              </span>
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs sm:text-sm text-white/80 font-medium">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs border border-white/10">
                Movie nights
              </span>
              <span>•</span>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs border border-white/10">
                Morning coffee
              </span>
              <span>•</span>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs border border-white/10">
                Kids playing
              </span>
              <span>•</span>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs border border-white/10">
                Everyday life
              </span>
            </div>

            <div className="pt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/50 tracking-wider">
              <span>SCROLL TO BEGIN THE STORY</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ACT 2: 18% - 38% (What the eye doesn't see) */}
        <div
          className={`relative z-20 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.18 && smoothProgress < 0.38
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-md space-y-4 bg-black/75 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md text-left shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono">
              ACT 02 • THE INVISIBLE REALITY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              It can look clean...<br />
              <span className="italic font-serif text-amber-200">
                without being deeply clean.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Everyday living settles deep into the weave: fine dust, natural body moisture, food oils, and pet dander burrow up to 3 inches deep into cushion foam.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300">
              Ordinary surface cloths and household vacuums only move dust around. Deep fibers remain untouched.
            </div>
          </div>
        </div>

        {/* ACT 3: 38% - 58% (Siri Arrives: Careful Inspection) */}
        <div
          className={`relative z-20 flex flex-col justify-center items-end px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.38 && smoothProgress < 0.58
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-md space-y-4 bg-black/75 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md text-left shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
              ACT 03 • PROFESSIONAL PROTOCOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Careful preparation before a single drop touches the weave.
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Our trained technician inspects your fabric weave, lays protective runners over your floor, and pre-treats stubborn stains with gentle pH-balanced bio-enzymes.
            </p>
            <div className="space-y-1.5 text-xs text-white/80 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Fabric testing to protect delicate velvets and linens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero mess or puddles on your living room floors</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACT 4: 58% - 78% (The Hero Moment: Extraction in Action) */}
        <div
          className={`relative z-20 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-24 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.58 && smoothProgress < 0.78
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-lg space-y-4 bg-black/80 p-6 sm:p-8 rounded-3xl border border-white/15 backdrop-blur-md text-left shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 font-mono">
              ACT 04 • THE RESTORATION MOMENT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Deep injection flushes out grime.<br />
              <span className="italic font-serif text-cyan-200">
                High-suction extraction pulls it away.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              As the transparent wand glides over the cushion, you can physically see the extracted murky water being pulled away into the machine tank, leaving behind clean, fresh fabric that dries in 2 to 3 hours.
            </p>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
              <span>Drag across the image to explore the extraction</span>
              <span className="font-mono text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">
                INTERACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* ACT 5: 78% - 92% (From lived-in to renewed) */}
        <div
          className={`relative z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 pointer-events-none ${
            smoothProgress >= 0.78 && smoothProgress < 0.92
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-4 p-8 sm:p-12 rounded-[2.5rem] bg-black/60 border border-white/15 backdrop-blur-lg shadow-2xl text-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
              ACT 05 • RENEWED
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              From lived-in<br />
              <span className="italic font-serif text-emerald-300">
                to renewed.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-lg mx-auto leading-relaxed">
              Your home doesn&apos;t always need something new.<br />
              Sometimes, it just needs a proper clean.
            </p>
            <div className="pt-3">
              <button
                onClick={scrollToServices}
                className="btn-primary text-xs py-3 px-8 shadow-xl pointer-events-auto flex items-center gap-2 mx-auto"
              >
                <span>Explore Services & Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ACT 6: 92% - 100% (The Grand Booking Transition) */}
        <div
          className={`relative z-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-700 ${
            smoothProgress >= 0.92
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-5 p-8 sm:p-12 rounded-[2.5rem] bg-white/95 border border-black/10 shadow-2xl backdrop-blur-xl text-[#121820]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-[#0C4A34] text-xs font-black uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ready For The Transformation?</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to restore your space?
            </h2>

            <p className="text-xs sm:text-sm text-[#525D6C] max-w-lg mx-auto">
              Book your professional doorstep upholstery cleaning across Hyderabad. Select your date, pick an open slot, and pay only after you inspect the finished cushions.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenBooking}
                className="btn-primary text-sm py-4 px-9 shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>BOOK YOUR CLEANING NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenTracking}
                className="btn-secondary text-sm py-4 px-7 shadow-xs"
              >
                Track Existing Booking
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-[#525D6C] font-semibold border-t border-black/8">
              <span>✓ Pay After Inspection</span>
              <span>✓ 2-3 Hour Air Dry</span>
              <span>✓ Verified Hyderabad Specialists</span>
            </div>
          </div>
        </div>

        {/* Bottom Film Slate Footnote */}
        <div className="relative z-30 pb-6 px-6 sm:px-10 flex items-center justify-between text-[11px] text-white/40 pointer-events-none font-mono">
          <span>SIRI SOFA SERVICES • CINEMATIC EXPERIENCE</span>
          <span>HYDERABAD, TELANGANA</span>
        </div>

      </div>
    </div>
  );
};
