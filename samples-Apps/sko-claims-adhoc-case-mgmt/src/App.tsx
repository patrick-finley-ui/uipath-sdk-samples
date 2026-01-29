import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { getAuthConfig, getBasename } from './utils/config';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ClaimDetail } from './components/ClaimDetail';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const basename = getBasename();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange"></div>
        <span className="ml-3 text-gray-600">Initializing Claims Management App...</span>
      </div>
    );
  }

  // If not authenticated, show login screen regardless of route
  // This ensures OAuth callbacks can be processed by the SDK
  if (!isAuthenticated) {
    return (
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/*" element={<LoginScreen />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/login"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/claims/:caseInstanceId"
          element={
            <ProtectedRoute>
              <ClaimDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Catch-all route: redirect any unmatched paths to dashboard when authenticated */}
        <Route
          path="/*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const authConfig = getAuthConfig();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={authConfig}>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
