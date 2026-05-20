import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
    useEffect(() => {
        document.title = "404 - Page Not Found";
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none"></div>

            <div className="relative flex-1 w-full flex items-center justify-center py-24 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md z-10"
                >
                    {/* Form Container with Dot Pattern */}
                    <div
                        className="bg-[#0a0a0a] border border-gray-800/50 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm text-center flex flex-col items-center"
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}
                    >
                        {/* 404 Icon / Illustration */}
                        <div className="mb-6 relative flex justify-center items-center w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="w-12 h-12 text-[#e63946]" />
                        </div>

                        {/* Title & Message */}
                        <div className="mb-8 relative z-10">
                            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">
                                404
                            </h1>
                            <h2 className="text-xl font-semibold text-gray-200 mb-3">
                                Page Not Found
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Oops! It seems you've wandered into an unknown route. The page you're looking for doesn't exist or has been moved.
                            </p>
                        </div>

                        {/* Back to Home Button */}
                        <Link
                            to="/"
                            className="w-full py-3.5 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#e63946] to-[#d62839] hover:from-[#d62839] hover:to-[#c1121f] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transform hover:-translate-y-0.5"
                        >
                            <Home className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
