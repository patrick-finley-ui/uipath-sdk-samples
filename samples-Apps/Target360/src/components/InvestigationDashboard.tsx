import { useState, useEffect, useMemo } from 'react';
import { StartStrategy, JobPriority } from '@uipath/uipath-typescript';
import { Sidebar } from './Sidebar';
import { KPICards } from './KPICards';
import { FilterControls } from './FilterControls';
import { InvestigationTable } from './InvestigationTable';
import { InvestigationDetails } from './InvestigationDetails';
import { StartInvestigationModal } from './modals/StartInvestigationModal';
import { SettingsPage } from './SettingsPage';
import { generateMockInvestigations, calculateKPIs } from '../services/mockInvestigations';
import { USE_MOCK_DATA, ENTITY_CONFIG } from '../config/mockData.config';
import { mapEntitiesToInvestigations } from '../utils/investigationMapper';
import type { Investigation, InvestigationFilters, TargetInvestigationEntity, AgentOutput } from '../types/investigation';
import type { UiPath } from '@uipath/uipath-typescript';

interface InvestigationDashboardProps {
  sdk?: UiPath;
}

export const InvestigationDashboard = ({ sdk }: InvestigationDashboardProps) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [allInvestigations, setAllInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<InvestigationFilters>({
    riskLevels: [],
    caseStatuses: [],
    checkOutcomes: [],
    dataSources: [],
    decisionStates: [],
  });

  // Sorting state - initially sort by last updated descending
  type SortField = 'subjectName' | 'subjectId' | 'overallRisk' | 'caseStatus' | 'flaggedChecks' | 'lastActivity';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Start Investigation Modal state
  const [isStartInvestigationModalOpen, setIsStartInvestigationModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [analystEmail, setAnalystEmail] = useState('');
  const [isStartingProcess, setIsStartingProcess] = useState(false);
  const [startProcessError, setStartProcessError] = useState<string | null>(null);

  // Demo Reset Time state
  const [demoResetTime, setDemoResetTime] = useState<string | null>(() => {
    const stored = localStorage.getItem('target360_demo_reset_time');
    return stored || null;
  });

  // Investigation Details state
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [processDetails, setProcessDetails] = useState<{
    agentOutput?: AgentOutput;
    rawVariables?: any;
    loading: boolean;
    error?: string;
  }>({ loading: false });

  const fetchInvestigations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockData = generateMockInvestigations(47);
        setAllInvestigations(mockData);
      } else {
        // Fetch from UiPath SDK
        if (!sdk) {
          throw new Error('SDK not initialized. Please authenticate first.');
        }

        const records = await sdk.entities.getRecordsById(ENTITY_CONFIG.entityId, {
          pageSize: ENTITY_CONFIG.pageSize,
          $orderby: ENTITY_CONFIG.orderBy,
        });

        const investigations = mapEntitiesToInvestigations(
          records.items as TargetInvestigationEntity[],
          demoResetTime
        );
        setAllInvestigations(investigations);
      }
    } catch (err) {
      console.error('Error fetching investigations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch investigations');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchInvestigations(true);
  };

  const handleResetTimeToNow = () => {
    const now = new Date().toISOString();
    setDemoResetTime(now);
    localStorage.setItem('target360_demo_reset_time', now);
    fetchInvestigations(true);
  };

  const handleClearResetTime = () => {
    setDemoResetTime(null);
    localStorage.removeItem('target360_demo_reset_time');
    fetchInvestigations(true);
  };

  const fetchProcessDetails = async (investigation: Investigation) => {
    if (!investigation.maestroProcessInstanceKey || !investigation.folderId) {
      setProcessDetails({ loading: false, error: 'No process instance associated with this investigation' });
      return;
    }

    if (!sdk) {
      setProcessDetails({ loading: false, error: 'SDK not initialized' });
      return;
    }

    // Check if SDK is authenticated
    if (!sdk.isAuthenticated()) {
      setProcessDetails({
        loading: false,
        error: 'SDK is not authenticated. Please log in again.'
      });
      return;
    }

    try {
      setProcessDetails({ loading: true });

      // Use folderId as-is (could be string or number, SDK handles both)
      const folderId = investigation.folderId;
      const processInstanceKey = investigation.maestroProcessInstanceKey;

      // Validate the process instance key format (should be a UUID)
      if (!processInstanceKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(processInstanceKey)) {
        throw new Error(`Invalid process instance key format: ${processInstanceKey}`);
      }

      console.group('🔍 Fetching Process Variables');
      console.log('Process Instance Key:', processInstanceKey);
      console.log('Folder ID:', folderId);
      console.log('Investigation ID:', investigation.id);
      console.log('SDK Authenticated:', sdk.isAuthenticated());
      console.groupEnd();

      // Try to fetch variables - this may fail if process instance doesn't exist or user lacks permissions
      let variables;
      try {
        variables = await sdk.maestro.processes.instances.getVariables(
          processInstanceKey,
          folderId
        );
      } catch (variablesError: any) {
        // If we get a 401, the process instance might not exist or user lacks access
        if (variablesError?.type === 'AuthenticationError' || variablesError?.statusCode === 401) {
          console.warn('⚠️ Could not fetch process variables. Process instance may not exist or you may not have access.');
          console.warn('This is normal for investigations that haven\'t been processed yet or have been deleted.');

          // Set empty agentOutput but don't show error - just show that data isn't available
          setProcessDetails({
            agentOutput: undefined,
            loading: false,
            error: undefined, // Don't show error, just show empty state
          });
          return;
        }
        // Re-throw other errors
        throw variablesError;
      }

      console.log('✅ Process variables response received:', variables);

      // Parse variables to find agentOutput
      // The response structure is: { elements: [], globalVariables: [], instanceId: string }
      const variablesArray = (variables as any)?.globalVariables || [];
      let agentOutput: AgentOutput | undefined;

      if (Array.isArray(variablesArray) && variablesArray.length > 0) {
        console.log('📋 Found', variablesArray.length, 'global variables');

        // Strategy 1: Look for a variable named "agentOutput" or "scriptResponse" with non-null value
        const agentOutputVariable = variablesArray.find(
          (v: any) => (v.name === 'agentOutput' || v.name === 'scriptResponse') && v.value !== null
        );

        if (agentOutputVariable) {
          console.log('✅ Found agentOutput/scriptResponse variable:', agentOutputVariable.name);

          // The value might be a string (JSON) or already an object
          if (typeof agentOutputVariable.value === 'string') {
            try {
              const parsed = JSON.parse(agentOutputVariable.value);
              if (parsed.type === 'agentOutput' || (parsed.output && (parsed.output.checks || parsed.output.overall_assessment))) {
                agentOutput = parsed as AgentOutput;
              }
            } catch (e) {
              console.error('Error parsing agentOutput JSON:', e);
            }
          } else if (agentOutputVariable.value && typeof agentOutputVariable.value === 'object') {
            if (agentOutputVariable.value.type === 'agentOutput' ||
              (agentOutputVariable.value.output && (agentOutputVariable.value.output.checks || agentOutputVariable.value.output.overall_assessment))) {
              agentOutput = agentOutputVariable.value as AgentOutput;
            }
          }
        }

        // Strategy 2: Look for separate "overall_assessment" and "checks" variables and construct agentOutput
        if (!agentOutput) {
          const overallAssessmentVar = variablesArray.find((v: any) => v.name === 'overall_assessment' && v.value !== null);
          const checksVar = variablesArray.find((v: any) => v.name === 'checks' && v.value !== null);

          if (overallAssessmentVar || checksVar) {
            console.log('✅ Found separate assessment/checks variables, constructing agentOutput');

            let overallAssessment: any = null;
            let checks: any[] = [];

            // Parse overall_assessment
            if (overallAssessmentVar?.value) {
              if (typeof overallAssessmentVar.value === 'string') {
                try {
                  overallAssessment = JSON.parse(overallAssessmentVar.value);
                } catch (e) {
                  console.warn('Could not parse overall_assessment:', e);
                }
              } else {
                overallAssessment = overallAssessmentVar.value;
              }
            }

            // Parse checks
            if (checksVar?.value) {
              if (typeof checksVar.value === 'string') {
                try {
                  const parsed = JSON.parse(checksVar.value);
                  checks = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  console.warn('Could not parse checks:', e);
                }
              } else if (Array.isArray(checksVar.value)) {
                checks = checksVar.value;
              }
            }

            if (overallAssessment || checks.length > 0) {
              agentOutput = {
                type: 'agentOutput',
                output: {
                  checks: checks,
                  overall_assessment: overallAssessment || {
                    risk_level: investigation.overallRisk,
                    summary: investigation.intelSummary || 'No assessment available',
                  },
                },
                error: null,
              };
            }
          }
        }

        // Strategy 3: Search all variables for any object with type === 'agentOutput' or output structure
        if (!agentOutput) {
          for (const variable of variablesArray) {
            if (variable.value && variable.value !== null) {
              // Check if it's an object with agentOutput structure
              if (typeof variable.value === 'object' && !Array.isArray(variable.value)) {
                if (variable.value.type === 'agentOutput' ||
                  (variable.value.output && (variable.value.output.checks || variable.value.output.overall_assessment))) {
                  agentOutput = variable.value as AgentOutput;
                  console.log('✅ Found agentOutput in variable:', variable.name);
                  break;
                }
              }
              // Check if value is a JSON string that contains agentOutput
              if (typeof variable.value === 'string' && variable.value.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(variable.value);
                  if (parsed.type === 'agentOutput' ||
                    (parsed.output && (parsed.output.checks || parsed.output.overall_assessment))) {
                    agentOutput = parsed as AgentOutput;
                    console.log('✅ Found agentOutput in JSON string variable:', variable.name);
                    break;
                  }
                } catch (e) {
                  // Not valid JSON, continue
                }
              }
            }
          }
        }

        // Log what we found
        if (agentOutput) {
          console.log('✅ Successfully parsed agentOutput:', {
            checksCount: agentOutput.output?.checks?.length || 0,
            riskLevel: agentOutput.output?.overall_assessment?.risk_level,
          });
        } else {
          console.warn('⚠️ Could not find agentOutput in process variables');
          console.log('Available variable names:', variablesArray
            .filter((v: any) => v.value !== null)
            .map((v: any) => `${v.name} (${v.type})`)
            .slice(0, 20)); // Show first 20
        }
      }

      setProcessDetails({
        agentOutput,
        rawVariables: variables,
        loading: false,
      });
    } catch (err: any) {
      console.error('Error fetching process details:', err);
      console.error('Error type:', err?.constructor?.name);
      console.error('Error status:', err?.statusCode || err?.status);
      console.error('Error message:', err?.message);

      // Handle AuthenticationError specifically
      let errorMessage = 'Failed to fetch process details';

      if (err?.type === 'AuthenticationError' || err?.statusCode === 401 || err?.status === 401) {
        errorMessage = 'Access denied. This process instance may not exist, may have been deleted, or you may not have permission to access it. Please verify the process instance exists and you have the necessary permissions.';
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.title) {
        errorMessage = err.title;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setProcessDetails({
        loading: false,
        error: errorMessage,
      });
    }
  };

  const handleInvestigationClick = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    fetchProcessDetails(investigation);
  };

  const handleCloseDetails = () => {
    setSelectedInvestigation(null);
    setProcessDetails({ loading: false });
  };

  const handleStartInvestigation = async () => {
    if (!subjectName.trim()) {
      setStartProcessError('Subject name is required');
      return;
    }

    if (!analystEmail.trim()) {
      setStartProcessError('Analyst email is required');
      return;
    }

    try {
      setIsStartingProcess(true);
      setStartProcessError(null);

      const processKey = import.meta.env.VITE_MAESTRO_PROCESS_KEY || '492019ca-34ad-4fa3-a7fd-050fc29783b9';
      const folderId = import.meta.env.VITE_MAESTRO_FOLDER_KEY_ID
        ? Number(import.meta.env.VITE_MAESTRO_FOLDER_KEY_ID)
        : 2110158;

      const requestPayload = {
        processKey: processKey,
        strategy: StartStrategy.ModernJobsCount,
        runAsMe: true,
        jobPriority: JobPriority.Normal,
        inputArguments: JSON.stringify({
          subjectName: subjectName,
          Target_Name: analystEmail,
        }),
        requiresUserInteraction: false,
      };

      console.group('🚀 Starting Investigation Process');
      console.log('Process Key:', processKey);
      console.log('Folder ID:', folderId);
      console.log('Subject Name:', subjectName);
      console.log('Analyst Email:', analystEmail);
      console.log('Request Payload:', requestPayload);
      console.log('Full Request:', {
        payload: requestPayload,
        folderId: folderId,
      });
      console.groupEnd();

      if (!sdk) {
        throw new Error('SDK not initialized. Please authenticate first.');
      }

      const result = await sdk.processes.start(requestPayload, folderId);

      console.group('✅ Investigation Process Started Successfully');
      console.log('Result:', result);
      console.log('Result Type:', typeof result);
      console.log('Result Keys:', Object.keys(result || {}));
      if (Array.isArray(result)) {
        console.log('Job Count:', result.length);
        result.forEach((job, index) => {
          console.log(`Job ${index + 1}:`, job);
        });
      }
      console.groupEnd();

      // Close modal and reset
      setIsStartInvestigationModalOpen(false);
      setSubjectName('');
      setAnalystEmail('');

      // Refresh investigations list immediately
      await fetchInvestigations(true);

      // Auto-refresh again after 7 seconds to pick up the new investigation entity
      setTimeout(() => {
        console.log('🔄 Auto-refreshing investigations 7 seconds after submission...');
        fetchInvestigations(true);
      }, 7000);

    } catch (err) {
      console.group('❌ Error Starting Investigation Process');
      console.error('Error Object:', err);
      console.error('Error Type:', typeof err);
      console.error('Error Message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error) {
        console.error('Error Stack:', err.stack);
      }
      if (err && typeof err === 'object') {
        console.error('Error Details:', JSON.stringify(err, null, 2));
      }
      console.groupEnd();

      setStartProcessError(err instanceof Error ? err.message : 'Failed to start investigation process');
    } finally {
      setIsStartingProcess(false);
    }
  };

  useEffect(() => {
    fetchInvestigations(false);
  }, [sdk]);

  const filteredInvestigations = useMemo(() => {
    console.log('Filtering with:', {
      searchQuery,
      filters,
      totalInvestigations: allInvestigations.length
    });

    const result = allInvestigations.filter((inv) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = inv.subjectName.toLowerCase().includes(query);
        const matchesId = inv.subjectId.toLowerCase().includes(query);
        if (!matchesName && !matchesId) {
          return false;
        }
      }

      // Risk level filter
      if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(inv.overallRisk)) {
        return false;
      }
      // Case status filter
      if (filters.caseStatuses.length > 0 && !filters.caseStatuses.includes(inv.caseStatus)) {
        return false;
      }
      // Data sources filter
      if (filters.dataSources.length > 0) {
        const hasMatchingSource = inv.primaryRiskDrivers.some(driver =>
          filters.dataSources.includes(driver)
        );
        if (!hasMatchingSource) return false;
      }
      // Decision state filter
      if (filters.decisionStates.length > 0 && !filters.decisionStates.includes(inv.decisionState)) {
        return false;
      }
      return true;
    });

    console.log('Filtered results:', result.length);
    return result;
  }, [allInvestigations, filters, searchQuery]);

  // Sort investigations after filtering
  const sortedInvestigations = useMemo(() => {
    const sorted = [...filteredInvestigations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'subjectName':
          aValue = a.subjectName.toLowerCase();
          bValue = b.subjectName.toLowerCase();
          break;
        case 'subjectId':
          aValue = a.subjectId.toLowerCase();
          bValue = b.subjectId.toLowerCase();
          break;
        case 'overallRisk':
          // Risk hierarchy: High > Medium > Low
          const riskOrder = { High: 3, Medium: 2, Low: 1 };
          aValue = riskOrder[a.overallRisk];
          bValue = riskOrder[b.overallRisk];
          break;
        case 'caseStatus':
          aValue = a.caseStatus.toLowerCase();
          bValue = b.caseStatus.toLowerCase();
          break;
        case 'flaggedChecks':
          aValue = a.flaggedChecks;
          bValue = b.flaggedChecks;
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity).getTime();
          bValue = new Date(b.lastActivity).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredInvestigations, sortField, sortDirection]);

  const paginatedInvestigations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInvestigations.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInvestigations, currentPage]);

  const totalPages = Math.ceil(sortedInvestigations.length / itemsPerPage);

  const kpis = useMemo(() => {
    return calculateKPIs(allInvestigations);
  }, [allInvestigations]);

  const handleClearFilters = () => {
    setFilters({
      riskLevels: [],
      caseStatuses: [],
      checkOutcomes: [],
      dataSources: [],
      decisionStates: [],
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleKPIFilterClick = (filterType: 'risk' | 'status', filterValue: Investigation['overallRisk'] | Investigation['caseStatus']) => {
    console.log('KPI Filter Clicked:', { filterType, filterValue });
    if (filterType === 'risk') {
      // Toggle risk filter
      setFilters(prev => {
        const newFilters = {
          ...prev,
          riskLevels: prev.riskLevels.includes(filterValue as Investigation['overallRisk'])
            ? prev.riskLevels.filter(r => r !== filterValue)
            : [filterValue as Investigation['overallRisk']],
        };
        console.log('New filters after risk update:', newFilters);
        return newFilters;
      });
    } else if (filterType === 'status') {
      // Toggle status filter
      setFilters(prev => {
        const newFilters = {
          ...prev,
          caseStatuses: prev.caseStatuses.includes(filterValue as Investigation['caseStatus'])
            ? prev.caseStatuses.filter(s => s !== filterValue)
            : [filterValue as Investigation['caseStatus']],
        };
        console.log('New filters after status update:', newFilters);
        return newFilters;
      });
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (query: string) => {
    console.log('Search query changed:', query);
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const highRiskCount = allInvestigations.filter(inv => inv.overallRisk === 'High').length;
  const inProgressCount = allInvestigations.filter(inv => inv.caseStatus !== 'Completed' && inv.caseStatus !== 'New').length;
  const completedCount = allInvestigations.filter(inv => inv.caseStatus === 'Completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-red-500"></div>
          <span className="text-gray-400 font-medium">Loading investigations...</span>
          {!USE_MOCK_DATA && (
            <span className="text-xs text-gray-500">Fetching data from UiPath entities...</span>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Investigations</h3>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <button
                onClick={() => fetchInvestigations(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        highRiskCount={highRiskCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFilterClick={handleKPIFilterClick}
      />

      <div className="flex-1 ml-[200px]">
        <div className="p-6">
          {activeView === 'settings' ? (
            <SettingsPage
              demoResetTime={demoResetTime}
              onResetTimeToNow={handleResetTimeToNow}
              onClearResetTime={handleClearResetTime}
              sdk={sdk}
              onRefresh={handleRefresh}
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white mb-1">Investigation Queue</h1>
                    {!USE_MOCK_DATA && (
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-xs font-medium text-blue-400">
                        Live Data
                      </span>
                    )}
                    {USE_MOCK_DATA && (
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs font-medium text-yellow-400">
                        Mock Data
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {allInvestigations.length} investigations loaded
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 bg-[#252836] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh investigations"
                  >
                    <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="p-2 bg-[#252836] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsStartInvestigationModalOpen(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Investigation
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <KPICards kpis={kpis} onFilterClick={handleKPIFilterClick} />

              {/* Filters */}
              <div className="mt-6">
                <FilterControls
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Investigation Table */}
              <InvestigationTable
                investigations={paginatedInvestigations}
                currentPage={currentPage}
                totalPages={totalPages}
                totalInvestigations={sortedInvestigations.length}
                onPageChange={handlePageChange}
                onInvestigationClick={handleInvestigationClick}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Start Investigation Modal */}
      <StartInvestigationModal
        isOpen={isStartInvestigationModalOpen}
        onClose={() => {
          setIsStartInvestigationModalOpen(false);
          setStartProcessError(null);
        }}
        subjectName={subjectName}
        setSubjectName={setSubjectName}
        analystEmail={analystEmail}
        setAnalystEmail={setAnalystEmail}
        onSubmit={handleStartInvestigation}
        isLoading={isStartingProcess}
        error={startProcessError}
      />

      {/* Investigation Details Modal */}
      {selectedInvestigation && (
        <InvestigationDetails
          investigation={selectedInvestigation}
          processDetails={processDetails}
          sdk={sdk}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};
