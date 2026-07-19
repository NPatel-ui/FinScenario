import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OnboardingWizard from './pages/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import ScenarioChat from './pages/ScenarioChat';
import SensitivityChart from './pages/SensitivityChart';
import CompareScenarios from './pages/CompareScenarios';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './index.css';

/**
 * ProtectedRoute — redirects to /login if the user is not authenticated.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: 'var(--ink-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scenario/:id" element={<ProtectedRoute><ScenarioChat /></ProtectedRoute>} />
        <Route path="/scenario/:id/sensitivity" element={<ProtectedRoute><SensitivityChart /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><CompareScenarios /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
