"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";
import { X, Lock, Mail, Phone, User as UserIcon, ShieldCheck, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialTab?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = "login",
}) => {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Challenge Verification state
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [mobileChallenge, setMobileChallenge] = useState("");
  const [emailChallenge, setEmailChallenge] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      if (res.token && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Invalid email, mobile number, or password");
      }
    } catch {
      setError("Network or authentication failure. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (res.token && res.user) {
        if (res.requires_verification) {
          setRequiresOtp(true);
          setMobileChallenge(res.mobile_challenge_id || "");
          setEmailChallenge(res.email_challenge_id || "");
          const hint = res.dev_mobile_otp || res.dev_email_otp || res.dev_otp_hint;
          if (hint) {
            setDevOtpHint(hint);
            setMobileOtp(res.dev_mobile_otp || hint);
            setEmailOtp(res.dev_email_otp || hint);
          }
        } else {
          onLoginSuccess(res.user);
          onClose();
        }
      } else {
        setError(res.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Registration network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const code = (mobileOtp || emailOtp).trim();
      if (!code) {
        setError("Please enter the 6-digit verification code");
        setLoading(false);
        return;
      }

      let res: { success?: boolean; error?: string } | null = null;
      if (mobileChallenge && mobileOtp.trim()) {
        res = await api.verifyOtp(mobileChallenge, mobileOtp.trim());
      }
      if ((!res || res.error) && emailChallenge && emailOtp.trim()) {
        res = await api.verifyOtp(emailChallenge, emailOtp.trim());
      }
      if (!res) {
        const challenge = mobileChallenge || emailChallenge;
        res = await api.verifyOtp(challenge, code);
      }

      if (!res || res.error) {
        setError(res?.error || "OTP verification failed");
        setLoading(false);
        return;
      }

      // Automatically sign in after verification
      const loginRes = await api.login(email.trim(), password);
      if (loginRes.user) {
        onLoginSuccess(loginRes.user);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-[#FAF9F6] border-b border-black/8 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-bold text-sm">
              🛋️
            </div>
            <h3 className="text-lg font-black text-[#121820]">
              {requiresOtp ? "Verify Account" : tab === "login" ? "Welcome Back" : "Create Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#8490A0] hover:text-[#121820]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if not in OTP step */}
        {!requiresOtp && (
          <div className="flex border-b border-black/8">
            <button
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition-all ${
                tab === "login"
                  ? "border-[#0C4A34] text-[#0C4A34]"
                  : "border-transparent text-[#8490A0] hover:text-[#121820]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                setError("");
              }}
              className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition-all ${
                tab === "register"
                  ? "border-[#0C4A34] text-[#0C4A34]"
                  : "border-transparent text-[#8490A0] hover:text-[#121820]"
              }`}
            >
              New Customer Registration
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {requiresOtp ? (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOtps} className="space-y-4">
              <p className="text-xs text-[#525D6C] leading-relaxed">
                We sent verification codes to your mobile phone and email. Please enter either code below to activate your account.
              </p>

              {devOtpHint && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Demo Code: <strong className="font-mono text-sm tracking-wider">{devOtpHint}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOtp(devOtpHint);
                      setEmailOtp(devOtpHint);
                    }}
                    className="px-2.5 py-1 bg-[#0C4A34] text-white rounded-lg text-[10px] font-bold"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={mobileOtp || emailOtp}
                  onChange={(e) => {
                    setMobileOtp(e.target.value);
                    setEmailOtp(e.target.value);
                  }}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 rounded-xl border border-black/15 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-[#0C4A34]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Verifying..." : "Complete Verification & Sign In"}
              </button>
            </form>
          ) : tab === "login" ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Email Address or Mobile Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com or 9876543210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Signing In..." : "Sign In to Account"}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#8490A0]">Don&apos;t have an account yet?</span>
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setError("");
                  }}
                  className="text-xs font-bold text-[#0C4A34] hover:underline ml-1"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Mobile Number (+91) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98480 99887"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Create Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div className="text-[11px] text-[#8490A0] leading-relaxed">
                By creating an account, you agree to our 100% Doorstep Hygiene Guarantee in Hyderabad.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Creating Account..." : "Create Verified Account"}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#8490A0]">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                  }}
                  className="text-xs font-bold text-[#0C4A34] hover:underline ml-1"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-[#FAF9F6] border-t border-black/8 px-6 py-4 flex items-center justify-center gap-2 text-xs text-[#525D6C]">
          <ShieldCheck className="w-4 h-4 text-[#0C4A34]" />
          <span>Verified Hyderabad Doorstep Care • Zero Data Sharing</span>
        </div>

      </div>
    </div>
  );
};
