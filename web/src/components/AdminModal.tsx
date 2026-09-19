"use client";

import React, { useState, useEffect } from "react";
import { Booking, Technician } from "@/types";
import { api } from "@/lib/api";
import { X, RefreshCw, UserCheck, ShieldAlert, Check } from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refresh = async () => {
    try {
      const [bList, tList] = await Promise.all([
        api.getAdminBookings(),
        api.getTechnicians(),
      ]);
      setBookings(bList);
      setTechnicians(tList);
    } catch {
      setError("Admin access restricted. Please sign in with staff credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    Promise.all([api.getAdminBookings(), api.getTechnicians()])
      .then(([bList, tList]) => {
        if (!isCancelled) {
          setBookings(bList);
          setTechnicians(tList);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Admin access restricted. Please sign in with staff credentials.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async (bookingId: string) => {
    const techId = selectedTechs[bookingId];
    if (!techId) return;
    try {
      await api.assignTechnician(bookingId, techId);
      setSuccessMsg(`Technician assigned to booking #${bookingId}`);
      setTimeout(() => setSuccessMsg(""), 3000);
      refresh();
    } catch {
      setError("Failed to assign technician");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-black/10 overflow-hidden my-8 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#FAF9F6] border-b border-black/8 p-6 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3 py-1 rounded-full border border-[#C2E2D3]">
              Staff Operations Console
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#121820] mt-1.5">
              Live Dispatch & Technician Management
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-xl border border-black/10 hover:bg-black/5 text-[#525D6C]"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-[#8490A0] hover:text-[#121820]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#8490A0]">
                {loading ? "Loading bookings..." : "No bookings found in database."}
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#FAF9F6] p-4 sm:p-5 rounded-2xl border border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#121820]">
                        #{b.id}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-white border border-black/8 text-[#0C4A34]">
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#121820]">
                      {b.customer_name} • {b.customer_phone}
                    </div>
                    <div className="text-xs text-[#525D6C]">
                      {b.service_date} ({b.service_slot}) • Total: ₹{b.total_amount}
                    </div>
                    {b.technician_name && (
                      <div className="text-xs text-emerald-700 font-semibold">
                        Assigned to: {b.technician_name} ({b.technician_phone})
                      </div>
                    )}
                  </div>

                  {/* Technician Assignment Form */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTechs[b.id] || ""}
                      onChange={(e) =>
                        setSelectedTechs({
                          ...selectedTechs,
                          [b.id]: parseInt(e.target.value),
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-black/15 text-xs font-semibold bg-white focus:outline-none focus:border-[#0C4A34]"
                    >
                      <option value="">Select Specialist</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (⭐ {t.rating || 5.0})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssign(b.id)}
                      disabled={!selectedTechs[b.id]}
                      className="btn-primary text-xs py-2 px-4 shadow-sm disabled:opacity-40"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
