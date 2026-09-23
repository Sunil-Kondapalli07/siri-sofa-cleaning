"use client";

import React, { useEffect, useState } from "react";
import { Booking } from "@/types";
import { api } from "@/lib/api";
import { X, RefreshCw, Calendar, Clock, MapPin, PackageCheck } from "lucide-react";

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statuses = [
  ["received", "Order Received"],
  ["confirmed", "Confirmed"],
  ["assigned", "Technician Assigned"],
  ["cleaning_started", "Cleaning Started"],
  ["completed", "Completed"],
] as const;

function statusIndex(status: Booking["status"]) {
  if (status === "cancelled") return -1;
  return Math.max(0, statuses.findIndex(([value]) => value === status));
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCustomerBookings();
      setOrders(data);
    } catch {
      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadOrders();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-hidden shadow-2xl border border-black/10">
        <div className="p-6 border-b border-black/8 flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34]">Customer Account</div>
            <h3 className="text-2xl font-black text-[#121820] mt-1">My Orders</h3>
            <p className="text-xs text-[#525D6C] mt-1">Your current and previous cleaning bookings.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void loadOrders()} disabled={loading} className="p-2 rounded-full hover:bg-black/5 disabled:opacity-50" aria-label="Refresh orders">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[72vh]">
          {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 text-xs font-bold">{error}</div>}
          {loading && orders.length === 0 && <div className="py-12 text-center text-sm text-[#8490A0]">Loading your orders...</div>}
          {!loading && !error && orders.length === 0 && (
            <div className="py-14 text-center">
              <PackageCheck className="w-10 h-10 mx-auto text-[#0C4A34] mb-3" />
              <h4 className="font-black text-[#121820]">No orders yet</h4>
              <p className="text-xs text-[#8490A0] mt-1">Your completed and previous bookings will appear here automatically.</p>
            </div>
          )}

          <div className="space-y-4">
            {orders.map((order) => {
              const current = statusIndex(order.status);
              return (
                <article key={order.id} className="rounded-2xl border border-black/8 p-5 bg-[#FAF9F6]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs font-black text-[#0C4A34]">{order.id}</div>
                      <div className="text-sm font-black text-[#121820] mt-1">
                        {order.service_date} • {order.service_slot}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${order.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" : order.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                      {order.status === "cancelled" ? "Cancelled" : statuses.find(([v]) => v === order.status)?.[1] || order.status}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 mt-4 text-xs text-[#525D6C]">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0C4A34]" />{order.service_date}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#0C4A34]" />{order.service_slot}</div>
                    <div className="flex items-center gap-2"><span className="font-black text-[#0C4A34]">₹</span>{order.total_amount}</div>
                  </div>

                  {order.address && (
                    <div className="flex items-start gap-2 text-xs text-[#525D6C] mt-3 pt-3 border-t border-black/5">
                      <MapPin className="w-4 h-4 text-[#0C4A34] shrink-0" />
                      <span>{order.address.house_flat}, {order.address.street}, {order.address.area}, {order.address.city || "Hyderabad"} - {order.address.pincode}</span>
                    </div>
                  )}

                  {order.status !== "cancelled" && (
                    <div className="mt-5 pt-4 border-t border-black/5">
                      <div className="grid grid-cols-5 gap-1">
                        {statuses.map(([value, label], index) => {
                          const done = current >= index;
                          return (
                            <div key={value} className="text-center">
                              <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${done ? "bg-[#0C4A34] text-white" : "bg-black/10 text-[#8490A0]"}`}>
                                {done ? "✓" : index + 1}
                              </div>
                              <div className="text-[9px] font-bold text-[#525D6C] mt-1 leading-tight">{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {order.technician_name && (
                    <div className="mt-3 text-xs font-bold text-[#0C4A34]">
                      Technician: {order.technician_name}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
