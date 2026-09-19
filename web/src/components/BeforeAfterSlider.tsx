"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";

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
    <section id="before-after" className="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
            Visible Results
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
            Before & After Deep Steam
          </h2>
          <p className="text-sm sm:text-base text-[#525D6C] mt-2">
            Drag the interactive slider below to inspect the fabric fiber difference our extraction achieves.
          </p>
        </div>

        {/* Draggable Slider Container */}
        <div className="max-w-4xl mx-auto">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 select-none cursor-ew-resize h-[360px] sm:h-[480px] bg-[#121820]"
          >
            {/* After Image (Background) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <Image
                src="/images/sofa_clean_after.jpg"
                alt="After Deep Cleaning Restoration"
                fill
                className="object-cover object-center"
              />
              <div className="absolute top-5 right-5 z-10 bg-[#0C4A34]/90 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                ✨ AFTER: Sanitized & Restored
              </div>
            </div>

            {/* Before Image (Clipped Layer) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="relative w-[896px] h-full">
                <Image
                  src="/images/sofa_dirty_before.jpg"
                  alt="Before Deep Cleaning"
                  fill
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute top-5 left-5 z-10 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                ⚠️ BEFORE: Dust, Oils & Stains
              </div>
            </div>

            {/* Divider Line & Center Grip */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-[#0C4A34] shadow-2xl border-2 border-[#0C4A34] flex items-center justify-center font-bold text-xs pointer-events-auto cursor-ew-resize">
                ↔
              </div>
            </div>

          </div>

          <div className="mt-4 text-center text-xs text-[#6B7788] font-semibold">
            ← Drag slider left or right to inspect fabric details →
          </div>
        </div>

      </div>
    </section>
  );
};
