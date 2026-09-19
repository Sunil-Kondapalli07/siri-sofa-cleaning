"use client";

import React, { useState } from "react";
import { Booking } from "@/types";
import { api } from "@/lib/api";
import { X, Search, Clock, User, Phone, MapPin, Calendar } from "lucide-react";

interface BookingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookingId?: string;
}

export const BookingTrackerModal: React.FC<BookingTrackerModalProps> = ({
  isOpen,
  onClose,
  initialBookingId = "",
}) => {
  const [bookingIdInput, setBookingIdInput] = useState(initialBookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = bookingIdInput.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const res = await api.getBookingById(id);
      if (res.booking) {
        setBooking(res.booking);
      } else {
        setError(res.error || `Booking reference ${id} not found.`);
      }
    } catch {
      setError("Failed to locate booking record.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      received: { bg: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", label: "Appointment Received" },
      confirmed: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", label: "Confirmed & Scheduled" },
      assigned: { bg: "bg-purple-50 text-purple-700 border-purple-200", text: "text-purple-700", label: "Technician Dispatched" },
      cleaning_started: { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", label: "Cleaning In Progress" },
      completed: { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", text: "text-emerald-800", label: "Service Completed" },
      cancelled: { bg: "bg-red-50 text-red-700 border-red-200", text: "text-red-700", label: "Appointment Cancelled" },
    };
    const c = config[status] || config.received;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-black/10 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-[#FAF9F6] border-b border-black/8 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3 py-1 rounded-full border border-[#C2E2D3]">
              Live Dispatch
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#121820] mt-1.5">
              Track Your Cleaning Appointment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#8490A0] hover:text-[#121820]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={bookingIdInput}
              onChange={(e) => setBookingIdInput(e.target.value)}
              placeholder="ENTER BOOKING ID (e.g. SIRI-464890)"
              className="flex-1 px-4 py-3 rounded-xl border border-black/15 text-sm font-bold uppercase focus:outline-none focus:border-[#0C4A34]"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-3 px-6 shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Searching..." : "Track"}</span>
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {booking && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-5 bg-[#FAF9F6] rounded-2xl border border-black/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#8490A0]">
                    #{booking.id}
                  </span>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0C4A34]" />
                    <span className="font-semibold text-[#121820]">{booking.service_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0C4A34]" />
                    <span className="font-semibold text-[#121820]">{booking.service_slot}</span>
                  </div>
                </div>

                {booking.address && (
                  <div className="flex items-start gap-2 text-xs text-[#525D6C] pt-2 border-t border-black/5">
                    <MapPin className="w-4 h-4 text-[#0C4A34] shrink-0 mt-0.5" />
                    <span>
                      {booking.address.house_flat}, {booking.address.street}, {booking.address.area}, Hyderabad - {booking.address.pincode}
                    </span>
                  </div>
                )}
              </div>

              {/* Technician Info */}
              {booking.technician_name && (
                <div className="p-4 bg-[#EBF5F0] rounded-2xl border border-[#C2E2D3] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0C4A34] text-white flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#8490A0] uppercase">
                        Assigned Specialist
                      </div>
                      <div className="font-bold text-sm text-[#121820]">
                        {booking.technician_name}
                      </div>
                    </div>
                  </div>
                  {booking.technician_phone && (
                    <a
                      href={`tel:${booking.technician_phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-bold text-[#0C4A34] shadow-xs hover:bg-[#FAF9F6]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Specialist</span>
                    </a>
                  )}
                </div>
              )}

              {/* Items Summary */}
              {booking.items && booking.items.length > 0 && (
                <div className="border-t border-black/5 pt-3 space-y-2">
                  <div className="text-xs font-bold text-[#121820]">Service Items:</div>
                  {booking.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-[#525D6C]">
                      <span>{it.variant_name} × {it.quantity}</span>
                      <span className="font-bold text-[#121820]">₹{it.total_price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-black text-[#121820] pt-2 border-t border-black/5">
                    <span>Total Bill:</span>
                    <span className="text-[#0C4A34]">₹{booking.total_amount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
