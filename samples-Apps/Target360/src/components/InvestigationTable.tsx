import { formatTimeAgo } from '../services/mockInvestigations';
import type { Investigation, RiskLevel, CaseStatus } from '../types/investigation';
import { getStatusBadgeConfig } from '../utils/caseStatus';

type SortField = 'subjectName' | 'subjectId' | 'overallRisk' | 'caseStatus' | 'flaggedChecks' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

interface InvestigationTableProps {
  investigations: Investigation[];
  currentPage: number;
  totalPages: number;
  totalInvestigations: number;
  onPageChange: (page: number) => void;
  onInvestigationClick?: (investigation: Investigation) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export const InvestigationTable = ({ investigations, currentPage, totalPages, totalInvestigations, onPageChange, onInvestigationClick, sortField, sortDirection, onSortChange }: InvestigationTableProps) => {
  // Get process definition key from environment
  const PROCESS_DEFINITION_KEY = import.meta.env.VITE_MAESTRO_PROCESS_KEY;

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with descending as default
      onSortChange(field, 'desc');
    }
  };

  const openMaestroProcess = (investigation: Investigation, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection when clicking the button
    if (!investigation.maestroProcessInstanceKey || !investigation.folderId) {
      console.error('Missing maestroProcessInstanceKey or folderId');
      return;
    }

    const baseUrl = import.meta.env.VITE_UIPATH_BASE_URL;
    const orgName = import.meta.env.VITE_UIPATH_ORG_NAME;
    const tenantName = import.meta.env.VITE_UIPATH_TENANT_NAME;
    const processKey = investigation.maestroProcessTypeKey || PROCESS_DEFINITION_KEY;
    const url = `${baseUrl}${orgName}/${tenantName}/maestro_/processes/${processKey}/instances/${investigation.maestroProcessInstanceKey}?folderKey=${investigation.folderId}`;
    window.open(url, '_blank');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRiskBadge = (risk: RiskLevel) => {
    const styles = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const getIcon = (level: RiskLevel) => {
      if (level === 'High') {
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.964-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      } else if (level === 'Medium') {
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      } else {
        return (
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      }
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[risk]}`}>
        {getIcon(risk)}
        {risk}
      </span>
    );
  };

  const getStatusBadge = (status: CaseStatus) => {
    const config = getStatusBadgeConfig(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.styles}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalInvestigations)} of {totalInvestigations} investigations
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md bg-[#252836] border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page
                  ? 'bg-red-500 text-white'
                  : 'bg-[#252836] border border-gray-700 text-gray-400 hover:bg-gray-800'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md bg-[#252836] border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1a1d29] rounded-lg border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#252836] border-b border-gray-800">
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('subjectName')}
              >
                <div className="flex items-center gap-2">
                  Subject
                  {renderSortIcon('subjectName')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('subjectId')}
              >
                <div className="flex items-center gap-2">
                  Subject ID
                  {renderSortIcon('subjectId')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('overallRisk')}
              >
                <div className="flex items-center gap-2">
                  Risk
                  {renderSortIcon('overallRisk')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('caseStatus')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {renderSortIcon('caseStatus')}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('flaggedChecks')}
              >
                <div className="flex items-center gap-2">
                  Flagged Checks
                  {renderSortIcon('flaggedChecks')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Intel Summary
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => handleSort('lastActivity')}
              >
                <div className="flex items-center gap-2">
                  Last Updated
                  {renderSortIcon('lastActivity')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Maestro
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {investigations.map((investigation) => {
              const hasRisk = investigation.overallRisk && investigation.overallRisk.trim() !== '';
              return (
              <tr
                key={investigation.id}
                className={`transition-colors ${hasRisk ? 'hover:bg-gray-800/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                onClick={() => hasRisk && onInvestigationClick?.(investigation)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(investigation.subjectName)} flex items-center justify-center`}>
                      <span className="text-white text-sm font-semibold">
                        {getInitials(investigation.subjectName)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {investigation.subjectName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {investigation.subjectNationality} | DOB: {investigation.subjectDob}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300 font-mono">
                    {investigation.subjectId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRiskBadge(investigation.overallRisk)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(investigation.caseStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${investigation.flaggedChecks > 5 ? 'text-red-400' :
                        investigation.flaggedChecks > 2 ? 'text-orange-400' :
                          'text-green-400'
                      }`}>
                      {investigation.flaggedChecks}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-sm text-gray-400">{investigation.totalChecks}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300 max-w-md truncate">
                    {investigation.intelSummary}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">
                    {formatTimeAgo(investigation.lastActivity)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {investigation.maestroProcessInstanceKey && investigation.folderId ? (
                    <button
                      onClick={(e) => openMaestroProcess(investigation, e)}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 hover:shadow-md border border-gray-700"
                      title="Open in Maestro"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.42.8l.13-.13a5 5 0 000-7.08 5.01 5.01 0 00-7.07-.01l-3 3" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 00-7.42-.8l-.13.13a5 5 0 000 7.08 5.01 5.01 0 007.07.01l3-3" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => hasRisk && onInvestigationClick?.(investigation)}
                    disabled={!hasRisk}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !hasRisk
                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        : investigation.caseStatus === 'Completed'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                  >
                    {investigation.caseStatus === 'Completed' ? 'View' : 'Open'}
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};
