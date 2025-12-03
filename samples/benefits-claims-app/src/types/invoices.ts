export type InvoiceStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Paid'
  | 'Under Review'
  | 'Processing';

export interface InvoiceRecord {
  invoiceId?: string;
  contractNumber?: string;
  vendorName?: string;
  userEmail?: string;
  shipmentNumber?: string;
  acceptanceDate?: string;
  invoiceTotal?: number;
  status?: string;
  recordOwner?: string;
  updatedBy?: string;
  id: string;
  createdBy?: string;
  createTime?: string;
  updateTime?: string;
  maestroProcessKey?: string;
  folderId?: string;
}

export interface InvoiceMetrics {
  totalInvoices: number;
  totalInvoiceValue: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  paid: number;
  averageInvoiceValue: number;
  invoicesByStatus: Record<string, number>;
}

export interface MatchEvaluation {
  MismatchType: string;
  Status: string;
  Severity: string;
  Reason: string;
  Justification: string;
}

export interface ClinData {
  clin?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  [key: string]: any;
}

export interface ScriptResponseData {
  clinsData: ClinData[];
  keyDetails: {
    contract_number_purchase_order?: string;
    contract_number_invoice?: string;
    contract_number_goods_receipt?: string;
    invoice_number_invoice?: string;
    invoice_number_goods_receipt?: string;
    [key: string]: any;
  };
  matchEvaluations: MatchEvaluation[];
  summaryData: {
    ContractNumber?: string;
    InvoiceNumber?: string;
    OverallStatus?: string;
    ChecksPerformed?: string;
    ChecksPassed?: string;
    ChecksFailed?: string;
    [key: string]: any;
  };
}

