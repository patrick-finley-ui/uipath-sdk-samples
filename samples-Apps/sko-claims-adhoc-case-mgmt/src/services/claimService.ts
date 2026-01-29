import type { UiPath } from '@uipath/uipath-typescript';
import type { Claim, Task, ClaimMetadata } from '../types/claim';
import { isMockMode, getCaseId, getFolderId } from '../utils/config';

// Case key for personal injury claims
const CASE_KEY = getCaseId();

// Entity ID for demo setup (claim entity)
const DEMO_ENTITY_ID = 'ad76bb21-97fb-f011-832f-000d3abf6e1a';

export class ClaimService {
  private sdk: UiPath | null;

  constructor(
    sdk: UiPath | null,
    _orgName?: string,
    _tenantName?: string,
    _baseUrl?: string
  ) {
    this.sdk = sdk;
    void _orgName;
    void _tenantName;
    void _baseUrl;
  }

  async getCaseInstances(_folderId?: string, skipTaskNames: boolean = false): Promise<Claim[]> {
    if (isMockMode() || !this.sdk) {
      // Return mock data for development
      return this.getMockClaims();
    }

    try {
      // First, get all cases to find the processKey for our case
      console.log('Fetching all cases to find processKey...');
      const allCases = await this.sdk.maestro.cases.getAll();
      
      // Find the case with the matching key (processKey)
      const targetCase = allCases.find((caseItem: any) => caseItem.processKey === CASE_KEY);
      
      if (!targetCase) {
        console.error(`Case with processKey ${CASE_KEY} not found. Available cases:`, allCases.map((c: any) => ({ processKey: c.processKey, name: c.name })));
        return [];
      }
      
      const processKey = targetCase.processKey;
      console.log(`Found case: ${targetCase.name} (processKey: ${processKey})`);
      
      // Now get case instances filtered by processKey
      console.log('Fetching case instances with processKey:', processKey);
      const instances = await this.sdk.maestro.cases.instances.getAll({
        pageSize: 100,
        processKey: processKey,
      });

      console.log('Case instances response:', instances);
      
      // Handle both paginated and non-paginated responses
      let items: any[] = [];
      if (instances && typeof instances === 'object') {
        if ('items' in instances && Array.isArray((instances as any).items)) {
          items = (instances as any).items;
        } else if (Array.isArray(instances)) {
          items = instances;
        }
      }
      
      if (!Array.isArray(items)) {
        console.error('Unexpected response structure from cases.instances.getAll:', instances);
        return [];
      }

      const filteredItems = items;

      console.log(`Found ${filteredItems.length} case instances for processKey ${processKey}`);

      if (filteredItems.length === 0) {
        console.warn('No case instances found for processKey:', processKey);
        return [];
      }

      // Fetch tasks for all instances to get current task names
      const instancesWithSteps = await Promise.all(
        filteredItems.map(async (instance: any) => {
          let currentStep = this.formatStepName(instance.instanceDisplayName);
          
          if (!skipTaskNames) {
            try {
              const taskName = await this.getCurrentTaskNameForCase(instance.instanceId, instance.folderKey);
              if (taskName) {
                currentStep = taskName;
              }
            } catch (err: any) {
              // Silently fail - CORS errors are expected in some environments
            }
          }
          
          return { instance, currentStep };
        })
      );

      // Map case instances to claims
      const claims = instancesWithSteps.map(({ instance, currentStep }, index) => {
        // Use mock data to augment with claim-specific fields
        const mockClaim = this.getMockClaims()[index % this.getMockClaims().length];
        return {
          id: `CLAIM-${String(instance.instanceId).slice(-6)}`,
          processInstanceId: instance.instanceId,
          caseInstanceId: instance.instanceId,
          caseId: instance.caseId, // Case ID from the Case Instance (e.g., "PIDEMO-323293939")
          claimant: instance.caseTitle || instance.instanceDisplayName || mockClaim.claimant,
          claimAmount: mockClaim.claimAmount,
          claimType: mockClaim.claimType,
          status: this.mapStatus(instance.latestRunStatus),
          currentStep,
          documentsSubmitted: mockClaim.documentsSubmitted,
          lastUpdated: instance.startedTime ? new Date(instance.startedTime) : new Date(),
          createdDate: instance.createdTimeUtc ? new Date(instance.createdTimeUtc) : (instance.startedTime ? new Date(instance.startedTime) : new Date()),
          folderId: instance.folderKey || getFolderId(),
          incidentDate: mockClaim.incidentDate,
          injuryType: mockClaim.injuryType,
        };
      });

      console.log(`Mapped ${claims.length} case instances to claims`);
      return claims;
    } catch (error: any) {
      console.error('Error fetching case instances:', error);
      console.error('Error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        status: error?.status,
        type: error?.type,
      });
      
      if (error?.statusCode === 401 || error?.type === 'AuthenticationError') {
        console.warn('Authentication error - returning empty array');
        return [];
      }
      
      // For other errors, return mock data as fallback for development
      console.warn('Returning mock data as fallback');
      return this.getMockClaims();
    }
  }

  async getCaseInstanceById(instanceId: string, folderId: string): Promise<ClaimMetadata | null> {
    if (isMockMode() || !this.sdk) {
      const mockClaim = this.getMockClaims().find(c => c.processInstanceId === instanceId);
      if (!mockClaim) return null;
      
      return {
        claimId: mockClaim.id,
        claimantName: mockClaim.claimant,
        claimAmount: mockClaim.claimAmount,
        claimType: mockClaim.claimType,
        submissionDate: new Date(mockClaim.lastUpdated.getTime() - 7 * 24 * 60 * 60 * 1000),
        currentStatus: mockClaim.status,
        currentStep: mockClaim.currentStep,
        stepStatus: 'In progress',
        incidentDate: mockClaim.incidentDate,
        injuryType: mockClaim.injuryType,
      };
    }

    try {
      let instance: any = null;
      let actualFolderKey = folderId;
      
      const allCases = await this.sdk.maestro.cases.getAll();
      const targetCase = allCases.find((caseItem: any) => caseItem.processKey === CASE_KEY);
      
      if (!targetCase) {
        throw new Error(`Case with processKey ${CASE_KEY} not found`);
      }
      
      const instances = await this.sdk.maestro.cases.instances.getAll({
        pageSize: 100,
        processKey: targetCase.processKey,
      });
      
      const items = (instances as any).items || instances;
      instance = Array.isArray(items) 
        ? items.find((inst: any) => inst.instanceId === instanceId)
        : null;
      
      if (!instance) {
        throw new Error(`Case instance ${instanceId} not found.`);
      }
      
      if (instance.folderKey) {
        actualFolderKey = instance.folderKey;
      }
      
      const claimantName = instance.caseTitle || instance.instanceDisplayName || 'Unknown';
      
      let currentStep = this.formatStepName(instance.instanceDisplayName);
      try {
        const taskName = await this.getCurrentTaskNameForCase(instanceId, actualFolderKey);
        if (taskName) {
          currentStep = taskName;
        }
      } catch (err) {
        console.warn('Error fetching task name for current step:', err);
      }
      
      const claimId = `CLAIM-${String(instance.instanceId).slice(-3)}`;
      const mockClaim = this.getMockClaims().find(c => c.processInstanceId === instanceId);
      
      return {
        claimId,
        claimantName: claimantName !== 'Unknown' ? claimantName : (mockClaim?.claimant || 'Unknown'),
        claimAmount: mockClaim?.claimAmount || 0,
        claimType: mockClaim?.claimType || 'Personal Injury',
        submissionDate: instance.startedTime ? new Date(instance.startedTime) : new Date(),
        currentStatus: this.mapStatus(instance.latestRunStatus),
        currentStep,
        stepStatus: 'In progress',
        incidentDate: mockClaim?.incidentDate,
        injuryType: mockClaim?.injuryType,
      };
    } catch (error: any) {
      console.error('Error fetching case instance:', error);
      
      const shortId = instanceId.length > 6 ? instanceId.slice(-6) : instanceId;
      const claimId = `CLAIM-${shortId}`;
      const mockIndex = instanceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % this.getMockClaims().length;
      const mockClaim = this.getMockClaims()[mockIndex];
      
      return {
        claimId,
        claimantName: mockClaim?.claimant || 'Unknown Claimant',
        claimAmount: mockClaim?.claimAmount || 0,
        claimType: mockClaim?.claimType || 'Personal Injury',
        submissionDate: new Date(),
        currentStatus: 'Under Review' as const,
        currentStep: mockClaim?.currentStep || 'Initial Review',
        stepStatus: 'In progress',
      };
    }
  }

  async getTasksForCaseInstance(instanceId: string, _folderId: string): Promise<Task[]> {
    if (isMockMode() || !this.sdk) {
      return this.getMockTasks().filter(t => t.processInstanceId === instanceId);
    }

    try {
      const tasksResponse = await this.sdk.maestro.cases.instances.getActionTasks(instanceId, {
        pageSize: 100,
      });
      
      const tasks: Task[] = [];
      const taskItems = (tasksResponse as any).items || tasksResponse;
      
      if (Array.isArray(taskItems)) {
        for (const task of taskItems) {
          let formUrl: string | undefined = undefined;
          
          if (task.formLayoutId && task.folderId) {
            try {
              if (typeof (task as any).getFormUrl === 'function') {
                formUrl = await (task as any).getFormUrl();
              } else {
                formUrl = `/embed_/actions_/current-task/tasks/${task.id}`;
              }
            } catch (e) {
              console.warn('Could not construct form URL for task:', task.id);
            }
          }
          
          const taskStatus = task.status || 'Open';
          let mappedStatus: 'Open' | 'In Progress' | 'Completed' = 'Open';
          const statusStr = String(taskStatus).toLowerCase();
          if (statusStr === 'completed' || statusStr === 'closed') {
            mappedStatus = 'Completed';
          } else if (statusStr === 'in progress' || statusStr === 'inprogress' || statusStr === 'pending') {
            mappedStatus = 'In Progress';
          }
          
          const assignee = task.taskAssigneeName || 
                          (task.assignedToUser ? `${task.assignedToUser.name || task.assignedToUser.userName || 'Assigned'}` : 'Unassigned');
          
          let dueDate: Date | undefined = undefined;
          if (task.taskSlaDetail?.expiryTime) {
            dueDate = new Date(task.taskSlaDetail.expiryTime);
          }
          
          tasks.push({
            id: String(task.id),
            title: task.title || 'Untitled Task',
            type: task.type || 'Form',
            status: mappedStatus,
            assignee,
            createdDate: task.createdTime ? new Date(task.createdTime) : new Date(),
            dueDate,
            formUrl,
            processInstanceId: instanceId,
            caseInstanceId: instanceId,
          });
        }
      }

      return tasks.length > 0 ? tasks : this.getMockTasks().filter(t => t.processInstanceId === instanceId);
    } catch (error: any) {
      if (error?.statusCode === 401 || error?.type === 'AuthenticationError') {
        return this.getMockTasks().filter(t => t.processInstanceId === instanceId);
      }
      if (error?.type === 'NetworkError' || error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch')) {
        return this.getMockTasks().filter(t => t.processInstanceId === instanceId);
      }
      console.error('Error fetching tasks for case instance:', error);
      return this.getMockTasks().filter(t => t.processInstanceId === instanceId);
    }
  }

  private mapStatus(status: string): Claim['status'] {
    const normalizedStatus = (status || '').toLowerCase();
    
    if (normalizedStatus === 'running' || normalizedStatus === 'in progress' || normalizedStatus === 'inprogress') {
      return 'Under Review';
    }
    if (normalizedStatus === 'completed' || normalizedStatus === 'successful') {
      return 'Approved';
    }
    if (normalizedStatus === 'faulted' || normalizedStatus === 'failed') {
      return 'Escalated';
    }
    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      return 'Denied';
    }
    
    return 'Under Review';
  }

  private formatStepName(stepName: string | undefined | null): string {
    if (!stepName) {
      return 'Unknown';
    }
    
    if (stepName.includes(' ') || /[a-z]/.test(stepName)) {
      return stepName;
    }
    
    const formatted = stepName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    
    return formatted || stepName;
  }

  private async getCurrentTaskNameForCase(instanceId: string, _folderId: string): Promise<string | null> {
    if (!this.sdk) {
      return null;
    }

    try {
      const tasksResponse = await this.sdk.maestro.cases.instances.getActionTasks(instanceId, {
        pageSize: 100,
      });
      
      const taskItems = (tasksResponse as any).items;
      
      if (!taskItems || !Array.isArray(taskItems) || taskItems.length === 0) {
        return null;
      }

      const openTask = taskItems.find(
        (task: any) => {
          const status = String(task.status || '').toLowerCase();
          return status !== 'completed' && status !== 'closed';
        }
      );

      if (openTask) {
        return openTask.title || null;
      }

      const lastTask = taskItems[taskItems.length - 1];
      return lastTask ? (lastTask.title || null) : null;
    } catch (error) {
      return null;
    }
  }

  private getMockClaims(): Claim[] {
    const now = new Date();
    return [
      {
        id: 'CLAIM-001',
        processInstanceId: 'mock-001',
        caseInstanceId: 'mock-001',
        caseId: 'PIDEMO-323293939',
        claimant: 'John Smith',
        claimAmount: 75000,
        claimType: 'Personal Injury - Auto',
        status: 'Under Review',
        currentStep: 'Medical Records Review',
        documentsSubmitted: { submitted: 5, required: 7 },
        lastUpdated: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        folderId: getFolderId(),
        incidentDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        injuryType: 'Whiplash',
      },
      {
        id: 'CLAIM-002',
        processInstanceId: 'mock-002',
        caseInstanceId: 'mock-002',
        caseId: 'PIDEMO-456712345',
        claimant: 'Sarah Johnson',
        claimAmount: 125000,
        claimType: 'Personal Injury - Slip & Fall',
        status: 'Under Review',
        currentStep: 'Liability Investigation',
        documentsSubmitted: { submitted: 8, required: 8 },
        lastUpdated: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        folderId: getFolderId(),
        incidentDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        injuryType: 'Back Injury',
      },
      {
        id: 'CLAIM-003',
        processInstanceId: 'mock-003',
        caseInstanceId: 'mock-003',
        caseId: 'PIDEMO-789045678',
        claimant: 'Michael Brown',
        claimAmount: 45000,
        claimType: 'Personal Injury - Workplace',
        status: 'Escalated',
        currentStep: 'Settlement Review',
        documentsSubmitted: { submitted: 6, required: 6 },
        lastUpdated: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        createdDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        folderId: getFolderId(),
        incidentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        injuryType: 'Shoulder Injury',
      },
    ];
  }

  private getMockTasks(): Task[] {
    return [
      {
        id: 'task-001',
        title: 'Review Medical Records',
        type: 'Form',
        status: 'Open',
        assignee: 'Current User',
        createdDate: new Date(),
        processInstanceId: 'mock-001',
        caseInstanceId: 'mock-001',
      },
    ];
  }

  /**
   * Fetches claim entity record filtered by CaseId only.
   * Uses getById() to get the entity, then gets all records and filters by CaseId in JavaScript.
   */
  async getClaimEntityRecord(caseId: string): Promise<any | null> {
    const ENTITY_ID = 'ad76bb21-97fb-f011-832f-000d3abf6e1a';
    
    if (isMockMode() || !this.sdk) {
      // Return mock data for development
      return {
        CaseId: caseId,
        InternalReview: null,
        Id: 'mock-entity-record-id',
      };
    }

    try {
      // Get entity by ID
      const entity = await this.sdk.entities.getById(ENTITY_ID);
      console.log('Found entity with ID:', (entity as any).id || (entity as any).Id || ENTITY_ID);
      
      // Get all records from the entity
      const response = await entity.getRecords();
      const records = (response as any).items || response;
      
      if (!Array.isArray(records)) {
        console.log(`No records found for entity ${ENTITY_ID}`);
        return null;
      }

      // Filter records in JavaScript by CaseId only
      const matchingRecords = records.filter((record: any) => {
        const recordCaseId = record.CaseId || record.caseId;
        return recordCaseId === caseId;
      });
      
      if (matchingRecords.length === 0) {
        console.log(`No entity record found for CaseId: ${caseId}`);
        return null;
      }

      // Get the first matching record
      const matchingRecord = matchingRecords[0];
      const recordId = matchingRecord.Id || matchingRecord.id;
      console.log('Found entity record with ID:', recordId);
      
      return matchingRecord;
    } catch (error: any) {
      console.error('Error fetching claim entity record:', error);
      return null;
    }
  }

  /**
   * Sends webhook after document upload.
   * Finds entity record by CaseId and sends webhook with entity record ID.
   */
  async submitDocumentUpload(caseId: string, notes: string, files: File[]): Promise<void> {
    const ENTITY_ID = 'ad76bb21-97fb-f011-832f-000d3abf6e1a';
    // Webhook URL - use window.location.origin in development (with proxy), direct URL in production
    const WEBHOOK_PATH = '/uipathlabs/Playground/orchestrator_/t/12b29e74-5ca3-40ee-84d5-849dbc279bba/create-event';
    const WEBHOOK_URL = import.meta.env.DEV 
      ? `${window.location.origin}${WEBHOOK_PATH}`
      : `https://staging.uipath.com${WEBHOOK_PATH}`;
    const BEARER_TOKEN = 'rt_857C11F7016B4B7823F5C9C1B1C3C540522092F3AC82CC7564D558C81236970C-1';

    if (isMockMode() || !this.sdk) {
      console.log('Mock mode: Simulating document upload submission');
      console.log('CaseId:', caseId);
      console.log('Notes:', notes);
      console.log('Files:', files.map(f => f.name));
      return;
    }

    try {
      // Step 1: Get the entity record by CaseId only (no DemoStage filter)
      const entity = await this.sdk.entities.getById(ENTITY_ID);
      console.log('Found entity with ID:', (entity as any).id || (entity as any).Id || ENTITY_ID);
      
      // Get all records from the entity
      const response = await entity.getRecords();
      const records = (response as any).items || response;
      
      if (!Array.isArray(records)) {
        throw new Error(`No records found for entity ${ENTITY_ID}`);
      }

      // Filter records in JavaScript by CaseId only
      const matchingRecords = records.filter((record: any) => {
        const recordCaseId = record.CaseId || record.caseId;
        return recordCaseId === caseId;
      });

      if (matchingRecords.length === 0) {
        throw new Error(`No entity record found for CaseId: ${caseId}`);
      }

      const entityRecord = matchingRecords[0];
      const recordId = entityRecord.Id || entityRecord.id;
      console.log('Found entity record with ID:', recordId);
      
      if (!recordId) {
        throw new Error('Entity record does not have an Id field');
      }

      // Step 2: Send webhook with entity record ID
      console.log('Sending webhook with entity record ID:', recordId);
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PICaseId: recordId,
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook failed: ${webhookResponse.status} - ${errorText}`);
      }

      console.log('Webhook sent successfully');
    } catch (error: any) {
      console.error('Error submitting document upload:', error);
      throw error;
    }
  }

  /**
   * Demo Setup: Sends GET request to demo-setup webhook (response includes recordId),
   * waits 30s, finds the most recently created case instance (within last minute),
   * then updates that entity record with the CaseId. Retries up to 2 times if case not found.
   */
  async runDemoSetup(): Promise<{ caseId: string }> {
    if (isMockMode() || !this.sdk) {
      throw new Error('Demo Setup is not available in mock mode or when not authenticated.');
    }

    // Use proxy in dev to avoid CORS (vite proxy: /uipathlabs -> staging.uipath.com)
    const DEMO_SETUP_PATH = '/uipathlabs/Playground/orchestrator_/t/12b29e74-5ca3-40ee-84d5-849dbc279bba/demo-setup';
    const DEMO_SETUP_WEBHOOK_URL = import.meta.env.DEV
      ? `${window.location.origin}${DEMO_SETUP_PATH}`
      : `https://staging.uipath.com${DEMO_SETUP_PATH}`;

    // 1. Send GET request to trigger demo setup (same Bearer token as other webhook)
    const DEMO_SETUP_BEARER_TOKEN = 'rt_857C11F7016B4B7823F5C9C1B1C3C540522092F3AC82CC7564D558C81236970C-1';
    const webhookResponse = await fetch(DEMO_SETUP_WEBHOOK_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${DEMO_SETUP_BEARER_TOKEN}`,
      },
    });
    if (!webhookResponse.ok) {
      throw new Error(`Demo Setup webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
    }
    const payload = await webhookResponse.json() as { recordId?: string };
    const recordId = payload?.recordId;
    if (!recordId || typeof recordId !== 'string') {
      throw new Error('Demo Setup: Webhook response did not contain a valid recordId.');
    }
    console.log('Demo Setup: Webhook triggered successfully, recordId', recordId);

    // 2. Wait 30 seconds before first search
    const SEARCH_DELAY_MS = 30000;
    const MAX_ATTEMPTS = 3; // initial + 2 retries

    const searchForLatestCaseInstance = async (): Promise<string | null> => {
      const allCases = await this.sdk!.maestro.cases.getAll();
      const targetCase = allCases.find((c: any) => c.processKey === CASE_KEY || c.id === CASE_KEY);
      if (!targetCase) return null;
      const processKey = targetCase.processKey;
      const instancesResponse = await this.sdk!.maestro.cases.instances.getAll({
        pageSize: 100,
        processKey,
      });
      const items: any[] = (instancesResponse as any).items ?? (Array.isArray(instancesResponse) ? instancesResponse : []);
      if (items.length === 0) return null;
      const sorted = [...items].sort((a, b) => {
        const timeA = a.createdTimeUtc ? new Date(a.createdTimeUtc).getTime() : 0;
        const timeB = b.createdTimeUtc ? new Date(b.createdTimeUtc).getTime() : 0;
        return timeB - timeA;
      });
      const latestInstance = sorted[0];
      const createdTimeUtc = latestInstance.createdTimeUtc ? new Date(latestInstance.createdTimeUtc).getTime() : 0;
      const oneMinuteAgo = Date.now() - 60 * 1000;
      if (createdTimeUtc < oneMinuteAgo) return null;
      const caseId = latestInstance.caseId ?? latestInstance.caseID;
      return caseId || null;
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
      const caseId = await searchForLatestCaseInstance();
      if (caseId) {
        console.log('Demo Setup: Latest case instance caseId', caseId);
        await this.sdk.entities.updateById(DEMO_ENTITY_ID, [{ id: recordId, CaseId: caseId }]);
        console.log('Demo Setup: Updated entity record with CaseId', caseId);
        return { caseId };
      }
      console.log(`Demo Setup: Case instance not found (attempt ${attempt}/${MAX_ATTEMPTS})`);
    }

    throw new Error('Demo Setup: Case instance was not found after 3 attempts. Ensure the case was started within the last minute.');
  }
}
