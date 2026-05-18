import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      // Clean redirect — no error params in URL
      navigate("/login", { replace: true, state: { googleError: true } });
      return;
    }

    const user = {
      id: params.get("id"),
      name: decodeURIComponent(params.get("name") || ""),
      email: decodeURIComponent(params.get("email") || ""),
      role: params.get("role") || "attendee",
      avatarUrl: params.get("avatar") ? decodeURIComponent(params.get("avatar")) : null,
    };

    // Store token + user in auth context
    login(token, user);

    // Always go to landing page after Google login
    navigate("/", { replace: true });
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
}

