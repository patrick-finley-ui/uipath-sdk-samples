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
        // Check for OAuth callback parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('error');
        
        if (hasOAuthParams) {
          console.log('🔐 OAuth callback detected:', {
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
        
        // Clean up OAuth params if authenticated
        if (authenticated && window.location.search.includes('code=')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          const newUrl = url.pathname + (url.search ? url.search : '');
          window.history.replaceState({}, '', newUrl);
          console.log('🧹 Cleaned up OAuth params');
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
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');
      const isInCallback = sdk.isInOAuthCallback();
      const isAuth = sdk.isAuthenticated();
      
      console.log('🔐 Login attempt:', {
        hasCode,
        isInOAuthCallback: isInCallback,
        isAuthenticated: isAuth,
      });

      // Handle OAuth callback if we have a code
      if (isInCallback && hasCode) {
        console.log('🔄 Processing OAuth callback in login...');
        await sdk.completeOAuth();
        setIsAuthenticated(sdk.isAuthenticated());
      } else if (!isAuth) {
        // Not authenticated - start OAuth flow
        // Create a fresh SDK instance to clear any stale OAuth state
        console.log('🔄 Creating fresh SDK instance...');
        const freshSdk = new UiPath(config);
        setSdk(freshSdk);
        console.log('🚀 Starting OAuth flow - redirecting to UiPath...');
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
