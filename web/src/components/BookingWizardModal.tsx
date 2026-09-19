"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceVariant, CartItem, AvailableSlot, User } from "@/types";
import { api } from "@/lib/api";
import { X, Check, ArrowRight, ArrowLeft, Calendar, MapPin, Tag, Sparkles, AlertCircle } from "lucide-react";

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  cart: CartItem[];
  pricingConfig: { service_charge: number; gst_percentage: number };
  user: User | null;
  onBookingSuccess: (bookingId: string) => void;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  services,
  cart,
  pricingConfig,
  user,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [houseFlat, setHouseFlat] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("Banjara Hills");
  const [pincode, setPincode] = useState("500034");
  const [instructions, setInstructions] = useState("");

  // Step 4: Date & Slot
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [serviceDate, setServiceDate] = useState(tomorrow);
  const [serviceSlot, setServiceSlot] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 5: Coupon & Pricing
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);

  // Initialize customer contact if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  // Load available slots when serviceDate changes
  useEffect(() => {
    if (serviceDate) {
      setLoadingSlots(true);
      api.getSlots(serviceDate).then((fetchedSlots) => {
        setSlots(fetchedSlots);
        setLoadingSlots(false);
        const firstAvailable = fetchedSlots.find((s) => s.available);
        if (firstAvailable && !serviceSlot) {
          setServiceSlot(firstAvailable.slot);
        }
      });
    }
  }, [serviceDate]);

  if (!isOpen) return null;

  // Cart calculations
  const subtotal = cart.reduce((sum, it) => sum + it.variant.base_price * it.quantity, 0);
  const serviceCharge = cart.length > 0 ? pricingConfig.service_charge : 0;
  const taxable = Math.max(0, subtotal - couponDiscount + serviceCharge);
  const gst = Math.round(taxable * (pricingConfig.gst_percentage / 100));
  const total = Math.round(taxable + gst);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    try {
      const res = await api.validateCoupon(couponCode.trim().toUpperCase(), subtotal);
      if (res.valid) {
        setCouponDiscount(res.discount);
        setCouponApplied(true);
      } else {
        setCouponError(res.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon");
    }
  };

  const handleSubmitBooking = async () => {
    if (isSubmitting) return;
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        phone,
        email,
        service_date: serviceDate,
        service_slot: serviceSlot || (slots[0] ? slots[0].slot : "09:00 AM"),
        items: cart.map((it) => ({
          variant_id: it.variant.id,
          quantity: it.quantity,
        })),
        coupon_code: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        address: {
          house_flat: houseFlat,
          street: street,
          area: area,
          city: "Hyderabad",
          pincode: pincode,
          instructions: instructions,
        },
        notes: instructions,
      };

      const res = await api.createBooking(payload);
      if (res.success && res.booking_id) {
        setCompletedBookingId(res.booking_id);
        onBookingSuccess(res.booking_id);
      } else {
        setSubmitError(res.error || "Failed to schedule booking. Please try again.");
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Booking submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-black/10 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-[#FAF9F6] border-b border-black/8 p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-3 py-1 rounded-full border border-[#C2E2D3]">
              Step {step} of 5
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#121820] mt-1.5">
              {step === 1 && "Selected Cleaning Items"}
              {step === 2 && "Contact & Identification"}
              {step === 3 && "Doorstep Hyderabad Address"}
              {step === 4 && "Select Date & Inspection Slot"}
              {step === 5 && "Review & Confirm Appointment"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#8490A0] hover:text-[#121820] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F4F2EC] h-1.5">
          <div
            className="bg-[#0C4A34] h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {completedBookingId ? (
            /* Booking Confirmation Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0C4A34] mx-auto flex items-center justify-center text-3xl font-black">
                ✓
              </div>
              <h4 className="text-2xl font-black text-[#121820]">
                Cleaning Scheduled!
              </h4>
              <p className="text-xs sm:text-sm text-[#525D6C] max-w-md mx-auto leading-relaxed">
                Your technician dispatch has been created in our system. You will receive real-time updates and technician GPS tracking.
              </p>

              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-black/8 max-w-sm mx-auto text-left space-y-2 mt-4">
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-[#0C4A34]">{completedBookingId}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Date & Slot:</span>
                  <span className="font-bold text-[#121820]">{serviceDate} • {serviceSlot}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Total Amount:</span>
                  <span className="font-bold text-[#121820]">₹{total} (Pay post-clean)</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="btn-primary text-xs py-3 px-8"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Selected Items Review */}
              {step === 1 && (
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[#8490A0]">
                      No services selected yet. Please pick items from the catalog.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((it) => (
                        <div
                          key={it.variant.id}
                          className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-2xl border border-black/5"
                        >
                          <div>
                            <div className="font-bold text-sm text-[#121820]">
                              {it.variant.name}
                            </div>
                            <div className="text-xs text-[#8490A0]">
                              ₹{it.variant.base_price} × {it.quantity}
                            </div>
                          </div>
                          <div className="font-black text-sm text-[#0C4A34]">
                            ₹{it.variant.base_price * it.quantity}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-black/5 flex justify-between font-bold text-base">
                        <span>Items Subtotal:</span>
                        <span className="text-[#0C4A34]">₹{subtotal}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sunil Kumar"
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sunil@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Hyderabad Service Address */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        House / Flat No. *
                      </label>
                      <input
                        type="text"
                        value={houseFlat}
                        onChange={(e) => setHouseFlat(e.target.value)}
                        placeholder="e.g. Flat 402, Luxury Heights"
                        className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        Street / Landmark *
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="e.g. Road No. 12, Near Park"
                        className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        Hyderabad Locality / Area *
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34] bg-white"
                      >
                        <option value="Banjara Hills">Banjara Hills</option>
                        <option value="Jubilee Hills">Jubilee Hills</option>
                        <option value="Gachibowli">Gachibowli</option>
                        <option value="Hitec City">Hitec City</option>
                        <option value="Madhapur">Madhapur</option>
                        <option value="Kondapur">Kondapur</option>
                        <option value="Kukatpally">Kukatpally</option>
                        <option value="Begumpet">Begumpet</option>
                        <option value="Secunderabad">Secunderabad</option>
                        <option value="Somajiguda">Somajiguda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="500034"
                        className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Special Cleaning Instructions (Optional)
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Please focus on deep chocolate/coffee stain on right armrest"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Date & Slot Picker */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Select Service Date *
                    </label>
                    <input
                      type="date"
                      value={serviceDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Available Inspection Slots (Max 3 Bookings / Slot) *
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-6 text-xs text-[#8490A0]">
                        Checking real-time slot availability...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {slots.map((s, idx) => {
                          const isSelected = serviceSlot === s.slot;
                          return (
                            <div
                              key={idx}
                              onClick={() => s.available && setServiceSlot(s.slot)}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                !s.available
                                  ? "opacity-40 bg-gray-100 cursor-not-allowed border-gray-200"
                                  : isSelected
                                  ? "border-[#0C4A34] bg-[#EBF5F0] ring-1 ring-[#0C4A34]"
                                  : "border-black/10 bg-white hover:border-black/20"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#121820]">
                                  {s.slot}
                                </span>
                                {s.available ? (
                                  <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-xs">
                                    {s.remaining} left
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                    Full
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Review & Price Breakdown */}
              {step === 5 && (
                <div className="space-y-5">
                  {/* Coupon Code Input */}
                  <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-black/8">
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Have a Promo Code? (Try: FRESHSOFA)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON"
                        className="flex-1 px-3 py-2 rounded-xl border border-black/15 text-xs font-bold uppercase focus:outline-none focus:border-[#0C4A34]"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-[#121820] text-white text-xs font-bold rounded-xl hover:bg-black"
                      >
                        Apply
                      </button>
                    </div>
                    {couponApplied && (
                      <div className="text-[11px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Promo applied! You saved ₹{couponDiscount}</span>
                      </div>
                    )}
                    {couponError && (
                      <div className="text-[11px] font-bold text-red-600 mt-1.5">
                        {couponError}
                      </div>
                    )}
                  </div>

                  {/* Price Summary Breakdown */}
                  <div className="space-y-2 text-xs text-[#525D6C] border-t border-black/5 pt-3">
                    <div className="flex justify-between">
                      <span>Services Subtotal</span>
                      <span className="font-bold text-[#121820]">₹{subtotal}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Coupon Discount</span>
                        <span>-₹{couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Hospital-Grade Doorstep Service Charge</span>
                      <span className="font-bold text-[#121820]">₹{serviceCharge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18% Statutory Invoice)</span>
                      <span className="font-bold text-[#121820]">₹{gst}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-[#121820] border-t border-black/10 pt-3">
                      <span>Estimated Payable:</span>
                      <span className="text-[#0C4A34] font-display text-xl">₹{total}</span>
                    </div>
                  </div>

                  <div className="bg-[#EBF5F0] p-3.5 rounded-xl border border-[#C2E2D3] flex items-center gap-2 text-[11px] text-[#0C4A34] font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Zero prepayment required. Inspect your furniture and pay only after 100% satisfaction.</span>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        {!completedBookingId && (
          <div className="bg-[#FAF9F6] border-t border-black/8 px-6 sm:px-8 py-4 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary text-xs py-2 px-5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && cart.length === 0}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="btn-primary text-xs py-3 px-8 shadow-xl bg-emerald-700 hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <span>Scheduling Booking...</span>
                ) : (
                  <>
                    <span>Confirm & Schedule</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
