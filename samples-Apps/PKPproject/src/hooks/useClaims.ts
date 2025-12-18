import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClaims } from '@/services/claimsService';
import { uiPathConfig, USE_TEST_MODE } from '@/config/uipath.config';
import { Claim } from '@/types/claims';

export const useClaims = () => {
  const { sdk, isAuthenticated } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadClaims = async () => {
    // In test mode, we don't need sdk to be initialized
    if (!USE_TEST_MODE && (!sdk || !isAuthenticated)) return;

    // In test mode, we only need to be authenticated (which is auto-set)
    if (USE_TEST_MODE && !isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchClaims(sdk, uiPathConfig.claimsEntityId || '');
      setClaims(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (USE_TEST_MODE && isAuthenticated) {
      loadClaims();
    } else if (sdk && isAuthenticated) {
      loadClaims();
    }
  }, [sdk, isAuthenticated]);

  return { claims, isLoading, error, refetch: loadClaims };
};
