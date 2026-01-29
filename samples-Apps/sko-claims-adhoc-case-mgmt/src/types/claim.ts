export interface Claim {
  id: string;
  processInstanceId: string; // Keep for backward compatibility
  caseInstanceId?: string; // Case instance ID
  caseId?: string; // Case ID from the Case Instance (e.g., "PIDEMO-323293939")
  claimant: string;
  claimAmount: number;
  claimType: string;
  status: 'Under Review' | 'Approved' | 'Escalated' | 'Denied' | 'Closed';
  currentStep: string;
  documentsSubmitted: {
    submitted: number;
    required: number;
  };
  lastUpdated: Date;
  createdDate?: Date; // Date when the case instance was created/started
  folderId: string;
  incidentDate?: Date;
  injuryType?: string;
}

export interface ProcessInstance {
  id: string;
  processKey: string;
  status: string;
  currentStep?: string;
  folderId: string;
  createdDate?: Date;
  lastUpdated?: Date;
}

export interface Task {
  id: string;
  title: string;
  type: string;
  status: 'Open' | 'In Progress' | 'Completed';
  assignee: string;
  createdDate: Date;
  dueDate?: Date;
  formUrl?: string;
  processInstanceId?: string; // Keep for backward compatibility
  caseInstanceId?: string; // Case instance ID
}

export interface ClaimMetadata {
  claimId: string;
  claimantName: string;
  claimAmount: number;
  claimType: string;
  submissionDate: Date;
  currentStatus: string;
  currentStep: string;
  stepStatus?: string;
  deadline?: Date;
  incidentDate?: Date;
  injuryType?: string;
  medicalRecords?: {
    submitted: number;
    required: number;
  };
}
