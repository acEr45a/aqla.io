import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Landing from '@/pages/Landing';
import Start from '@/pages/Start';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import AppLayout from '@/components/AppLayout';
import Assessment from '@/pages/Assessment';
import Analysis from '@/pages/Analysis';
import Today from '@/pages/Today';
import BrainMap from '@/pages/BrainMap';
import ProtocolPage from '@/pages/ProtocolPage';
import Protocols from '@/pages/Protocols';
import Toolkit from '@/pages/Toolkit';
import Progress from '@/pages/Progress';
import History from '@/pages/History';
import Coach from '@/pages/Coach';
import CognitiveTests from '@/pages/CognitiveTests';
import Games from '@/pages/Games';
import SafetyScreening from '@/pages/SafetyScreening';
import Science from '@/pages/Science';
import Clinician from '@/pages/Clinician';
import Trust from '@/pages/Trust';
import SettingsPage from '@/pages/Settings';
import EvidenceLibrary from '@/pages/EvidenceLibrary';
import HelpCenter from '@/pages/HelpCenter';
import AccountManagement from '@/pages/AccountManagement';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfUse from '@/pages/TermsOfUse';
import AdminDashboard from '@/pages/AdminDashboard';
import CommunityInsights from '@/pages/CommunityInsights';
import AdminSecurityGate from '@/components/admin/AdminSecurityGate';
import ClinicalInboxPage from '@/pages/ClinicalInboxPage';

// These routes must render immediately — never block them with global full-screen spinners.
const PUBLIC_ROUTES = [
  "/",
  "/start",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth/consent",
  "/privacy",
  "/terms",
  "/science",
  "/trust",
  "/safety-screening",
  "/help",
  "/evidence",
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Public & Auth routes (landing, login, register, legal) must render instantly — never gate them.
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  // Show loading spinner while resolving auth — but ONLY for protected/dashboard routes.
  if (!isPublicRoute && isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/start" element={<Start />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/inbox" element={<ClinicalInboxPage />} />
        <Route path="/clinician/inbox" element={<ClinicalInboxPage />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Today />} />
          <Route path="/today" element={<Navigate to="/dashboard" replace />} />
          <Route path="/map" element={<BrainMap />} />
          <Route path="/protocol" element={<ProtocolPage />} />
          <Route path="/protocols" element={<Protocols />} />
          <Route path="/toolkit" element={<Toolkit />} />
          <Route path="/experiments" element={<Navigate to="/toolkit" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/history" element={<History />} />
          <Route path="/community-insights" element={<CommunityInsights />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/tests" element={<CognitiveTests />} />
          <Route path="/games" element={<Games />} />
          <Route path="/safety" element={<SafetyScreening />} />
          <Route path="/science" element={<Science />} />
          <Route path="/clinician" element={<Clinician />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/evidence-library" element={<EvidenceLibrary />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/account-management" element={<AccountManagement />} />
          <Route path="/admin" element={<AdminSecurityGate><AdminDashboard /></AdminSecurityGate>} />
          <Route path="/super-admins" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App