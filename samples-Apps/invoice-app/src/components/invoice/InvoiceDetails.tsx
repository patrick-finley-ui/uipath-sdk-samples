import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { InvoiceRecord, ScriptResponseData } from '../../types/invoices';
import type { ProcessInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript';
import { InvoiceHeader } from './InvoiceHeader';
import { KeyDetailsCard } from './KeyDetailsCard';
import { AIAgentSummaryCard } from './AIAgentSummaryCard';
import { DocumentViewer } from './DocumentViewer';
import { TabNavigation } from './TabNavigation';
import { CLINsDataTable } from './CLINsDataTable';
import { MatchEvaluationsTable } from './MatchEvaluationsTable';
import { ExecutionHistory } from './ExecutionHistory';


interface InvoiceDetailsProps {
  selectedInvoice: InvoiceRecord | null;
  processDetails: {
    executionHistory?: ProcessInstanceExecutionHistoryResponse[];
    variables?: Record<string, Array<{ name: string; value: string; type: string }>>;
    scriptResponse?: ScriptResponseData;
    bpmnXml?: string;
    taskLink?: string;
    activityType?: string;
    activityName?: string;
    taskCompleted?: boolean;
    loading: boolean;
    error?: string;
  };
  onRefreshData?: () => void;
  sdk: any; // UiPath SDK instance
}

export const InvoiceDetails = ({ selectedInvoice, processDetails, sdk, onRefreshData }: InvoiceDetailsProps) => {
  const [isTaskPopupOpen, setIsTaskPopupOpen] = useState(false);
  const [isLoadingVariables, setIsLoadingVariables] = useState(false);
  const [variablesData, setVariablesData] = useState<any>(null);
  const [variablesError, setVariablesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clins' | 'evaluations' | 'execution' | 'invoice' | 'dd250' | 'dd1155'>('clins');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<('clins' | 'evaluations' | 'execution' | 'invoice' | 'dd250' | 'dd1155')[]>(['clins']);
  const [isMilestoneExpanded, setIsMilestoneExpanded] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<{
    invoice?: string;
    dd250?: string;
    dd1155?: string;
  }>({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const showDebugBox = import.meta.env.VITE_SHOW_DEBUG_BOX === 'true';

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTaskPopupOpen) {
        setIsTaskPopupOpen(false);
      }
    };

    if (isTaskPopupOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isTaskPopupOpen]);

  const BUCKET_ID = 101519;
  const FOLDER_ID = 2500475;

  // Helper function to convert taskLink to embed format
  const convertToEmbedUrl = (taskLink: string): string => {
    // Convert from: https://staging.uipath.com/82e69757-09ff-4e6d-83e7-d530f2ac4e7b/bd829329-42ff-40aa-96dc-95a78168275a/actions_/tasks/9185075
    // To: https://staging.uipath.com/embed_/82e69757-09ff-4e6d-83e7-d530f2ac4e7b/bd829329-42ff-40aa-96dc-95a78168275a/actions_/current-task/tasks/9185075
    const url = new URL(taskLink);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);

    // Keep the organization and tenant IDs (first two parts)
    const orgId = pathParts[0];
    const tenantId = pathParts[1];

    // Get everything from 'actions_' onwards
    const actionsIndex = pathParts.findIndex(part => part === 'actions_');
    const remainingPath = actionsIndex !== -1 ? pathParts.slice(actionsIndex).join('/') : pathParts.slice(2).join('/');

    // Replace 'actions_/tasks' with 'actions_/current-task/tasks'
    const pathWithCurrentTask = remainingPath.replace('actions_/tasks', 'actions_/current-task/tasks');

    // Build embed URL with org and tenant IDs preserved
    const embedPath = `/embed_/${orgId}/${tenantId}/${pathWithCurrentTask}`;

    return `${url.origin}${embedPath}`;
  };

  const fetchDocumentUrls = async () => {
    if (!selectedInvoice) return;

    try {
      setLoadingDocuments(true);
      setDocumentError(null);

      // Get dynamic file paths, only up to the second hyphen in invoiceId
      const originalId = selectedInvoice.invoiceId || selectedInvoice.id;
      const match = originalId?.match(/^([^-]+-[^-]+)/);
      const shortId = match ? match[1] : originalId;
      const invoiceFilePath = `/Invoice-${shortId}.pdf`;

      // Extract shipment number and determine DD250 file
      const shipmentNumber = selectedInvoice.shipmentNumber || 'SHP-001';
      const shipmentNumMatch = shipmentNumber.match(/(\d+)$/);
      // Remove leading zeros from the extracted number (e.g., "001" becomes "1")
      const shipmentNum = shipmentNumMatch ? parseInt(shipmentNumMatch[1], 10).toString() : '1';
      const dd250FilePath = `/dd0250_FA4801_shipment${shipmentNum}_print.pdf`;

      // DD1155 is static
      const dd1155FilePath = '/dd1155_FA4801_appendix_schedule_cleaned.pdf';

      // Fetch all three document URLs
      const [invoiceUrl, dd250Url, dd1155Url] = await Promise.all([
        sdk.buckets.getReadUri({
          bucketId: BUCKET_ID,
          folderId: FOLDER_ID,
          path: invoiceFilePath,
        }),
        sdk.buckets.getReadUri({
          bucketId: BUCKET_ID,
          folderId: FOLDER_ID,
          path: dd250FilePath,
        }),
        sdk.buckets.getReadUri({
          bucketId: BUCKET_ID,
          folderId: FOLDER_ID,
          path: dd1155FilePath,
        }),
      ]);

      console.log('Document fetch responses:');
      console.log('invoiceUrl response:', invoiceUrl);
      console.log('dd250Url response:', dd250Url);
      console.log('dd1155Url response:', dd1155Url);

      // Handle both uppercase Uri and lowercase uri for backwards compatibility
      const getUri = (response: any) => response.Uri || response.uri;

      const invoiceUri = getUri(invoiceUrl);
      const dd250Uri = getUri(dd250Url);
      const dd1155Uri = getUri(dd1155Url);

      console.log('Extracted URIs:');
      console.log('invoice URI:', invoiceUri);
      console.log('dd250 URI:', dd250Uri);
      console.log('dd1155 URI:', dd1155Uri);

      setDocumentUrls({
        invoice: invoiceUri,
        dd250: dd250Uri,
        dd1155: dd1155Uri,
      });

      console.log('Document URLs set successfully:', {
        invoice: invoiceUri,
        dd250: dd250Uri,
        dd1155: dd1155Uri,
      });
    } catch (err) {
      console.error('Error fetching document URLs:', err);
      setDocumentError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fetch documents when a document tab is selected
  useEffect(() => {
    const tabsToCheck = multiSelectMode ? selectedTabs : [activeTab];
    const needsFetch = tabsToCheck.some(tab => 
      (tab === 'invoice' || tab === 'dd250' || tab === 'dd1155') && !documentUrls[tab]
    );
    
    if (needsFetch && selectedInvoice) {
      fetchDocumentUrls();
    }
  }, [activeTab, selectedInvoice, multiSelectMode, selectedTabs]);

  const fetchVariablesDebug = async () => {
    if (!selectedInvoice?.maestroProcessKey || !selectedInvoice?.folderId) {
      setVariablesError('No process key or folder ID available');
      return;
    }

    try {
      setIsLoadingVariables(true);
      setVariablesError(null);

      const variables = await (window as any).sdk.maestro.processes.instances.getVariables(
        selectedInvoice.maestroProcessKey,
        selectedInvoice.folderId
      );

      // Extract the scriptResponse variable with id 'vDuNTvAij' from globalVariables
      const variablesArray = (variables as any)?.globalVariables || variables;
      let scriptResponseVariable = null;

      if (Array.isArray(variablesArray)) {
        scriptResponseVariable = variablesArray.find(
          (v: any) => v.id === 'vDuNTvAij' && v.name === 'scriptResponse'
        );
      }

      if (scriptResponseVariable) {
        setVariablesData(scriptResponseVariable);
      } else {
        setVariablesError('scriptResponse variable with id "vDuNTvAij" not found in response');
        setVariablesData(variables); // Show full response for debugging
      }
    } catch (err) {
      console.error('Error fetching variables:', err);
      setVariablesError(err instanceof Error ? err.message : 'Failed to fetch variables');
    } finally {
      setIsLoadingVariables(false);
    }
  };

  // Empty state - no invoice selected
  if (!selectedInvoice) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="max-w-md mx-auto p-8">
          <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Invoice Details</h3>
          <p className="text-gray-500 leading-relaxed">Select an invoice from the left panel to view detailed information, process execution data, and associated documents.</p>
        </div>
      </div>
    );
  }

  const hasProcessInstance = selectedInvoice.maestroProcessKey && selectedInvoice.folderId;

  return (
    <>
      <div className="h-full overflow-y-auto bg-white">
        {/* Invoice Header Section */}
        <InvoiceHeader
          invoice={selectedInvoice}
          isMilestoneExpanded={isMilestoneExpanded}
          onToggleMilestone={() => setIsMilestoneExpanded(!isMilestoneExpanded)}
          activityType={processDetails.activityType}
          taskCompleted={processDetails.taskCompleted}
          taskLink={processDetails.taskLink}
          onOpenTask={() => setIsTaskPopupOpen(true)}
          scriptResponse={processDetails.scriptResponse}
          onRefresh={onRefreshData}
          isRefreshing={processDetails.loading}
        />

        {/* Tier 2 & 3: Side-by-side cards - Key Details and AI Agent Match Summary */}
        <div className="bg-white border-b border-white px-6 py-2">
          {processDetails.scriptResponse && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Key Details Card */}
              <KeyDetailsCard
                scriptResponse={processDetails.scriptResponse}
                selectedInvoice={selectedInvoice}
              />

              {/* AI Agent Match Summary Card */}
              <AIAgentSummaryCard
                summaryData={processDetails.scriptResponse.summaryData}
                onClick={() => setActiveTab('evaluations')}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-1 space-y-4">
          {/* Debug Box - Maestro Data */}
          {showDebugBox && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug: Maestro Process Data</h3>
                  <div className="text-xs font-mono space-y-1 mb-3">
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">Process Key:</span>
                      <span className="text-yellow-900">{selectedInvoice.maestroProcessKey || 'Not set'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">Folder ID:</span>
                      <span className="text-yellow-900">{selectedInvoice.folderId || 'Not set'}</span>
                    </div>
                  </div>

                  <button
                    onClick={fetchVariablesDebug}
                    disabled={isLoadingVariables || !selectedInvoice.maestroProcessKey || !selectedInvoice.folderId}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingVariables ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Fetch Variables Data
                      </>
                    )}
                  </button>

                  {variablesError && (
                    <div className="mt-3 bg-red-100 border border-red-300 rounded p-2">
                      <p className="text-xs text-red-800 font-semibold">Error:</p>
                      <p className="text-xs text-red-700">{variablesError}</p>
                    </div>
                  )}

                  {variablesData && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-yellow-800 font-semibold">scriptResponse Variable (id: vDuNTvAij)</p>
                          {variablesData.id && (
                            <p className="text-xs text-yellow-600 mt-1">
                              ID: {variablesData.id} | Name: {variablesData.name} | Type: {variablesData.type}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setVariablesData(null)}
                          className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="bg-yellow-100 border border-yellow-300 rounded p-3 max-h-96 overflow-auto">
                        <pre className="text-xs text-yellow-900 whitespace-pre-wrap break-words">
                          {JSON.stringify(variablesData.value || variablesData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
<div className="w-full h-1 bg-slate-100 my-6 rounded"></div>

        </div>

        {/* Process Details Sections Below - Full Width */}
        {hasProcessInstance && (
          <div className="px-4 space-y-4">
            {processDetails.loading ? (
              <div>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto mb-4"></div>
                    <h3 className="text-md font-semibold text-gray-900 mb-1">Loading Process Details</h3>
                    <p className="text-gray-600 text-sm">Fetching execution history and variables...</p>
                  </div>
                </div>
              </div>
            ) : processDetails.error ? (
              <div>
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-red-800">Unable to load process details</h3>
                      <p className="text-red-700 mt-1">{processDetails.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Tab Navigation */}
                {processDetails.scriptResponse?.clinsData && processDetails.scriptResponse.clinsData.length > 0 &&
                 processDetails.scriptResponse?.matchEvaluations && processDetails.scriptResponse.matchEvaluations.length > 0 && (
                  <TabNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    clinsCount={processDetails.scriptResponse.clinsData?.length}
                    evaluationsCount={processDetails.scriptResponse.matchEvaluations?.length}
                    multiSelectMode={multiSelectMode}
                    selectedTabs={selectedTabs}
                    onToggleMultiSelect={() => {
                      const newMode = !multiSelectMode;
                      setMultiSelectMode(newMode);
                      if (newMode) {
                        setSelectedTabs([activeTab]);
                      } else {
                        setActiveTab(selectedTabs[0] || 'clins');
                      }
                    }}
                    onMultiSelectChange={setSelectedTabs}
                  />
                )}

                <div className={`flex gap-4 ${multiSelectMode ? 'overflow-x-auto pb-4' : ''}`}>
                  {(multiSelectMode ? selectedTabs : [activeTab]).map((tabId) => (
                    <div 
                      key={tabId} 
                      className={`${multiSelectMode ? 'flex-1 min-w-[33%] border-r last:border-r-0 border-gray-200 pr-4 last:pr-0' : 'w-full'}`}
                    >
                      {/* CLINs Data Section */}
                      {tabId === 'clins' && processDetails.scriptResponse?.clinsData && (
                        <CLINsDataTable clinsData={processDetails.scriptResponse.clinsData} />
                      )}

                      {/* Match Evaluations Section */}
                      {tabId === 'evaluations' && processDetails.scriptResponse?.matchEvaluations && (
                        <MatchEvaluationsTable evaluations={processDetails.scriptResponse.matchEvaluations} />
                      )}

                      {/* Execution History Section */}
                      {tabId === 'execution' && processDetails.executionHistory && (
                        <ExecutionHistory executionHistory={processDetails.executionHistory as any[]} />
                      )}

                      {/* Invoice Document Tab */}
                      {tabId === 'invoice' && (
                        <div id="invoice-panel" role="tabpanel" aria-labelledby="invoice-tab">
                          <DocumentViewer
                            documentUrl={documentUrls.invoice}
                            loading={loadingDocuments}
                            error={documentError}
                            title="Invoice Document"
                            subtitle="View invoice PDF"
                          />
                        </div>
                      )}

                      {/* DD250 Document Tab */}
                      {tabId === 'dd250' && (
                        <div id="dd250-panel" role="tabpanel" aria-labelledby="dd250-tab">
                          <DocumentViewer
                            documentUrl={documentUrls.dd250}
                            loading={loadingDocuments}
                            error={documentError}
                            title="DD250 Document"
                            subtitle="Material Inspection and Receiving Report"
                          />
                        </div>
                      )}

                      {/* DD1155 Document Tab */}
                      {tabId === 'dd1155' && (
                        <div id="dd1155-panel" role="tabpanel" aria-labelledby="dd1155-tab">
                          <DocumentViewer
                            documentUrl={documentUrls.dd1155}
                            loading={loadingDocuments}
                            error={documentError}
                            title="DD1155 Document"
                            subtitle="Order for Supplies or Services Schedule"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* No Process Instance Message */}
        {!hasProcessInstance && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">No Process Instance</h4>
                <p className="text-blue-700 text-sm">This invoice does not have an associated process instance</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Popup */}
      {isTaskPopupOpen && processDetails.taskLink &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm  flex items-center justify-center z-50 animate-in fade-in duration-200"
            onClick={() => setIsTaskPopupOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-[90vw] h-[95vh] flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={() => setIsTaskPopupOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
                  aria-label="Close modal (ESC)"
                  title="Close (ESC)"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4 rounded-b-lg">
                <iframe
                  src={convertToEmbedUrl(processDetails.taskLink)}
                  className="w-full h-full rounded border-0"
                  title="Task Details"
                />
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
};
