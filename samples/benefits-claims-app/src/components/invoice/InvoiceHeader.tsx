import type { InvoiceRecord, ScriptResponseData } from '../../types/invoices';
import { formatInvoiceIdWithTimestamp, getStatusColor } from '../../utils/formatters';

interface InvoiceHeaderProps {
  invoice: InvoiceRecord;
  isMilestoneExpanded: boolean;
  onToggleMilestone: () => void;
  activityType?: string;
  taskCompleted?: boolean;
  taskLink?: string;
  onOpenTask?: () => void;
  scriptResponse?: ScriptResponseData;
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
}: InvoiceHeaderProps) => {
  return (
    <div className="bg-white border-b border-white p-6">
      {/* Tier 1: Most Important - Invoice #, Status, Vendor */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice: {formatInvoiceIdWithTimestamp(invoice.invoiceId || invoice.id, invoice.createTime)}
          </h1>
          <p className="text-xl font-semibold text-orange-700 mb-1">
            Vendor: {invoice.vendorName || 'Unknown Vendor'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={onToggleMilestone}
            className={`px-5 py-2.5 text-base font-bold rounded-full shadow-sm border whitespace-nowrap transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer flex items-center gap-2 ${getStatusColor(invoice.status)}`}
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
              className={`px-5 py-2.5 text-base font-bold rounded-full shadow-sm border whitespace-nowrap transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 flex items-center gap-2`}
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
              className={`px-5 py-2.5 text-base font-bold rounded-full shadow-sm border whitespace-nowrap flex items-center gap-2 ${
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

      <div className="w-full h-1 bg-orange-100 my-6 rounded"></div>
    </div>
  );
};
