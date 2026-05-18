import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import Footer from "./components/mvpblocks/footer-standard";
import Header2 from "./components/mvpblocks/header-2";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import DashboardLayout from "./components/DashboardLayout";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import OrganizerDashboard from "./pages/dashboard/OrganizerDashboard";
import CreateEvent from "./pages/dashboard/CreateEvent";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ThankYou from "./pages/ThankYou";
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ui/ScrollToTop";

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import Footer from "./components/mvpblocks/footer-standard";
import Header2 from "./components/mvpblocks/header-2"
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import DashboardLayout from './components/DashboardLayout';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import CreateEvent from './pages/dashboard/CreateEvent';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ThankYou from './pages/ThankYou';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or unauthorized page
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Header2 />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/verify-email" element={<VerifyEmail />} /> 
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Dashboard Routes - Flattened, No Sidebar Layout */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer/create-event"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Alias for admin pending events */}
            <Route
              path="/admin/pending-events"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback to Home or 404 */}
            <Route path="*" element={<Home />} />
          </Routes>
          <>
            <ScrollToTop />
          </>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
