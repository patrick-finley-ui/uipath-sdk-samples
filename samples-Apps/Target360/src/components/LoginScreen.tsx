import { useAuth } from '../hooks/useAuth';
import { getLogoUrls } from '../utils/logoUtils';
import { LoginInstructions } from './ui/LoginInstructions';

export interface LoginScreenProps {
  customerLogo?: string;
  customerName?: string;
  appName?: string;
  appDescription?: string;
  systemFeatures?: string[];
  detailedDescription?: string;
}

export const LoginScreen = ({
  customerLogo,
  customerName = 'UiPath',
  appName = 'Application Dashboard',
  appDescription = 'Automated Workflow Management',
  systemFeatures = [
    'Real-time processing tracking',
    'Document verification status',
    'Automated processing workflows',
    'Analytics and reporting',
  ],
  detailedDescription,
}: LoginScreenProps = {}) => {
  const { login, error, isLoading } = useAuth();
  const { uipathLogoSrc } = getLogoUrls();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1117] to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1d29] border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            {/* Only show customer logo if provided */}
            {customerLogo && (
              <div className="flex justify-center mb-4">
                <div className="bg-[#252836] p-4 rounded-full border border-gray-700">
                  <div className="flex items-center">
                    <img
                      src={customerLogo}
                      alt={customerName}
                      className="h-28 w-auto object-contain"
                      onError={(e) => {
                        console.error('Failed to load customer logo:', customerLogo);
                        // Hide the image if it fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <h2 className="text-3xl font-bold text-white">{appName}</h2>
            <p className="text-gray-400 mt-2">{appDescription}</p>
          </div>

          {/* Description */}
          {detailedDescription && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                {detailedDescription}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={login}
            disabled={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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

          {/* UiPath Logo */}
          <div className="flex justify-center pt-4 border-t border-gray-700">
            <div className="bg-[#252836] p-3 rounded-lg border border-gray-700">
              <img
                src={uipathLogoSrc}
                alt="UiPath"
                className="h-28 w-auto object-contain"
                onError={(e) => {
                  console.error('Failed to load UiPath logo:', uipathLogoSrc);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <p>Powered by UiPath TypeScript SDK</p>
            <p className="mt-1">Secure access for authorized users only</p>
          </div>
        </div>

        {/* Login Instructions - Collapsible */}
        <LoginInstructions />

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="bg-[#1a1d29] border border-gray-800 rounded-lg p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">System Features</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              {systemFeatures.map((feature, index) => (
                <li key={index} className="flex items-center justify-center gap-2">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
