import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ErrorBoundary, { InlineFallback } from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
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
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — isolated so a header crash doesn't kill page content */}
      <ErrorBoundary
        level="layout"
        fallback={({ resetError }) => (
          <InlineFallback label="header" resetError={resetError} />
        )}
      >
        <Header2 />
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
          <Route path="/about-us" element={
            <RouteErrorBoundary><About /></RouteErrorBoundary>
          } />
          <Route path="/login" element={
            <RouteErrorBoundary><SignIn /></RouteErrorBoundary>
          } />
          <Route path="/signup" element={
            <RouteErrorBoundary><SignUp /></RouteErrorBoundary>
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
                <ProtectedRoute allowedRoles={['customer']}>
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

          {/* Fallback to Home or 404 */}
          <Route path="*" element={
            <RouteErrorBoundary><Home /></RouteErrorBoundary>
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

export default App
