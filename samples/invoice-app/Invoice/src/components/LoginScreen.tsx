import { useAuth } from '../hooks/useAuth';
import { getLogoUrls } from '../utils/logoUtils';
import { LoginInstructions } from './ui/LoginInstructions';

export const LoginScreen = () => {
  const { login, error, isLoading } = useAuth();
  const { dodLogoSrc, uipathLogoSrc } = getLogoUrls();


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-full">
                
               <div className="flex items-center">
            <img
              src={uipathLogoSrc}
              alt="UiPath"
              className="h-28 w-auto object-contain"
            />
          </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invoice Processing App</h2>
            <p className="text-gray-600 mt-2">Automated Invoice Management & Verification</p>
          </div>

          {/* Description */}
          <div className="bg-uipath-orange-subtle rounded-lg p-4 border border-uipath-orange/20">
            <p className="text-sm text-gray-700">
              Access the invoice processing system to manage, verify, and track invoice documents.
            </p>
          </div>

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
                <span className="text-white">Login with UiPath</span>
              </>
            )}
          </button>
<div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-full">
                
               <div className="flex items-center">
            <img
              src={dodLogoSrc}
              alt="Department of Defense"
              className="h-28 w-auto object-contain"
            />
          </div>
              </div>
            </div>
          {/* Footer Info */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
            <p>Powered by UiPath TypeScript SDK</p>
            <p className="mt-1">Secure access for authorized users only</p>
          </div>
        </div>

        {/* Login Instructions - Collapsible */}
        <LoginInstructions />

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">System Features</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>Real-time invoice tracking</li>
              <li>Document verification status</li>
              <li>Automated processing workflows</li>
              <li>Analytics and reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
