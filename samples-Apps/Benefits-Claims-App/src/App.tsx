import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { ClaimsDashboard } from './components/ClaimsDashboard';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

const authConfig: UiPathSDKConfig = {
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || 'your-client-id',
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
  baseUrl: window.location.origin,
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI || window.location.origin,
  scope: import.meta.env.VITE_UIPATH_SCOPES || import.meta.env.VITE_UIPATH_SCOPE || 'DataFabric.Schema.Read',
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Initializing UiPath SDK...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        customerLogo="https://www.usda.gov/themes/custom/usda_uswds/img/USDA_logo_640.png"
        customerName="US Department of Agriculture"
        appName="SNAP Benefits Applications Dashboard"
        appDescription="Automated Benefits Processing & Management"
        detailedDescription="Access the SNAP benefits processing system to manage, review, and approve benefits applications."
        systemFeatures={[
          'Real-time application tracking',
          'AI-powered eligibility verification',
          'Automated document processing',
          'Fraud detection and prevention',
        ]}
      />
    )
  }

  return <ClaimsDashboard />;
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;



