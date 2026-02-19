import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ClaimService } from '../services/claimService';
import { KPICard } from './ui/KPICard';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { getFolderId } from '../utils/config';
import { mapStepToAction, formatDueDate } from '../utils/stepMapper';
import { getPriorityAndRisk, getPriorityBadgeClass, getRiskFlagIcon } from '../utils/priorityAndRisk';
import { getClaimantName } from '../utils/nameMapper';
import type { Claim } from '../types/claim';

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

const formatClaimId = (claim: Claim): string => {
  // If caseId exists, extract last 4 digits and format as CLAIM-XXXX
  if (claim.caseId) {
    const lastFourDigits = claim.caseId.slice(-4);
    return `CLAIM-${lastFourDigits}`;
  }
  // Fallback to existing id if caseId is not available
  return claim.id;
};

const getStatusColor = (status: Claim['status']): string => {
  const colors = {
    'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Escalated': 'bg-red-100 text-red-800 border-red-200',
    'Denied': 'bg-gray-100 text-gray-800 border-gray-200',
    'Closed': 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

type QueueFilter = 'all' | 'assigned-to-me' | 'my-team' | 'escalations' | 'sla-risk';

// Simulate assignee information
const getClaimAssignee = (claim: Claim): string => {
  const assignees = ['Current User', 'Team Member A', 'Team Member B', 'Unassigned'];
  const hash = claim.id.charCodeAt(claim.id.length - 1) % assignees.length;
  return assignees[hash];
};

// Check if claim requires action today
const requiresActionToday = (claim: Claim): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastUpdated = new Date(claim.lastUpdated);
  lastUpdated.setHours(0, 0, 0, 0);
  
  return (
    claim.status === 'Under Review' &&
    (lastUpdated.getTime() === today.getTime() ||
     claim.documentsSubmitted.submitted < claim.documentsSubmitted.required)
  );
};

// Check if claim is at SLA risk (within 3+ days of last update)
const isSlaAtRisk = (claim: Claim): boolean => {
  const now = new Date();
  const lastUpdated = new Date(claim.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  return claim.status === 'Under Review' && daysSinceUpdate >= 3;
};

export const Dashboard = () => {
  const { sdk } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [showSecondaryMetrics, setShowSecondaryMetrics] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [demoSetupLoading, setDemoSetupLoading] = useState(false);
  const [demoSetupError, setDemoSetupError] = useState<string | null>(null);
  const [demoSetupResult, setDemoSetupResult] = useState<{ caseId: string } | null>(null);
  
  const claimService = new ClaimService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const folderId = getFolderId();
  const { data: claims, isLoading, error } = useQuery({
    queryKey: ['claims', folderId],
    queryFn: () => claimService.getCaseInstances(folderId, true),
  });

  // Calculate metrics based on all claims
  const metrics = useMemo(() => {
    if (!claims || claims.length === 0) {
      return {
        assignedToMe: 0,
        requiringActionToday: 0,
        escalations: 0,
        slaAtRisk: 0,
        avgHandlingTime: 0,
        approvalRate: 0,
        docsPending: 0,
        totalClaimValue: 0,
      };
    }

    // Assigned to Me = 3 most recently created instances (same logic as the filter)
    const assignedToMeClaims = [...claims].sort((a, b) => {
      const dateA = a.createdDate instanceof Date 
        ? a.createdDate 
        : (a.createdDate ? new Date(a.createdDate) : new Date(0));
      const dateB = b.createdDate instanceof Date 
        ? b.createdDate 
        : (b.createdDate ? new Date(b.createdDate) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 3);
    const assignedToMe = assignedToMeClaims.length;
    const requiringActionToday = claims.filter(requiresActionToday).length;
    const escalations = claims.filter(claim => claim.status === 'Escalated').length;
    const slaAtRisk = claims.filter(isSlaAtRisk).length;
    
    // Calculate average handling time
    const activeClaims = claims.filter(claim => claim.status === 'Under Review');
    const avgHandlingTime = activeClaims.length > 0
      ? activeClaims.reduce((sum, claim) => {
          const days = (new Date().getTime() - new Date(claim.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / activeClaims.length
      : 0;
    
    // Approval rate
    const reviewedClaims = claims.filter(claim => 
      claim.status === 'Approved' || claim.status === 'Under Review' || claim.status === 'Escalated'
    );
    const approvedClaims = claims.filter(claim => claim.status === 'Approved').length;
    const approvalRate = reviewedClaims.length > 0 ? (approvedClaims / reviewedClaims.length) * 100 : 0;
    
    // Docs pending
    const docsPending = claims.reduce((sum, claim) => {
      return sum + Math.max(0, claim.documentsSubmitted.required - claim.documentsSubmitted.submitted);
    }, 0);

    // Total claim value
    const totalClaimValue = claims.reduce((sum, claim) => sum + claim.claimAmount, 0);

    return {
      assignedToMe,
      requiringActionToday,
      escalations,
      slaAtRisk,
      avgHandlingTime: Math.round(avgHandlingTime * 10) / 10,
      approvalRate: Math.round(approvalRate * 10) / 10,
      docsPending,
      totalClaimValue,
    };
  }, [claims]);

  // Filter claims based on queue selection
  const filteredClaims = useMemo(() => {
    if (!claims || claims.length === 0) return [];
    
    console.log(`Total claims: ${claims.length}`);
    console.log('All claim IDs:', claims.map(c => ({ id: c.id, caseId: c.caseId, caseInstanceId: c.caseInstanceId })));
    
    let filtered: Claim[] = [];
    
    switch (queueFilter) {
      case 'all':
        filtered = claims;
        break;
      case 'assigned-to-me':
        // Always show the three most recently created instances
        console.log('Assigned to Me filter - sorting by createdDate');
        console.log('Claims with createdDate:', claims.map(c => ({ 
          id: c.id, 
          createdDate: c.createdDate,
          createdDateType: typeof c.createdDate,
          isDate: c.createdDate instanceof Date
        })));
        filtered = [...claims].sort((a, b) => {
          const dateA = a.createdDate instanceof Date 
            ? a.createdDate 
            : (a.createdDate ? new Date(a.createdDate) : new Date(0));
          const dateB = b.createdDate instanceof Date 
            ? b.createdDate 
            : (b.createdDate ? new Date(b.createdDate) : new Date(0));
          const result = dateB.getTime() - dateA.getTime();
          console.log(`Comparing ${a.id} (${dateA.toISOString()}) vs ${b.id} (${dateB.toISOString()}) = ${result}`);
          return result;
        }).slice(0, 3);
        console.log('Assigned to Me - filtered to 3 most recent:', filtered.map(c => ({ id: c.id, createdDate: c.createdDate })));
        break;
      case 'my-team':
        filtered = claims.filter(claim => {
          const assignee = getClaimAssignee(claim);
          return assignee !== 'Unassigned' && assignee !== 'Current User';
        });
        break;
      case 'escalations':
        filtered = claims.filter(claim => claim.status === 'Escalated');
        break;
      case 'sla-risk':
        filtered = claims.filter(isSlaAtRisk);
        break;
      default:
        filtered = claims;
    }
    
    console.log(`Filter "${queueFilter}" resulted in ${filtered.length} claims`);
    console.log('Filtered claim IDs:', filtered.map(c => ({ id: c.id, caseId: c.caseId, caseInstanceId: c.caseInstanceId })));
    
    // Sort by most recent update (newest first) - skip for 'assigned-to-me' as it's already sorted and limited
    const sorted = queueFilter === 'assigned-to-me' 
      ? filtered 
      : [...filtered].sort((a, b) => {
          const dateA = a.lastUpdated instanceof Date 
            ? a.lastUpdated 
            : new Date(a.lastUpdated);
          const dateB = b.lastUpdated instanceof Date 
            ? b.lastUpdated 
            : new Date(b.lastUpdated);
          
          return dateB.getTime() - dateA.getTime();
        });
    
    // Map claimant names to random names and normalize claim type for "Assigned to Me"
    return sorted.map((claim) => ({
      ...claim,
      claimant: getClaimantName(claim.id),
      // For "Assigned to Me" queue, always show claim type as "Personal Injury - Auto"
      claimType: queueFilter === 'assigned-to-me' ? 'Personal Injury - Auto' : claim.claimType,
    }));
  }, [claims, queueFilter]);

  const handleRowClick = (claim: Claim) => {
    const instanceId = claim.caseInstanceId || claim.processInstanceId;
    navigate(`/claims/${instanceId}`);
  };

  const handleOpenConfigModal = () => {
    setShowConfigModal(true);
    setDemoSetupError(null);
    setDemoSetupResult(null);
  };

  const handleCloseConfigModal = () => {
    setShowConfigModal(false);
    setDemoSetupError(null);
    setDemoSetupResult(null);
  };

  const handleRunDemoSetup = async () => {
    setDemoSetupLoading(true);
    setDemoSetupError(null);
    setDemoSetupResult(null);
    try {
      const result = await claimService.runDemoSetup();
      setDemoSetupResult(result);
      queryClient.invalidateQueries({ queryKey: ['claims', folderId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Demo Setup failed.';
      setDemoSetupError(message);
    } finally {
      setDemoSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div 
        className="flex flex-col transition-all duration-300 min-h-screen"
        style={{ 
          marginLeft: 'var(--sidebar-width, 256px)',
          width: 'calc(100% - var(--sidebar-width, 256px))'
        }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[95%] mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Claims Queue</h1>
              <p className="text-gray-600 mt-1">Manage your active personal injury claims and track your workload</p>
            </div>

            {/* Queue Selector */}
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setQueueFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    queueFilter === 'all'
                      ? 'bg-uipath-orange text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setQueueFilter('my-team')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    queueFilter === 'my-team'
                      ? 'bg-uipath-orange text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  My Team
                </button>
                <button
                  onClick={() => setQueueFilter('assigned-to-me')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    queueFilter === 'assigned-to-me'
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
                title="Claims Assigned to Me"
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
                    title="Total Claim Value"
                    value={formatCurrency(metrics.totalClaimValue)}
                    description="Across my queue"
                    icon={
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
              )}
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {queueFilter === 'all' && 'All Cases'}
                  {queueFilter === 'assigned-to-me' && 'Assigned to Me'}
                  {queueFilter === 'my-team' && 'My Team'}
                  {queueFilter === 'escalations' && 'Escalations & Exceptions'}
                  {queueFilter === 'sla-risk' && 'SLA at Risk Cases'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredClaims.length} {filteredClaims.length === 1 ? 'case' : 'cases'} found
                </p>
              </div>
              
              {isLoading && (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading claims...</p>
                </div>
              )}

              {error && (
                <div className="p-12 text-center">
                  <div className="text-red-600 mb-4">Error loading claims</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && filteredClaims && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claim ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claimant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claim Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claim Type
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
                      {filteredClaims.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                            No cases found in this queue
                          </td>
                        </tr>
                      ) : (
                        filteredClaims.map((claim) => (
                          <tr
                            key={claim.id}
                            onClick={() => handleRowClick(claim)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatClaimId(claim)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {claim.claimant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(claim.claimAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {claim.claimType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(claim.status)}`}>
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const { priority } = getPriorityAndRisk(claim);
                                return (
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeClass(priority)}`}>
                                    {priority}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4">
                              {(() => {
                                const { riskFlags } = getPriorityAndRisk(claim);
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
                                const nextAction = mapStepToAction(claim.currentStep, claim);
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
                              <span className={claim.documentsSubmitted.submitted < claim.documentsSubmitted.required ? 'text-orange-600 font-medium' : ''}>
                                {claim.documentsSubmitted.submitted} / {claim.documentsSubmitted.required}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(claim.lastUpdated)}
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

        {/* Config button - bottom right */}
        <button
          type="button"
          onClick={handleOpenConfigModal}
          className="fixed bottom-6 right-6 p-2.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-uipath-orange focus:ring-offset-2"
          aria-label="Open demo setup and configuration"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Demo Setup modal */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleCloseConfigModal} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Demo Setup</h3>
                <button
                  type="button"
                  onClick={handleCloseConfigModal}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Triggers the demo setup webhook, waits 10 seconds, then verifies a new case instance was created in the last minute.
              </p>
              {demoSetupError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {demoSetupError}
                </div>
              )}
              {demoSetupResult && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-200">
                  <span className="font-medium">Done.</span> Case instance found: {demoSetupResult.caseId}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRunDemoSetup}
                  disabled={demoSetupLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-uipath-orange text-white font-medium text-sm hover:bg-uipath-orange/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-uipath-orange focus:ring-offset-2"
                >
                  {demoSetupLoading ? 'Running…' : 'Execute Demo Setup'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseConfigModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
