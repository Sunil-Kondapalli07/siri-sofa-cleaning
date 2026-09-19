"use client";

import React from "react";
import Image from "next/image";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface EmotionalStoryProps {
  onBookNow: () => void;
}

export const EmotionalStory: React.FC<EmotionalStoryProps> = ({ onBookNow }) => {
  return (
    <section id="story" className="py-20 lg:py-28 bg-[#FAF9F6] border-t border-black/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Pre-title */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3] inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-[#0C4A34]" />
              <span>The Heart of the Home</span>
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#121820] tracking-tight leading-[1.08]">
              Your Sofa Has Seen Every Birthday.<br />
              <span className="font-serif italic text-[#0C4A34] font-normal">
                Every Sick Day. Every Late Night.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[#525D6C] leading-relaxed max-w-2xl mx-auto">
              It is where your children take afternoon naps, where the family gathers for movie nights, and where you decompress after exhausting days.
            </p>
          </div>
        </ScrollReveal>

        {/* Emotional Story Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          
          {/* Left: Emotional Family Lifestyle Photo */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="left" delay={150}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/8 bg-white group">
                <div className="relative w-full h-[450px] sm:h-[520px]">
                  <Image
                    src="/images/billion_family_serenity.jpg"
                    alt="Mother and child laughing peacefully on a sanitized pure sofa"
                    fill
                    className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Emotional Quote Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 glass-card p-5 rounded-2xl border border-white/70 shadow-xl text-left">
                    <div className="flex items-center gap-2 text-[#0C4A34] text-xs font-bold mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Pure, Breathable Living Room Serenity</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#121820] font-bold leading-snug">
                      &quot;When our baby crawls and buries her face into the cushions, I know with 100% certainty that she is breathing pure, sterile, dust-free fabric.&quot;
                    </p>
                    <div className="text-[11px] text-[#525D6C] mt-1.5 font-medium">
                      — Sneha & Raghav, Jubilee Hills Resident
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: The Invisible Reality vs Scientific Peace of Mind */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <ScrollReveal direction="right" delay={200}>
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
                  Behind the Fabric
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-[#121820] tracking-tight">
                  Life Happens Every Day.<br />
                  <span className="text-[#0C4A34]">So Do 200,000 Micro-Particles.</span>
                </h3>
                <p className="text-sm sm:text-base text-[#525D6C] leading-relaxed">
                  Ordinary living leaves behind microscopic residue: natural body moisture, cooking fumes, pet dander, and microscopic dust mites that burrow 3 to 5 inches deep into foam cores.
                </p>
              </div>

              {/* 3 Emotional Fact Cards */}
              <div className="space-y-3 pt-4">
                <div className="p-4 rounded-2xl bg-white border border-black/8 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold text-lg">
                    🛋️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#121820]">
                      4.2 Hours of Intimate Contact Daily
                    </h4>
                    <p className="text-xs text-[#525D6C] mt-0.5 leading-relaxed">
                      Your family spends more waking hours touching living room fabric than any other surface in your entire home.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-black/8 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 font-bold text-lg">
                    🔬
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#121820]">
                      Surface Wiping Leaves 90% Behind
                    </h4>
                    <p className="text-xs text-[#525D6C] mt-0.5 leading-relaxed">
                      Dry cloths and handheld vacuums only move dust around. They cannot break down oxidized oils or dissolve mite colonies deep in the batting.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#0C4A34]/20 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0C4A34] flex items-center justify-center shrink-0 font-bold text-lg">
                    🌿
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#121820]">
                      The Siri Restoration Standard
                    </h4>
                    <p className="text-xs text-[#525D6C] mt-0.5 leading-relaxed">
                      Our 12-bar thermal injection flushes out trapped allergens while our industrial vacuum extracts 90%+ moisture, leaving fibers soft, crisp, and fresh.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onBookNow}
                  className="btn-primary text-xs py-3.5 px-8 shadow-md flex items-center gap-2"
                >
                  <span>Give Your Living Room A Fresh Start</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </ScrollReveal>
          </div>

        </div>

        {/* Real Home Purity Metrics Banner */}
        <ScrollReveal direction="scale" delay={250}>
          <div className="bg-[#121820] text-white rounded-[2rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0C4A34]/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="pt-4 md:pt-0">
                <div className="text-3xl sm:text-5xl font-black text-emerald-400 font-display">
                  12,000+
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-bold mt-1">
                  Hyderabad Homes Restored
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Jubilee Hills, Gachibowli, Banjara
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6">
                <div className="text-3xl sm:text-5xl font-black text-white font-display">
                  99.9%
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-bold mt-1">
                  Allergen Neutralization
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Certified Dust Mite Elimination
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6">
                <div className="text-3xl sm:text-5xl font-black text-emerald-400 font-display">
                  2-3 Hrs
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-bold mt-1">
                  Rapid Controlled Dry
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ready for evening relaxation
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6">
                <div className="text-3xl sm:text-5xl font-black text-white font-display">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-bold mt-1">
                  Eco-Safe Plant Shampoos
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Zero harmful fumes or harsh residue
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};
