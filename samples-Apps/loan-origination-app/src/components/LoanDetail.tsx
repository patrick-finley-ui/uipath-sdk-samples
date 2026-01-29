import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { LoanService } from '../services/loanService';
import { Header } from './layout/Header';
import { LoanProgressBar } from './LoanProgressBar';
import { TaskList } from './TaskList';
import { getFolderId } from '../utils/config';
import { mapStepToAction, formatDueDate } from '../utils/stepMapper';
import { getApplicantName } from '../utils/nameMapper';
import type { LoanApplication } from '../types/loan';

// Helper function to get loan assignee (same as Dashboard)
const getLoanAssignee = (loan: LoanApplication): string => {
  const assignees = ['Current User', 'Team Member A', 'Team Member B', 'Unassigned'];
  const hash = loan.id.charCodeAt(loan.id.length - 1) % assignees.length;
  return assignees[hash];
};

// Helper function to get applicant name with special handling for first loan in "Assigned to Me"
const getApplicantNameForLoan = (loanId: string, instanceId: string | undefined, allLoans?: LoanApplication[]): string => {
  // If we have all loans, check if this is the first one in "Assigned to Me" list
  if (allLoans && allLoans.length > 0 && instanceId) {
    // Filter for "Assigned to Me" (which uses 'my-team' filter in Dashboard)
    // This shows loans assigned to team members (not Current User, not Unassigned)
    const filtered = allLoans.filter(loan => {
      const assignee = getLoanAssignee(loan);
      return assignee !== 'Unassigned' && assignee !== 'Current User';
    });
    
    // Sort by most recent update (newest first) - same as Dashboard
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.lastUpdated instanceof Date ? a.lastUpdated : new Date(a.lastUpdated);
      const dateB = b.lastUpdated instanceof Date ? b.lastUpdated : new Date(b.lastUpdated);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Check if this loan is the first one by comparing instanceId (more reliable than loanId)
    if (sorted.length > 0) {
      const firstLoan = sorted[0];
      const firstInstanceId = firstLoan.caseInstanceId || firstLoan.processInstanceId;
      if (firstInstanceId === instanceId) {
        return 'John Sample';
      }
    }
  }
  
  // Otherwise use deterministic mapping
  return getApplicantName(loanId);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const LoanDetail = () => {
  const { processInstanceId } = useParams<{ processInstanceId: string }>();
  const navigate = useNavigate();
  const { sdk } = useAuth();
  const queryClient = useQueryClient();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const loanService = new LoanService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const folderId = getFolderId() || 'default';
  const instanceId = processInstanceId; // Can be either caseInstanceId or processInstanceId

  const { data: metadata, isLoading: metadataLoading, refetch: refetchMetadata } = useQuery({
    queryKey: ['loan-metadata', instanceId],
    queryFn: () => loanService.getCaseInstanceById(instanceId!, folderId),
    enabled: !!instanceId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['loan-tasks', instanceId],
    queryFn: () => loanService.getTasksForCaseInstance(instanceId!, folderId),
    enabled: !!instanceId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch all loans to determine if this is the first loan in "Assigned to Me" list
  const { data: allLoans } = useQuery({
    queryKey: ['loans', folderId],
    queryFn: () => loanService.getCaseInstances(folderId, true),
    enabled: !!instanceId,
  });

  // Get the effective current step - use tasks to determine if metadata is stale
  const getEffectiveCurrentStep = (): string => {
    // If we have tasks, use the first open/in-progress task title as current step
    if (tasks && tasks.length > 0) {
      const openTask = tasks.find(
        task => task.status === 'Open' || task.status === 'In Progress'
      );
      if (openTask) {
        return openTask.title;
      }
      // If all tasks are completed, use the most recent task
      const completedTasks = tasks.filter(t => t.status === 'Completed');
      if (completedTasks.length > 0) {
        return completedTasks[completedTasks.length - 1].title;
      }
    }
    // Fallback to metadata currentStep
    return metadata?.currentStep || 'Initial Review';
  };

  // Handle escape key to close chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isChatOpen]);

  // Determine current stage based on metadata currentStep, tasks, and process instance status
  const getCurrentStage = (): number => {
    // If process instance is completed/approved, show 100% completion (stage 3)
    if (metadata?.currentStatus === 'Approved') {
      return 3; // Close & Notify (100% complete)
    }
    
    // Hard-coded rule: If there is an Action Task on the Case Instance, show Eligibility Analysis stage
    if (tasks && tasks.length > 0) {
      return 2; // Eligibility Analysis & determination
    }
    
    // Use effective current step (from tasks if available, otherwise metadata) to determine stage
    const currentStep = getEffectiveCurrentStep();
    const step = currentStep.toLowerCase();
    // Map currentStep names to stages - check more specific patterns first
    if (step.includes('final approval') || step.includes('close') || step.includes('notify')) {
      return 3; // Close & Notify
    }
    if (step.includes('eligibility') || step.includes('determination') || step.includes('credit check')) {
      return 2; // Eligibility Analysis & determination
    }
    // Check for document/intake first (before generic 'review' which could match 'Document Review')
    if (step.includes('document') || step.includes('intake') || step.includes('collection') || step.includes('initial review') || step.includes('waiting for')) {
      return 0; // Intake and Document Collection
    }
    // Risk Assessment - be more specific to avoid matching 'Initial Review' or 'Document Review'
    if (step.includes('risk') || step.includes('assessment') || (step.includes('review') && !step.includes('document') && !step.includes('initial'))) {
      return 1; // Risk Assessment
    }
    
    // If no open tasks and status is Under Review, show Risk Assessment
    if (metadata?.currentStatus === 'Under Review') {
      return 1; // Risk Assessment
    }
    
    return 0; // Default to Intake and Document Collection
  };

  if (!instanceId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Invalid loan ID</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (metadataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-900 font-medium mb-2">Loan not found</p>
            <p className="text-gray-600 mb-4">The loan application you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back to Dashboard Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900">
                Dashboard
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Loan {metadata.loanId}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Loan - {metadata.productType} - {getApplicantNameForLoan(metadata.loanId, instanceId, allLoans)}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {formatCurrency(metadata.loanAmount)} • {metadata.productType}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Simulate approval - redirect to dashboard
                  navigate('/dashboard');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  // Submit for review action
                  if (window.confirm('Submit this loan for final review?')) {
                    // TODO: Implement submit logic
                    console.log('Loan submitted for review');
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-uipath-orange rounded-lg hover:bg-uipath-orange-light transition-colors shadow-sm"
              >
                Submit for Review
              </button>
              <button
                onClick={() => {
                  // Request more info action
                  if (window.confirm('Request additional information from the applicant?')) {
                    // TODO: Implement request info logic
                    console.log('Requesting more information');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Request Info
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <LoanProgressBar currentStage={getCurrentStage()} />

        {/* Property Details - Subtle Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Sunset Beach Villa</h3>
              <p className="text-sm text-gray-600">123 Ocean Drive, Miami, Florida 33139</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Property Value</p>
              <p className="text-xl font-semibold text-gray-900">$1,500,000</p>
            </div>
          </div>
        </div>

        {/* Key Indicators - Status, DTI, LTV, Credit Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</div>
            <div className="mt-1">
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                {metadata.currentStatus}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">DTI Ratio</div>
            <div className="text-2xl font-bold text-gray-900">28.5%</div>
            <div className="text-xs text-gray-500 mt-1">Threshold: 43%</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">LTV Ratio</div>
            <div className="text-2xl font-bold text-gray-900">75%</div>
            <div className="text-xs text-gray-500 mt-1">25% Down Payment</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Credit Score</div>
            <div className="text-2xl font-bold text-gray-900">{metadata.creditScore !== undefined ? metadata.creditScore : '740'}</div>
            <div className="text-xs text-gray-500 mt-1">Excellent</div>
          </div>
        </div>

        {/* Quadrant Layout: 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Left: Agent Analysis */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Analysis</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
              <div className="space-y-6">
                {/* Risk Score Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Score</h3>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Overall Risk</p>
                        <p className="text-3xl font-bold text-gray-900">40%</p>
                      </div>
                      <div className="relative w-20 h-20">
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.4)}`}
                            strokeLinecap="round"
                            className="text-blue-600 transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-600">40%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30" />
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-500 via-yellow-500"
                            style={{ width: '40%' }}
                          />
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                            style={{ left: '40%' }}
                          />
                        </div>
                        <div className="flex gap-1 text-xs">
                          <span className="text-green-600 font-medium">Low</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-yellow-600 font-medium">Med</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-red-600 font-medium">High</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold text-blue-700">Moderate Risk:</span> Application shows acceptable risk profile with strong credit and stable employment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerts Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Alerts</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {metadata.riskScore !== undefined && metadata.riskScore > 7 && (
                        <>High risk score detected. Review: Jumbo loans often require significant post-closing reserves (6–12+ months of PITI).</>
                      )}
                      {(!metadata.riskScore || metadata.riskScore <= 7) && (
                        <>Review: Jumbo loans often require significant post-closing reserves (6–12+ months of PITI).</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Summary Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {metadata.creditScore !== undefined ? (
                        <>Strong financial profile with a FICO score of {metadata.creditScore}, stable employment history, and sufficient liquid assets.</>
                      ) : (
                        <>Strong financial profile with stable employment history and sufficient liquid assets.</>
                      )}
                      {metadata.income !== undefined && metadata.loanAmount !== undefined && (
                        <> The loan-to-income ratio is {Math.round((metadata.loanAmount / metadata.income) * 100)}%.</>
                      )}
                      {metadata.propertyValue !== undefined && metadata.loanAmount !== undefined && (
                        <> The LTV ratio is {Math.round((metadata.loanAmount / metadata.propertyValue) * 100)}%, indicating a healthy down payment capability.</>
                      )}
                      {!metadata.income && !metadata.propertyValue && (
                        <> The DTI ratio is within acceptable limits at 40%, and the LTV ratio is 80%, indicating a healthy down payment capability.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Tasks & Actions */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks & Actions</h2>
            <div className="flex-1 min-h-0">
              <TaskList
                tasks={tasks || []}
                isLoading={tasksLoading}
                processInstanceId={instanceId}
                caseInstanceId={instanceId}
                onTaskComplete={async () => {
                  // Invalidate and refetch both queries when a task is completed
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['loan-metadata', instanceId] }),
                    queryClient.invalidateQueries({ queryKey: ['loan-tasks', instanceId] }),
                    refetchMetadata(),
                    refetchTasks(),
                  ]);
                }}
              />
            </div>
          </div>

          {/* Bottom Left: Financial Details */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 flex-1">
              {metadata.loanAmountRequest !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loan Amount Requested</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{formatCurrency(metadata.loanAmountRequest)}</dd>
                </div>
              )}
              {metadata.propertyValue !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Value</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{formatCurrency(metadata.propertyValue)}</dd>
                </div>
              )}
              {metadata.downPayment !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Down Payment</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{formatCurrency(metadata.downPayment)}</dd>
                </div>
              )}
              {metadata.propertyValue !== undefined && metadata.downPayment !== undefined && (
                <div className="pt-3 border-t border-gray-200">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">LTV Ratio</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">
                    {Math.round(((metadata.propertyValue - metadata.downPayment) / metadata.propertyValue) * 100)}%
                  </dd>
                </div>
              )}
              {metadata.income !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annual Income</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{formatCurrency(metadata.income)}</dd>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">DTI Ratio</dt>
                <dd className="mt-1.5 text-lg font-semibold text-gray-900">40%</dd>
              </div>
              {metadata.term !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Term</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{metadata.term} months</dd>
                </div>
              )}
              {metadata.interestRate !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interest Rate</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-gray-900">{metadata.interestRate.toFixed(2)}%</dd>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Right: Applicant Information */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 flex-1">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant Name</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{getApplicantNameForLoan(metadata.loanId, instanceId, allLoans)}</dd>
              </div>
              {metadata.address && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">
                    {metadata.address.street && <div>{metadata.address.street}</div>}
                    {metadata.address.city && metadata.address.postalCode && (
                      <div>{metadata.address.city}, {metadata.address.postalCode}</div>
                    )}
                    {metadata.address.country && <div>{metadata.address.country}</div>}
                  </dd>
                </div>
              )}
              {metadata.creditScore !== undefined && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credit Score</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.creditScore}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Type</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.productType}</dd>
              </div>
              {metadata.purpose && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purpose</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.purpose}</dd>
                </div>
              )}
              {metadata.propertyType && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Property Type</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.propertyType}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submission Date</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{formatDate(metadata.submissionDate)}</dd>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Next Required Action</dt>
                <dd className="mt-1.5">
                  {(() => {
                    const currentStep = getEffectiveCurrentStep();
                    const nextAction = mapStepToAction(currentStep, undefined, tasks || []);
                    return (
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-gray-900">{nextAction.action}</div>
                        {nextAction.blockingParty && (
                          <div className="text-xs text-gray-500">
                            Blocked by: <span className="font-medium">{nextAction.blockingParty}</span>
                          </div>
                        )}
                        {nextAction.dueBy && (
                          <div className="text-xs text-gray-500">
                            {formatDueDate(nextAction.dueBy)}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Button - Floating in bottom right */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-uipath-orange text-white rounded-full shadow-lg hover:bg-uipath-orange-light transition-all duration-200 hover:scale-110 flex items-center justify-center"
        aria-label="Open AI Assistant Chat"
        title="AI Assistant Chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* AI Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">Loan Assistant</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
              aria-label="Close chat"
              title="Close (ESC)"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Chat iframe */}
          <div className="flex-1 overflow-hidden rounded-b-lg">
            <iframe
              src="https://staging.uipath.com/uipathstgss_updated/UiPathDefault/autopilotforeveryone_/conversational-agents/?agentId=36966&mode=embedded&title=Loan%20Assistant"
              className="w-full h-full border-0"
              title="Loan Assistant Chat"
              allow="camera; microphone; geolocation"
            />
          </div>
        </div>
      )}
    </div>
  );
};

