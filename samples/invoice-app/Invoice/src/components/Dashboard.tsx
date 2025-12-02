import { useState, useEffect, useMemo } from 'react';
import { UiPath, StartStrategy, JobPriority} from '@uipath/uipath-typescript';
import type { InvoiceRecord, InvoiceMetrics } from '../types/invoices';
import type { ProcessInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript';
import { InvoiceGrid } from './invoice/InvoiceGrid';
import { InvoiceDetails } from './invoice/InvoiceDetails';
import { DebugBox } from './layout/DebugBox';
import { Header } from './layout/Header';
import { KpiCard } from './ui/KpiCard';
import { StartProcessModal } from './modals/StartProcessModal';

interface DashboardProps {
  sdk: UiPath;
}

const ENTITY_UUID = '9f8f532a-a6ae-f011-8e61-002248862cce';

export const Dashboard = ({ sdk }: DashboardProps) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [processDetails, setProcessDetails] = useState<{
    executionHistory?: ProcessInstanceExecutionHistoryResponse[];
    variables?: Record<string, Array<{ name: string; value: string; type: string }>>;
    scriptResponse?: {
      clinsData: any[];
      keyDetails: Record<string, any>;
      matchEvaluations: any[];
      summaryData: Record<string, any>;
    };
    bpmnXml?: string;
    taskLink?: string;
    activityType?: string;
    activityName?: string;
    taskCompleted?: boolean;
    loading: boolean;
    error?: string;
  }>({ loading: false });
  const [isStartProcessModalOpen, setIsStartProcessModalOpen] = useState(false);
  const [invoiceFilePath, setInvoiceFilePath] = useState('Invoice-INV-1025.pdf');
  const [sendToEmail, setSendToEmail] = useState('');
  const [isStartingProcess, setIsStartingProcess] = useState(false);
  const [startProcessError, setStartProcessError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const fetchInvoices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const records = await sdk.entities.getRecordsById(ENTITY_UUID, {
        pageSize: 100,
        $orderby: 'UpdateTime desc',
      });

      setInvoices(records.items as InvoiceRecord[]);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchInvoices(true);
  };

  useEffect(() => {
    fetchInvoices(false);
  }, [sdk]);

  const fetchProcessDetails = async (invoice: InvoiceRecord) => {
    if (!invoice.maestroProcessKey || !invoice.folderId) {
      // No process instance associated with this invoice
      return;
    }

    try {
      setProcessDetails({ loading: true });

      const [bpmnXml, executionHistory, variables] = await Promise.all([
        sdk.maestro.processes.instances.getBpmn(invoice.maestroProcessKey, invoice.folderId),
        sdk.maestro.processes.instances.getExecutionHistory(invoice.maestroProcessKey),
        sdk.maestro.processes.instances.getVariables(invoice.maestroProcessKey, invoice.folderId),
      ]);

      // Group variables by source
      const groupedVariables: Record<string, Array<{ name: string; value: string; type: string }>> = {};
      let scriptResponse: any = undefined;

      // Check if variables has a globalVariables array
      const variablesArray = (variables as any)?.globalVariables || variables;

      if (variablesArray && Array.isArray(variablesArray)) {
        variablesArray.forEach((variable: any) => {
          // Extract scriptResponse variable with id 'vDuNTvAij'
          if (variable.id === 'vDuNTvAij' && variable.name === 'scriptResponse') {
            try {
              scriptResponse = variable.value;
              console.log('Found scriptResponse variable:', scriptResponse);
            } catch (e) {
              console.error('Error parsing scriptResponse:', e);
            }
          }

          const source = variable.source || 'Unknown';
          if (!groupedVariables[source]) {
            groupedVariables[source] = [];
          }
          groupedVariables[source].push({
            name: variable.name,
            value: JSON.stringify(variable.value),
            type: variable.type || 'string',
          });
        });
      }

      // Extract task link and activity type from execution history if available
      let taskLink: string | undefined;
      let activityType: string | undefined;
      let activityName: string | undefined;
      let taskCompleted: boolean = false;
      if (executionHistory && executionHistory.length > 0) {
        // Find the first activity with an actionCenterTaskLink in attributes
        for (const activity of executionHistory) {
          const attributes = (activity as any).attributes;
          if (attributes && attributes.actionCenterTaskLink) {
            taskLink = attributes.actionCenterTaskLink;
            activityType = 'user task';
            activityName = (activity as any).name;
            taskCompleted = attributes.status === 'Completed';
            break;
          }
        }
      }

      setProcessDetails({
        executionHistory: executionHistory as ProcessInstanceExecutionHistoryResponse[],
        variables: groupedVariables,
        scriptResponse,
        bpmnXml: bpmnXml as string,
        taskLink,
        activityType,
        activityName,
        taskCompleted,
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching process details:', err);
      setProcessDetails({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch process details',
      });
    }
  };

  const handleInvoiceSelect = async (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    await fetchProcessDetails(invoice);
  };

  const handleStartProcess = async () => {
    if (!invoiceFilePath.trim()) {
      setStartProcessError('Invoice file path is required');
      return;
    }

    try {
      setIsStartingProcess(true);
      setStartProcessError(null);

      const processKey = import.meta.env.VITE_MAESTRO_PROCESS_KEY || '44479d67-c3d0-41e4-9ae0-3b337e320f9e';
      const folderId = import.meta.env.VITE_MAESTRO_FOLDER_KEY_ID
        ? Number(import.meta.env.VITE_MAESTRO_FOLDER_KEY_ID) 
        : 2495996;

      const requestPayload = {
        processKey: processKey,
        strategy: StartStrategy.ModernJobsCount,
        runAsMe: true,
        jobPriority: JobPriority.Normal,
        inputArguments: JSON.stringify({
          InvoiceFilePath: invoiceFilePath,
          SendToEmail: sendToEmail,
        }),
        requiresUserInteraction: false,
      };

      console.group('🚀 Starting Process');
      console.log('Process Key:', processKey);
      console.log('Folder ID:', folderId);
      console.log('Invoice File Path:', invoiceFilePath);
      console.log('Send To Email:', sendToEmail);
      console.log('Request Payload:', requestPayload);
      console.log('Full Request:', {
        payload: requestPayload,
        folderId: folderId,
      });
      console.groupEnd();

      const result = await sdk.processes.start(requestPayload, folderId);

      console.group('✅ Process Started Successfully');
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
      setIsStartProcessModalOpen(false);
      setInvoiceFilePath('Invoice-INV-1025.pdf');
      setSendToEmail('');

      // Refresh invoices list
      await fetchInvoices(true);

    } catch (err) {
      console.group('❌ Error Starting Process');
      console.error('Error Object:', err);
      console.error('Error Type:', typeof err);
      console.error('Error Message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error) {
        console.error('Error Stack:', err.stack);
      }
      // Log any response data if available
      if (err && typeof err === 'object') {
        console.error('Error Details:', JSON.stringify(err, null, 2));
      }
      console.groupEnd();

      setStartProcessError(err instanceof Error ? err.message : 'Failed to start process');
    } finally {
      setIsStartingProcess(false);
    }
  };

  const metrics = useMemo((): InvoiceMetrics => {
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + (inv.invoiceTotal || 0), 0);
    const invoicesByStatus = invoices.reduce((acc, inv) => {
      const status = inv.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInvoices: invoices.length,
      totalInvoiceValue,
      pendingReview: invoicesByStatus['Pending Review'] || 0,
      approved: invoicesByStatus['Accepted'] || 0,
      rejected: invoicesByStatus['Rejected'] || 0,
      paid: invoicesByStatus['Paid'] || 0,
      averageInvoiceValue: invoices.length > 0 ? totalInvoiceValue / invoices.length : 0,
      invoicesByStatus,
    };
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uipath-orange"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded m-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading invoices</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [

   
    {
      title: 'Pending Review',
      value: metrics.pendingReview,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-white',
      description: 'Invoices awaiting review',
    },
        {
      title: 'High Severity Failed Checks',
      value: '5%',
      customContent: (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">High Severity Failed Checks</p>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-3xl font-bold text-green-600">5%</p>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-lg text-gray-400 line-through">30%</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            83% reduction
          </div>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'bg-uipath-orange',
      textColor: 'text-uipath-orange',
      bgColor: 'bg-white',
      description: '% of invoices with critical validation failures',
    },
     {
      title: 'Total Invoice Value',
      value: '$18.5B',
      customContent: (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-700">Total Invoice Value</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Navy
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">$18.5B</p>
          <p className="text-sm font-semibold text-gray-700 mb-1">Prevented in unsupported transactions</p>
          <p className="text-xs text-gray-500 italic">Navy 25'</p>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-gray-700',
      textColor: 'text-gray-700',
      bgColor: 'bg-white',
      description: 'Sum of all invoice amounts',
    },
    {
      title: 'Approved',
      value: metrics.approved,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-white',
      description: 'Approved invoices',
    },
    {
      title: 'Paid',
      value: metrics.paid,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-white',
      description: 'Invoices that have been paid',
    },
    {
      title: 'Average Invoice-to-Pay Time',
      value: '4 days',
      customContent: (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Average Invoice-to-Pay Time</p>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-3xl font-bold text-green-600">4 days</p>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-lg text-gray-400 line-through">18 days</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            78% faster
          </div>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-gray-700',
      textColor: 'text-gray-700',
      bgColor: 'bg-white',
      description: 'Time from invoice receipt to payment',
    },
  ];

  const showDebugBox = import.meta.env.VITE_SHOW_DEBUG_BOX === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logos */}
      <Header />

      <div className="space-y-6 p-6">
        {/* Debug Box */}
        {showDebugBox && <DebugBox />}

        {/* Subtitle */}
        <div>
          <p className="text-gray-600">Real-time tracking and analytics for your invoice workflows</p>
        </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <KpiCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            textColor={card.textColor}
            bgColor={card.bgColor}
            description={card.description}
            customContent={(card as any).customContent}
            onClick={
              card.title === 'Pending Review'
                ? () => setStatusFilter('Pending Review')
                : undefined
            }
            isClickable={card.title === 'Pending Review'}
          />
        ))}
      </div>



      {/* Invoice Management Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Invoice Processing</h3>
          <button
            onClick={() => setIsStartProcessModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Start Invoice Processing
          </button>
        </div>

        {/* Toggle between Grid and Detail View */}
        {!selectedInvoice ? (
            /* Grid View - Full Width */
            
          <div className=" glass overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <InvoiceGrid
              invoices={invoices}
              onInvoiceSelect={handleInvoiceSelect}
              selectedInvoiceId={undefined}
              onRefresh={handleRefresh}
              isRefreshing={refreshing}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        ) : (
          /* Detail View - Full Width with Breadcrumb */
          <div className="glass overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Invoice Grid
              </button>
            </div>
            <InvoiceDetails
              selectedInvoice={selectedInvoice}
              processDetails={processDetails}
              sdk={sdk}
              onRefreshData={() => {
                if (selectedInvoice) {
                  fetchProcessDetails(selectedInvoice);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Start Process Modal */}
      <StartProcessModal
        isOpen={isStartProcessModalOpen}
        onClose={() => {
          setIsStartProcessModalOpen(false);
          setStartProcessError(null);
        }}
        invoiceFilePath={invoiceFilePath}
        setInvoiceFilePath={setInvoiceFilePath}
        sendToEmail={sendToEmail}
        setSendToEmail={setSendToEmail}
        onSubmit={handleStartProcess}
        isLoading={isStartingProcess}
        error={startProcessError}
      />
    </div>
    </div>
  );
};

