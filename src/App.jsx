import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy-loaded page components for route-level code splitting
const Landing = lazy(() => import('@/pages/Landing'));
const LandingMockup = lazy(() => import('@/pages/LandingMockup'));
const MockupOneTunnel = lazy(() => import('@/pages/mockups/MockupOneTunnel'));
const MockupTwoMatrix = lazy(() => import('@/pages/mockups/MockupTwoMatrix'));
const MockupThreeLuxury = lazy(() => import('@/pages/mockups/MockupThreeLuxury'));
const MockupFourUnseen = lazy(() => import('@/pages/mockups/MockupFourUnseen'));
import PageTransitionCurtain from '@/components/common/PageTransitionCurtain';
const Start = lazy(() => import('@/pages/Start'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const AppLayout = lazy(() => import('@/components/AppLayout'));
const Assessment = lazy(() => import('@/pages/Assessment'));
const Analysis = lazy(() => import('@/pages/Analysis'));
const Today = lazy(() => import('@/pages/Today'));
const BrainMap = lazy(() => import('@/pages/BrainMap'));
const ProtocolPage = lazy(() => import('@/pages/ProtocolPage'));
const Protocols = lazy(() => import('@/pages/Protocols'));
const Toolkit = lazy(() => import('@/pages/Toolkit'));
const Progress = lazy(() => import('@/pages/Progress'));
const History = lazy(() => import('@/pages/History'));
const Coach = lazy(() => import('@/pages/Coach'));
const CognitiveTests = lazy(() => import('@/pages/CognitiveTests'));
const Games = lazy(() => import('@/pages/Games'));
const SafetyScreening = lazy(() => import('@/pages/SafetyScreening'));
const Science = lazy(() => import('@/pages/Science'));
const Clinician = lazy(() => import('@/pages/Clinician'));
const Trust = lazy(() => import('@/pages/Trust'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const EvidenceLibrary = lazy(() => import('@/pages/EvidenceLibrary'));
const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const AccountManagement = lazy(() => import('@/pages/AccountManagement'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('@/pages/TermsOfUse'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const CommunityInsights = lazy(() => import('@/pages/CommunityInsights'));
const AdminSecurityGate = lazy(() => import('@/components/admin/AdminSecurityGate'));
const ClinicalInboxPage = lazy(() => import('@/pages/ClinicalInboxPage'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#06080c] z-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      <span className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">AQLA // LOADING</span>
    </div>
  </div>
);

// These routes must render immediately — never block them with global full-screen spinners.
const PUBLIC_ROUTES = [
  "/",
  "/mockup",
  "/mockup-1",
  "/mockup-2",
  "/mockup-3",
  "/mockup-4",
  "/landing-v2",
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

  // Render the main app with code-split lazy routes
  return (
    <>
      <PageTransitionCurtain />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mockup" element={<MockupOneTunnel />} />
          <Route path="/mockup-1" element={<MockupOneTunnel />} />
          <Route path="/mockup-2" element={<MockupTwoMatrix />} />
          <Route path="/mockup-3" element={<MockupThreeLuxury />} />
          <Route path="/mockup-4" element={<MockupFourUnseen />} />
          <Route path="/landing-v2" element={<LandingMockup />} />
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
    </Suspense>
    </>
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