import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

const REQUIRED_CONVERSATIONAL_SCOPE = 'ConversationalAgents';
const DEFAULT_CLAIMS_ASSISTANT_AGENT_ID = 1776514;
const DEFAULT_CLAIMS_ASSISTANT_FOLDER_ID = 2596817;

const ensureScopeIncludesConversationalAgents = (scopeValue: string): string => {
  const normalizedScopes = scopeValue
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  const hasConversationalScope = normalizedScopes.some(
    (scope) => scope.toLowerCase() === REQUIRED_CONVERSATIONAL_SCOPE.toLowerCase()
  );

  if (!hasConversationalScope) {
    normalizedScopes.push(REQUIRED_CONVERSATIONAL_SCOPE);
  }

  return Array.from(new Set(normalizedScopes)).join(' ');
};

export const getAuthConfig = (): UiPathSDKConfig => {
  // Determine if we should use CORS proxy (set VITE_USE_CORS_PROXY=true to enable)
  const useCorsProxy = import.meta.env.VITE_USE_CORS_PROXY === 'true';
  
  // baseUrl configuration
  let baseUrl: string;
  if (useCorsProxy && import.meta.env.DEV) {
    baseUrl = window.location.origin;
  } else {
    baseUrl = import.meta.env.VITE_UIPATH_BASE_URL || 'https://cloud.uipath.com';
  }

  // Default scopes for tasks and folders
  const defaultScopes = 'offline_access OR.Tasks OR.Tasks.Read OR.Tasks.Write OR.Folders OR.Folders.Read PIMS';
  const configuredScopes = import.meta.env.VITE_UIPATH_SCOPE || defaultScopes;
  const scopes = ensureScopeIncludesConversationalAgents(configuredScopes);
  
  // Redirect URI must match EXACTLY what's configured in UiPath External App
  let redirectUri: string;
  if (import.meta.env.VITE_UIPATH_REDIRECT_URI) {
    redirectUri = import.meta.env.VITE_UIPATH_REDIRECT_URI;
  } else if (import.meta.env.DEV) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      redirectUri = window.location.origin;
    } else {
      redirectUri = 'http://localhost:5173';
    }
  } else {
    redirectUri = window.location.origin;
  }
  
  // Log configuration for debugging
  if (import.meta.env.DEV) {
    console.log('🔧 Auth Configuration:', {
      mode: import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION',
      baseUrl,
      redirectUri,
      orgName: import.meta.env.VITE_UIPATH_ORG_NAME || 'your-organization',
      tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'your-tenant',
      hasClientId: !!(import.meta.env.VITE_UIPATH_CLIENT_ID),
      scopes: scopes.substring(0, 50) + '...',
    });
    
    console.warn('⚠️  CRITICAL: Redirect URI Configuration');
    console.warn('   Current redirect URI:', redirectUri);
    console.warn('   This EXACT URL must be registered in your UiPath External App!');
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

export const getCaseId = (): string => {
  // Case ID for personal injury claims
  return import.meta.env.VITE_CASE_ID || '3b73de73-32d9-458c-a2b5-833c6722c3fc';
};

export const getFolderId = (): string => {
  // Folder Key for personal injury claims
  return import.meta.env.VITE_UIPATH_FOLDER_ID || '17c3f2fb-9994-42bf-b49b-6c917c756dba';
};

export const getClaimsAssistantAgentId = (): number => {
  const configuredAgentId = Number.parseInt(
    import.meta.env.VITE_CLAIMS_ASSISTANT_AGENT_ID || '',
    10
  );

  if (Number.isNaN(configuredAgentId)) {
    return DEFAULT_CLAIMS_ASSISTANT_AGENT_ID;
  }

  return configuredAgentId;
};

export const getClaimsAssistantFolderId = (): number => {
  const configuredFolderId = Number.parseInt(
    import.meta.env.VITE_CLAIMS_ASSISTANT_FOLDER_ID || '',
    10
  );

  if (Number.isNaN(configuredFolderId)) {
    return DEFAULT_CLAIMS_ASSISTANT_FOLDER_ID;
  }

  return configuredFolderId;
};

/**
 * Gets the basename for React Router from the redirect URI or window location.
 */
export const getBasename = (): string => {
  const redirectUri = import.meta.env.VITE_UIPATH_REDIRECT_URI;
  if (redirectUri) {
    try {
      const url = new URL(redirectUri);
      const pathname = url.pathname;
      if (pathname === '/' || pathname === '') {
        return '/';
      }
      const basename = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
      return basename;
    } catch (e) {
      console.error("Error parsing redirect URI for basename:", e);
    }
  }
  
  if (!import.meta.env.DEV) {
    try {
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        return '/';
      }
      const segments = currentPath.split('/').filter(Boolean);
      const commonRoutes = ['dashboard', 'login', 'claims'];
      if (segments.length > 0 && !commonRoutes.includes(segments[0])) {
        return `/${segments[0]}`;
      }
    } catch (e) {
      console.error("Error parsing window location for basename:", e);
    }
  }
  
  return '/';
};
