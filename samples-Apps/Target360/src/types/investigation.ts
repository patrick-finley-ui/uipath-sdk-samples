export type RiskLevel = 'High' | 'Medium' | 'Low';
export type CaseStatus = 'New' | 'AI Agent Review' | 'Analyst Review' | 'Completed';
export type CheckOutcome = 'Flagged' | 'Warning' | 'Clear';
export type DecisionState = 'Pending' | 'Finalized';
export type DataSource = 'Sanctions' | 'PEP' | 'Adverse Media' | 'Watchlists' | 'Financial' | 'Criminal Records';

export interface Investigation {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectNationality: string;
  subjectDob?: string;
  overallRisk: RiskLevel;
  caseStatus: CaseStatus;
  flaggedChecks: number;
  totalChecks: number;
  primaryRiskDrivers: DataSource[];
  intelSummary: string;
  lastActivity: string;
  decisionState: DecisionState;
  needsAttention: boolean;
  maestroProcessInstanceKey?: string;
  folderId?: string;
  maestroProcessTypeKey?: string;
  intelAnalystEmail?: string;
  isRandomized?: boolean;
}

export interface InvestigationFilters {
  riskLevels: RiskLevel[];
  caseStatuses: CaseStatus[];
  checkOutcomes: CheckOutcome[];
  dataSources: DataSource[];
  decisionStates: DecisionState[];
}

export interface InvestigationKPIs {
  activeCases: number;
  highRiskSubjects: number;
  casesRequiringReview: number;
  completedToday: number;
  overrides: number;
}

// Entity record type from UiPath
export interface TargetInvestigationEntity {
  Id?: string;
  subjectFirstName?: string;
  subjectLastName?: string;
  subjectId?: string;
  subjectNationality?: string;
  subjectName?: string;
  idDOB?: string; // Entity field name for date of birth
  caseStatus?: string;
  numChecksFlagged?: number;
  aiSummary?: string;
  primaryRiskDrivers?: string;
  LastActivity?: string;
  maestroProcessInstanceKey?: string;
  folderId?: string;
  risk?: string;
  maestroProcessTypeKey?: string;
  intelAnalystEmail?: string;
  UpdateTime?: string;
  CreateTime?: string;
}

// Investigation Check type
export interface InvestigationCheck {
  id: string;
  name: string;
  agency: string;
  status: CheckOutcome;
  details: string;
  timestamp: string;
  documentName: string;
  documentType: string;
}

// Investigation Subject type (detailed view)
export interface InvestigationSubject {
  id: string;
  name: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  riskLevel: RiskLevel;
  status: CaseStatus;
  flaggedChecks: number;
  totalChecks: number;
  lastUpdated: string;
  intelSummary: string;
  checks: InvestigationCheck[];
  isBulkPull: boolean;
}

// Maestro Process Variables Types
export interface AgentCheck {
  name: string;
  result: 'Pass' | 'Fail' | 'Inconclusive' | 'Warning';
  details: string;
}

export interface AgentOverallAssessment {
  risk_level: RiskLevel;
  summary: string;
}

export interface AgentOutput {
  type: 'agentOutput';
  output: {
    checks: AgentCheck[];
    overall_assessment: AgentOverallAssessment;
  };
  error: string | null;
}

export type AnalystDecision = 'Approve' | 'Escalate' | 'Report' | 'Clear';

export interface InvestigationProcessDetails {
  agentOutput?: AgentOutput;
  rawVariables?: any;
  loading: boolean;
  error?: string;
}