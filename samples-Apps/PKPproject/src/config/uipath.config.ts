// Switch to enable/disable test mode (bypasses authentication and uses dummy data)
export const USE_TEST_MODE = import.meta.env.VITE_USE_TEST_MODE === 'true';

export const uiPathConfig = {
  baseUrl: import.meta.env.VITE_UIPATH_BASE_URL,
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME,
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME,
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID,
  redirectUri: import.meta.env.VITE_UIPATH_REDIRECT_URI,
  scope: import.meta.env.VITE_UIPATH_SCOPE,
  claimsEntityId: import.meta.env.VITE_CLAIMS_ENTITY_ID,
};

// Validate required configuration only when not in test mode
// Validate required configuration only when not in test mode
export const validateConfig = () => {
  if (!USE_TEST_MODE) {
    const requiredVars: (keyof typeof uiPathConfig)[] = [
      'baseUrl',
      'orgName',
      'tenantName',
      'clientId',
      'redirectUri',
      'claimsEntityId',
    ];

    const missingVars = requiredVars.filter((key) => !uiPathConfig[key]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars
          .map((key) => `VITE_UIPATH_${key.toUpperCase()}`)
          .join(', ')}`
      );
    }
  }
};
