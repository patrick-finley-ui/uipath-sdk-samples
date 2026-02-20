import { UiPath } from '@uipath/uipath-typescript';
import { Claim } from '@/types/claims';
import { USE_TEST_MODE } from '@/config/uipath.config';
import { TEST_CLAIMS } from '@/data/testData';

export const fetchClaims = async (
  sdk: UiPath | null,
  entityId: string
): Promise<Claim[]> => {
  // If in test mode, return dummy data
  if (USE_TEST_MODE) {
    console.log('Fetching test claims data...');
    // Simulate network delay for realistic behavior
    await new Promise(resolve => setTimeout(resolve, 500));
    return TEST_CLAIMS;
  }

  // Production mode - fetch from UiPath
  if (!sdk) {
    throw new Error('SDK not initialized');
  }

  try {
    const response = await sdk.entities.getRecordsById(entityId);
    return response.items as Claim[];
  } catch (error) {
    console.error('Failed to fetch claims:', error);
    throw new Error('Unable to load claims data. Please try again.');
  }
};


