"use client";

import React, { useState, useEffect } from "react";
import { Service, ServiceVariant, CartItem, AvailableSlot, User } from "@/types";
import { api } from "@/lib/api";
import { DEFAULT_SERVICES } from "@/lib/defaultData";
import { getSavedLocation, requestAndSaveCurrentLocation, SavedLocation } from "@/lib/location";
import { X, Check, ArrowRight, ArrowLeft, Sparkles, AlertCircle, Lock, Plus, Minus } from "lucide-react";

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  cart: CartItem[];
  pricingConfig: { service_charge: number; gst_percentage: number };
  user: User | null;
  onBookingSuccess: (bookingId: string) => void;
  onOpenAuth?: () => void;
  onOpenTrackingWithId?: (bookingId: string) => void;
  onUpdateQuantity?: (variant: ServiceVariant, newQty: number) => void;
}

function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  services,
  cart,
  pricingConfig,
  user,
  onBookingSuccess,
  onOpenAuth,
  onOpenTrackingWithId,
  onUpdateQuantity,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(() => user?.name || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [password, setPassword] = useState("");
  const [houseFlat, setHouseFlat] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("Banjara Hills");
  const [pincode, setPincode] = useState("500034");
  const [instructions, setInstructions] = useState("");

  // Validation errors (must be called unconditionally before early return)
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Step 4: Date & Slot
  const [serviceDate, setServiceDate] = useState<string>(getTomorrowDateString);
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");

  useEffect(() => {\n    if (typeof window === "undefined" || document.getElementById("razorpay-checkout-script")) return;\n    const script = document.createElement("script");\n    script.id = "razorpay-checkout-script";\n    script.src = "https://checkout.razorpay.com/v1/checkout.js";\n    script.async = true;\n    document.head.appendChild(script);\n  }, []);\n\n  const activeServices = (services && services.length > 0) ? services : DEFAULT_SERVICES;
  const [activeCatalogCategory, setActiveCatalogCategory] = useState<string>("sofa");
  const [showCatalogPicker, setShowCatalogPicker] = useState<boolean>(true);

  const handleQuantityChange = (variant: ServiceVariant, newQty: number) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(variant, newQty);
    }
  };

  const getVariantQuantity = (variantId: number) => {
    const item = cart.find((i) => i.variant.id === variantId);
    return item ? item.quantity : 0;
  };

  // Restore the last saved service location and request a fresh browser location after sign-in.
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    let cancelled = false;
    const saved = getSavedLocation();
    if (saved) {
      queueMicrotask(() => {
        if (cancelled) return;
        setLocationCaptured(true);
        if (saved.house_flat) setHouseFlat(saved.house_flat);
        if (saved.street) setStreet(saved.street);
        if (saved.area) setArea(saved.area);
        if (saved.pincode) setPincode(saved.pincode);
      });
    }
    queueMicrotask(() => {
      if (!cancelled) setLocationMessage("Allow location access so we can pre-fill your service address. You can change it anytime.");
    });
    return () => { cancelled = true; };
  }, [user]);

  // Synchronize customer contact if logged-in user changes
  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setName((prev) => prev || user.name || "");
        setPhone((prev) => prev || user.phone || "");
        setEmail((prev) => prev || user.email || "");
      });
    }
  }, [user]);

  // Every new booking starts with a clean wizard state. The modal stays mounted
  // in the page, so closing it must explicitly clear the previous success screen.
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setCompletedBookingId(null);
    setIsSubmitting(false);
    setSubmitError("");
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
    setCouponApplied(false);
    setPaymentMethod("cod");
    setServiceDate(getTomorrowDateString());
    setServiceSlot("");
  }, [isOpen]);

  // Load available slots when serviceDate changes
  useEffect(() => {
    if (!serviceDate) return;
    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) setLoadingSlots(true);
    });

    api.getSlots(serviceDate).then((fetchedSlots) => {
      if (!isCurrent) return;
      setSlots(fetchedSlots);
      setLoadingSlots(false);
      const firstAvailable = fetchedSlots.find((s) => s.available);
      if (firstAvailable) {
        setServiceSlot((prev) => {
          if (!prev || !fetchedSlots.find((s) => s.slot === prev && s.available)) {
            return firstAvailable.slot;
          }
          return prev;
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [serviceDate]);

  if (!isOpen) return null;

  // Cart calculations with robust numeric fallback
  const subtotal = Math.round(cart.reduce((sum, it) => sum + (Number(it.variant.base_price) || 0) * it.quantity, 0));
  const serviceCharge = cart.length > 0 ? (Number(pricingConfig?.service_charge) || 49) : 0;
  const gstRate = Number(pricingConfig?.gst_percentage) || 18;
  const taxable = Math.max(0, subtotal - couponDiscount + serviceCharge);
  const gst = Math.round(taxable * (gstRate / 100));
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
        setCouponError(res.error || "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon");
    }
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Please enter your full name.";
    } else if (name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    }

    const cleanPhone = phone.replace(/\+91|\s|-/g, "");
    if (!cleanPhone) {
      errs.phone = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = "Please enter a valid 10-digit Indian mobile number (e.g. 98480 99887).";
    }

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (password && password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep2Continue = async () => {
    setSubmitError("");
    if (!validateStep2()) return;

    // If not logged in but provided password, attempt instant registration or login
    if (!user && password.length >= 6 && email && name && phone) {
      try {
        const cleanPhone = phone.replace(/\+91|\s|-/g, "");
        const regRes = await api.register({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          password,
        });
        if (regRes.error && regRes.error.toLowerCase().includes("already exists")) {
          setContactErrors({
            email: "An account already exists with this email or mobile. Please sign in to link your booking.",
          });
          return;
        }
      } catch {}
    }
    setStep(3);
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!houseFlat.trim()) {
      errs.houseFlat = "House / Flat number is required.";
    } else if (houseFlat.trim().length < 2) {
      errs.houseFlat = "Please enter complete house/flat details.";
    }

    if (!street.trim()) {
      errs.street = "Street / Landmark is required.";
    } else if (street.trim().length < 3) {
      errs.street = "Please enter valid street or landmark.";
    }

    const cleanPin = pincode.trim();
    if (!cleanPin) {
      errs.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errs.pincode = "Pincode must be exactly 6 digits (e.g. 500034).";
    }

    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationMessage("Requesting your current location...");
    try {
      const saved: SavedLocation | null = await requestAndSaveCurrentLocation();
      if (!saved) throw new Error("Location is not available in this browser.");
      if (saved.house_flat) setHouseFlat(saved.house_flat);
      if (saved.street) setStreet(saved.street);
      if (saved.area) setArea(saved.area);
      if (saved.pincode) setPincode(saved.pincode);
      setLocationCaptured(true);
      setLocationMessage("Location captured. Review the address below and change anything that is incorrect.");
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : "Location permission was denied or unavailable. You can enter the address manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleStep3Continue = () => {
    if (!validateStep3()) return;
    setStep(4);
  };


  const handleSubmitBooking = async () => {
    if (isSubmitting) return;

    const token = localStorage.getItem("siri_auth_token") || localStorage.getItem("siri_token");
    if (!token && !user) {
      setSubmitError("Please sign in or create an account to schedule your appointment.");
      onOpenAuth?.();
      return;
    }
    if (!serviceDate || !serviceSlot || cart.length === 0) {
      setSubmitError("Please complete the service, date and time details.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.replace(/\+91|\s|-/g, ""),
        email: email.trim().toLowerCase(),
        service_date: serviceDate,
        service_slot: serviceSlot,
        items: cart.map((it) => ({ variant_id: it.variant.id, quantity: it.quantity })),
        coupon_code: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        address: (() => {
          const saved = getSavedLocation();
          return {
            house_flat: houseFlat.trim(),
            street: street.trim(),
            area,
            city: "Hyderabad",
            pincode: pincode.trim(),
            instructions,
            ...(saved ? { latitude: saved.latitude, longitude: saved.longitude } : {}),
          };
        })(),
        notes: instructions,
        payment_method: paymentMethod,
      };

      const res = await api.createBooking(payload);
      if (!res.success || !res.booking_id) {
        throw new Error(res.error || "Unable to create booking.");
      }

      const bookingId = String(res.booking_id);

      if (paymentMethod === "razorpay") {
        const order = await api.createRazorpayOrder(bookingId);
        if (!order?.success || !order?.order_id) {
          throw new Error(order?.error || "Unable to start Razorpay payment. Please try Cash on Delivery.");
        }

        const RazorpayCtor = (window as any).Razorpay;
        if (!RazorpayCtor) {
          throw new Error("Razorpay checkout is not loaded. Please refresh the page or use Cash on Delivery.");
        }

        await new Promise<void>((resolve, reject) => {
          const checkout = new RazorpayCtor({
            key: order.key_id,
            amount: order.amount,
            currency: order.currency || "INR",
            name: "Siri Sofa Services",
            description: "Sofa & upholstery cleaning",
            order_id: order.order_id,
            prefill: { name: name.trim(), email: email.trim(), contact: phone.replace(/\+91|\s|-/g, "") },
            theme: { color: "#0C4A34" },
            handler: async (response: any) => {
              try {
                const verified = await api.verifyRazorpayPayment({
                  booking_id: bookingId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (!verified?.success) throw new Error(verified?.error || "Payment verification failed.");
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled. Your booking remains pending payment.")) },
          });
          checkout.open();
        });
      }

      setCompletedBookingId(bookingId);
      onBookingSuccess(bookingId);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Booking submission failed.");
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0C4A34] mx-auto flex items-center justify-center text-3xl font-black shadow-inner">
                ✓
              </div>
              <h4 className="text-2xl font-black text-[#121820]">
                Cleaning Scheduled!
              </h4>
              <p className="text-xs sm:text-sm text-[#525D6C] max-w-md mx-auto leading-relaxed">
                Your appointment has been registered in our Hyderabad dispatch queue. You will receive real-time updates and technician route tracking.
              </p>

              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-black/8 max-w-md mx-auto text-left space-y-2.5 mt-4">
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-black text-[#0C4A34] text-sm">{completedBookingId}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Date & Slot:</span>
                  <span className="font-bold text-[#121820]">{serviceDate} • {serviceSlot}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#525D6C]">
                  <span>Service Address:</span>
                  <span className="font-bold text-[#121820] text-right">{houseFlat}, {area}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-[#525D6C] pt-2 border-t border-black/8">
                  <span>Total Amount (Pay After Inspection):</span>
                  <span className="font-black text-base text-[#0C4A34]">₹{total}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                {onOpenTrackingWithId && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTrackingWithId(completedBookingId);
                    }}
                    className="btn-secondary text-xs py-3 px-6"
                  >
                    Track Appointment
                  </button>
                )}
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
              {/* Step 1: Selected Items & Catalog Customization */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Selected Items summary if cart has items */}
                  {cart.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-[#0C4A34]">
                          Your Selected Services ({cart.reduce((s, i) => s + i.quantity, 0)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                          className="text-xs font-bold text-[#0C4A34] hover:underline flex items-center gap-1"
                        >
                          {showCatalogPicker ? "Hide Catalog" : "+ Add More Services"}
                        </button>
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {cart.map((it) => (
                          <div
                            key={it.variant.id}
                            className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-2xl border border-black/5"
                          >
                            <div>
                              <div className="font-bold text-sm text-[#121820]">
                                {it.variant.name}
                              </div>
                              <div className="text-xs text-[#8490A0]">
                                ₹{it.variant.base_price} / {it.variant.unit_type}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-white border border-black/10 rounded-xl p-1 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(it.variant, it.quantity - 1)}
                                  className="w-6 h-6 rounded-lg bg-[#FAF9F6] hover:bg-black/5 text-[#121820] flex items-center justify-center font-bold text-xs transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-extrabold text-xs text-[#121820]">
                                  {it.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(it.variant, it.quantity + 1)}
                                  className="w-6 h-6 rounded-lg bg-[#0C4A34] hover:bg-[#083324] text-white flex items-center justify-center font-bold text-xs transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="font-black text-sm text-[#0C4A34] min-w-[55px] text-right">
                                ₹{it.variant.base_price * it.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-black/8 pt-3 flex justify-between text-sm font-bold text-[#121820]">
                        <span>Subtotal:</span>
                        <span className="text-[#0C4A34] font-black text-base">₹{subtotal}</span>
                      </div>
                    </div>
                  )}

                  {/* Interactive In-Modal Catalog Picker */}
                  {(cart.length === 0 || showCatalogPicker) && (
                    <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-black/8 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-sm text-[#121820]">
                            {cart.length === 0 ? "Select Doorstep Services" : "Add From Catalog"}
                          </h4>
                          <p className="text-[11px] text-[#525D6C]">
                            Pick the seating & upholstery items you want cleaned
                          </p>
                        </div>
                        {cart.length === 0 && (
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-lg">
                            Pick at least 1 item
                          </span>
                        )}
                      </div>

                      {/* Category Tabs */}
                      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-black/5 overflow-x-auto">
                        {activeServices.map((svc) => (
                          <button
                            key={svc.slug}
                            type="button"
                            onClick={() => setActiveCatalogCategory(svc.slug)}
                            className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                              activeCatalogCategory === svc.slug
                                ? "bg-[#0C4A34] text-white shadow-xs"
                                : "text-[#525D6C] hover:text-[#121820] hover:bg-black/5"
                            }`}
                          >
                            {svc.slug === "sofa" ? "🛋️ Sofa" :
                             svc.slug === "chair" ? "🪑 Chair" :
                             svc.slug === "mattress" ? "🛏️ Mattress" :
                             svc.slug === "carpet" ? "🧶 Carpet" : svc.title}
                          </button>
                        ))}
                      </div>

                      {/* Variants List */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {activeServices
                          .find((s) => s.slug === activeCatalogCategory)
                          ?.variants.map((v) => {
                            const qty = getVariantQuantity(v.id);
                            return (
                              <div
                                key={v.id}
                                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-black/5 hover:border-black/10 transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-xs text-[#121820]">{v.name}</div>
                                  <div className="text-[11px] text-[#8490A0]">
                                    ₹{v.base_price} • {v.estimated_minutes} mins
                                  </div>
                                </div>

                                {qty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(v, 1)}
                                    className="px-3 py-1 bg-[#0C4A34] hover:bg-[#083324] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1 bg-[#FAF9F6] border border-black/10 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(v, qty - 1)}
                                      className="w-5 h-5 rounded bg-white hover:bg-black/5 text-[#121820] flex items-center justify-center font-bold text-xs"
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>
                                    <span className="w-5 text-center font-bold text-xs text-[#0C4A34]">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(v, qty + 1)}
                                      className="w-5 h-5 rounded bg-[#0C4A34] text-white flex items-center justify-center font-bold text-xs"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact & Identification */}
              {step === 2 && (
                <div className="space-y-4">
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-left mb-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        <span className="text-emerald-950 font-bold">
                          Authenticated as: <strong>{user.name}</strong> ({user.phone || user.email})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-600 font-medium">Already have an account?</span>
                      {onOpenAuth && (
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="px-3 py-1 rounded-lg bg-[#0C4A34] text-white text-xs font-bold hover:bg-[#083324] transition-all"
                        >
                          Sign In Here
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (contactErrors.name) setContactErrors(prev => ({ ...prev, name: "" }));
                      }}
                      placeholder="e.g. Ramesh Reddy"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                        contactErrors.name ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                      }`}
                      required
                    />
                    {contactErrors.name && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{contactErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (contactErrors.phone) setContactErrors(prev => ({ ...prev, phone: "" }));
                      }}
                      placeholder="e.g. 98480 99887"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                        contactErrors.phone ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                      }`}
                      required
                    />
                    {contactErrors.phone && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{contactErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (contactErrors.email) setContactErrors(prev => ({ ...prev, email: "" }));
                      }}
                      placeholder="e.g. ramesh@example.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                        contactErrors.email ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                      }`}
                      required
                    />
                    {contactErrors.email && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{contactErrors.email}</p>
                    )}
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        Create Password (min 6 chars) <span className="text-[#8490A0] font-normal">(optional — secures your booking)</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (contactErrors.password) setContactErrors(prev => ({ ...prev, password: "" }));
                        }}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                          contactErrors.password ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                        }`}
                      />
                      {contactErrors.password && (
                        <p className="text-[11px] text-red-600 font-medium mt-1">{contactErrors.password}</p>
                      )}
                    </div>
                  )}
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
                        onChange={(e) => {
                          setHouseFlat(e.target.value);
                          if (addressErrors.houseFlat) setAddressErrors(prev => ({ ...prev, houseFlat: "" }));
                        }}
                        placeholder="e.g. Flat 402, Luxury Heights"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                          addressErrors.houseFlat ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                        }`}
                        required
                      />
                      {addressErrors.houseFlat && (
                        <p className="text-[11px] text-red-600 font-medium mt-1">{addressErrors.houseFlat}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#121820] mb-1.5">
                        Street / Landmark *
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => {
                          setStreet(e.target.value);
                          if (addressErrors.street) setAddressErrors(prev => ({ ...prev, street: "" }));
                        }}
                        placeholder="e.g. Road No. 12, Near Park"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                          addressErrors.street ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                        }`}
                        required
                      />
                      {addressErrors.street && (
                        <p className="text-[11px] text-red-600 font-medium mt-1">{addressErrors.street}</p>
                      )}
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
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => {
                          setPincode(e.target.value);
                          if (addressErrors.pincode) setAddressErrors(prev => ({ ...prev, pincode: "" }));
                        }}
                        placeholder="500034"
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                          addressErrors.pincode ? "border-red-400 bg-red-50/20 focus:border-red-500" : "border-black/15 focus:border-[#0C4A34]"
                        }`}
                        required
                      />
                      {addressErrors.pincode && (
                        <p className="text-[11px] text-red-600 font-medium mt-1">{addressErrors.pincode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Special Instructions for Technician (Optional)
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={2}
                      placeholder="e.g. Please call before reaching; pet at home."
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Date & Slot Selection */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-1.5">
                      Service Date (Next 7 Days) *
                    </label>
                    <input
                      type="date"
                      value={serviceDate}
                      min={getTomorrowDateString()}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121820] mb-2">
                      Available Inspection Slots for {serviceDate} (Max 3 Homes/Slot) *
                    </label>

                    {loadingSlots ? (
                      <div className="text-center py-6 text-xs text-[#8490A0]">
                        Checking real-time technician availability...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {slots.map((s) => {
                          const isSelected = serviceSlot === s.slot;
                          return (
                            <div
                              key={s.slot}
                              onClick={() => s.available && setServiceSlot(s.slot)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
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
                  {/* Auth Verification Banner on Review Step */}
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-left">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 font-bold" />
                        <span className="text-emerald-950 font-bold">
                          Authenticated as: <strong>{user.name}</strong> ({user.phone || user.email})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                        Ready to Schedule
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Sign In Required to Complete Booking</span>
                      </div>
                      <p className="text-xs text-amber-800/90 leading-relaxed">
                        To dispatch your verified specialist and enable live tracking, please sign in or create your account.
                      </p>
                      {onOpenAuth && (
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={onOpenAuth}
                            className="px-4 py-2 rounded-xl bg-[#0C4A34] text-white font-bold text-xs hover:bg-[#083324] transition-all shadow-sm"
                          >
                            Sign In / Create Account (30-Sec)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Payment Method */}
                  <div className="bg-white p-4 rounded-2xl border border-black/10 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-[#121820]">Payment Method</h4>
                      <p className="text-[11px] text-[#525D6C] mt-0.5">Choose how you want to pay for this booking.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${paymentMethod === "cod" ? "border-[#0C4A34] bg-[#EBF5F0]" : "border-black/10 bg-white hover:border-black/20"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-[#0C4A34]" : "border-gray-400"}`}>
                            {paymentMethod === "cod" && <span className="w-2 h-2 rounded-full bg-[#0C4A34]" />}
                          </span>
                          <span className="font-black text-sm text-[#121820]">Cash on Delivery</span>
                        </div>
                        <p className="text-[10px] text-[#525D6C] mt-1.5 ml-6">Pay after the cleaning/service is completed.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("razorpay")}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${paymentMethod === "razorpay" ? "border-[#0C4A34] bg-[#EBF5F0]" : "border-black/10 bg-white hover:border-black/20"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-[#0C4A34]" : "border-gray-400"}`}>
                            {paymentMethod === "razorpay" && <span className="w-2 h-2 rounded-full bg-[#0C4A34]" />}
                          </span>
                          <span className="font-black text-sm text-[#121820]">Online Payment</span>
                        </div>
                        <p className="text-[10px] text-[#525D6C] mt-1.5 ml-6">Razorpay: UPI, cards and net banking when configured.</p>
                      </button>
                    </div>
                    {paymentMethod === "cod" && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900">
                        ✓ Cash on Delivery selected. Your booking will be confirmed without requiring payment now.
                      </div>
                    )}
                    {paymentMethod === "razorpay" && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-900">
                        Online payment will open securely after your booking is created. If Razorpay is not configured, you can switch back to Cash on Delivery.
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
                      <span>Doorstep Sanitization & Service Charge</span>
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
                    <span>{paymentMethod === "cod" ? "Cash on Delivery selected — no online payment is required to confirm this booking." : "Online payment selected — you will be redirected to the secure Razorpay checkout."}</span>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
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

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={cart.length === 0}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleStep2Continue}
                disabled={!name || !phone || !email}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-40"
              >
                <span>Continue to Address</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleStep3Continue}
                className="btn-primary text-xs py-2.5 px-6"
              >
                <span>Continue to Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={() => setStep(5)}
                disabled={!serviceDate || !serviceSlot}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-40"
              >
                <span>Review Appointment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 5 && (
              user ? (
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
              ) : (
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="btn-primary text-xs py-3 px-8 shadow-xl bg-[#0C4A34] hover:bg-[#083324] flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Confirm Booking</span>
                </button>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
};
