import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!EMAIL_REGEX.test(value)) return "Enter a valid email address";
    return "";
  };

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    if (error) {
      setError(validateEmail(value));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      showToast("error", validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        "success",
        "If an account exists for this email, a reset link has been sent.",
      );
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none"></div>

      {toast && (
        <div
          className="fixed top-6 right-6 z-50"
          role="status"
          aria-live="polite"
        >
          <div
            className={`min-w-[260px] max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-100"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                className="text-xs text-white/70 hover:text-white transition-colors"
                onClick={() => setToast(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 w-full flex items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md z-10"
        >
          <div
            className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            <div className="text-center mb-8 relative z-10">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Forgot Password
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Enter your email and we will send a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2 group">
                <label
                  className="text-xs font-medium text-gray-400 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={(event) =>
                    setError(validateEmail(event.target.value))
                  }
                  className={`w-full bg-zinc-900/50 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 text-base ${
                    error ? "border-red-500" : "border-gray-700"
                  }`}
                  placeholder="name@example.com"
                />
                {error ? <p className="text-red-400 text-xs">{error}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-[#e63946] to-[#d62839] hover:from-[#d62839] hover:to-[#c1121f] text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  "Change Password"
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm relative z-10">
              <span className="text-gray-500">Remember your password? </span>
              <Link
                to="/login"
                className="font-semibold text-[#e63946] hover:text-[#ff4d5a] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
