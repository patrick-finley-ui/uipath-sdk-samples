import { useAuth } from '../hooks/useAuth';

export interface LoginScreenProps {
  appName?: string;
  appDescription?: string;
  detailedDescription?: string;
}

export const LoginScreen = ({
  appName = 'Loan Origination Workspace',
  appDescription = 'Manage loan applications and workflows',
  detailedDescription = 'Access the loan origination system to review, process, and track loan applications through automated workflows.',
}: LoginScreenProps = {}) => {
  const { login, error, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{appName}</h2>
            <p className="text-gray-600 mt-2">{appDescription}</p>
          </div>

          {/* Description */}
          {detailedDescription && (
            <div className="bg-uipath-orange-subtle rounded-lg p-4 border border-uipath-orange/20">
              <p className="text-sm text-gray-700">
                {detailedDescription}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={login}
            disabled={isLoading}
            className="w-full bg-uipath-orange hover:bg-uipath-orange-light active:bg-uipath-orange-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="text-white">Sign in with UiPath</span>
              </>
            )}
          </button>

          {/* Footer Info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <p>Powered by UiPath TypeScript SDK</p>
            <p className="mt-1">Secure access for authorized users only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

