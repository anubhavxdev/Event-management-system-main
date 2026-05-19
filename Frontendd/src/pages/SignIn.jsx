import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import { API_BASE_URL } from "../config";

export default function SignIn() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [googleErrorDismissed, setGoogleErrorDismissed] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const showGoogleError = !googleErrorDismissed && (
        new URLSearchParams(location.search).get('error') === 'google_failed' ||
        location.state?.googleError
    );

    useEffect(() => {
        if (new URLSearchParams(location.search).get('error') === 'google_failed') {
            window.history.replaceState({}, '', '/login');
        }
    }, [location.search]);

    const toggleVisibility = () => setIsVisible(!isVisible);

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = toast.loading("Signing in...");

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            login(data.token, data.user);

            toast.success("Login successful!", {
                id: loadingToast,
            });

            navigate('/');
        } else {
            toast.error(data.message || 'Login failed', {
                id: loadingToast,
            });
        }
    } catch (error) {
        console.error("Login error", error);

        toast.error("Something went wrong", {
            id: loadingToast,
        });
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            {/* Website Standard Background (Grid) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative flex-1 w-full flex items-center justify-center py-24 px-4">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md z-10"
                >
                    {/* Form Container with Dot Pattern */}
                    <div
                        className="bg-white/40 border border-white/50 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md"
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}
                    >
                        {/* Google Error Banner */}
                        {showGoogleError && (
                            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 relative z-10">
                                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-red-400 text-sm">Google sign-in failed. Please try again or use email.</p>
                                <button onClick={() => setGoogleErrorDismissed(true)} className="ml-auto text-red-400 hover:text-white transition-colors">✕</button>
                            </div>
                        )}

                        {/* Title */}
                        <div className="text-center mb-10 relative z-10">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Welcome Back
                            </h1>
                            <p className="text-gray-600 text-sm mt-2">Sign in to access your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Email Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-600 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/50 border border-white/50 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 text-base backdrop-blur-sm shadow-sm"
                                    placeholder="name@example.com"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-600 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={isVisible ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/50 border border-white/50 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 pr-10 text-base backdrop-blur-sm shadow-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors p-1"
                                        type="button"
                                        onClick={toggleVisibility}
                                    >
                                        {isVisible ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {/* Forgot Password Link - Moved BELOW input */}
                                <div className="flex justify-end pt-1">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-[#e63946] hover:text-[#ff4d5a] transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-8 py-3.5 px-4 bg-gradient-to-r from-[#e63946] to-[#d62839] hover:from-[#d62839] hover:to-[#c1121f] text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transform hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Signing In...</span>
                                    </div>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mt-8 mb-6 z-10 text-sm text-gray-500">
                            <div className="flex-1 border-t border-gray-300" />
                            <span>Or continue with</span>
                            <div className="flex-1 border-t border-gray-300" />
                        </div>

                        {/* Google Button */}
                        <button
                            type="button"
                            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
                            className="w-full relative z-10 flex items-center justify-center space-x-3 py-3.5 px-4 bg-black hover:bg-gray-900 border border-black hover:border-gray-800 text-white font-medium rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-black/20"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                        </button>                        {/* Sign Up Link */}
                        <div className="mt-8 text-center text-sm relative z-10">
                            <span className="text-gray-600">Don't have an account? </span>
                            <Link
                                to="/signup"
                                className="font-semibold text-[#e63946] hover:text-[#ff4d5a] transition-colors"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
