import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import "./index.css";

import toast, { Toaster } from "react-hot-toast";
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
import GoogleCallback from "./pages/auth/GoogleCallback";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import OrganizerDashboard from "./pages/dashboard/OrganizerDashboard";
import CreateEvent from "./pages/dashboard/CreateEvent";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ThankYou from "./pages/ThankYou";
import Support from "./pages/Support";
import QRScanner from "./pages/dashboard/QRScanner";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./context/AuthContext";

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
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => toast.success("You are back online!");
    const handleOffline = () =>
      toast.error("You are offline. Viewing cached data.");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />

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
        <Header2 />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about-us" element={<About />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <SignIn />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/" replace /> : <SignUp />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route
              path="/auth/google/callback"
              element={<GoogleCallback />}
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["attendee", "customer"]}>
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
              path="/organizer/scan/:eventId"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <QRScanner />
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
            <Route
              path="/admin/pending-events"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
