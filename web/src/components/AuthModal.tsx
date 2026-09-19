"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";
import { X, Lock, Mail, Phone, User as UserIcon, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");
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

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(email.trim().toLowerCase(), password);
      if (res.token && res.user) {
        localStorage.setItem("siri_auth_token", res.token);
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Invalid email or password");
      }
    } catch {
      setError("Network or authentication failure");
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

      if (res.token && res.user) {
        localStorage.setItem("siri_auth_token", res.token);
        if (res.requires_verification) {
          setRequiresOtp(true);
          setMobileChallenge(res.mobile_challenge_id || "");
          setEmailChallenge(res.email_challenge_id || "");
        } else {
          onLoginSuccess(res.user);
          onClose();
        }
      } else {
        setError(res.error || "Registration failed");
      }
    } catch {
      setError("Registration error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mobileChallenge && mobileOtp) {
        await api.verifyOtp(mobileChallenge, mobileOtp);
      }
      if (emailChallenge && emailOtp) {
        await api.verifyOtp(emailChallenge, emailOtp);
      }
      // Reload or fetch current customer session
      const loginRes = await api.login(email.trim().toLowerCase(), password);
      if (loginRes.user) {
        onLoginSuccess(loginRes.user);
      }
      onClose();
    } catch {
      setError("OTP verification failed. Please check the codes entered.");
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
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {requiresOtp ? (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyOtps} className="space-y-4">
              <p className="text-xs text-[#525D6C] leading-relaxed">
                We sent verification codes to your mobile phone and email address. Please enter either code to verify.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Mobile SMS OTP (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#0C4A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Email Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="e.g. 654321"
                  className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#0C4A34]"
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Password
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
                className="btn-primary w-full text-xs py-3.5 mt-2 shadow-md"
              >
                {loading ? "Signing in..." : "Sign In to Account"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sunil Kumar"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Mobile Number (+91)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Choose Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2 shadow-md"
              >
                {loading ? "Creating Account..." : "Create Account & Get Verified"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
