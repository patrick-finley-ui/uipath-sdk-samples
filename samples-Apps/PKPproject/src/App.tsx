import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClaimsDashboard } from './components/ClaimsDashboard';
import { AuthCallback } from './components/AuthCallback';
import { LoginScreen } from './components/LoginScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { uiPathConfig } from './config/uipath.config';

const authConfig = {
  clientId: uiPathConfig.clientId,
  orgName: uiPathConfig.orgName,
  tenantName: uiPathConfig.tenantName,
  baseUrl: uiPathConfig.baseUrl,
  redirectUri: uiPathConfig.redirectUri,
  scope: uiPathConfig.scope,
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<ClaimsDashboard />} />
      <Route path="/callback" element={<AuthCallback />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider config={authConfig}>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
