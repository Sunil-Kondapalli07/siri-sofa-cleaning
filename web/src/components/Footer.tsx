"use client";

import React from "react";
import { Phone, Mail, MapPin, ShieldCheck, Lock } from "lucide-react";

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenTracking }) => {
  return (
    <footer className="bg-[#121820] text-slate-400 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-bold text-base">
                🛋️
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Siri Sofa Services
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Hyderabad’s premier doorstep upholstery deep steam extraction service. Hospital-grade fabric sanitization eliminating stains, odors, and 99.9% of dust mites.
            </p>
            <div className="text-xs text-slate-500 font-semibold">
              Serving All Hyderabad PIN Codes (500001 - 500099)
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">
              Upholstery Services
            </h4>
            <ul className="text-xs space-y-2.5">
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  Fabric & Velvet Sofa Deep Steam
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  Dining & Office Chair Shampoo
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  Anti-Allergen Mattress Sanitization
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  Living Room Carpet Deep Extraction
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">
              Customer Hub
            </h4>
            <ul className="text-xs space-y-2.5">
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Track Dispatch Status
                </button>
              </li>
              <li>
                <a href="#hygiene" className="hover:text-emerald-400 transition-colors">
                  6-Step Hospital-Grade Protocol
                </a>
              </li>
              <li>
                <a href="#before-after" className="hover:text-emerald-400 transition-colors">
                  Before & After Proof
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-emerald-400 transition-colors">
                  Customer Ratings & FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">
              Direct Contact
            </h4>
            <div className="text-xs space-y-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+919123456789" className="hover:text-white">
                  +91 91234 56789
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:support@sirisofa.com" className="hover:text-white">
                  support@sirisofa.com
                </a>
              </div>
              <div className="flex items-start gap-2.5 text-slate-400 leading-snug">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Road No. 12, Banjara Hills, Hyderabad, Telangana 500034</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Siri Sofa Services. All rights reserved. Professional Doorstep Care.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doorstep Hygiene Guarantee</span>
            </span>
            <span>•</span>
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 font-mono text-[11px]"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Console</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
