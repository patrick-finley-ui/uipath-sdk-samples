import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { UiPath, UiPathError } from '@uipath/uipath-typescript';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript';
import { USE_TEST_MODE, validateConfig } from '@/config/uipath.config';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sdk: UiPath | null;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; config: UiPathSDKConfig }> = ({
  children,
  config
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdk, setSdk] = useState<UiPath | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      // If in test mode, bypass authentication
      if (USE_TEST_MODE) {
        console.log('Running in TEST MODE - authentication bypassed');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        validateConfig();
        const uipathSDK = new UiPath(config);
        setSdk(uipathSDK);

        // Handle OAuth callback if present
        if (uipathSDK.isInOAuthCallback()) {
          await uipathSDK.completeOAuth();
          setIsAuthenticated(true);
        } else {
          // Check authentication status
          setIsAuthenticated(uipathSDK.isAuthenticated());
        }
      } catch (err) {
        console.error('Authentication initialization failed:', err);
        setError(err instanceof UiPathError ? err.message : 'Authentication failed');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, [config]);

  const login = async () => {
    if (USE_TEST_MODE) {
      setIsAuthenticated(true);
      return;
    }

    if (!sdk) {
      setError('SDK not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sdk.initialize();
      setIsAuthenticated(sdk.isAuthenticated());
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof UiPathError ? err.message : 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(`uipath_sdk_user_token-${config.clientId}`);
    sessionStorage.removeItem('uipath_sdk_oauth_context');
    sessionStorage.removeItem('uipath_sdk_code_verifier');

    setIsAuthenticated(false);
    setError(null);

    if (!USE_TEST_MODE) {
      setSdk(new UiPath(config));
    }
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



