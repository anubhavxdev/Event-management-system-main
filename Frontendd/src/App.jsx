import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";
import { Toaster } from "react-hot-toast";
import Footer from "./components/mvpblocks/footer-standard";
import Header2 from "./components/mvpblocks/header-2";
import ScrollToTop from "./components/ui/ScrollToTop";
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Support from "./pages/Support";
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Profile from './pages/Profile';
import DashboardLayout from './components/DashboardLayout';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import CreateEvent from './pages/dashboard/CreateEvent';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import QRScanner from "./pages/dashboard/QRScanner";
import ThankYou from './pages/ThankYou';
import { useAuth } from './context/AuthContext';
import ErrorBoundary, { InlineFallback } from './components/ErrorBoundary';

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

/**
 * Route-level ErrorBoundary wrapper.
 * Uses current pathname as a resetKey so the error state auto-clears
 * when the user navigates to a different route via the still-functional header.
 */
const RouteErrorBoundary = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary level="route" resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if(darkMode){
      document.documentElement.classList.add("dark");
    }else{
      document.documentElement.classList.remove("dark");
    } 
  },[darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
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

      {/* Header — isolated so a header crash doesn't kill page content */}
      <ErrorBoundary
        level="layout"
        fallback={({ resetError }) => (
          <InlineFallback label="header" resetError={resetError} />
        )}
      >
        <Header2 darkMode={darkMode} setDarkMode={setDarkMode} />
      </ErrorBoundary>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <RouteErrorBoundary><Home /></RouteErrorBoundary>
          } />
          <Route path="/features" element={
            <RouteErrorBoundary><Features /></RouteErrorBoundary>
          } />
          <Route path="/pricing" element={
            <RouteErrorBoundary><Pricing /></RouteErrorBoundary>
          } />
          <Route path="/contact" element={
            <RouteErrorBoundary><Contact /></RouteErrorBoundary>
          } />
          <Route path="/support" element={
            <RouteErrorBoundary><Support /></RouteErrorBoundary>
          } />
          <Route path="/about-us" element={
            <RouteErrorBoundary><About /></RouteErrorBoundary>
          } />
          <Route path="/login" element={
            <RouteErrorBoundary><SignIn /></RouteErrorBoundary>
          } />
          <Route path="/signup" element={
            <RouteErrorBoundary><SignUp /></RouteErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <RouteErrorBoundary><ForgotPassword /></RouteErrorBoundary>
          } />
          <Route path="/thank-you" element={
            <RouteErrorBoundary><ThankYou /></RouteErrorBoundary>
          } />
          <Route path="/profile" element={
            <RouteErrorBoundary>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </RouteErrorBoundary>
          } />

          {/* Dashboard Routes - Flattened, No Sidebar Layout */}
          <Route
            path="/customer/dashboard"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['attendee']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/organizer/dashboard"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/organizer/scan/:eventId"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['organizer']}>
                  <QRScanner />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/organizer/create-event"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['organizer']}>
                  <CreateEvent />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          {/* Alias for admin pending events */}
          <Route
            path="/admin/pending-events"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />

          {/* Fallback to 404 */}
          <Route path="*" element={
            <RouteErrorBoundary><NotFound /></RouteErrorBoundary>
          } />
        </Routes>
      </main>

      {/* Footer — isolated so a footer crash doesn't kill page content */}
      <ErrorBoundary
        level="layout"
        fallback={({ resetError }) => (
          <InlineFallback label="footer" resetError={resetError} />
        )}
      >
        <Footer />
      </ErrorBoundary>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      {/* Root-level boundary — last resort for catastrophic failures */}
      <ErrorBoundary level="root">
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
