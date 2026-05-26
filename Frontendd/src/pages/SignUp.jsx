import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { LegalModal } from "../components/ui/legal-modal";
import { legalContent } from "../data/legalContent";

import { API_BASE_URL } from "../config";

// ── Reusable error message component ─────────────────────────────────────
const ErrorMsg = ({ msg }) =>
    msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

export default function SignUp() {
    const [isVisible, setIsVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'attendee'
    });

    // ── Validation errors state ──────────────────────────────────────────────
    const [errors, setErrors] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const toggleVisibility = () => setIsVisible(!isVisible);
    const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

    // ── Real-time field validation ───────────────────────────────────────────
    const validateField = (name, value) => {
        switch (name) {
            case 'fullName':
                return value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address';
            case 'password':
                return value.length < 6 ? 'Password must be at least 6 characters' : '';
            case 'confirmPassword':
                return value !== formData.password ? 'Passwords do not match' : '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        // Validate the changed field in real-time
        setErrors(prev => ({
            ...prev,
            [id]: validateField(id, value),
            // Re-validate confirmPassword whenever password changes
            ...(id === 'password' && {
                confirmPassword: formData.confirmPassword
                    ? formData.confirmPassword !== value ? 'Passwords do not match' : ''
                    : prev.confirmPassword
            })
        }));
    };

    // ── Check if the form is fully valid to enable submit ────────────────────
    const isFormValid =
        formData.fullName.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.length >= 6 &&
        formData.confirmPassword === formData.password &&
        agreeTerms;

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
        toast.error("Please agree to the Terms & Conditions");
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        setErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
        }));

        toast.error("Passwords do not match");
        return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading("Creating account...");

    try {
        const payload = {
            name: formData.fullName.trim(),
            email: formData.email,
            password: formData.password,
            role: formData.role
        };

        const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            login(data.token, data.user);

            toast.success("Account created successfully!", {
                id: loadingToast,
            });

            switch (data.user.role) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;

                case 'organizer':
                    navigate('/organizer/dashboard');
                    break;

                default:
                    navigate('/customer/dashboard');
            }
        } else {
            toast.error(data.message || 'Signup failed', {
                id: loadingToast,
            });
        }
    } catch (error) {
        console.error("Signup error", error);

        toast.error("Something went wrong", {
            id: loadingToast,
        });
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none"></div>

            {/* Main Content */}
            <div className="relative flex-1 w-full flex items-center justify-center py-24 px-4">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md z-10"
                >
                    {/* Form Container */}
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
                                Create an Account
                            </h1>
                            <p className="text-gray-600 text-sm mt-2">Join us to start your journey</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                            {/* Full Name Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-600 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider" htmlFor="fullName">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full bg-white/50 border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 text-base backdrop-blur-sm shadow-sm ${errors.fullName ? 'border-red-500' : 'border-white/50'}`}
                                    placeholder="John Doe"
                                />
                                <ErrorMsg msg={errors.fullName} />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-600 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full bg-white/50 border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 text-base backdrop-blur-sm shadow-sm ${errors.email ? 'border-red-500' : 'border-white/50'}`}
                                    placeholder="name@example.com"
                                />
                                <ErrorMsg msg={errors.email} />
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
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full bg-white/50 border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 pr-10 text-base backdrop-blur-sm shadow-sm ${errors.password ? 'border-red-500' : 'border-white/50'}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors p-1"
                                        type="button"
                                        onClick={toggleVisibility}
                                    >
                                        {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                <ErrorMsg msg={errors.password} />
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-gray-600 group-focus-within:text-[#e63946] transition-colors uppercase tracking-wider" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={isConfirmVisible ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full bg-white/50 border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition-all duration-300 pr-10 text-base backdrop-blur-sm shadow-sm ${errors.confirmPassword ? 'border-red-500' : 'border-white/50'}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors p-1"
                                        type="button"
                                        onClick={toggleConfirmVisibility}
                                    >
                                        {isConfirmVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                    </button>
                                </div>
                                <ErrorMsg msg={errors.confirmPassword} />
                            </div>

                            {/* Terms & Conditions */}
                            <div className="flex items-center space-x-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 bg-white/50 text-[#e63946] focus:ring-[#e63946] focus:ring-offset-0 cursor-pointer accent-[#e63946]"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                                    I agree to the{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveModal('terms');
                                        }}
                                        className="text-[#e63946] hover:text-[#ff4d5a] transition-colors underline decoration-transparent hover:decoration-[#ff4d5a] bg-transparent border-none p-0 inline cursor-pointer"
                                    >
                                        Terms & Conditions
                                    </button>
                                </label>
                            </div>

                            {/* Submit Button — disabled until form is valid */}
                            <button
                                type="submit"
                                disabled={!isFormValid || isLoading}
                                className="w-full mt-8 py-3.5 px-4 bg-gradient-to-r from-[#e63946] to-[#d62839] hover:from-[#d62839] hover:to-[#c1121f] text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transform hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>

                        {/* Sign In Link */}
                        <div className="mt-8 text-center text-sm relative z-10">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link
                                to="/login"
                                className="font-semibold text-[#e63946] hover:text-[#ff4d5a] transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            <LegalModal
                isOpen={!!activeModal}
                onClose={() => setActiveModal(null)}
                title={activeModal ? legalContent[activeModal].title : ""}
                content={activeModal ? legalContent[activeModal].content : ""}
            />
        </div>
    );
}