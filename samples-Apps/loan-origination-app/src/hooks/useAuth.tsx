import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import {
  UiPath,
  UiPathError
} from '@uipath/uipath-typescript';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sdk: UiPath | null;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; config: UiPathSDKConfig }> = ({ children, config }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdk, setSdk] = useState<UiPath | null>(() => {
    const newSdk = new UiPath(config);
    return newSdk;
  });

  useEffect(() => {
    const initializeAuth = async () => {
      if (!sdk) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Log current URL for debugging OAuth callbacks
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('error');
        
        if (hasOAuthParams) {
          console.log('🔐 OAuth callback detected:', {
            url: currentUrl,
            hasCode: urlParams.has('code'),
            hasError: urlParams.has('error'),
            error: urlParams.get('error'),
            errorDescription: urlParams.get('error_description'),
          });
          
          // Check for OAuth errors in URL
          if (urlParams.has('error')) {
            const error = urlParams.get('error') || 'Unknown error';
            const errorDescription = urlParams.get('error_description') || error;
            throw new Error(`OAuth error: ${error} - ${errorDescription}`);
          }
        }

        // Handle OAuth callback if present
        if (sdk.isInOAuthCallback()) {
          console.log('🔄 Processing OAuth callback...');
          try {
            await sdk.completeOAuth();
            console.log('✅ OAuth callback completed successfully');
          } catch (oauthError) {
            console.error('❌ OAuth callback failed:', oauthError);
            throw oauthError;
          }
        }
        
        // Check authentication status
        const authenticated = sdk.isAuthenticated();
        console.log('🔍 Authentication status:', authenticated ? '✅ Authenticated' : '❌ Not authenticated');
        setIsAuthenticated(authenticated);
        
        // If we just completed OAuth and are authenticated, clean up OAuth params
        // React Router will handle navigation when the component re-renders
        if (authenticated && window.location.search.includes('code=')) {
          const url = new URL(window.location.href);
          
          // Remove OAuth params
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          
          // Update URL without OAuth params, keeping the current pathname
          // React Router will handle routing when AppContent re-renders with isAuthenticated=true
          const newUrl = url.pathname + (url.search ? url.search : '');
          window.history.replaceState({}, '', newUrl);
          console.log('🧹 Cleaned up OAuth params, path:', url.pathname);
        }
      } catch (err) {
        console.error('❌ Authentication initialization failed:', err);
        const errorMessage = err instanceof UiPathError 
          ? err.message 
          : err instanceof Error 
          ? err.message 
          : 'Authentication failed';
        setError(errorMessage);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [sdk]);

  const login = async () => {
    if (!sdk) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Log current state for debugging
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');
      const hasState = urlParams.has('state');
      const isInCallback = sdk.isInOAuthCallback();
      const isAuth = sdk.isAuthenticated();
      
      console.log('🔐 Login attempt:', {
        currentUrl,
        hasCode,
        hasState,
        isInOAuthCallback: isInCallback,
        isAuthenticated: isAuth,
      });

      // Only treat as callback if we actually have a code in the URL
      // The SDK might think we're in a callback due to stored state, but if there's no code,
      // we should start a fresh OAuth flow
      if (isInCallback && hasCode) {
        console.log('🔄 Processing OAuth callback in login...');
        await sdk.completeOAuth();
        setIsAuthenticated(sdk.isAuthenticated());
      } else if (!isAuth) {
        // Not authenticated - start OAuth flow
        // Clear any stale OAuth state from localStorage/sessionStorage
        // The SDK may store OAuth state that persists across page reloads
        try {
          // Clear common OAuth storage keys
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('oauth') || key.includes('uipath') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            console.log('🧹 Clearing stale storage key:', key);
            localStorage.removeItem(key);
          });
        } catch (e) {
          console.warn('⚠️  Could not clear storage:', e);
        }
        
        // Always create a fresh SDK instance to clear any stale OAuth state
        // This prevents issues where the SDK has stale state from a previous failed login attempt
        console.log('🔄 Creating fresh SDK instance to clear any stale OAuth state...');
        console.log('📋 SDK Config being used:', {
          clientId: config.clientId,
          baseUrl: config.baseUrl,
          redirectUri: config.redirectUri,
          orgName: config.orgName,
          tenantName: config.tenantName,
          scope: config.scope?.substring(0, 50) + '...',
        });
        const freshSdk = new UiPath(config);
        setSdk(freshSdk);
        console.log('🚀 Starting OAuth flow - redirecting to UiPath...');
        console.log('⚠️  IMPORTANT: Make sure the redirect URI below is registered in your UiPath External App:');
        console.log('   Redirect URI:', config.redirectUri);
        await freshSdk.initialize();
        // Note: initialize() will redirect, so we won't reach here unless there's an error
        setIsAuthenticated(freshSdk.isAuthenticated());
      } else {
        // Already authenticated
        console.log('✅ Already authenticated');
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
      const errorMessage = err instanceof UiPathError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setError(null);
    // Create new SDK instance for next login
    const newSdk = new UiPath(config);
    setSdk(newSdk);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        sdk,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

