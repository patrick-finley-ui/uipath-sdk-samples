export type RiskLevel = 'High' | 'Medium' | 'Low';
export type CheckStatus = 'Flagged' | 'Clear' | 'Warning' | 'Pending';

export interface InvestigationCheck {
  id: string;
  name: string;
  agency: string;
  status: CheckStatus;
  details: string;
  timestamp: string;
  documentName?: string;
  documentType?: string;
}

export interface InvestigationSubject {
  id: string;
  name: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  riskLevel: RiskLevel;
  status: 'New' | 'In Progress' | 'Completed';
  flaggedChecks: number;
  totalChecks: number;
  lastUpdated: string;
  intelSummary: string;
  checks: InvestigationCheck[];
  isBulkPull: boolean;
}
