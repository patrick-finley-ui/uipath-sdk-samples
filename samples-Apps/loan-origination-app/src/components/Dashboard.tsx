import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoanService } from '../services/loanService';
import { KPICard } from './ui/KPICard';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { getFolderId } from '../utils/config';
import { mapStepToAction, formatDueDate } from '../utils/stepMapper';
import { getPriorityAndRisk, getPriorityBadgeClass, getRiskFlagIcon } from '../utils/priorityAndRisk';
import { getApplicantName } from '../utils/nameMapper';
import type { LoanApplication } from '../types/loan';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getStatusColor = (status: LoanApplication['status']): string => {
  const colors = {
    'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Escalated': 'bg-red-100 text-red-800 border-red-200',
    'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

type QueueFilter = 'assigned-to-me' | 'my-team' | 'escalations' | 'sla-risk';

// Simulate assignee information - in production this would come from the backend
const getLoanAssignee = (loan: LoanApplication): string => {
  // For demo purposes, assign loans based on ID pattern
  // In production, this would be a field on the loan object
  const assignees = ['Current User', 'Team Member A', 'Team Member B', 'Unassigned'];
  const hash = loan.id.charCodeAt(loan.id.length - 1) % assignees.length;
  return assignees[hash];
};

// Check if loan requires action today (simplified logic)
const requiresActionToday = (loan: LoanApplication): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastUpdated = new Date(loan.lastUpdated);
  lastUpdated.setHours(0, 0, 0, 0);
  
  // Requires action if: under review, not approved, and updated today or has pending docs
  return (
    loan.status === 'Under Review' &&
    (lastUpdated.getTime() === today.getTime() ||
     loan.documentsSubmitted.submitted < loan.documentsSubmitted.required)
  );
};

// Check if loan is at SLA risk (simplified logic - within 24-48h of deadline)
const isSlaAtRisk = (loan: LoanApplication): boolean => {
  // For demo: consider loans that are under review and haven't been updated in 2+ days
  const now = new Date();
  const lastUpdated = new Date(loan.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  return loan.status === 'Under Review' && daysSinceUpdate >= 2;
};

export const Dashboard = () => {
  const { sdk } = useAuth();
  const navigate = useNavigate();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('assigned-to-me');
  const [showSecondaryMetrics, setShowSecondaryMetrics] = useState(false);
  
  const loanService = new LoanService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const folderId = getFolderId();
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['loans', folderId],
    queryFn: () => loanService.getCaseInstances(folderId, true), // Skip task names to avoid CORS errors
  });

  // Calculate metrics based on all loans
  const metrics = useMemo(() => {
    if (!loans || loans.length === 0) {
      return {
        assignedToMe: 0,
        requiringActionToday: 0,
        escalations: 0,
        slaAtRisk: 0,
        avgHandlingTime: 0,
        approvalRate: 0,
        docsPending: 0,
      };
    }

    // "Assigned to Me" button now shows team member cases (my-team filter)
    const assignedToMe = loans.filter(loan => {
      const assignee = getLoanAssignee(loan);
      return assignee !== 'Unassigned' && assignee !== 'Current User';
    }).length;
    const requiringActionToday = loans.filter(requiresActionToday).length;
    const escalations = loans.filter(loan => loan.status === 'Escalated').length;
    const slaAtRisk = loans.filter(isSlaAtRisk).length;
    
    // Calculate average handling time (simplified - days since last update for active loans)
    const activeLoans = loans.filter(loan => loan.status === 'Under Review');
    const avgHandlingTime = activeLoans.length > 0
      ? activeLoans.reduce((sum, loan) => {
          const days = (new Date().getTime() - new Date(loan.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / activeLoans.length
      : 0;
    
    // Approval rate (approved vs total reviewed)
    const reviewedLoans = loans.filter(loan => loan.status === 'Approved' || loan.status === 'Under Review' || loan.status === 'Escalated');
    const approvedLoans = loans.filter(loan => loan.status === 'Approved').length;
    const approvalRate = reviewedLoans.length > 0 ? (approvedLoans / reviewedLoans.length) * 100 : 0;
    
    // Docs pending across queue
    const docsPending = loans.reduce((sum, loan) => {
      return sum + Math.max(0, loan.documentsSubmitted.required - loan.documentsSubmitted.submitted);
    }, 0);

    return {
      assignedToMe,
      requiringActionToday,
      escalations,
      slaAtRisk,
      avgHandlingTime: Math.round(avgHandlingTime * 10) / 10,
      approvalRate: Math.round(approvalRate * 10) / 10,
      docsPending,
    };
  }, [loans]);

  // Filter loans based on queue selection, sorted by most recent update
  const filteredLoans = useMemo(() => {
    if (!loans || loans.length === 0) return [];
    
    let filtered: LoanApplication[] = [];
    
    switch (queueFilter) {
      case 'assigned-to-me':
        filtered = loans.filter(loan => getLoanAssignee(loan) === 'Current User');
        break;
      case 'my-team':
        // My Team shows all cases (no limit) - all loans except unassigned
        filtered = loans.filter(loan => {
          const assignee = getLoanAssignee(loan);
          return assignee !== 'Unassigned' && assignee !== 'Current User';
        });
        break;
      case 'escalations':
        filtered = loans.filter(loan => loan.status === 'Escalated');
        break;
      case 'sla-risk':
        filtered = loans.filter(isSlaAtRisk);
        break;
      default:
        filtered = loans;
    }
    
    // Sort by most recent update (newest first)
    // Create a copy to avoid mutating the original array
    const sorted = [...filtered].sort((a, b) => {
      // Ensure we're working with Date objects
      const dateA = a.lastUpdated instanceof Date 
        ? a.lastUpdated 
        : new Date(a.lastUpdated);
      const dateB = b.lastUpdated instanceof Date 
        ? b.lastUpdated 
        : new Date(b.lastUpdated);
      
      // Get timestamps for comparison
      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      
      // Descending order (newest first) - if b is newer, return positive
      return timeB - timeA;
    });
    
    // Limit to most recent cases per queue:
    // - "Assigned to me" (queueFilter === 'assigned-to-me'): 3 most recent
    // - Other filtered queues (except "my-team"): 5 most recent
    // - "my-team": show all
    let limited = sorted;
    if (queueFilter === 'assigned-to-me') {
      limited = sorted.slice(0, 3);
    } else if (queueFilter !== 'my-team') {
      limited = sorted.slice(0, 5);
    }
    
    // Map applicant names to random names
    // Note: Button labels are swapped - "My Team" button uses 'assigned-to-me' filter
    // and "Assigned to Me" button uses 'my-team' filter
    // - First loan in "Assigned to Me" button (my-team filter) must be "John Sample"
    // - First loan in "My Team" button (assigned-to-me filter) must be "Andrew Walker"
    return limited.map((loan, index) => {
      let applicantName: string;
      
      if (queueFilter === 'my-team' && index === 0) {
        // "Assigned to Me" button uses 'my-team' filter - first loan must be "John Sample"
        applicantName = 'John Sample';
      } else if (queueFilter === 'assigned-to-me' && index === 0) {
        // "My Team" button uses 'assigned-to-me' filter - first loan must be "Andrew Walker"
        applicantName = 'Andrew Walker';
      } else {
        // Use deterministic name mapping for all other loans
        applicantName = getApplicantName(loan.id);
      }
      
      // Hardcode loan amount and product type for John Sample (first entry in "Assigned to Me")
      const isJohnSample = queueFilter === 'my-team' && index === 0;
      
      return {
        ...loan,
        applicant: applicantName,
        loanAmount: isJohnSample ? 1200000 : loan.loanAmount,
        productType: isJohnSample ? 'Home Mortgage' : loan.productType,
        documentsSubmitted: isJohnSample 
          ? { ...loan.documentsSubmitted, submitted: loan.documentsSubmitted.required }
          : loan.documentsSubmitted,
      };
    });
  }, [loans, queueFilter]);

  const handleRowClick = (loan: LoanApplication) => {
    // Use caseInstanceId if available, otherwise fall back to processInstanceId
    const instanceId = loan.caseInstanceId || loan.processInstanceId;
    navigate(`/loans/${instanceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 256px)' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Loan Queue</h1>
              <p className="text-gray-600 mt-1">Manage your active cases and track your workload</p>
            </div>

        {/* Queue Selector */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setQueueFilter('assigned-to-me')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                queueFilter === 'assigned-to-me'
                  ? 'bg-uipath-orange text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              My Team
            </button>
            <button
              onClick={() => setQueueFilter('my-team')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                queueFilter === 'my-team'
                  ? 'bg-uipath-orange text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setQueueFilter('escalations')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                queueFilter === 'escalations'
                  ? 'bg-uipath-orange text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Escalations
            </button>
            <button
              onClick={() => setQueueFilter('sla-risk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                queueFilter === 'sla-risk'
                  ? 'bg-uipath-orange text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              SLA at Risk
            </button>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Loans Assigned to Me"
            value={metrics.assignedToMe}
            icon={
              <svg className="w-6 h-6 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <KPICard
            title="Requiring Action Today"
            value={metrics.requiringActionToday}
            icon={
              <svg className="w-6 h-6 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title="Escalations / Exceptions"
            value={metrics.escalations}
            icon={
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <KPICard
            title="SLA at Risk"
            value={metrics.slaAtRisk}
            description="Next 24-48h"
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>

        {/* Secondary Metrics (Collapsible) */}
        <div className="mb-8">
          <button
            onClick={() => setShowSecondaryMetrics(!showSecondaryMetrics)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showSecondaryMetrics ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showSecondaryMetrics ? 'Hide' : 'Show'} Additional Metrics
          </button>
          
          {showSecondaryMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard
                title="Avg Handling Time"
                value={`${metrics.avgHandlingTime} days`}
                description="For my cases"
                icon={
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <KPICard
                title="Approval Rate"
                value={`${metrics.approvalRate}%`}
                description="For my cases"
                icon={
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <KPICard
                title="Docs Pending"
                value={metrics.docsPending}
                description="Across my queue"
                icon={
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>
          )}
        </div>

        {/* Process Instances Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {queueFilter === 'assigned-to-me' && 'Team Queue'}
              {queueFilter === 'my-team' && 'My Active Cases'}
              {queueFilter === 'escalations' && 'Escalations & Exceptions'}
              {queueFilter === 'sla-risk' && 'SLA at Risk Cases'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredLoans.length} {filteredLoans.length === 1 ? 'case' : 'cases'} found
            </p>
          </div>
          
          {isLoading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading loan applications...</p>
            </div>
          )}

          {error && (
            <div className="p-12 text-center">
              <div className="text-red-600 mb-4">Error loading loan applications</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && filteredLoans && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Flags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Required Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No cases found in this queue
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        onClick={() => handleRowClick(loan)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {loan.applicant}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(loan.loanAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {loan.productType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const { priority } = getPriorityAndRisk(loan);
                            return (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeClass(priority)}`}>
                                {priority}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const { riskFlags } = getPriorityAndRisk(loan);
                            if (riskFlags.length === 0) {
                              return <span className="text-xs text-gray-400">—</span>;
                            }
                            return (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {riskFlags.map((flag, index) => {
                                  const { icon: Icon, color, tooltip, label } = getRiskFlagIcon(flag);
                                  return (
                                    <div
                                      key={index}
                                      className="relative group flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100"
                                      title={tooltip}
                                    >
                                      <Icon className={`w-3.5 h-3.5 ${color} cursor-help flex-shrink-0`} />
                                      <span className={`text-xs font-medium ${color} cursor-help whitespace-nowrap`}>{label}</span>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {tooltip}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(() => {
                            const nextAction = mapStepToAction(loan.currentStep, loan);
                            return (
                              <div>
                                <div className="font-medium">{nextAction.action}</div>
                                {nextAction.blockingParty && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Blocked by: {nextAction.blockingParty}
                                  </div>
                                )}
                                {nextAction.dueBy && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {formatDueDate(nextAction.dueBy)}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className={loan.documentsSubmitted.submitted < loan.documentsSubmitted.required ? 'text-orange-600 font-medium' : ''}>
                            {loan.documentsSubmitted.submitted} / {loan.documentsSubmitted.required}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(loan.lastUpdated)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};

