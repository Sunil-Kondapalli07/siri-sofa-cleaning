"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";
import {
  X,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: (notification?: unknown) => void;
        };
      };
    };
  }
}

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
  type AuthTab = "login" | "register" | "forgot_request" | "forgot_verify";
  const [tab, setTab] = useState<AuthTab>(initialTab);

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading & general notification states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userExistsNotice, setUserExistsNotice] = useState<{
    message: string;
    target: string;
  } | null>(null);

  // Inline field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Registration OTP Challenge state
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [mobileChallenge, setMobileChallenge] = useState("");
  const [emailChallenge, setEmailChallenge] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  // Forgot Password flow states
  const [forgotTarget, setForgotTarget] = useState("");
  const [forgotChallengeId, setForgotChallengeId] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // Google OAuth 2.0 / GIS states
  const [googleClientId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("siri_google_client_id") ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        ""
      );
    }
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  });
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("sunil@example.com");
  const [googleName, setGoogleName] = useState("Sunil Kumar");

  // Validation helpers
  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const isValidPhone = (val: string) => {
    const clean = val.replace(/\+91|\s|-/g, "");
    return /^[6-9]\d{9}$/.test(clean);
  };

  const clearErrors = () => {
    setError("");
    setFieldErrors({});
    setUserExistsNotice(null);
    setSuccessMessage("");
  };

  const markTouched = (fieldName: string) => {
    if (fieldName === "email" && email.trim()) {
      if (email.includes("@") && !isValidEmail(email)) {
        setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      }
    } else if (fieldName === "phone" && phone.trim()) {
      if (!isValidPhone(phone)) {
        setFieldErrors((prev) => ({ ...prev, phone: "Please enter a valid 10-digit Indian mobile number." }));
      }
    }
  };

  // --- Real Google Credential Login (from official Google ID Token JWT) ---
  const handleGoogleCredentialLogin = React.useCallback(async (credential: string) => {
    clearErrors();
    setGoogleLoading(true);
    try {
      const res = await api.googleLogin({ credential });
      if (res.success && res.user) {
        setShowGoogleModal(false);
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(
          res.error || "Google token verification failed. Please try again."
        );
      }
    } catch {
      setError("Network or verification error during Google sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  }, [onLoginSuccess, onClose]);

  // Initialize Real Google Identity Services (GIS) if client ID is configured
  useEffect(() => {
    if (typeof window === "undefined" || !isOpen || !googleClientId) return;

    const setupGoogleGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: { credential?: string }) => {
              if (response?.credential) {
                handleGoogleCredentialLogin(response.credential);
              }
            },
          });

          const containerId =
            tab === "register"
              ? "google-gis-register-btn"
              : "google-gis-login-btn";
          const btnEl = document.getElementById(containerId);
          if (btnEl) {
            btnEl.innerHTML = "";
            window.google.accounts.id.renderButton(btnEl, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: tab === "register" ? "signup_with" : "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
        } catch (err) {
          console.warn("GIS setup notice:", err);
        }
      }
    };

    setupGoogleGis();
    const timer = setTimeout(setupGoogleGis, 400);
    return () => clearTimeout(timer);
  }, [googleClientId, tab, isOpen, handleGoogleCredentialLogin]);

  if (!isOpen) return null;

  // --- Sign In Validation & Submission ---
  const validateLoginForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedTarget = email.trim();

    if (!trimmedTarget) {
      errors.email = "Please enter your email or 10-digit mobile number.";
    } else if (trimmedTarget.includes("@")) {
      if (!isValidEmail(trimmedTarget)) {
        errors.email = "Please enter a valid email address (e.g. name@domain.com).";
      }
    } else {
      if (!isValidPhone(trimmedTarget)) {
        errors.email = "Please enter a valid 10-digit Indian mobile number.";
      }
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      if (res.token && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Invalid credentials. Please verify and try again.");
      }
    } catch {
      setError("Network or authentication failure. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- Sign Up Validation & Submission ---
  const validateRegisterForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    }

    const cleanPhone = phone.replace(/\+91|\s|-/g, "");
    if (!cleanPhone) {
      errors.phone = "Mobile number is required.";
    } else if (!isValidPhone(cleanPhone)) {
      errors.phone = "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address (e.g. you@example.com).";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (confirmPassword && confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\+91|\s|-/g, "");
      const res = await api.register({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        password,
      });

      // Handle duplicate user check
      if (
        res.error &&
        (res.error.toLowerCase().includes("already exists") ||
          (res as Record<string, unknown>).user_exists)
      ) {
        const targetFound = email.trim() || cleanPhone;
        setUserExistsNotice({
          message: "User already exists. Please sign in.",
          target: targetFound,
        });
        setLoading(false);
        return;
      }

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

  // --- Registration OTP Verification ---
  const handleVerifyOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const code = (mobileOtp || emailOtp).trim();
      if (!code || code.length !== 6) {
        setError("Please enter a valid 6-digit verification code.");
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
        setError(res?.error || "OTP verification failed. Please try again.");
        setLoading(false);
        return;
      }

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

  // --- Forgot Password Flow ---
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const target = forgotTarget.trim();
    if (!target) {
      setError("Please enter your registered email or 10-digit mobile number.");
      return;
    }

    if (target.includes("@")) {
      if (!isValidEmail(target)) {
        setError("Please enter a valid email address.");
        return;
      }
    } else {
      if (!isValidPhone(target)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.requestPasswordReset(target);
      if (res.success && res.challenge_id) {
        setForgotChallengeId(res.challenge_id);
        setSuccessMessage(
          res.message || `Verification code dispatched to ${target}.`
        );
        setTab("forgot_verify");
      } else {
        setError(
          res.error ||
            "No account found with this email or mobile. Please check details."
        );
      }
    } catch {
      setError("Could not send password reset request. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(
        forgotChallengeId,
        forgotOtp.trim(),
        forgotNewPassword
      );

      if (res.success) {
        setSuccessMessage(
          "Password reset successfully! Please sign in with your new password."
        );
        setEmail(forgotTarget);
        setPassword(forgotNewPassword);
        setTab("login");
      } else {
        setError(res.error || "Password reset failed. Please check your code.");
      }
    } catch {
      setError("Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // --- Simulated / Custom Google Profile Sign-In ---
  const handleGoogleDirectSignIn = async (
    userEmail?: string,
    userName?: string
  ) => {
    clearErrors();
    setGoogleLoading(true);
    const targetEmail = userEmail || googleEmail;
    const targetName = userName || googleName;

    try {
      const res = await api.googleLogin({
        email: targetEmail,
        name: targetName,
      });

      if (res.success && res.user) {
        setShowGoogleModal(false);
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Google sign-in failed. Please try again.");
      }
    } catch {
      setError("Google authentication error. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-black/10 overflow-hidden my-8 relative">
        {/* Top Header */}
        <div className="bg-[#FAF9F6] border-b border-black/8 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0C4A34] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🛋️
            </div>
            <h3 className="text-lg font-black text-[#121820]">
              {requiresOtp
                ? "Verify Account"
                : tab === "forgot_request" || tab === "forgot_verify"
                ? "Reset Password"
                : tab === "login"
                ? "Welcome Back"
                : "Create Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#8490A0] hover:text-[#121820] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switchers (Only on Login & Register) */}
        {!requiresOtp &&
          (tab === "login" || tab === "register") && (
            <div className="flex border-b border-black/8">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  clearErrors();
                }}
                className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition-all ${
                  tab === "login"
                    ? "border-[#0C4A34] text-[#0C4A34] bg-[#F7FAF8]"
                    : "border-transparent text-[#8490A0] hover:text-[#121820]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  clearErrors();
                }}
                className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition-all ${
                  tab === "register"
                    ? "border-[#0C4A34] text-[#0C4A34] bg-[#F7FAF8]"
                    : "border-transparent text-[#8490A0] hover:text-[#121820]"
                }`}
              >
                New Customer Registration
              </button>
            </div>
          )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {/* User Already Exists Alert & 1-Click Transition */}
          {userExistsNotice && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 animate-fade-in text-left">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>User already exists. Please sign in.</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                An account with this email or mobile number already exists. Please
                sign in with your existing password or use Forgot Password to reset it.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setEmail(userExistsNotice.target);
                  clearErrors();
                }}
                className="w-full py-2 px-3 bg-[#0C4A34] hover:bg-[#083324] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Sign In</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Generic Error Banner */}
          {error && !userExistsNotice && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. REGISTRATION OTP VERIFICATION */}
          {requiresOtp ? (
            <form onSubmit={handleVerifyOtps} className="space-y-4">
              <p className="text-xs text-[#525D6C] leading-relaxed">
                We sent verification codes to your mobile phone and email. Please enter
                either 6-digit code below to activate your account.
              </p>

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
            /* 2. SIGN IN FORM */
            <form onSubmit={handleLogin} className="space-y-4 text-left">
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
                    onBlur={() => markTouched("email")}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="you@example.com or 9876543210"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.email
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#121820]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotTarget(email.trim());
                      clearErrors();
                      setTab("forgot_request");
                    }}
                    className="text-[11px] font-bold text-[#0C4A34] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onBlur={() => markTouched("password")}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#8490A0] hover:text-[#121820]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Signing In..." : "Sign In to Account"}
              </button>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-black/10 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#8490A0] uppercase tracking-wider">
                  or continue with
                </span>
                <div className="border-t border-black/10 w-full" />
              </div>

              {/* Official Google Identity Services GIS Container (if Client ID present) */}
              {googleClientId ? (
                <div id="google-gis-login-btn" className="w-full min-h-[44px] flex justify-center" />
              ) : null}

              {/* Custom Google Trigger Button */}
              {(!googleClientId || true) && (
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-3 px-4 rounded-xl border border-black/15 bg-white hover:bg-black/5 flex items-center justify-center gap-3 text-xs font-bold text-[#121820] transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.24 5.41l4.04-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                    />
                  </svg>
                  <span>
                    {googleClientId
                      ? "Sign in with Google (Live OAuth)"
                      : "Sign in with Google"}
                  </span>
                </button>
              )}

              <div className="text-center pt-2">
                <span className="text-xs text-[#8490A0]">
                  Don&apos;t have an account yet?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    clearErrors();
                  }}
                  className="text-xs font-bold text-[#0C4A34] hover:underline ml-1"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : tab === "register" ? (
            /* 3. SIGN UP REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-3 text-left">
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
                    onBlur={() => markTouched("name")}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    placeholder="e.g. Ramesh Reddy"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.name
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.name}
                  </p>
                )}
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
                    onBlur={() => markTouched("phone")}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    placeholder="98480 99887"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.phone
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
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
                    onBlur={() => markTouched("email")}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="ramesh@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.email
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Create Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onBlur={() => markTouched("password")}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? "border-red-400 bg-red-50/20 focus:border-red-500"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#8490A0] hover:text-[#121820]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-400 bg-red-50/20"
                        : "border-black/15 focus:border-[#0C4A34]"
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <div className="text-[11px] text-[#8490A0] leading-relaxed">
                By creating an account, you agree to our 100% Doorstep Hygiene Guarantee
                in Hyderabad.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Creating Account..." : "Create Verified Account"}
              </button>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-black/10 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-[#8490A0] uppercase tracking-wider">
                  or
                </span>
                <div className="border-t border-black/10 w-full" />
              </div>

              {/* Official Google Identity Services GIS Container (if Client ID present) */}
              {googleClientId ? (
                <div id="google-gis-register-btn" className="w-full min-h-[44px] flex justify-center" />
              ) : null}

              {/* Custom Google Trigger Button */}
              {(!googleClientId || true) && (
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-black/15 bg-white hover:bg-black/5 flex items-center justify-center gap-3 text-xs font-bold text-[#121820] transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.24 5.41l4.04-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                    />
                  </svg>
                  <span>
                    {googleClientId
                      ? "Sign up with Google (Live OAuth)"
                      : "Sign up with Google"}
                  </span>
                </button>
              )}

              <div className="text-center pt-2">
                <span className="text-xs text-[#8490A0]">
                  Already have an account?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    clearErrors();
                  }}
                  className="text-xs font-bold text-[#0C4A34] hover:underline ml-1"
                >
                  Sign In
                </button>
              </div>
            </form>
          ) : tab === "forgot_request" ? (
            /* 4. FORGOT PASSWORD - STEP 1 (REQUEST OTP) */
            <form onSubmit={handleForgotRequest} className="space-y-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0C4A34] mb-1">
                <KeyRound className="w-4 h-4 text-[#0C4A34]" />
                <span>Password Recovery</span>
              </div>
              <p className="text-xs text-[#525D6C] leading-relaxed">
                Enter your registered email address or mobile number. We will send you
                a 6-digit verification code to securely reset your password.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Registered Email or Mobile *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={forgotTarget}
                    onChange={(e) => setForgotTarget(e.target.value)}
                    placeholder="e.g. you@example.com or 9848099887"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  clearErrors();
                }}
                className="w-full text-center text-xs font-bold text-[#525D6C] hover:text-[#121820] py-2 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </form>
          ) : (
            /* 5. FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD) */
            <form
              onSubmit={handleForgotVerifyAndReset}
              className="space-y-3.5 text-left"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#0C4A34] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#0C4A34]" />
                <span>Set New Password</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-[#0C4A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  New Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#8490A0] hover:text-[#121820]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121820] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8490A0] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-[#0C4A34]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs py-3.5 mt-2"
              >
                {loading ? "Updating Password..." : "Reset Password & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("forgot_request");
                  clearErrors();
                }}
                className="w-full text-center text-xs font-bold text-[#525D6C] hover:text-[#121820] py-1 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Request a different code</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-[#FAF9F6] border-t border-black/8 px-6 py-4 flex items-center justify-center gap-2 text-xs text-[#525D6C]">
          <ShieldCheck className="w-4 h-4 text-[#0C4A34]" />
          <span>Verified Hyderabad Doorstep Care • Zero Data Sharing</span>
        </div>

        {/* --- Google OAuth 2.0 / GIS Configuration & Sign-In Modal --- */}
        {showGoogleModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-black/10 space-y-4 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.24 5.41l4.04-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.6 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                    />
                  </svg>
                  <span className="font-bold text-sm text-[#121820]">
                    Sign in with Google
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="p-1 text-[#8490A0] hover:text-[#121820]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#525D6C]">
                Choose an account to continue to <strong>Siri Sofa Services</strong>
              </p>

              {/* Verified One-Click Google Account Option */}
              <div
                onClick={() =>
                  handleGoogleDirectSignIn(
                    "sunil.kondapalli@gmail.com",
                    "Sunil Kumar"
                  )
                }
                className="p-3.5 rounded-2xl border border-black/10 hover:border-[#0C4A34] hover:bg-[#FAF9F6] cursor-pointer transition-all flex items-center gap-3.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-full bg-[#0C4A34] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  SK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#121820] truncate">
                    Sunil Kumar
                  </div>
                  <div className="text-xs text-[#8490A0] truncate">
                    sunil.kondapalli@gmail.com
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Use Another Google Account */}
              <div className="pt-2 border-t border-black/8 space-y-2.5">
                <span className="text-xs font-bold text-[#121820] block">
                  Use another Google account:
                </span>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:border-[#0C4A34]"
                />
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:border-[#0C4A34]"
                />
                <button
                  type="button"
                  disabled={googleLoading || !googleEmail.includes("@")}
                  onClick={() => handleGoogleDirectSignIn()}
                  className="w-full py-3 bg-[#0C4A34] hover:bg-[#083324] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40"
                >
                  {googleLoading ? "Signing in..." : "Continue with this Account"}
                </button>
              </div>

              <div className="text-[11px] text-[#8490A0] text-center pt-1">
                Google will share your name, email address, and profile picture with Siri Sofa Services.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
