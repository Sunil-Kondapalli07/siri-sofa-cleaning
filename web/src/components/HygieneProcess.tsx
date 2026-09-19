"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, Sparkles, Wind, Droplets, Clock } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const HygieneProcess: React.FC = () => {
  const steps = [
    {
      step: "01",
      icon: <Wind className="w-5 h-5 text-[#0C4A34]" />,
      title: "Dry High-Suction HEPA Vacuuming",
      desc: "Industrial dual-motor extraction lifts coarse dust, loose grit, pet dander, and food particles before any moisture touches the weave.",
    },
    {
      step: "02",
      icon: <Droplets className="w-5 h-5 text-[#0C4A34]" />,
      title: "Targeted Bio-Enzyme Spot Treatment",
      desc: "Natural pH-neutral spot lifters dissolve old coffee, grease, and tea marks without bleaching delicate dye pigments.",
    },
    {
      step: "03",
      icon: <Sparkles className="w-5 h-5 text-[#0C4A34]" />,
      title: "12-Bar Deep Thermal Injection",
      desc: "Heated shampoo solution injected 3.5 inches deep into foam cores, dissolving embedded dust mites and stale odor compounds.",
    },
    {
      step: "04",
      icon: <ShieldCheck className="w-5 h-5 text-[#0C4A34]" />,
      title: "Gentle Microfiber Weave Agitation",
      desc: "Soft-touch rotating agitation frees deep trapped soil from between woven fibers without pulling or fraying threads.",
    },
    {
      step: "05",
      icon: <CheckCircle2 className="w-5 h-5 text-[#0C4A34]" />,
      title: "Intense Moisture Vacuum Recovery",
      desc: "Aerospace-grade vacuum extraction recovers 90%+ of moisture into dirty holding tank, ensuring no internal frame rust or sponge decay.",
    },
    {
      step: "06",
      icon: <Clock className="w-5 h-5 text-[#0C4A34]" />,
      title: "Hypoallergenic Mist & Rapid Dry",
      desc: "Non-toxic herbal deodorizing spray leaves the living room smelling fresh, clean, and completely dry in 2 to 3 hours.",
    },
  ];

  return (
    <section id="protocol" className="py-20 lg:py-28 bg-[#F4F2EC] border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C4A34] bg-white px-4 py-1.5 rounded-full border border-black/8 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Precision Engineering</span>
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#121820] tracking-tight">
              The 6-Step Clinical Protocol
            </h2>
            <p className="text-sm sm:text-base text-[#525D6C] max-w-2xl mx-auto">
              Standardized hospital-grade fabric extraction executed by verified specialists using precision machinery across Hyderabad.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature Split Showcase with Specialist Photo */}
        <ScrollReveal direction="scale" delay={150}>
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-12 border border-black/8 shadow-xl mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left: Specialist in Action Image */}
              <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-lg border border-black/5 h-[380px] sm:h-[460px]">
                <Image
                  src="/images/billion_tech_extraction.jpg"
                  alt="Siri Sofa Services precision upholstery extraction specialist in action"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-2xl border border-white/80 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0C4A34] uppercase tracking-wider">
                      Specialist On-Site
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Certified Technician
                    </span>
                  </div>
                  <div className="text-xs text-[#525D6C] mt-1 font-medium">
                    Equipped with transparent vacuum wand verifying clear extraction liquid before signing off.
                  </div>
                </div>
              </div>

              {/* Right: Technical Guarantee Breakdown */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0C4A34] bg-[#EBF5F0] px-3 py-1 rounded-full">
                    Zero Living Room Mess
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#121820]">
                    Industrial Cleaning Without The Household Chaos
                  </h3>
                  <p className="text-xs sm:text-sm text-[#525D6C] leading-relaxed">
                    We treat your home like a fine gallery. Our specialists lay protective floor runners, use quiet sound-insulated motors, and contain 100% of dirty water inside our dual-chamber tanks.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-black/5">
                    <div className="text-xl font-black text-[#0C4A34] font-display">12 Bar</div>
                    <div className="text-xs font-bold text-[#121820] mt-0.5">Injection Pressure</div>
                    <div className="text-[11px] text-[#8490A0] mt-0.5">Penetrates deep foam</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-black/5">
                    <div className="text-xl font-black text-[#0C4A34] font-display">90%+</div>
                    <div className="text-xs font-bold text-[#121820] mt-0.5">Moisture Recovery</div>
                    <div className="text-[11px] text-[#8490A0] mt-0.5">Dry in 2-3 hours</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-[#C2E2D3] flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#0C4A34] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#0C4A34] leading-relaxed">
                    <strong className="block font-black">Joint Post-Clean Cushion Inspection</strong>
                    You and our specialist review every corner and armrest under bright inspection lights before any payment is collected.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>

        {/* 6 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 75}>
              <div className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#EBF5F0] flex items-center justify-center">
                      {s.icon}
                    </div>
                    <span className="text-xs font-black text-[#8490A0] font-mono">
                      STAGE {s.step}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#121820] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#525D6C] leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-black/5 flex items-center gap-1.5 text-[11px] font-bold text-[#0C4A34]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Quality Standard</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
