import { useState, useMemo, useEffect } from 'react';
import type { InvoiceRecord } from '../../types/invoices';
import { formatCurrency, formatDate, getStatusColor, formatInvoiceIdWithTimestamp, formatNameFromEmail } from '../../utils/formatters';

type SortField = 'invoiceId' | 'userEmail' | 'invoiceTotal' | 'status' | 'acceptanceDate' | 'updateTime';
type SortDirection = 'asc' | 'desc';

interface InvoiceGridProps {
  invoices: InvoiceRecord[];
  onInvoiceSelect?: (invoice: InvoiceRecord) => void;
  selectedInvoiceId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export const InvoiceGrid = ({ invoices, onInvoiceSelect, selectedInvoiceId, onRefresh, isRefreshing, statusFilter, onStatusFilterChange }: InvoiceGridProps) => {
  const [sortField, setSortField] = useState<SortField>('updateTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<string>(statusFilter || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Hardcoded process definition key - same as in InvoiceDetails
  const PROCESS_DEFINITION_KEY = import.meta.env.VITE_MAESTRO_PROCESS_KEY;

  const openMaestroProcess = (invoice: InvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection when clicking the button
    if (!invoice.maestroProcessKey || !invoice.folderId) {
      console.error('Missing maestroProcessKey or folderId');
      return;
    }

    const url = `https://staging.uipath.com/uipathlabs/Playground/maestro_/processes/${PROCESS_DEFINITION_KEY}/instances/${invoice.maestroProcessKey}?folderKey=${invoice.folderId}`;
    window.open(url, '_blank');
  };

  // Update internal state when prop changes
  useEffect(() => {
    if (statusFilter !== undefined) {
      setFilterStatus(statusFilter);
    }
  }, [statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    invoices.forEach(inv => {
      if (inv.status) statuses.add(inv.status);
    });
    return Array.from(statuses).sort();
  }, [invoices]);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter(inv => inv.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.invoiceId?.toLowerCase().includes(query)) ||
        (inv.userEmail?.toLowerCase().includes(query)) ||
        (inv.contractNumber?.toLowerCase().includes(query)) ||
        (inv.shipmentNumber?.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'invoiceTotal') {
        aVal = a.invoiceTotal || 0;
        bVal = b.invoiceTotal || 0;
      } else if (sortField === 'acceptanceDate' || sortField === 'updateTime') {
        aVal = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
        bVal = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [invoices, filterStatus, searchQuery, sortField, sortDirection]);

  // Reset to page 1 when filters, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredAndSortedInvoices.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };



  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Instructions Banner */}
  

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by invoice ID, vendor name, contract, or shipment number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              if (onStatusFilterChange) {
                onStatusFilterChange(e.target.value);
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-transparent"
          >
            <option value="All">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedInvoices.length)} of {filteredAndSortedInvoices.length} invoices
        {filteredAndSortedInvoices.length !== invoices.length && (
          <span className="text-gray-500"> (filtered from {invoices.length} total)</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceId')}
                  aria-sort={sortField === 'invoiceId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Invoice ID
                    <SortIcon field="invoiceId" />
                  </div>
                </th>
                  <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                  aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Number
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userEmail')}
                  aria-sort={sortField === 'userEmail' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Vendor Contact
                    <SortIcon field="userEmail" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipment Number
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('acceptanceDate')}
                  aria-sort={sortField === 'acceptanceDate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Acceptance Date
                    <SortIcon field="acceptanceDate" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceTotal')}
                  aria-sort={sortField === 'invoiceTotal' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Invoice Total
                    <SortIcon field="invoiceTotal" />
                  </div>
                </th>
              
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updateTime')}
                  aria-sort={sortField === 'updateTime' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Last Updated
                    <SortIcon field="updateTime" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maestro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-uipath-orange-subtle mb-4">
                      <svg className="h-8 w-8 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices match your criteria</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery || filterStatus !== 'All'
                        ? 'Try adjusting your search or filter to see more results.'
                        : 'No invoices have been processed yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onInvoiceSelect?.(invoice)}
                    className={`transition-colors cursor-pointer ${
                      selectedInvoiceId === invoice.id
                        ? 'bg-orange-50 border-l-4 border-l-uipath-orange'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatInvoiceIdWithTimestamp(invoice.invoiceId, invoice.createTime)}
                    </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.contractNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.userEmail ? (
                        <div className="relative group inline-block">
                          <span className="cursor-help">
                            {formatNameFromEmail(invoice.userEmail).fullName}
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                            {invoice.userEmail}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.shipmentNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.acceptanceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(invoice.invoiceTotal)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.updateTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.maestroProcessKey && invoice.folderId ? (
                        <button
                          onClick={(e) => openMaestroProcess(invoice, e)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md"
                          title="Open in Maestro"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.42.8l.13-.13a5 5 0 000-7.08 5.01 5.01 0 00-7.07-.01l-3 3"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 00-7.42-.8l-.13.13a5 5 0 000 7.08 5.01 5.01 0 007.07.01l3-3"/>
                          </svg>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
          {/* Left side - Page info */}
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </span>
          </div>

          {/* Center - Page navigation */}
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return (
                    page === currentPage ||
                    page === currentPage - 1 ||
                    page === currentPage + 1 ||
                    (page === currentPage - 2 && currentPage <= 3) ||
                    (page === currentPage + 2 && currentPage >= totalPages - 2)
                  );
                })
                .map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-uipath-orange text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              aria-label="Next page"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right side - Items per page info */}
          <div className="text-sm text-gray-700">
            <span className="font-medium">{itemsPerPage}</span> per page
          </div>
        </div>
      )}
    </div>
  );
};
