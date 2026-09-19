"use client";

import React, { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

interface Section {
  id: string;
  number: string;
  name: string;
}

const SECTIONS: Section[] = [
  { id: "hero", number: "01", name: "Sanctuary" },
  { id: "story", number: "02", name: "The Story" },
  { id: "science", number: "03", name: "Science Proof" },
  { id: "services", number: "04", name: "Services" },
  { id: "protocol", number: "05", name: "Protocol" },
  { id: "reviews", number: "06", name: "Reviews" },
];

export const SectionNavigator: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      setIsScrolled(window.scrollY > 400);

      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentSec = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      {/* Scroll to Top button when scrolled */}
      {isScrolled && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-10 h-10 rounded-full bg-white/95 border border-black/10 shadow-lg backdrop-blur-md flex items-center justify-center text-[#121820] hover:bg-emerald-50 hover:text-[#0C4A34] transition-all hover:scale-105"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Active Section Pill */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 border border-black/10 shadow-xl backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-black tracking-wider text-[#0C4A34]">
          {currentSec.number}
        </span>
        <span className="text-black/20">|</span>
        <span className="text-xs font-bold text-[#121820]">{currentSec.name}</span>

        {/* Quick jump dots */}
        <div className="flex items-center gap-1 ml-2">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              aria-label={`Jump to ${sec.name}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeSection === sec.id
                  ? "w-4 bg-[#0C4A34]"
                  : "bg-black/20 hover:bg-black/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
