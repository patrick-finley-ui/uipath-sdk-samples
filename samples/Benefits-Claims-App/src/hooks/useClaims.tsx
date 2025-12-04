import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Raw record shape as returned by the Data Fabric entity.
// The API uses ProperCase keys (e.g. AddressLine1, ApplicantFullName, CreateTime).
// Keep these names exactly as they come from the API so TypeScript matches reality.
export interface ClaimData {
  maestroProcessInstanceKey?: string;

  FolderId?: string;

  AddressLine1?: string;
  AddressVerifiedFlag?: boolean;
  IncomeVerifiedFlag?: boolean;

  ApplicationSubmittedAt?: string;
  EligibilityStatus?: string;
  EligibilityReason?: string;
  BenefitAmountMonthly?: string | number;
  BenefitStartDate?: string;
  BenefitEndDate?: string;

  ApplicantFullName?: string;
  ApplicantHouseholdSize?: number;
  ApplicantIncomeText?: string;

  caseWorkerEmail?: string;

  UpdatedBy?: string;
  UpdateTime?: string;
  Id?: string;
  RecordOwner?: string;
  CreatedBy?: string;
  CreateTime?: string;

  // Allow additional dynamic fields without breaking type checking
  [key: string]: unknown;
}

export interface ProcessedClaim {
  id: string;
  applicantName: string;
  eligibilityStatus: 'Pending' | 'Approved' | 'Denied' | 'Under Review';
  addressVerifiedFlag: boolean;
  incomeVerifiedFlag: boolean;
  caseWorkerName: string;
  applicationCreationTime: string;
  rawData: ClaimData;
}

const ENTITY_ID = 'bcb8f163-c5cf-f011-8196-00224882fdd3';

export const useClaims = () => {
  const { sdk } = useAuth();
  const [claims, setClaims] = useState<ProcessedClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the SDK to fetch data from the entity
      const response = await sdk.entities.getRecordsById(ENTITY_ID, {
        pageSize: 100,
        $orderby: 'UpdateTime desc',
      } as any);

      // Process the response data
      const processedClaims: ProcessedClaim[] = response.items.map((claim: ClaimData) => {
        // Extract caseworker name from email (caseWorkerEmail / CreatedBy field)
        const caseWorkerEmail = (claim.caseWorkerEmail || claim.CreatedBy || '') as string;
        const caseWorkerName = extractNameFromEmail(caseWorkerEmail);

        return {
          id: (claim.Id as string) || 'unknown',
          applicantName: claim.ApplicantFullName || 'Unknown Applicant',
          eligibilityStatus: claim.EligibilityStatus as 'Pending' | 'Approved' | 'Denied' | 'Under Review' || 'Pending',
          addressVerifiedFlag: claim.AddressVerifiedFlag ?? false,
          incomeVerifiedFlag: claim.IncomeVerifiedFlag ?? false,
          caseWorkerName,
          applicationCreationTime: claim.CreateTime || new Date().toISOString(),
          rawData: claim,
        };
      });

      setClaims(processedClaims);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch claims data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [sdk]);

  return { claims, isLoading, error, refetch: fetchClaims };
};

// Helper function to extract name from email
function extractNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return 'Unknown';
  }

  const localPart = email.split('@')[0];
  const parts = localPart.split(/[._-]/);

  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

