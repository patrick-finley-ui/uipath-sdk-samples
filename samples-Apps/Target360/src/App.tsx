import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { InvestigationDashboard } from './components/InvestigationDashboard';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

// Determine if we should use CORS proxy (set VITE_USE_CORS_PROXY=true to enable)
const useCorsProxy = import.meta.env.VITE_USE_CORS_PROXY === 'true';

const authConfig: UiPathSDKConfig = {
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || 'your-client-id',
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
  // Use proxy in development if enabled, otherwise use direct URL
  baseUrl: (import.meta.env.DEV && useCorsProxy)
    ? window.location.origin
    : (import.meta.env.VITE_UIPATH_BASE_URL || 'https://cloud.uipath.com/'),
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI || window.location.origin,
  scope: import.meta.env.VITE_UIPATH_SCOPES || import.meta.env.VITE_UIPATH_SCOPE || 'DataFabric.Schema.Read',
};

// Log configuration for debugging
console.log('ðŸ”§ Auth Config:', {
  mode: import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION',
  corsProxy: useCorsProxy ? 'ENABLED âœ…' : 'DISABLED âŒ',
  baseUrl: authConfig.baseUrl,
  redirectUri: authConfig.redirectUri,
});

function AppContent() {
  const { isAuthenticated, isLoading, sdk } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-red-500"></div>
          <span className="text-gray-400 font-medium">Initializing Target360 Investigation Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        customerName="Target360"
        appName="Investigation Dashboard"
        appDescription="Advanced Investigation Management System"
        detailedDescription="Access the investigation management system to track, analyze, and manage investigation cases with real-time risk assessment."
        systemFeatures={[
          'Real-time investigation tracking',
          'Risk level assessment and monitoring',
          'Automated case management workflows',
          'Advanced analytics and reporting',
        ]}
      />
    );
  }

  if (!sdk) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <p className="text-red-400">SDK not initialized</p>
        </div>
      </div>
    );
  }

  return <InvestigationDashboard sdk={sdk} />;
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;



