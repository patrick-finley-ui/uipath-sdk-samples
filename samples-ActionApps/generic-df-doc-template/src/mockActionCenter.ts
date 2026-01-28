/**
 * Mock Action Center Data for Local Development
 * 
 * This file provides mock data to simulate Action Center task data
 * when running the app locally. Use this to test different configurations.
 * 
 * Usage:
 * 1. Import and call mockActionCenterData() in your component
 * 2. Or use the browser console to manually trigger: window.mockActionCenter()
 */

import sdk from './uipath';

// Example configurations
const exampleConfigs: Record<string, any> = {
  loan: {
    entityId: "f5cc0fa5-54dc-f011-8196-00224882fdd3",
    entityFields: {
      loanType: { label: "Loan Type", mapping: "loanType" },
      amount: { label: "Amount", mapping: "amount" },
      processingDate: { label: "Processing Date", mapping: "processingDate" },
      duration: { label: "Duration", mapping: "duration" },
      status: { label: "Status", mapping: "status" }
    },
    storageBucketId: 12345,
    filePath: "",
    readOnlyFields: {
      applicantName: { label: "Applicant Name", value: "John Doe" },
      loanAmount: { label: "Loan Amount", value: "50000" },
      creditScore: { label: "Credit Score", value: "750" }
    },
    aiAgentHTML: "<p><strong>AI Analysis:</strong> Applicant shows strong credit history with consistent payment patterns. Income verification completed. Recommendation: Approve with standard terms.</p>",
    outputFields: {
      riskFactor: { type: "string", required: true },
      reviewerComments: { type: "textarea", required: false }
    },
    outcomes: {
      Approve: { type: "string", label: "Accept Application" },
      Reject: { type: "string", label: "Reject Application" }
    }
  },
  
  invoice: {
    entityId: "invoice-entity-id-here",
    entityFields: {
      invoiceNumber: { label: "Invoice Number", mapping: "invoiceNumber" },
      vendorName: { label: "Vendor", mapping: "vendorName" },
      amount: { label: "Amount", mapping: "amount" },
      dueDate: { label: "Due Date", mapping: "dueDate" },
      status: { label: "Status", mapping: "status" }
    },
    storageBucketId: 12345,
    filePath: "invoices/2024/",
    readOnlyFields: {
      invoiceId: { label: "Invoice ID", value: "INV-2024-001234" },
      totalAmount: { label: "Total Amount", value: "12500.00" },
      vendor: { label: "Vendor", value: "Acme Corporation" },
      purchaseOrder: { label: "PO Number", value: "PO-2024-5678" }
    },
    aiAgentHTML: "<p><strong>AI Analysis:</strong> Invoice matches purchase order. All line items verified. Vendor payment terms confirmed. No discrepancies found.</p>",
    outputFields: {
      approvalStatus: { type: "string", required: true },
      approverNotes: { type: "textarea", required: false },
      paymentMethod: { type: "string", required: false }
    },
    outcomes: {
      Approve: { type: "string", label: "Approve Invoice" },
      Reject: { type: "string", label: "Reject Invoice" },
      RequestInfo: { type: "string", label: "Request More Information" }
    }
  },
  
  claim: {
    entityId: "claim-entity-id-here",
    entityFields: {
      claimNumber: { label: "Claim Number", mapping: "claimNumber" },
      claimType: { label: "Claim Type", mapping: "claimType" },
      claimAmount: { label: "Claim Amount", mapping: "claimAmount" },
      filedDate: { label: "Filed Date", mapping: "filedDate" },
      status: { label: "Status", mapping: "status" }
    },
    storageBucketId: 12345,
    filePath: "claims/",
    readOnlyFields: {
      claimId: { label: "Claim ID", value: "CLM-2024-98765" },
      policyNumber: { label: "Policy Number", value: "POL-123456789" },
      claimantName: { label: "Claimant Name", value: "Jane Smith" },
      incidentDate: { label: "Incident Date", value: "2024-01-15" },
      estimatedAmount: { label: "Estimated Amount", value: "15000.00" }
    },
    aiAgentHTML: "<p><strong>AI Analysis:</strong> Claim documentation is complete. Incident report verified. Policy coverage confirmed. Medical reports attached. Recommendation: Approve for processing.</p>",
    outputFields: {
      assessmentScore: { type: "integer", required: true },
      adjusterNotes: { type: "textarea", required: true },
      approvedAmount: { type: "number", required: false }
    },
    outcomes: {
      Approve: { type: "string", label: "Approve Claim" },
      Deny: { type: "string", label: "Deny Claim" },
      Investigate: { type: "string", label: "Require Investigation" }
    }
  },
  
  contract: {
    entityId: "contract-entity-id-here",
    entityFields: {
      contractNumber: { label: "Contract Number", mapping: "contractNumber" },
      contractType: { label: "Contract Type", mapping: "contractType" },
      startDate: { label: "Start Date", mapping: "startDate" },
      endDate: { label: "End Date", mapping: "endDate" },
      status: { label: "Status", mapping: "status" }
    },
    storageBucketId: 12345,
    filePath: "",
    readOnlyFields: {
      contractId: { label: "Contract ID", value: "CNT-2024-001" },
      vendor: { label: "Vendor/Supplier", value: "Global Services Inc." },
      contractValue: { label: "Contract Value", value: "250000.00" },
      department: { label: "Department", value: "Procurement" }
    },
    aiAgentHTML: "<p><strong>AI Analysis:</strong> Contract terms reviewed. All clauses standard. No red flags identified. Legal review completed. Ready for approval.</p>",
    outputFields: {
      reviewStatus: { type: "string", required: true },
      reviewerComments: { type: "textarea", required: true },
      riskLevel: { type: "string", required: false }
    },
    outcomes: {
      Approve: { type: "string", label: "Approve Contract" },
      Reject: { type: "string", label: "Reject Contract" },
      Revise: { type: "string", label: "Request Revisions" }
    }
  },
  
  onboarding: {
    entityId: "employee-entity-id-here",
    entityFields: {
      employeeId: { label: "Employee ID", mapping: "employeeId" },
      department: { label: "Department", mapping: "department" },
      startDate: { label: "Start Date", mapping: "startDate" },
      position: { label: "Position", mapping: "position" },
      status: { label: "Status", mapping: "status" }
    },
    storageBucketId: 12345,
    filePath: "onboarding/",
    readOnlyFields: {
      candidateName: { label: "Candidate Name", value: "Michael Johnson" },
      email: { label: "Email", value: "michael.johnson@company.com" },
      phone: { label: "Phone", value: "+1-555-0123" },
      offerDate: { label: "Offer Date", value: "2024-02-01" }
    },
    aiAgentHTML: "<p><strong>AI Analysis:</strong> All required documents submitted. Background check completed. References verified. Onboarding checklist 95% complete. Ready for final approval.</p>",
    outputFields: {
      approvalDecision: { type: "string", required: true },
      hrNotes: { type: "textarea", required: false },
      startDateConfirmed: { type: "string", required: false }
    },
    outcomes: {
      Approve: { type: "string", label: "Approve Onboarding" },
      Reject: { type: "string", label: "Reject Application" },
      Pending: { type: "string", label: "Request Additional Info" }
    }
  }
};

