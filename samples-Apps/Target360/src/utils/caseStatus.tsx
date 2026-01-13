import type { CaseStatus } from '../types/investigation';
import type { ReactNode } from 'react';

/**
 * All available case statuses - used for filters and consistent status handling
 */
export const CASE_STATUSES: CaseStatus[] = ['New', 'AI Agent Review', 'Analyst Review', 'Completed'];

/**
 * Status badge configuration - reusable across components
 */
export interface StatusBadgeConfig {
  styles: string;
  icon: ReactNode;
  label: string;
}

/**
 * Get status badge configuration for a given case status
 */
export const getStatusBadgeConfig = (status: CaseStatus): StatusBadgeConfig => {
  const configs: Record<CaseStatus, StatusBadgeConfig> = {
    'New': {
      styles: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'New',
    },
    'AI Agent Review': {
      styles: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: 'AI Agent Review',
    },
    'Analyst Review': {
      styles: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Analyst Review',
    },
    'Completed': {
      styles: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Completed',
    },
  };

  return configs[status];
};

/**
 * Check if a status is considered "active" (not completed)
 */
export const isActiveStatus = (status: CaseStatus): boolean => {
  return status !== 'Completed';
};

/**
 * Check if a status requires review
 */
export const requiresReview = (status: CaseStatus): boolean => {
  return status === 'AI Agent Review' || status === 'Analyst Review';
};
