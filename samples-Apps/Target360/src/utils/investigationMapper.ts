import type { Investigation, TargetInvestigationEntity, RiskLevel, CaseStatus, DataSource } from '../types/investigation';
import { randomizeEntity } from './demoRandomizer';

/**
 * Maps a UiPath entity record to an Investigation object
 */
export const mapEntityToInvestigation = (entity: TargetInvestigationEntity): Investigation => {
  // Parse risk level


  // Parse primary risk drivers from comma-separated string
  const parseRiskDrivers = (drivers?: string): DataSource[] => {
    if (!drivers) return [];
    return drivers
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0) as DataSource[];
  };

  // Build full subject name
  const subjectName = entity.subjectName ||
    `${entity.subjectFirstName || ''} ${entity.subjectLastName || ''}`.trim() ||
    'Unknown Subject';

  const flaggedChecks = entity.numChecksFlagged || 0;

  return {
    id: entity.Id || 'unknown',
    subjectId: entity.subjectId || 'unknown',
    subjectName,
    subjectNationality: entity.subjectNationality || 'Unknown',
    subjectDob: entity.idDOB, // Map from entity field 'idDOB' to Investigation 'subjectDob'
    overallRisk: entity.risk as RiskLevel,

    caseStatus: entity.caseStatus as CaseStatus,
    flaggedChecks,
    totalChecks: 10, // Defa  ult to 10, can be made configurable
    primaryRiskDrivers: parseRiskDrivers(entity.primaryRiskDrivers),
    intelSummary: entity.aiSummary || 'No summary available',
    lastActivity: entity.LastActivity || entity.UpdateTime || entity.CreateTime || new Date().toISOString(),
    decisionState:entity.caseStatus === 'Completed' ? 'Finalized' : 'Pending',
      needsAttention: entity.risk === 'High' && entity.caseStatus !== 'Completed',
    maestroProcessInstanceKey: entity.maestroProcessInstanceKey,
    folderId: entity.folderId,
    maestroProcessTypeKey: entity.maestroProcessTypeKey,
    intelAnalystEmail: entity.intelAnalystEmail,
  };
};

/**
 * Maps an array of entity records to Investigation objects
 * @param entities - Array of entity records from Data Service
 * @param demoResetTime - Optional ISO timestamp for demo data randomization
 */
export const mapEntitiesToInvestigations = (
  entities: TargetInvestigationEntity[],
  demoResetTime: string | null = null
): Investigation[] => {
  return entities
    .map(entity => randomizeEntity(entity, demoResetTime))
    .map(mapEntityToInvestigation);
};