// Default loan application configuration for testing
const defaultLoanConfig = exampleConfigs.loan;

/**
 * Mock Action Center data structure
 */
export interface MockActionCenterData {
  data: any; // Task data including configuration
  baseUrl: string;
  orgName: string;
  tenantName: string;
  token: string;
  organizationUnitId: string;
  newToken?: string;
}

/**
 * Create mock Action Center data with a specific configuration
 */
export function createMockActionCenterData(config: any): MockActionCenterData {
  return {
    data: {
      ...config,
      // Add any output field initial values here
      riskFactor: '',
      reviewerComments: '',
    },
    baseUrl: 'https://platform.uipath.com',
    orgName: 'your-org',
    tenantName: 'default',
    token: 'mock-token-for-local-dev',
    organizationUnitId: 'mock-org-unit-id',
  };
}

// Store the registered callback so we can call it manually
let registeredCallback: ((data: any) => void) | null = null;

/**
 * Initialize mock Action Center data
 * Call this in your component or browser console for local testing
 * @param config - Configuration object or string name of example config ('loan', 'invoice', 'claim', 'contract', 'onboarding')
 */
export function mockActionCenterData(config?: any) {
  let mockConfig: any;
  
  // If config is a string, look up in example configs
  if (typeof config === 'string' && exampleConfigs[config]) {
    mockConfig = exampleConfigs[config];
    console.log(`📋 Loading example config: ${config}`);
  } else if (config) {
    mockConfig = config;
  } else {
    mockConfig = defaultLoanConfig;
    console.log('📋 Loading default config: loan');
  }
  
  const mockData = createMockActionCenterData(mockConfig);
  
  // Try to get the registered callback from the SDK
  // The SDK's getTaskDetailsFromActionCenter might store the callback
  // If not available, we'll need to call it directly from the component
  if (registeredCallback) {
    console.log('📞 Calling registered callback with mock data');
    registeredCallback(mockData);
  } else if (sdk.taskEvents && (sdk.taskEvents as any)._callback) {
    // Try to access internal callback if SDK stores it
    (sdk.taskEvents as any)._callback(mockData);
  } else {
    // Fallback: try to trigger via the SDK method (might work if SDK supports it)
    console.warn('⚠️ No registered callback found. Make sure the component has registered the callback first.');
    console.warn('💡 Try calling this after the page loads, or use window.triggerMockData() from the component');
  }
  
  console.log('✅ Mock Action Center data initialized:', mockData);
  return mockData;
}

// Export function to register callback (called from Form component)
export function registerMockCallback(callback: (data: any) => void) {
  registeredCallback = callback;
  console.log('✅ Mock callback registered');
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).mockActionCenter = (config?: any) => {
    return mockActionCenterData(config);
  };
  
  // Make example configs available
  (window as any).exampleConfigs = exampleConfigs;
  
  // Make loadExampleConfig available
  (window as any).loadExampleConfig = (configName: string) => {
    if (!exampleConfigs[configName]) {
      console.error(`❌ Config "${configName}" not found. Available: ${Object.keys(exampleConfigs).join(', ')}`);
      return;
    }
    mockActionCenterData(configName);
  };
  
  console.log('🔧 Mock helpers loaded! Available commands:');
  console.log('  - window.mockActionCenter() or window.mockActionCenter("loan")');
  console.log('  - window.loadExampleConfig("loan")');
  console.log('  - Available configs:', Object.keys(exampleConfigs).join(', '));
  
  // Auto-initialize with loan config for convenience
  // Comment this out if you want to manually trigger it
  // setTimeout(() => mockActionCenterData(), 1000);
}
