import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

export const getAuthConfig = (): UiPathSDKConfig => {
  // Determine if we should use CORS proxy (set VITE_USE_CORS_PROXY=true to enable)
  // When enabled, API requests go through the Vite proxy to avoid CORS issues
  const useCorsProxy = import.meta.env.VITE_USE_CORS_PROXY === 'true';
  
  // baseUrl configuration:
  // - If CORS proxy is enabled in dev mode: use window.location.origin so requests go through proxy
  // - Otherwise: use the actual UiPath server URL
  // Note: OAuth redirects will still work because redirectUri is set separately
  let baseUrl: string;
  if (useCorsProxy && import.meta.env.DEV) {
    // Use local origin so requests go through Vite proxy
    baseUrl = window.location.origin;
  } else {
    // Use actual UiPath server URL
    baseUrl = import.meta.env.VITE_UIPATH_BASE_URL || 'https://staging.uipath.com';
  }

  // Default scopes for Maestro processes and tasks
  // These are the minimum required scopes for the loan origination app
  // Note: Maestro API access may require additional scopes depending on your UiPath version
  // If you get 403 errors, you may need to add more Orchestrator scopes
  const defaultScopes = 'offline_access OR.Tasks OR.Tasks.Read OR.Tasks.Write OR.Folders OR.Folders.Read PIMS';
  const scopes = import.meta.env.VITE_UIPATH_SCOPE || defaultScopes;
  
  // CRITICAL: redirectUri must match EXACTLY what's configured in UiPath External App
  // In dev mode, ALWAYS use localhost (don't trust window.location.origin as it might be from OAuth redirect)
  // In production, use the configured value or window.location.origin
  let redirectUri: string;
  if (import.meta.env.VITE_UIPATH_REDIRECT_URI) {
    // Explicitly set in env - use it
    redirectUri = import.meta.env.VITE_UIPATH_REDIRECT_URI;
  } else if (import.meta.env.DEV) {
    // Development mode - ALWAYS use localhost:5173 (or detect port if on localhost)
    // This ensures OAuth redirects go back to localhost even if page loaded from UiPath redirect
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // We're actually on localhost, use the current port (might be 5173, 5174, etc.)
      redirectUri = window.location.origin;
    } else {
      // We're not on localhost (probably redirected from OAuth or page loaded from UiPath)
      // Force localhost:5173 - user can override with VITE_UIPATH_REDIRECT_URI if using different port
      redirectUri = 'http://localhost:5173';
    }
  } else {
    // Production mode - use window.location.origin
    redirectUri = window.location.origin;
  }
  
  // Debug: Log what we detected
  if (import.meta.env.DEV) {
    console.log('🔍 Redirect URI Debug:', {
      isDev: import.meta.env.DEV,
      hostname: window.location.hostname,
      origin: window.location.origin,
      finalRedirectUri: redirectUri,
      hasEnvVar: !!import.meta.env.VITE_UIPATH_REDIRECT_URI,
    });
  }
  
  // Log configuration for debugging (especially important for cloud deployments)
  console.log('🔧 Auth Configuration:', {
    mode: import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION',
    baseUrl,
    redirectUri,
    orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
    tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
    hasClientId: !!(import.meta.env.VITE_UIPATH_CLIENT_ID),
    scopes: scopes.substring(0, 50) + '...', // Truncate for readability
    corsProxy: useCorsProxy && import.meta.env.DEV ? 'ENABLED (using proxy)' : 'DISABLED',
  });
  
  // CRITICAL WARNING: The redirect URI MUST be registered in UiPath External App
  if (import.meta.env.DEV) {
    console.warn('⚠️  ⚠️  ⚠️  CRITICAL: Redirect URI Configuration ⚠️  ⚠️  ⚠️');
    console.warn('   Current redirect URI:', redirectUri);
    console.warn('   This EXACT URL must be registered in your UiPath External App!');
    console.warn('   Go to: UiPath Cloud → Admin → External Applications → Your App');
    console.warn('   Add this redirect URI:', redirectUri);
    if (!import.meta.env.VITE_UIPATH_REDIRECT_URI) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('   (Using current localhost URL)');
      } else {
        console.warn('   (Using default http://localhost:5173 - set VITE_UIPATH_REDIRECT_URI if using a different port)');
      }
    }
  }
  
  return {
    clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || 'your-client-id',
    orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
    tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
    baseUrl,
    redirectUri,
    scope: scopes,
  };
};

export const isMockMode = (): boolean => {
  return import.meta.env.VITE_MOCK_MODE === 'true';
};

export const getProcessKey = (): string | undefined => {
  return import.meta.env.VITE_MAESTRO_PROCESS_KEY || undefined;
};

export const getFolderId = (): string | undefined => {
  // Use environment variable if set, otherwise use hardcoded default folder key
  return import.meta.env.VITE_UIPATH_FOLDER_ID || '9a74c4c0-dc6f-4469-aeda-51d6a1711de5';
};

// Entity ID for LOLoanDetails entity
export const LO_LOAN_DETAILS_ENTITY_ID = 'e9b82946-00d9-f011-8d4c-000d3a315d7a';

/**
 * Gets the basename for React Router from the redirect URI or window location.
 * 
 * This is needed when the deployed app redirects to origin (staging.uipath.com or alpha.uipath.com)
 * after authentication. The basename ensures routes work correctly in the deployed environment.
 * 
 * @returns The basename path (e.g., "/app-name" or "/")
 */
export const getBasename = (): string => {
  // Option 1: Parse from configured redirect URL (preferred method)
  const redirectUri = import.meta.env.VITE_UIPATH_REDIRECT_URI;
  if (redirectUri) {
    try {
      const url = new URL(redirectUri);
      const pathname = url.pathname;
      // If pathname is "/" or empty, no basename needed
      if (pathname === '/' || pathname === '') {
        return '/';
      }
      // Remove trailing slash if present, but keep leading slash
      const basename = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
      
      // Log for debugging
      console.log('🔍 Router Basename:', {
        source: 'redirect URI',
        redirectUri,
        basename,
      });
      
      return basename;
    } catch (e) {
      console.error("Error parsing redirect URI for basename:", e);
    }
  }
  
  // Option 2: Parse from current window location (fallback)
  // This handles cases where the app is deployed and the pathname contains the app path
  // Only use this in production (not in dev mode)
  if (!import.meta.env.DEV) {
    try {
      const currentPath = window.location.pathname;
      // If we're at root, return "/"
      if (currentPath === '/') {
        return '/';
      }
      
      // Extract the base path (everything before the route)
      // For example, if pathname is "/app-name/dashboard", return "/app-name"
      const segments = currentPath.split('/').filter(Boolean);
      if (segments.length > 0) {
        // Check if the first segment looks like a route (common routes)
        const commonRoutes = ['dashboard', 'login', 'analytics', 'loans', 'applications', 'documents', 'compliance', 'settings'];
        if (commonRoutes.includes(segments[0])) {
          // We're already at a route, so no basename needed
          return '/';
        }
        // Otherwise, use the first segment as basename
        const basename = `/${segments[0]}`;
        
        // Log for debugging
        console.log('🔍 Router Basename:', {
          source: 'window location',
          pathname: window.location.pathname,
          basename,
        });
        
        return basename;
      }
    } catch (e) {
      console.error("Error parsing window location for basename:", e);
    }
  }
  
  // Default: no basename (for localhost development)
  return '/';
};

