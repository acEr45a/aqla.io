import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import AppLayout from '@/components/AppLayout';
import Assessment from '@/pages/Assessment';
import Analysis from '@/pages/Analysis';
import Today from '@/pages/Today';
import BrainMap from '@/pages/BrainMap';
import ProtocolPage from '@/pages/ProtocolPage';
import Protocols from '@/pages/Protocols';
import Toolkit from '@/pages/Toolkit';
import Progress from '@/pages/Progress';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
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