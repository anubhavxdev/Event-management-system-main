import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import { Toaster } from "react-hot-toast";

import { Toaster } from "react-hot-toast";

import Footer from "./components/mvpblocks/footer-standard";
import Header2 from "./components/mvpblocks/header-2";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import OrganizerDashboard from "./pages/dashboard/OrganizerDashboard";
import CreateEvent from "./pages/dashboard/CreateEvent";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ThankYou from "./pages/ThankYou";
import { useAuth } from "./context/AuthContext";

import ScrollToTop from "./components/ui/ScrollToTop";

const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if(darkMode){
      document.documentElement.classList.add("dark");
    }else{
      document.documentElement.classList.remove("dark");
    } 
  },[darkMode]);
  return (
    <BrowserRouter>
      <ScrollToTop />

      {/* Global Toast Notification System */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#ffffff",
            border: "1px solid #374151",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Header2 darkMode={darkMode} setDarkMode={setDarkMode} />  

        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/thank-you" element={<ThankYou />} />
            {/* Protected Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Customer Dashboard */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Organizer Dashboard */}
            <Route
              path="/organizer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Create Event */}
            <Route
              path="/organizer/create-event"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Pending Events Alias */}
            <Route
              path="/admin/pending-events"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback to Home or 404 */}
            <Route path="*" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              }>
                <NotFound />
              </Suspense>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
