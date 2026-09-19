"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, ChevronDown, CheckCircle2, SlidersHorizontal, ShieldCheck, Clock, Award } from "lucide-react";

interface CinematicBrandFilmProps {
  onOpenBooking: () => void;
  onOpenTracking: () => void;
}

const CHAPTERS = [
  { id: 1, label: "THE LIVING ROOM", act: "ACT 01", range: [0.00, 0.20], center: 0.10 },
  { id: 2, label: "THE INVISIBLE DUST", act: "ACT 02", range: [0.20, 0.40], center: 0.30 },
  { id: 3, label: "THE SPECIALIST", act: "ACT 03", range: [0.40, 0.60], center: 0.50 },
  { id: 4, label: "DEEP EXTRACTION", act: "ACT 04", range: [0.60, 0.80], center: 0.70 },
  { id: 5, label: "RENEWED SANCTUARY", act: "ACT 05", range: [0.80, 0.94], center: 0.87 },
  { id: 6, label: "RESERVE SERVICE", act: "ACT 06", range: [0.94, 1.00], center: 0.97 },
];

export const CinematicBrandFilm: React.FC<CinematicBrandFilmProps> = ({
  onOpenBooking,
  onOpenTracking,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);

  // Interactive Before/After Scrubber State for Act 4
  const [scrubberPos, setScrubberPos] = useState(50);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [hasUserDragged, setHasUserDragged] = useState(false);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height - window.innerHeight;
      if (containerHeight <= 0) return;
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
        if (Math.abs(diff) < 0.0005) return scrollProgress;
        return prev + diff * 0.12;
      });
      animId = requestAnimationFrame(lerp);
    };
    animId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animId);
  }, [scrollProgress]);

  // Auto-advance scrubber with scroll if user hasn't manually taken over
  useEffect(() => {
    if (hasUserDragged) return;
    if (smoothProgress >= 0.60 && smoothProgress <= 0.80) {
      // map 0.60 - 0.80 to 15% - 85%
      const localP = (smoothProgress - 0.60) / 0.20;
      const targetPos = Math.round(15 + localP * 70);
      queueMicrotask(() => {
        setScrubberPos(targetPos);
      });
    }
  }, [smoothProgress, hasUserDragged]);

  // Update scrubber position from coordinate
  const updateScrubberFromClientX = useCallback((clientX: number) => {
    if (!scrubberTrackRef.current) return;
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setScrubberPos(Math.round(pct));
    setHasUserDragged(true);
  }, []);

  // Pointer event handlers for drag scrubber
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingScrubber(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    updateScrubberFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingScrubber) return;
    updateScrubberFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingScrubber(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Determine active chapter
  const currentChapter = CHAPTERS.find(
    (c) => smoothProgress >= c.range[0] && smoothProgress < c.range[1]
  ) || CHAPTERS[CHAPTERS.length - 1];

  // Jump to chapter
  const jumpToChapter = (chapterCenter: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
    const targetScrollY = containerTop + containerHeight * chapterCenter;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  // Image Frame Opacities
  // Frame 1 (Hero): 0.00 - 0.23
  // Frame 2 (Macro): 0.19 - 0.43
  // Frame 3 (Technician): 0.39 - 0.63
  // Frame 4 (Extraction): 0.59 - 0.83
  // Frame 5 (Restored): 0.79 - 1.00
  const getFrameOpacity = (idx: number) => {
    const windows = [
      [0.00, 0.23], // Frame 0: Hero
      [0.19, 0.43], // Frame 1: Macro
      [0.39, 0.63], // Frame 2: Technician
      [0.59, 0.83], // Frame 3: Extraction
      [0.79, 1.00], // Frame 4: Restored
    ];
    const [start, end] = windows[idx];
    if (smoothProgress < start || smoothProgress > end) return 0;
    
    // Smooth cosine fade
    const mid = (start + end) / 2;
    const halfWidth = (end - start) / 2;
    const dist = Math.abs(smoothProgress - mid);
    const factor = Math.cos((dist / halfWidth) * (Math.PI / 2));
    return Math.max(0, Math.min(1, factor));
  };

  return (
    <div ref={containerRef} className="relative h-[560vh] bg-[#070A0F]">
      {/* Pinned 100vh Stage Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden select-none">

        {/* ------------------- LAYER 1: CINEMATIC PHOTOGRAPHIC BACKDROPS ------------------- */}
        <div className="absolute inset-0 z-0">
          
          {/* Frame 1: Natural Living Room Hero */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{
              opacity: getFrameOpacity(0),
              transform: `scale(${1 + smoothProgress * 0.12})`,
            }}
          >
            <Image
              src="/images/cinematic_hero.jpg"
              alt="Natural luxury living room with cream woven fabric sofa in morning light"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none" />
          </div>

          {/* Frame 2: Macro Fabric Inspection */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{
              opacity: getFrameOpacity(1),
              transform: `scale(${1 + (smoothProgress - 0.2) * 0.12})`,
            }}
          >
            <Image
              src="/images/cinematic_macro.jpg"
              alt="Extreme macro close up of woven fabric weave with trapped dust"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 pointer-events-none" />
          </div>

          {/* Frame 3: Technician Arrival & Protective Preparation */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{
              opacity: getFrameOpacity(2),
              transform: `scale(${1 + (smoothProgress - 0.4) * 0.10})`,
            }}
          >
            <Image
              src="/images/cinematic_technician.jpg"
              alt="Professional technician carefully inspecting sofa fabric with floor runner"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />
          </div>

          {/* Frame 4: The Hero Extraction Moment (Active Transparent Wand Backdrop) */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: getFrameOpacity(3) }}
          >
            <Image
              src="/images/cinematic_extraction.jpg"
              alt="Transparent upholstery extraction wand pulling dirty water from cushion"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30 pointer-events-none" />
          </div>

          {/* Frame 5: Restored Living Room Sanctuary */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{
              opacity: getFrameOpacity(4),
              transform: `scale(${1 + (smoothProgress - 0.8) * 0.08})`,
            }}
          >
            <Image
              src="/images/cinematic_restored.jpg"
              alt="Naturally restored modern living room with pristine cream sofa in afternoon light"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />
          </div>

        </div>

        {/* ------------------- LAYER 2: FLOATING CHAPTER NAVIGATION HUD ------------------- */}
        <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
          {/* Active Chapter Indicator */}
          <div className="glass-card px-4 py-2 rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 font-mono">
              {currentChapter.act} • {currentChapter.label}
            </span>
          </div>

          {/* Quick Chapter Step Dots */}
          <div className="hidden md:flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl pointer-events-auto">
            {CHAPTERS.map((c) => {
              const isActive = currentChapter.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => jumpToChapter(c.center)}
                  title={`${c.act}: ${c.label}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-7 bg-emerald-400 shadow-md shadow-emerald-400/50"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              );
            })}
          </div>

          {/* Skip Button */}
          <div className="pointer-events-auto">
            <button
              onClick={scrollToServices}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* ------------------- LAYER 3: DEDICATED STORYTELLING CAPTION CARDS ------------------- */}
        <div className="absolute inset-0 z-20 pointer-events-none">

          {/* ACT 1: THE LIVING ROOM (0.00 - 0.20) */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
              currentChapter.id === 1
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-8 pointer-events-none"
            }`}
          >
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 text-[11px] font-black tracking-widest uppercase backdrop-blur-md shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>SIRI SOFA SERVICES • HYDERABAD</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] drop-shadow-2xl">
                This is more than a sofa.<br />
                <span className="italic font-serif font-normal text-emerald-200">
                  It is where life unfolds.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-medium drop-shadow-md">
                Where morning chai is shared, tired bodies sink in after long Hyderabad commutes, and children build weekend memories.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-white/90">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                  ☕ Morning Chai
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                  🎬 Movie Evenings
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                  🧸 Family Playtime
                </span>
              </div>

              <div className="pt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/60 tracking-wider">
                <span>SCROLL TO DISCOVER THE STORY</span>
                <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
              </div>
            </div>
          </div>

          {/* ACT 2: THE INVISIBLE DUST (0.20 - 0.40) */}
          <div
            className={`absolute inset-0 flex flex-col justify-center items-start p-6 sm:p-12 lg:p-20 transition-all duration-700 ${
              currentChapter.id === 2
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <div className="max-w-lg space-y-4 bg-[#0A0E17]/90 p-7 sm:p-9 rounded-3xl border border-white/15 backdrop-blur-2xl text-left shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 font-mono">
                  ACT 02 • THE INVISIBLE BURDEN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  MACRO WEAVE
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                What looks clean...<br />
                <span className="italic font-serif text-amber-200">
                  is it always clean?
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Beneath the surface, everyday fabrics naturally hold fine airborne road dust, natural body moisture, cooking fumes, and microscopic dust mites that burrow deep into the cushion core.
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                ⚠️ Surface wiping and domestic vacuuming only agitate the top fibers. Deep-seated grime remains trapped inside.
              </div>
            </div>
          </div>

          {/* ACT 3: THE SPECIALIST (0.40 - 0.60) — PROMINENT RIGHT-ALIGNED CARD FOR TECHNICIAN */}
          <div
            className={`absolute inset-0 flex flex-col justify-center items-end p-6 sm:p-12 lg:p-20 transition-all duration-700 ${
              currentChapter.id === 3
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <div className="max-w-lg space-y-4 bg-[#080C14]/92 p-7 sm:p-9 rounded-3xl border border-white/20 backdrop-blur-2xl text-left shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                  ACT 03 • TRAINED HYGIENE SPECIALIST
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono">
                  DOORSTEP PROTOCOL
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                The Specialist Arrives at Your Doorstep.
              </h2>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Respectful, uniformed, and meticulously prepared. Before a single drop of water touches your upholstery, our technician prepares your room with surgical care:
              </p>

              <div className="space-y-2.5 pt-1 text-xs text-white/90">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Floor & Rug Protection</strong>
                    <span className="text-white/70">Waterproof runners laid down; protective shoe covers worn at all times. Zero drips on wood or marble.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Fiber Assessment & pH Testing</strong>
                    <span className="text-white/70">Custom bio-enzymatic pre-treatment calibrated for linen, velvet, suede, or blended fabrics.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACT 4: DEEP EXTRACTION & INTERACTIVE BEFORE/AFTER SLIDER (0.60 - 0.80) */}
          <div
            className={`absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-8 transition-all duration-700 ${
              currentChapter.id === 4
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            {/* Interactive Before / After Dual-Layer Inspection Deck */}
            <div className="w-full max-w-3xl bg-[#090D16]/95 border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-white space-y-4">
              
              {/* Header Bar with Real-time Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300 font-mono">
                      ACT 04 • THE RESTORATION MOMENT
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold">
                      INTERACTIVE WIPE
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Watch the Dirt Release in Real-Time
                  </h3>
                </div>

                {/* Dynamic Status Pill based on Scrubber Position */}
                <div className="glass-card px-3 py-1.5 rounded-full border border-white/15 bg-black/40 text-[11px] font-bold">
                  {scrubberPos < 35 ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      BEFORE: Trapped grime & dark liquid spill
                    </span>
                  ) : scrubberPos < 75 ? (
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      ACTIVE: High-suction extraction pulling dirty water
                    </span>
                  ) : (
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      RESTORATION: 100% Clean, purified fabric weave
                    </span>
                  )}
                </div>
              </div>

              {/* The Interactive Before/After Visual Canvas */}
              <div
                ref={scrubberTrackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden cursor-ew-resize select-none border border-white/15 shadow-inner touch-none"
              >
                {/* Layer 1 (Base): Soiled Before State */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/sofa_dirty_before.jpg"
                    alt="Sofa cushion with deep spill stain and trapped dust before cleaning"
                    fill
                    className="object-cover object-center pointer-events-none"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 text-white/90 border border-white/20 text-[10px] font-black uppercase font-mono backdrop-blur-md">
                    SOILED BEFORE
                  </div>
                </div>

                {/* Layer 2 (Revealed): Clean Restored State */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `polygon(0 0, ${scrubberPos}% 0, ${scrubberPos}% 100%, 0 100%)`,
                  }}
                >
                  <Image
                    src="/images/sofa_clean_after.jpg"
                    alt="Sofa cushion immaculately cleaned and restored after Siri deep clean"
                    fill
                    className="object-cover object-center pointer-events-none"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase font-mono backdrop-blur-md">
                    ✨ CLEAN & RENEWED
                  </div>
                </div>

                {/* The Draggable Dividing Wand Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-30 pointer-events-none"
                  style={{ left: `${scrubberPos}%` }}
                >
                  {/* Glowing Tactile Center Handle */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-3 py-2 rounded-full bg-black/90 text-white border-2 border-emerald-400 text-[11px] font-black tracking-wider flex items-center gap-1.5 shadow-2xl backdrop-blur-lg whitespace-nowrap">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DRAG TO REVEAL</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls & Narrative */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70 pt-1">
                <p className="leading-relaxed text-center sm:text-left max-w-md">
                  {scrubberPos > 70
                    ? "✨ Notice the restored fiber weave: all stains dissolved, zero sticky soap residues left behind, touch-dry in 2 to 3 hours."
                    : "Drag the slider to see how industrial extraction extracts buried grime without damaging delicate upholstery fibers."}
                </p>

                {/* Instant Jump Comparison Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setScrubberPos(0); setHasUserDragged(true); }}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-bold text-white transition-all"
                  >
                    View Before
                  </button>
                  <button
                    onClick={() => { setScrubberPos(100); setHasUserDragged(true); }}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] transition-all shadow-md"
                  >
                    View Restored
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ACT 5: RENEWED SANCTUARY (0.80 - 0.94) — ULTRA-PREMIUM POST-CLEAN CAPTION */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
              currentChapter.id === 5
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <div className="max-w-2xl mx-auto space-y-5 p-8 sm:p-11 rounded-[2.5rem] bg-[#090D16]/92 border border-white/20 backdrop-blur-2xl shadow-2xl text-white">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>ACT 05 • THE RENEWED SANCTUARY</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                From lived-in<br />
                <span className="italic font-serif font-normal text-emerald-300">
                  to renewed sanctuary.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-white/85 max-w-lg mx-auto leading-relaxed">
                Run your hand across the cushions. No chemical stiffness. No lingering artificial perfume. Just breathable, supple fabric restored to its purest state.
              </p>

              {/* 3 Luxury Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-white">100% Baby & Pet Safe</div>
                  <div className="text-[11px] text-white/60">Non-toxic bio-enzymes, zero harsh bleaches.</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-white">2–3 Hour Air Dry</div>
                  <div className="text-[11px] text-white/60">90% water extracted; dries fast under room fans.</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Award className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-white">Pay After Inspection</div>
                  <div className="text-[11px] text-white/60">Zero advance; pay only when you are 100% delighted.</div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={scrollToServices}
                  className="btn-primary text-xs py-3.5 px-8 shadow-xl pointer-events-auto flex items-center gap-2 mx-auto"
                >
                  <span>Select Your Furniture & Date</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ACT 6: DIRECT BOOKING TRANSITION (0.94 - 1.00) */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
              currentChapter.id === 6
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <div className="max-w-xl mx-auto space-y-5 p-8 sm:p-12 rounded-[2.5rem] bg-white/95 border border-black/10 shadow-2xl backdrop-blur-xl text-[#121820]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-[#0C4A34] text-xs font-black uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>EXPERIENCE THE TRANSFORMATION</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to restore your living room?
              </h2>

              <p className="text-xs sm:text-sm text-[#525D6C] max-w-md mx-auto leading-relaxed">
                Book your professional doorstep cleaning across Hyderabad in under 60 seconds. Pick an open slot with no advance payment.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
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

              <div className="pt-3 flex items-center justify-center gap-4 text-xs text-[#525D6C] font-semibold border-t border-black/8">
                <span>✓ Pay After Inspection</span>
                <span>•</span>
                <span>✓ 2-3h Rapid Dry</span>
                <span>•</span>
                <span>✓ Trained Hyderabad Pros</span>
              </div>
            </div>
          </div>

        </div>

        {/* ------------------- LAYER 4: BOTTOM FILM SLATE FOOTER BAR ------------------- */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pb-5 px-6 sm:px-10 flex items-center justify-between text-[11px] text-white/50 pointer-events-none font-mono">
          <span>SIRI SOFA SERVICES • CINEMATIC EXPERIENCE</span>
          <span>HYDERABAD, TELANGANA</span>
        </div>

      </div>
    </div>
  );
};
