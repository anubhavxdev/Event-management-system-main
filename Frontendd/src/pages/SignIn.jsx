import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { API_BASE_URL } from "../config";

export default function SignIn() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');
    const processedCode = useRef(false);

    useEffect(() => {
        if (code && !processedCode.current) {
            processedCode.current = true;
            handleGithubCallback(code);
        }
    }, [code]);

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

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const loadingToast = toast.loading("Signing in with Google...");
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token })
                });
                const data = await res.json();
                if (res.ok) {
                    login(data.token, data.user);
                    toast.success("Login successful!", { id: loadingToast });
                    navigate('/');
                } else {
                    toast.error(data.message || 'Login failed', { id: loadingToast });
                }
            } catch (error) {
                console.error("Google login error", error);
                toast.error("Something went wrong", { id: loadingToast });
            }
        },
        onError: errorResponse => {
            console.error("Google login failed", errorResponse);
            toast.error("Google sign-in was cancelled or failed.");
        }
    });

    const handleGithubCallback = async (code) => {
        const loadingToast = toast.loading("Signing in with GitHub...");
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
                toast.success("Login successful!", { id: loadingToast });
                navigate('/');
            } else {
                toast.error(data.message || 'GitHub login failed', { id: loadingToast });
                navigate('/login'); // clear the code from URL
            }
        } catch (error) {
            console.error("GitHub login error", error);
            toast.error("Something went wrong", { id: loadingToast });
            navigate('/login');
        }
    };

    const githubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        if (!clientId) {
            toast.error("GitHub Client ID is not configured");
            return;
        }
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
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
                      {/* Close Button */}
                        <button
                           onClick={() => navigate(-1)}
                           className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all duration-200 z-20"
                           type="button">
                           ✕
                        </button>
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
                                            <Eye className="h-5 w-5" />
                                        ) : (
                                            <EyeOff className="h-5 w-5" />
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
                        <div className="relative my-6 z-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white/40 text-gray-600 rounded-full">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Sign In Button */}
                        <button
                            type="button"
                            onClick={() => googleLogin()}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md relative z-10 mb-4"
                        >
                            <FcGoogle className="h-6 w-6" />
                            <span className="font-semibold">Continue with Google</span>
                        </button>
                        
                        {/* GitHub Sign In Button */}
                        <button
                            type="button"
                            onClick={githubLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-[#24292F] hover:bg-[#24292F]/90 text-white border border-gray-300 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md relative z-10 mb-6"
                        >
                            <FaGithub className="h-6 w-6" />
                            <span className="font-semibold">Continue with GitHub</span>
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
