import { useState, useEffect } from 'react';
import { UiPath } from '@uipath/uipath-typescript';
import { uiPathConfig, USE_TEST_MODE } from '@/config/uipath.config';

export const useUiPathSDK = () => {
  const [sdk, setSdk] = useState<UiPath | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      // If in test mode, skip authentication and set ready state
      if (USE_TEST_MODE) {
        console.log('Running in TEST MODE - authentication bypassed');
        setIsAuthenticated(true);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      try {
        const uipathSDK = new UiPath({
          baseUrl: uiPathConfig.baseUrl,
          orgName: uiPathConfig.orgName,
          tenantName: uiPathConfig.tenantName,
          clientId: uiPathConfig.clientId,
          redirectUri: uiPathConfig.redirectUri,
          scope: uiPathConfig.scope,
        });

        setSdk(uipathSDK);

        // Check if we're in OAuth callback
        if (uipathSDK.isInOAuthCallback()) {
          await uipathSDK.completeOAuth();
          setIsAuthenticated(true);
          setIsInitialized(true);
        } else if (!uipathSDK.isAuthenticated()) {
          // Start OAuth flow
          await uipathSDK.initialize();
        } else {
          // Already authenticated
          setIsAuthenticated(true);
          setIsInitialized(true);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSDK();
  }, []);

  return { sdk, isInitialized, isAuthenticated, isLoading, error };
};


