export interface LoanApplication {
  id: string;
  processInstanceId: string; // Keep for backward compatibility
  caseInstanceId?: string; // Case instance ID
  applicant: string;
  loanAmount: number;
  productType: string;
  status: 'Under Review' | 'Approved' | 'Escalated' | 'Cancelled';
  currentStep: string;
  documentsSubmitted: {
    submitted: number;
    required: number;
  };
  lastUpdated: Date;
  folderId: string;
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

export interface LoanMetadata {
  loanId: string;
  applicantName: string;
  loanAmount: number;
  productType: string;
  submissionDate: Date;
  currentStatus: string;
  currentStep: string;
  stepStatus?: string;
  deadline?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  creditScore?: number;
  downPayment?: number;
  income?: number;
  loanAmountRequest?: number;
  propertyValue?: number;
  riskScore?: number;
  // Fields from LOLoanDetails entity
  term?: number;
  interestRate?: number;
  purpose?: string;
  propertyType?: string;
}

