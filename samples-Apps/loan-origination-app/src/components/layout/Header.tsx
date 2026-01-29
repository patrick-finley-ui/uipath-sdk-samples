import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/assetHelpers';
import UiBankLogo from '../../assets/UiBank_Logo.svg?url';

export const Header = () => {
  const { logout, sdk } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img
              src={resolveAssetUrl(UiBankLogo)}
              alt="UiBank"
              className="h-12 w-auto object-contain"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">Loan Origination Portal</h1>
              <p className="text-xs text-gray-500">Internal Banking System</p>
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-4">
            {sdk?.isAuthenticated() && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">Current User</span>
                  <span className="text-xs text-gray-500">Loan Officer</span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-uipath-orange text-white rounded-full font-semibold text-sm shadow-sm">
                  CU
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

