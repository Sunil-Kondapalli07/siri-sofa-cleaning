"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { Phone, Calendar, User as UserIcon, Menu, X, ShieldCheck } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onOpenBooking: () => void;
  onOpenTracking: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenOrders: () => void;
  onLogout: () => void;
  locationLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenBooking,
  onOpenTracking,
  onOpenAuth,
  onOpenAdmin,
  onOpenOrders,
  onLogout,
  locationLabel,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
      {/* Top micro-bar */}
      <div className="bg-[#0C4A34] text-white text-[11px] font-semibold py-1 px-4 text-center tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline">🚀 Hyderabad Express Cleaning Slots Available Today</span>
          <span className="sm:hidden mx-auto">🚀 Hyderabad Express Slots Available</span>
          <div className="hidden sm:flex items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>99.9% Dust Mite Elimination</span>
            </span>
            <span>•</span>
            <a href="tel:+919123456789" className="hover:text-emerald-200 transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>+91 91234 56789</span>
            </a>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#0C4A34] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
            🛋️
          </div>
          <div>
            <div className="font-extrabold text-lg sm:text-xl tracking-tight text-[#121820] leading-none">
              Siri Sofa Services
            </div>
            <div className="text-[10px] font-bold text-[#0C4A34] tracking-wider uppercase mt-0.5">
              Doorstep Upholstery Hygiene
            </div>
          </div>
        </a>

        {locationLabel && (
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#C2E2D3] bg-[#EBF5F0] px-3 py-2 text-[11px] font-bold text-[#0C4A34]" title="Saved service location">
            <span>📍</span>
            <span>{locationLabel}</span>
          </div>
        )}

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-bold text-[#525D6C] tracking-wide">
          <a href="#services" className="hover:text-[#0C4A34] transition-colors">
            Services & Pricing
          </a>
          <a href="#hygiene" className="hover:text-[#0C4A34] transition-colors">
            Hospital-Grade Hygiene
          </a>
          <a href="#before-after" className="hover:text-[#0C4A34] transition-colors">
            Before & After
          </a>
          <a href="#reviews" className="hover:text-[#0C4A34] transition-colors">
            Reviews & FAQ
          </a>
          <button
            onClick={onOpenTracking}
            className="hover:text-[#0C4A34] transition-colors flex items-center gap-1 text-[#121820]"
          >
            <span>Track Booking</span>
          </button>
        </div>

        {/* Actions & Account Badge */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="bg-[#EBF5F0] border border-[#C2E2D3] px-3 py-1.5 rounded-full flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-[#0C4A34]" />
                <span className="text-xs font-bold text-[#0C4A34]">{user.name.split(" ")[0]}</span>
                <button
                onClick={onOpenOrders}
                className="text-xs font-bold text-[#0C4A34] hover:underline px-2"
              >
                My Orders
              </button>
              {user.role === "admin" && (
                  <span className="bg-[#0C4A34] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              {user.role === "admin" && (
                <button
                  onClick={onOpenAdmin}
                  className="text-xs font-bold text-[#0C4A34] hover:underline px-2"
                >
                  Admin Hub
                </button>
              )}
              <button
                onClick={onLogout}
                className="text-xs font-semibold text-[#8490A0] hover:text-red-600 transition-colors ml-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold text-[#121820] hover:text-[#0C4A34] transition-colors px-3 py-2"
            >
              Sign In
            </button>
          )}

          <button
            onClick={onOpenBooking}
            className="btn-primary text-xs py-3 px-6 shadow-md"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book a Cleaning</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-[#121820] hover:bg-black/5"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-black/10 px-6 py-6 space-y-4 shadow-xl animate-fade-in">
          <div className="flex flex-col gap-3 text-sm font-bold text-[#121820]">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-black/5"
            >
              Services & Pricing
            </a>
            <a
              href="#hygiene"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-black/5"
            >
              Hospital-Grade Hygiene
            </a>
            <a
              href="#before-after"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-black/5"
            >
              Before & After
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-black/5"
            >
              Reviews & FAQ
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="py-2 text-left border-b border-black/5 flex items-center justify-between"
            >
              <span>Track Cleaning Status</span>
              <span>→</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            {user ? (
              <div className="flex items-center justify-between bg-[#EBF5F0] p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#0C4A34]" />
                  <span className="text-xs font-bold text-[#0C4A34]">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenOrders();
                    }}
                    className="text-xs font-bold text-[#0C4A34]"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={onLogout}
                    className="text-xs font-bold text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-3 rounded-full border border-black/15 text-xs font-bold text-[#121820]"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="btn-primary w-full text-xs py-3.5"
            >
              Book a Cleaning Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
