import { useState } from 'react';

export const LoginInstructions = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get environment variables
  const baseUrl = import.meta.env.VITE_UIPATH_BASE_URL || 'https://cloud.uipath.com/';
  const orgName = import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization';
  const tenantName = import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant';
  const loginUrl = `${baseUrl}${orgName}/`;

  return (
    <div className="mt-6">
      <div className="bg-[#1a1d29] border border-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header - Clickable to expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#252836] transition-colors"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-gray-300 text-sm">
              Setup Instructions - Click to {isExpanded ? 'Collapse' : 'Expand'}
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Content - Collapsible */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 font-medium">
              Before logging in, ensure you have completed the following setup requirements:
            </p>

            {/* Step 1 */}
            <div className="bg-[#252836] rounded-md p-3 border border-gray-700">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-200 text-sm mb-1">
                    Use SSO Login
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Log in using Single Sign-On (SSO) to:
                  </p>
                  <a
                    href={loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-red-400 hover:text-red-300 font-medium underline"
                  >
                    {loginUrl}
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#252836] rounded-md p-3 border border-gray-700">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-200 text-sm mb-1">
                    Verify Folder Access
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    In the <span className="font-semibold text-gray-300">{tenantName} Tenant</span>, ensure you have access to:
                  </p>
                  <div className="bg-[#0f1117] rounded px-3 py-2 border border-gray-700">
                    <p className="text-xs font-mono text-gray-300">
                      Amer Presales → Public Sector Folder
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#252836] rounded-md p-3 border border-gray-700">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-200 text-sm mb-1">
                    Verify Data Fabric Permissions
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    In the <span className="font-semibold text-gray-300">{tenantName} Tenant</span>, confirm you have the following permissions:
                  </p>
                  <ul className="space-y-1">
                    <li className="flex items-center text-xs text-gray-300">
                      <svg
                        className="w-3 h-3 text-green-500 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-semibold">Data Fabric Data Reader</span>
                    </li>
                    <li className="flex items-center text-xs text-gray-300">
                      <svg
                        className="w-3 h-3 text-green-500 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-semibold">Data Fabric Data Writer</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-yellow-400 font-medium mb-1">
                    Need Help?
                  </p>
                  <p className="text-xs text-yellow-300/80">
                    If you don't have the required access or permissions, contact your UiPath administrator or tenant owner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
