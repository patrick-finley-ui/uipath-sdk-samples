import type { Claim } from '../types/claim';
import type { ReactElement } from 'react';

export type Priority = 'High' | 'Normal' | 'Low';

export type RiskFlag = 
  | 'High Value'
  | 'Complex Injury'
  | 'Liability Dispute'
  | 'Medical Review Pending';

export interface PriorityAndRisk {
  priority: Priority;
  riskFlags: RiskFlag[];
}

/**
 * Calculates priority based on SLA, amount, and escalation status for claims.
 * High: Escalated, SLA at risk, or high-value claims (>$100k)
 * Normal: Standard claims with normal SLA
 * Low: Low-value claims (<$10k) with no issues
 */
export function calculatePriority(claim: Claim): Priority {
  // Escalated cases are always high priority
  if (claim.status === 'Escalated') {
    return 'High';
  }

  // Check SLA risk (claims not updated in 3+ days)
  const now = new Date();
  const lastUpdated = new Date(claim.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const isSlaAtRisk = claim.status === 'Under Review' && daysSinceUpdate >= 3;

  if (isSlaAtRisk) {
    return 'High';
  }

  // High-value claims (>$100k) are high priority
  if (claim.claimAmount > 100000) {
    return 'High';
  }

  // Low-value claims (<$10k) with no issues are low priority
  if (claim.claimAmount < 10000 && claim.status === 'Under Review' && daysSinceUpdate < 1) {
    return 'Low';
  }

  // Default to normal priority
  return 'Normal';
}

/**
 * Detects risk flags for a claim.
 * Uses claim data and step information to identify risks.
 */
export function detectRiskFlags(claim: Claim): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const stepLower = claim.currentStep.toLowerCase();

  // High Value: Claims over $50k
  if (claim.claimAmount > 50000) {
    flags.push('High Value');
  }

  // Complex Injury: Check if step mentions complex injury types or if injuryType suggests complexity
  if (
    stepLower.includes('complex') ||
    stepLower.includes('severe') ||
    stepLower.includes('catastrophic') ||
    claim.injuryType?.toLowerCase().includes('spinal') ||
    claim.injuryType?.toLowerCase().includes('brain') ||
    claim.injuryType?.toLowerCase().includes('traumatic')
  ) {
    flags.push('Complex Injury');
  }

  // Liability Dispute: Check if step mentions liability or dispute
  if (
    stepLower.includes('liability') ||
    stepLower.includes('dispute') ||
    stepLower.includes('contested') ||
    stepLower.includes('disputed')
  ) {
    flags.push('Liability Dispute');
  }

  // Medical Review Pending: Check if documents are incomplete or step suggests medical review
  const now = new Date();
  const lastUpdated = new Date(claim.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const hasMissingDocs = claim.documentsSubmitted.submitted < claim.documentsSubmitted.required;
  
  if (
    stepLower.includes('medical review') ||
    stepLower.includes('medical records') ||
    stepLower.includes('verification pending') ||
    (hasMissingDocs && daysSinceUpdate > 2 && stepLower.includes('medical'))
  ) {
    flags.push('Medical Review Pending');
  }

  return flags;
}

/**
 * Gets priority and risk information for a claim
 */
export function getPriorityAndRisk(claim: Claim): PriorityAndRisk {
  return {
    priority: calculatePriority(claim),
    riskFlags: detectRiskFlags(claim),
  };
}

/**
 * Gets priority badge styling
 */
export function getPriorityBadgeClass(priority: Priority): string {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Normal':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Gets risk flag icon component and styling
 */
export function getRiskFlagIcon(flag: RiskFlag): { 
  icon: (props: { className?: string }) => ReactElement; 
  color: string; 
  tooltip: string;
  label: string;
} {
  switch (flag) {
    case 'High Value':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-orange-600',
        tooltip: 'High value claim requiring additional review',
        label: 'High Value',
      };
    case 'Complex Injury':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        color: 'text-red-600',
        tooltip: 'Complex injury requiring specialized medical review',
        label: 'Complex Injury',
      };
    case 'Liability Dispute':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-purple-600',
        tooltip: 'Liability is disputed or contested',
        label: 'Liability Dispute',
      };
    case 'Medical Review Pending':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
        color: 'text-blue-600',
        tooltip: 'Medical records review pending',
        label: 'Medical Review',
      };
    default:
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        color: 'text-gray-600',
        tooltip: flag,
        label: flag,
      };
  }
}
