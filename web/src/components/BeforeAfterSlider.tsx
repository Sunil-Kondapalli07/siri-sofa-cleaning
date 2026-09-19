"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ShieldCheck, Microscope } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <section id="science" className="py-20 lg:py-28 bg-[#FAF9F6] border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3] inline-flex items-center gap-1.5">
              <Microscope className="w-3.5 h-3.5" />
              <span>Visible Scientific Transformation</span>
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#121820] tracking-tight">
              See The Real Difference.<br />
              <span className="font-serif italic text-[#0C4A34] font-normal">
                Fiber by Fiber.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#525D6C] max-w-2xl mx-auto">
              Drag the interactive slider below to reveal how our 12-bar thermal extraction flushes out years of embedded discoloration and restores original texture.
            </p>
          </div>
        </ScrollReveal>

        {/* Draggable Slider Container */}
        <ScrollReveal direction="scale" delay={150}>
          <div className="max-w-5xl mx-auto mb-16">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-black/10 select-none cursor-ew-resize h-[380px] sm:h-[520px] bg-[#121820]"
            >
              {/* After Image (Background) */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <Image
                  src="/images/sofa_clean_after.jpg"
                  alt="After Deep Cleaning Restoration"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute top-6 right-6 z-10 bg-[#0C4A34]/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>AFTER: Hospital-Grade Restored & Sanitized</span>
                </div>
              </div>

              {/* Before Image (Clipped Layer) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPos}%` }}
              >
                <div className="relative w-[1024px] h-full">
                  <Image
                    src="/images/sofa_dirty_before.jpg"
                    alt="Before Deep Cleaning"
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="absolute top-6 left-6 z-10 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl">
                  ⚠️ BEFORE: Dull, Stained & Micro-Debris
                </div>
              </div>

              {/* Divider Line & Center Grip */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-[#0C4A34] shadow-2xl border-2 border-[#0C4A34] flex items-center justify-center font-black text-sm pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
                  ↔
                </div>
              </div>

            </div>

            <div className="mt-4 text-center text-xs text-[#6B7788] font-bold tracking-wide">
              ← DRAG SLIDER HORIZONTALLY TO INSPECT FIBER PURITY →
            </div>
          </div>
        </ScrollReveal>

        {/* Micro-Fiber Deep Science Callout with billion_macro_fiber.jpg */}
        <ScrollReveal direction="up" delay={200}>
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-black/10 bg-[#121820] text-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-7 p-8 sm:p-12 space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Micro-Fiber Science</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  How We Protect Fine Weaves Without Fraying
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Traditional harsh chemical cleaning burns natural cotton, linen, and velvet fibers, causing stiffness and color fading. Our European bio-enzyme shampoos are pH-balanced to loosen grime at the molecular level, allowing our vacuum to glide gently without friction damage.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-semibold">
                  <span>✓ Safe for Chenille & Linen</span>
                  <span>✓ Zero Bleach or Ammonia</span>
                  <span>✓ Preserves Velvet Nap</span>
                </div>
              </div>

              <div className="lg:col-span-5 relative h-64 sm:h-80 w-full overflow-hidden">
                <Image
                  src="/images/billion_macro_fiber.jpg"
                  alt="Microscopic textile fibers showing clean steam extraction"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#121820] via-transparent to-transparent hidden lg:block" />
              </div>

            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};
