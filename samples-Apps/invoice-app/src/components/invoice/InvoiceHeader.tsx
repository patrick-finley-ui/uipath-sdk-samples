import type { InvoiceRecord, ScriptResponseData } from '../../types/invoices';
import { getStatusColor } from '../../utils/formatters';

interface InvoiceHeaderProps {
  invoice: InvoiceRecord;
  isMilestoneExpanded: boolean;
  onToggleMilestone: () => void;
  activityType?: string;
  taskCompleted?: boolean;
  taskLink?: string;
  onOpenTask?: () => void;
  scriptResponse?: ScriptResponseData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const InvoiceHeader = ({
  invoice,
  isMilestoneExpanded,
  onToggleMilestone,
  activityType,
  taskCompleted,
  taskLink,
  onOpenTask,
  scriptResponse,
  onRefresh,
  isRefreshing,
}: InvoiceHeaderProps) => {
  const PROCESS_DEFINITION_KEY = import.meta.env.VITE_MAESTRO_PROCESS_KEY;

  const openMaestroProcess = () => {
    if (!invoice.maestroProcessKey || !invoice.folderId) {
      console.error('Missing maestroProcessKey or folderId');
      return;
    }

    const baseUrl = import.meta.env.VITE_UIPATH_BASE_URL;
    const orgName = import.meta.env.VITE_UIPATH_ORG_NAME;
    const tenantName = import.meta.env.VITE_UIPATH_TENANT_NAME;
    const url = `${baseUrl}${orgName}/${tenantName}/maestro_/processes/${PROCESS_DEFINITION_KEY}/instances/${invoice.maestroProcessKey}?folderKey=${invoice.folderId}`;
    window.open(url, '_blank');
  };
  return (
    <div className="bg-white border-b border-white px-6 pt-4 pb-0">
      {/* Tier 1: Most Important - Invoice #, Status, Vendor */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice: {invoice.invoiceId || invoice.id}
          </h1>
          <p className="text-xl font-semibold text-slate-700 mb-1">
            Vendor: {invoice.vendorName || 'Unknown Vendor'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh invoice data"
              aria-label="Refresh data"
            >
              <svg
                className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Maestro Link Button */}
          {invoice.maestroProcessKey && invoice.folderId && (
            <button
              onClick={openMaestroProcess}
              className="p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md border border-gray-300"
              title="Open in Maestro"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.42.8l.13-.13a5 5 0 000-7.08 5.01 5.01 0 00-7.07-.01l-3 3"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 00-7.42-.8l-.13.13a5 5 0 000 7.08 5.01 5.01 0 007.07.01l3-3"/>
              </svg>
            </button>
          )}

          <button
            onClick={onToggleMilestone}
            className={`px-5 py-2.5 text-base font-bold rounded-lg shadow-sm border whitespace-nowrap transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer flex items-center gap-2 ${getStatusColor(invoice.status)}`}
          >
            Status: {invoice.status || 'Unknown'}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isMilestoneExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activityType?.toLowerCase() === 'user task' && !taskCompleted && taskLink ? (
            <button
              onClick={onOpenTask}
              className={`px-5 py-2.5 text-base font-bold rounded-lg shadow-sm border whitespace-nowrap transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 flex items-center gap-2`}
            >
              Audit Review: Active
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          ) : (
            <span
              className={`px-5 py-2.5 text-base font-bold rounded-lg shadow-sm border whitespace-nowrap flex items-center gap-2 ${
                scriptResponse?.summaryData?.OverallStatus === 'FullyMatched'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : activityType?.toLowerCase() === 'user task' && !taskCompleted
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : scriptResponse
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              Audit Review:{' '}
              {scriptResponse?.summaryData?.OverallStatus === 'FullyMatched'
                ? 'Completed'
                : activityType?.toLowerCase() === 'user task' && !taskCompleted
                  ? 'Active'
                  : scriptResponse
                    ? 'Completed'
                    : 'Not Ready Yet'}
              {scriptResponse?.summaryData?.OverallStatus === 'FullyMatched' || scriptResponse ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : activityType?.toLowerCase() === 'user task' && !taskCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Invoice Status Milestone */}
      {isMilestoneExpanded && <div></div>}
<div></div>
      {/* <div className="w-full h-1 bg-orange-100 my-4 rounded"></div> */}
    </div>
  );
};
