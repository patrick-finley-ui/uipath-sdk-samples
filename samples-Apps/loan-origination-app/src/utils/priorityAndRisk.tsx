import type { LoanApplication } from '../types/loan';
import type { ReactElement } from 'react';

export type Priority = 'High' | 'Normal' | 'Low';

export type RiskFlag = 
  | 'Credit Exception'
  | 'High DTI'
  | 'Manual Override'
  | 'Fraud Check Pending';

export interface PriorityAndRisk {
  priority: Priority;
  riskFlags: RiskFlag[];
}

/**
 * Calculates priority based on SLA, amount, and escalation status.
 * High: Escalated, SLA at risk, or high-value loans (>$500k)
 * Normal: Standard loans with normal SLA
 * Low: Low-value loans (<$50k) with no issues
 */
export function calculatePriority(loan: LoanApplication): Priority {
  // Escalated cases are always high priority
  if (loan.status === 'Escalated') {
    return 'High';
  }

  // Check SLA risk (loans not updated in 2+ days)
  const now = new Date();
  const lastUpdated = new Date(loan.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const isSlaAtRisk = loan.status === 'Under Review' && daysSinceUpdate >= 2;

  if (isSlaAtRisk) {
    return 'High';
  }

  // High-value loans (>$500k) are high priority
  if (loan.loanAmount > 500000) {
    return 'High';
  }

  // Low-value loans (<$50k) with no issues are low priority
  if (loan.loanAmount < 50000 && loan.status === 'Under Review' && daysSinceUpdate < 1) {
    return 'Low';
  }

  // Default to normal priority
  return 'Normal';
}

/**
 * Detects risk flags for a loan application.
 * Uses loan data and step information to identify risks.
 */
export function detectRiskFlags(loan: LoanApplication): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const stepLower = loan.currentStep.toLowerCase();

  // Credit Exception: Check if step mentions credit exception or approval
  // Also check if action mentions credit exception
  if (
    stepLower.includes('credit exception') ||
    stepLower.includes('credit approval') ||
    stepLower.includes('approve credit') ||
    (stepLower.includes('exception') && stepLower.includes('credit'))
  ) {
    flags.push('Credit Exception');
  }

  // High DTI: For demo purposes, we'll simulate based on loan amount and product type
  // In production, this would come from actual DTI calculation
  // High DTI typically: >43% for conventional, >50% for some government loans
  // Simulate: Large loans relative to typical income suggest high DTI
  // Also check if step mentions DTI or debt-to-income
  if (
    stepLower.includes('dti') ||
    stepLower.includes('debt-to-income') ||
    stepLower.includes('debt to income') ||
    (loan.loanAmount > 300000 && loan.productType === 'Home Mortgage')
  ) {
    flags.push('High DTI');
  }

  // Manual Override: Check if step mentions manual review or override
  // Escalated cases often require manual override
  if (
    loan.status === 'Escalated' ||
    stepLower.includes('manual override') ||
    stepLower.includes('manual review') ||
    (stepLower.includes('manual') && stepLower.includes('review'))
  ) {
    flags.push('Manual Override');
  }

  // Fraud Check Pending: Check if documents are incomplete or step suggests fraud review
  // Only flag if documents are missing AND it's been pending
  const now = new Date();
  const lastUpdated = new Date(loan.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  const hasMissingDocs = loan.documentsSubmitted.submitted < loan.documentsSubmitted.required;
  
  if (
    stepLower.includes('fraud') ||
    stepLower.includes('verification pending') ||
    stepLower.includes('identity verification') ||
    (hasMissingDocs && daysSinceUpdate > 1 && stepLower.includes('verification'))
  ) {
    flags.push('Fraud Check Pending');
  }

  return flags;
}

/**
 * Gets priority and risk information for a loan
 */
export function getPriorityAndRisk(loan: LoanApplication): PriorityAndRisk {
  return {
    priority: calculatePriority(loan),
    riskFlags: detectRiskFlags(loan),
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
    case 'Credit Exception':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        color: 'text-orange-600',
        tooltip: 'Credit exception requires approval',
        label: 'Credit Exception',
      };
    case 'High DTI':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        color: 'text-red-600',
        tooltip: 'High debt-to-income ratio detected',
        label: 'High DTI',
      };
    case 'Manual Override':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        color: 'text-purple-600',
        tooltip: 'Manual override or escalation required',
        label: 'Manual Override',
      };
    case 'Fraud Check Pending':
      return {
        icon: ({ className }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
        color: 'text-blue-600',
        tooltip: 'Fraud check or verification pending',
        label: 'Fraud Check',
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
