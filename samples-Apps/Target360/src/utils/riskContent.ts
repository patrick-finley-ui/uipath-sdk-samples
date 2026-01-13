import type { RiskLevel } from '../types/investigation';

export interface TimelineEvent {
  date: string;
  event: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RiskContent {
  riskSummary: string;
  riskConfidence: 'High' | 'Medium' | 'Low';
  keyDrivers: string[];
  timeline: TimelineEvent[];
  associations: {
    vessels: number;
    vesselsHighRisk: boolean;
    highRiskAssociates: number;
    linkedInvestigations: boolean;
    activeWarrants: boolean;
  };
}

export const getRiskContent = (riskLevel: RiskLevel): RiskContent => {
  if (riskLevel === 'High') {
    return {
      riskSummary: "Subject is linked to financial crime, active watchlists, and recent high-risk cross-border maritime movement.",
      riskConfidence: 'High',
      keyDrivers: [
        'Active watchlist match (border / immigration)',
        'Prior fraud and money laundering charges with active warrant',
        'Recent high-risk route deviation (Panama → Texas)',
        'Association with a high-risk vessel and crew',
        'Visa overstay tied to verified passport'
      ],
      timeline: [
        { date: '2015', event: 'Fraud charge', severity: 'high' },
        { date: '2018', event: 'Money laundering charge', severity: 'high' },
        { date: '2023', event: 'Visa overstay', severity: 'medium' },
        { date: 'Dec 1, 2025', event: 'High-risk maritime route deviation', severity: 'high' },
        { date: 'Current', event: 'Watchlist status active', severity: 'high' }
      ],
      associations: {
        vessels: 1,
        vesselsHighRisk: true,
        highRiskAssociates: 2,
        linkedInvestigations: true,
        activeWarrants: true
      }
    };
  } else if (riskLevel === 'Medium') {
    return {
      riskSummary: "Subject has some concerning patterns but lacks definitive evidence of illicit activity.",
      riskConfidence: 'Medium',
      keyDrivers: [
        'Unusual travel patterns requiring review',
        'Minor financial irregularities detected',
        'Secondary screening recommended'
      ],
      timeline: [
        { date: '2022', event: 'Minor financial flag', severity: 'medium' },
        { date: '2024', event: 'Unusual travel pattern noted', severity: 'medium' },
        { date: 'Current', event: 'Under review', severity: 'medium' }
      ],
      associations: {
        vessels: 0,
        vesselsHighRisk: false,
        highRiskAssociates: 0,
        linkedInvestigations: false,
        activeWarrants: false
      }
    };
  } else {
    return {
      riskSummary: "Routine travel patterns with minor name collision flag requiring standard verification.",
      riskConfidence: 'Medium',
      keyDrivers: [
        'Name collision on watchlist (different DOB)',
        'Standard tourist travel pattern',
        'No criminal history or sanctions matches'
      ],
      timeline: [
        { date: '2020', event: 'Standard visa processing', severity: 'low' },
        { date: '2023', event: 'Routine border crossing (tourist)', severity: 'low' },
        { date: '2024', event: 'Name collision flag (resolved)', severity: 'medium' },
        { date: 'Current', event: 'No active concerns', severity: 'low' }
      ],
      associations: {
        vessels: 0,
        vesselsHighRisk: false,
        highRiskAssociates: 0,
        linkedInvestigations: false,
        activeWarrants: false
      }
    };
  }
};
