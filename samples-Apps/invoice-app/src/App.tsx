import { AuthProvider } from './hooks/useAuth'
import { useAuth } from './hooks/useAuth'
import { LoginScreen } from './components/LoginScreen'
import { Dashboard } from './components/Dashboard'
import type { UiPathSDKConfig } from '@uipath/uipath-typescript'

// Determine if we should use CORS proxy (set VITE_USE_CORS_PROXY=true to enable)
const useCorsProxy = import.meta.env.VITE_USE_CORS_PROXY === 'true'

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
}

// Log configuration for debugging
console.log('ðŸ”§ Auth Config:', {
  mode: import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION',
  corsProxy: useCorsProxy ? 'ENABLED âœ…' : 'DISABLED âŒ',
  baseUrl: authConfig.baseUrl,
  redirectUri: authConfig.redirectUri,
})

function AppContent() {
  const { isAuthenticated, isLoading, sdk } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange"></div>
        <span className="ml-3 text-gray-600">Initializing Invoice Processing App...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        customerName="Department of Defense"
        appName="Invoice Processing Dashboard"
        appDescription="Automated Invoice Management"
        detailedDescription="Access the invoice processing system to manage, verify, and track invoice documents."
        systemFeatures={[
          'Real-time invoice tracking',
          'Document verification status',
          'Automated processing workflows',
          'Analytics and reporting',
        ]}
      />
    )
  }

  if (!sdk) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">SDK not initialized</p>
      </div>
    )
  }

  return <Dashboard sdk={sdk} />
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  )
}

export default App



