import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { ClaimService } from '../services/claimService';
import { Header } from './layout/Header';
import { ClaimProgressBar } from './ClaimProgressBar';
import { DocumentUploadTask } from './DocumentUploadTask';
import { getFolderId } from '../utils/config';
import { resolveAssetUrl } from '../utils/assetHelpers';
import { mapStepToAction, formatDueDate } from '../utils/stepMapper';
import { getClaimantName } from '../utils/nameMapper';

import carAccidentReport from '../assets/car_accident_report_front.gif';
import carImage from '../assets/car.jpg';
import medicalImage from '../assets/Medical-1.png';

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

const formatClaimId = (claimId: string, caseId?: string): string => {
  if (caseId) {
    const lastFourDigits = caseId.slice(-4);
    return `CLAIM-${lastFourDigits}`;
  }
  return claimId;
};

export const ClaimDetail = () => {
  const { caseInstanceId } = useParams<{ caseInstanceId: string }>();
  const navigate = useNavigate();
  const { sdk } = useAuth();
  const claimService = new ClaimService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const folderId = getFolderId() || 'default';
  const instanceId = caseInstanceId; // Case instance ID for maintaining integrity with UiPath entities

  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['claim-metadata', instanceId],
    queryFn: () => claimService.getCaseInstanceById(instanceId!, folderId),
    enabled: !!instanceId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['claim-tasks', instanceId],
    queryFn: () => claimService.getTasksForCaseInstance(instanceId!, folderId),
    enabled: !!instanceId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch all claims to determine claimant name
  const { data: allClaims } = useQuery({
    queryKey: ['claims', folderId],
    queryFn: () => claimService.getCaseInstances(folderId, true),
    enabled: !!instanceId,
  });

  // Find the claim to get caseId for entity lookup
  const claim = allClaims?.find(c => (c.caseInstanceId || c.processInstanceId) === instanceId);
  const caseId = claim?.caseId; // e.g., "PIDEMO-320339"

  // Fetch entity record using caseId
  const { data: entityRecord, isLoading: entityLoading, refetch: refetchEntity } = useQuery({
    queryKey: ['claim-entity', caseId],
    queryFn: () => claimService.getClaimEntityRecord(caseId!),
    enabled: !!caseId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Get InternalReview status (handle both PascalCase and camelCase field names)
  const internalReview = entityRecord?.InternalReview ?? entityRecord?.internalReview;
  
  // Determine UI state based on InternalReview status
  const isInternalReviewStarted = internalReview === 'Started';
  const isInternalReviewComplete = internalReview === 'Complete';
  
  // Show agent analysis, enable approve button, and show modal when InternalReview is "Started"
  const shouldShowAgentAnalysis = entityRecord && isInternalReviewStarted;
  
  // Show document upload task when InternalReview is NOT "Started" and NOT "Complete"
  const shouldShowDocumentUpload = entityRecord && !isInternalReviewStarted && !isInternalReviewComplete;
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planModalTab, setPlanModalTab] = useState<'summary' | 'images'>('summary');
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Images from src/assets – bundled by Vite and resolved for deployed app path
  const modalImages = [
    { src: carAccidentReport, label: 'Car Accident Report' },
    { src: carImage, label: 'Vehicle' },
    { src: medicalImage, label: 'Medical' },
  ];

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

  // Handle approval action
  const handleApprove = async () => {
    if (!shouldShowAgentAnalysis || !entityRecord) {
      return;
    }

    // Get the entity record Id that matches the CaseId from the selected claim
    // This entityRecord was fetched by matching the caseId from the claim selected on Dashboard
    // The recordId is the unique identifier for this specific entity record
    const recordId = entityRecord.Id || entityRecord.id;
    
    if (!recordId) {
      alert('Error: Could not find record ID for this claim.');
      return;
    }

    // Verify we have the correct caseId match
    const entityCaseId = entityRecord.CaseId || entityRecord.caseId;
    if (entityCaseId !== caseId) {
      console.warn('Warning: Entity record CaseId does not match selected claim caseId', {
        entityCaseId,
        selectedCaseId: caseId,
      });
    }

    console.log('Sending approval webhook with entity record ID:', {
      recordId,
      caseId: entityCaseId,
      selectedCaseId: caseId,
    });

    // Webhook URL - use window.location.origin in development (with proxy), direct URL in production
    const WEBHOOK_PATH = '/uipathlabs/Playground/orchestrator_/t/12b29e74-5ca3-40ee-84d5-849dbc279bba/review-complete';
    const WEBHOOK_URL = import.meta.env.DEV
      ? `${window.location.origin}${WEBHOOK_PATH}`
      : `https://staging.uipath.com${WEBHOOK_PATH}`;
    const BEARER_TOKEN = 'rt_857C11F7016B4B7823F5C9C1B1C3C540522092F3AC82CC7564D558C81236970C-1';

    setIsApproving(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: recordId, // Entity record Id that matches the CaseId from the selected claim
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook request failed: ${response.status} - ${errorText}`);
      }

      // Show success notification
      alert('Claim approved successfully!');
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error approving claim:', error);
      alert(`Failed to approve claim: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Get the effective current step
  const getEffectiveCurrentStep = (): string => {
    if (tasks && tasks.length > 0) {
      const openTask = tasks.find(
        task => task.status === 'Open' || task.status === 'In Progress'
      );
      if (openTask) {
        return openTask.title;
      }
      const completedTasks = tasks.filter(t => t.status === 'Completed');
      if (completedTasks.length > 0) {
        return completedTasks[completedTasks.length - 1].title;
      }
    }
    return metadata?.currentStep || 'Initial Review';
  };

  // Determine current stage based on InternalReview status
  const getCurrentStage = (): number => {
    // If InternalReview is "Complete", show Resolution & Settlement (stage 3)
    if (isInternalReviewComplete) {
      return 3; // Resolution & Settlement
    }
    
    // If InternalReview is "Started", show Medical Evaluation & Assessment (stage 2)
    if (isInternalReviewStarted) {
      return 2; // Medical Evaluation & Assessment
    }
    
    // Otherwise, show Investigation & Review (stage 1)
    return 1; // Investigation & Review
  };

  if (!instanceId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Invalid claim ID</p>
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
            <p className="text-gray-900 font-medium mb-2">Claim not found</p>
            <p className="text-gray-600 mb-4">The claim you're looking for doesn't exist.</p>
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

  // Use the claim found earlier for formatting
  const displayClaimId = formatClaimId(metadata.claimId, claim?.caseId);
  // Use the same name mapping as Dashboard to ensure consistency
  const claimantName = claim ? getClaimantName(claim.id) : (metadata.claimantName || 'Unknown Claimant');
  
  // Use same claim amount as Dashboard (from claims list); fallback to metadata or default
  const displayClaimAmount = claim?.claimAmount ?? metadata?.claimAmount ?? 62500;

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
            <li className="text-gray-900 font-medium">{displayClaimId}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Claim - Personal Injury - {claimantName}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {formatCurrency(displayClaimAmount)} • {metadata.claimType}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!shouldShowAgentAnalysis) return;
                  if (window.confirm('Approve this claim?')) {
                    handleApprove();
                  }
                }}
                disabled={!shouldShowAgentAnalysis || isApproving}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm ${
                  shouldShowAgentAnalysis && !isApproving
                    ? 'text-white bg-green-600 hover:bg-green-700 cursor-pointer'
                    : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                }`}
                title={!shouldShowAgentAnalysis ? 'Internal review must be started to approve this claim' : undefined}
              >
                {isApproving ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Request additional information for this claim?')) {
                    // TODO: Implement request info logic
                    console.log('Requesting additional information');
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
        <ClaimProgressBar currentStage={getCurrentStage()} />

        {/* Key Data Points - Personal Injury Claim Cards */}
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
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Claim Amount</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(displayClaimAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">Requested</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Medical Records</div>
            <div className="text-2xl font-bold text-gray-900">
              {shouldShowAgentAnalysis
                ? '7/7'
                : metadata.medicalRecords
                  ? `${metadata.medicalRecords.submitted}/${metadata.medicalRecords.required}`
                  : '5/7'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Submitted</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Days Since Incident</div>
            <div className="text-2xl font-bold text-gray-900">
              {metadata.incidentDate 
                ? Math.floor((new Date().getTime() - new Date(metadata.incidentDate).getTime()) / (1000 * 60 * 60 * 24))
                : '45'}
            </div>
            <div className="text-xs text-gray-500 mt-1">{metadata.injuryType || 'Personal Injury'}</div>
          </div>
        </div>

        {/* Quadrant Layout: 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Left: Agent Analysis */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Analysis</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
              <div className="space-y-6">
                {/* Layered Agent Analysis - only when InternalReview is "Started" */}
                {shouldShowAgentAnalysis && (
                  <>
                    {/* Aggregate Exposure Summary */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Aggregate Exposure Index</h3>
                        <p className="text-xs text-gray-500">
                          AI-derived blended view of medical, RTW, financial, legal, and operational signals.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-gray-900">35%</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                      setIsPlanModalOpen(true);
                      setPlanModalTab('summary');
                      setImageViewerIndex(0);
                    }}
                      className="inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900"
                    >
                      View full risk profile &amp; strategic plan
                      <svg
                        className="ml-1 h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 14.78a.75.75 0 001.06 0l6.22-6.22v4.69a.75.75 0 001.5 0v-6.5a.75.75 0 00-.75-.75h-6.5a.75.75 0 000 1.5h4.69l-6.22 6.22a.75.75 0 000 1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Clinical Trajectory Indicator */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Clinical Trajectory</h3>
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                          Improving
                        </span>
                      </div>
                    </div>

                    {/* Claim Outcome Projection */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Claim Outcome Projection</h3>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-2 text-sm text-gray-800">
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                          Outcome Projection (AI-estimated)
                        </p>
                        <ul className="space-y-1.5">
                          <li>• Medical stabilization expected in approximately 30–45 days.</li>
                          <li>• Return-to-work likelihood (modified/full duty) assessed as high.</li>
                          <li>• Claim escalation risk remains in the low–moderate band.</li>
                          {metadata.incidentDate && (
                            <li>
                              • Current treatment window is consistent with incident timing{' '}
                              {`(${formatDate(new Date(metadata.incidentDate))} onward).`}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* AI Recommendations (distinct from handler plan) */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Recommendations</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm text-gray-800">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Agent perspective – distinct from handler plan
                        </p>
                        <ul className="space-y-1.5">
                          <li>• Proceed with structured RTW planning now to reduce wage-loss tail.</li>
                          <li>• Defer IME escalation unless specialist notes contradict current improvement trend.</li>
                          <li>• Keep settlement discussions on hold until remaining records and RTW path are confirmed.</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* Show message when InternalReview is not "Started" */}
                {!shouldShowAgentAnalysis && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      Agent analysis will be available when internal review is started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Right: Tasks & Actions */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks & Actions</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1 space-y-4">
              {/* Document Upload Task - Show when InternalReview is NOT "Started" and NOT "Complete" */}
              {entityLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-uipath-orange"></div>
                </div>
              ) : shouldShowDocumentUpload && caseId ? (
                <DocumentUploadTask
                  caseId={caseId}
                  onUploadComplete={() => {
                    // Refetch entity record after upload
                    refetchEntity();
                    refetchTasks();
                  }}
                />
              ) : null}

              {/* Regular Tasks - Only show when InternalReview is "Started" (not Complete, not null/undefined) */}
              {isInternalReviewStarted && !isInternalReviewComplete && (
                <>
                  {tasksLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-uipath-orange"></div>
                    </div>
                  ) : tasks && tasks.length > 0 ? (
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">Assignee: {task.assignee}</p>
                          {task.dueDate && (
                            <p className="text-xs text-gray-600">Due: {formatDate(task.dueDate)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          1 active task
                        </span>
                      </div>
                      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Internal review pending approval</h3>
                        <p className="text-xs text-gray-600">
                          The internal review task is pending. Complete the review and use Approve or Request Info above.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Handler Notes & Attachments */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Handler Notes
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-uipath-orange focus:border-transparent resize-y min-h-[80px]"
                    placeholder="Capture key observations, decisions, and follow-ups for this claim..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Attach Files
                  </label>
                  <input
                    type="file"
                    multiple
                    className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <p className="text-[11px] text-gray-400">
                    This uploader is for demo purposes only; files are not persisted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left: Claim Details */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Details</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 flex-1">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Claim ID</dt>
                <dd className="mt-1.5 text-lg font-semibold text-gray-900">{displayClaimId}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Claimant Name</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{claimantName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Claim Type</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.claimType}</dd>
              </div>
              {metadata.incidentDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Incident Date</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">{formatDate(new Date(metadata.incidentDate))}</dd>
                </div>
              )}
              {metadata.injuryType && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Injury Type</dt>
                  <dd className="mt-1.5 text-sm font-medium text-gray-900">{metadata.injuryType}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submission Date</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">{formatDate(metadata.submissionDate)}</dd>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Next Required Action</dt>
                <dd className="mt-1.5">
                  {(() => {
                    const currentStep = getEffectiveCurrentStep();
                    const nextAction = mapStepToAction(currentStep, claim);
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

          {/* Bottom Right: Medical Information */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 flex-1">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Medical Records Status</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">
                  {shouldShowAgentAnalysis
                    ? '7 of 7 submitted'
                    : metadata.medicalRecords 
                      ? `${metadata.medicalRecords.submitted} of ${metadata.medicalRecords.required} submitted`
                      : '5 of 7 submitted'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Treatment Duration</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">
                  {metadata.incidentDate 
                    ? `${Math.floor((new Date().getTime() - new Date(metadata.incidentDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : '45 days'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Primary Provider</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">Metro General Hospital</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Specialist Referrals</dt>
                <dd className="mt-1.5 text-sm font-medium text-gray-900">2 referrals</dd>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Treatment Summary</dt>
                <dd className="mt-1.5 text-sm text-gray-700">
                  Ongoing physical therapy and specialist consultations. Medical records indicate consistent treatment 
                  progression with documented improvement. All treatment appears medically necessary and related to the incident.
                </dd>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Risk, Strategic Action Plan & Return to Work Modal */}
      {shouldShowAgentAnalysis && isPlanModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Risk &amp; Strategic Action Plan</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Consolidated view of risk drivers, recommended actions, and return to work trajectory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Main modal tabs: Summary vs Documents / Images */}
            <div className="border-b border-gray-200 px-6">
              <nav className="flex gap-1" aria-label="Modal sections">
                <button
                  type="button"
                  onClick={() => setPlanModalTab('summary')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    planModalTab === 'summary'
                      ? 'border-uipath-orange text-uipath-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Risk &amp; Plan Summary
                </button>
                <button
                  type="button"
                  onClick={() => setPlanModalTab('images')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    planModalTab === 'images'
                      ? 'border-uipath-orange text-uipath-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Documents / Images
                </button>
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
              {planModalTab === 'summary' && (
              <div className="space-y-6">
              {/* Aggregate Exposure & Risk Profile */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Aggregate Exposure Index</h3>
                    <p className="text-xs text-gray-500">
                      Composite view across medical, RTW, financial, legal, and operational risk dimensions.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">35%</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  {[
                    { label: 'Medical Risk', value: 'Low–Moderate' },
                    { label: 'Return to Work Risk', value: 'Moderate' },
                    { label: 'Financial Risk', value: 'Moderate' },
                    { label: 'Legal Risk', value: 'Low' },
                    { label: 'Operational Risk', value: 'Moderate' },
                  ].map((item) => (
                    <details
                      key={item.label}
                      className="group px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <summary className="flex items-center justify-between gap-4 list-none">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-50">
                            {item.value}
                          </span>
                          <svg
                            className="h-3 w-3 text-slate-500 group-open:rotate-180 transition-transform"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </summary>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <p className="text-[11px] font-semibold text-rose-700 mb-1">Drivers</p>
                          <ul className="space-y-1">
                            <li>• RTW uncertainty while specialist clearance is pending.</li>
                            <li>• Remaining records needed to fully bound settlement range.</li>
                          </ul>
                        </div>
                        <div className="bg-white border border-emerald-200 rounded-lg p-3">
                          <p className="text-[11px] font-semibold text-emerald-700 mb-1">Mitigations</p>
                          <ul className="space-y-1">
                            <li>• Consistent treatment and documented functional gains.</li>
                            <li>• Clear liability with no competing causation flagged.</li>
                          </ul>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {/* Strategic Action Plan */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Strategic Action Plan</h3>
                <p className="text-xs text-gray-500">
                  Objective: Progress the claim toward medical stabilization while minimizing indemnity and expense exposure.
                </p>
                <ol className="space-y-4 text-sm">
                  <li className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">1. Obtain remaining medical records (PT + specialist)</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-50">
                        High impact • Near term
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Rationale (AI): Required to confirm treatment plateau and tighten the settlement range.
                    </p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-700">
                      <span>Owner: <span className="font-semibold">Claims Adjuster</span></span>
                      <span>Target: <span className="font-semibold">+7 days</span></span>
                      <span>Risk if delayed: <span className="font-semibold">Settlement value uncertainty</span></span>
                    </div>
                  </li>

                  <li className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">2. Initiate RTW assessment with employer</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-50">
                        High impact • RTW
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Rationale (AI): Provider notes indicate functional improvement compatible with modified duty.
                    </p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-700">
                      <span>Owner: <span className="font-semibold">RTW Coordinator</span></span>
                      <span>Target: <span className="font-semibold">within 5 days</span></span>
                      <span>Risk if delayed: <span className="font-semibold">Extended wage-loss exposure</span></span>
                    </div>
                  </li>

                  <li className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">3. Schedule medical evaluation checkpoint</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-50">
                        Medium impact • Clinical
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Rationale (AI): 45-day post-incident checkpoint aligns with reassessment norms for this injury pattern.
                    </p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-gray-700">
                      <span>Owner: <span className="font-semibold">Nurse Case Manager</span></span>
                      <span>Target: <span className="font-semibold">within 14 days</span></span>
                      <span>Risk if delayed: <span className="font-semibold">Delayed clarity on medical stability</span></span>
                    </div>
                  </li>
                </ol>
              </section>

              {/* Return to Work Plan */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Return to Work Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">RTW Status</dt>
                    <dd className="text-gray-900">
                      In Progress <span className="text-xs text-gray-500">(AI confidence: 78%)</span>
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommended Path</dt>
                    <dd className="text-gray-900">
                      Modified duty (4–6 hrs/day), no lifting &gt; 20 lbs, remote/desk-based work preferred.
                    </dd>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-700">Functional Capacity Snapshot</dt>
                    <dd className="space-y-1 text-gray-700">
                      <p>• Mobility: Improving</p>
                      <p>• Lifting capacity: Up to 20 lbs comfortably</p>
                      <p>• Sitting/standing tolerance: 4–6 hrs/day with breaks</p>
                      <p>• Pain trend: Gradually decreasing under current plan</p>
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-700">Constraints &amp; Dependencies</dt>
                    <dd className="space-y-1 text-gray-700">
                      <p>• Pending specialist clearance (orthopedics)</p>
                      <p>• Employer accommodation required for modified duty</p>
                      <p>• No current legal hold identified</p>
                    </dd>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 text-xs text-gray-700 space-y-1.5">
                  <p>
                    <span className="font-semibold text-gray-900">Medical basis:</span> Physical therapy notes show functional improvement, no contraindications from primary provider, specialist opinion pending.
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Next checkpoint:</span> Reassess in 14 days or upon receipt of specialist report, whichever comes first.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    RTW risk: Moderate – initiating modified duty in a structured way is expected to reduce overall wage-loss exposure.
                  </p>
                </div>
              </section>
              </div>
              )}

              {planModalTab === 'images' && (
                <div className="flex flex-col h-full min-h-[400px]">
                  {/* Image sub-tabs */}
                  <div className="flex gap-1 mb-4 border-b border-gray-200 pb-2">
                    {modalImages.map((img, idx) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => setImageViewerIndex(idx)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          imageViewerIndex === idx
                            ? 'bg-uipath-orange/10 text-uipath-orange border border-uipath-orange/30'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                  {/* Image viewer – one image at a time */}
                  <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden min-h-[360px]">
                    <img
                      src={resolveAssetUrl(modalImages[imageViewerIndex].src)}
                      alt={modalImages[imageViewerIndex].label}
                      className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Button - Floating in bottom right */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-uipath-orange text-white rounded-full shadow-lg hover:bg-uipath-orange-light transition-all duration-200 hover:scale-110 flex items-center justify-center"
        aria-label="Open Claims Assistant Chat"
        title="Claims Assistant Chat"
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
            <h3 className="text-lg font-semibold text-gray-900">Claims Assistant</h3>
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
              src="https://staging.uipath.com/uipathlabs/Playground/autopilotforeveryone_/conversational-agents/?agentId=1714873&mode=embedded&title=Claims%20Assistant"
              className="w-full h-full border-0"
              title="Claims Assistant Chat"
              allow="camera; microphone; geolocation"
            />
          </div>
        </div>
      )}
    </div>
  );
};
