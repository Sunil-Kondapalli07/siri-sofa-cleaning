"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Wind, Droplets, Clock } from "lucide-react";

export const HygieneProcess: React.FC = () => {
  const steps = [
    {
      step: "01",
      icon: <Wind className="w-6 h-6 text-[#0C4A34]" />,
      title: "Dry High-Suction HEPA Vacuuming",
      desc: "Industrial dual-motor extraction lifts loose dust, pet dander, food crumbs, and surface grit before any liquid touches the fabric.",
    },
    {
      step: "02",
      icon: <Droplets className="w-6 h-6 text-[#0C4A34]" />,
      title: "Enzyme Stain Pre-Treatment",
      desc: "Eco-friendly, fabric-specific spot lifters break down oily residue, tea/coffee marks, and body grease without discoloration.",
    },
    {
      step: "03",
      icon: <Sparkles className="w-6 h-6 text-[#0C4A34]" />,
      title: "High-Pressure Hot Steam Injection",
      desc: "Heated shampoo solution injected 3 inches deep into foam cushions, dissolving embedded dust mites and bacteria.",
    },
    {
      step: "04",
      icon: <ShieldCheck className="w-6 h-6 text-[#0C4A34]" />,
      title: "Gentle Microfiber Agitation",
      desc: "Soft-bristle rotary brushing safely dislodges embedded soil from velvet, chenille, linen, or faux-leather weaves.",
    },
    {
      step: "05",
      icon: <CheckCircle2 className="w-6 h-6 text-[#0C4A34]" />,
      title: "Intense Moisture Extraction",
      desc: "12-bar vacuum extraction recovers 90%+ of moisture and lifted contaminants into dirty recovery tank, preventing water-logging.",
    },
    {
      step: "06",
      icon: <Clock className="w-6 h-6 text-[#0C4A34]" />,
      title: "Anti-Bacterial Deodorization",
      desc: "Non-toxic herbal sanitizing mist leaves upholstery fresh, hypoallergenic, and completely dry within 2 to 3 hours.",
    },
  ];

  return (
    <section id="hygiene" className="py-16 lg:py-24 bg-[#F4F2EC] border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-white px-4 py-1.5 rounded-full border border-black/8">
            Hygiene Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
            6-Step Hospital-Grade Process
          </h2>
          <p className="text-sm sm:text-base text-[#525D6C] mt-2">
            Every cushion and stitch receives standardized, scientific care for guaranteed purity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs hover:border-[#0C4A34]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF5F0] flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-xs font-black text-[#8490A0] font-mono">
                    STEP {s.step}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-[#121820] mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-[#525D6C] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-black/5 flex items-center gap-1.5 text-[11px] font-bold text-[#0C4A34]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standardized Inspection Check</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
