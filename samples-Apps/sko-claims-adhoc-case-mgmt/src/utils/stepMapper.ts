import type { Claim, Task } from '../types/claim';

export type BlockingParty = 'Claimant' | 'Third-party' | 'Internal' | 'Medical Provider';

export interface NextRequiredAction {
  action: string;
  blockingParty?: BlockingParty;
  dueBy?: Date;
}

/**
 * Maps opaque step names to human-readable, task-oriented actions for claims management.
 */
export function mapStepToAction(
  stepName: string | undefined | null,
  claim?: Claim,
  tasks?: Task[]
): NextRequiredAction {
  if (!stepName) {
    return { action: 'Initial review' };
  }

  const stepLower = stepName.toLowerCase();
  const stepNoSpaces = stepLower.replace(/\s/g, '');
  
  // Check if it's an opaque ID
  const isOpaqueId = 
    stepLower.includes('agentic') || 
    /case-\d+/.test(stepLower) ||
    (/^[a-z0-9-]+$/.test(stepNoSpaces) && 
     !stepLower.includes('review') && 
     !stepLower.includes('document') && 
     !stepLower.includes('medical') && 
     !stepLower.includes('investigation') && 
     !stepLower.includes('approval') &&
     stepNoSpaces.length < 30);
  
  if (isOpaqueId) {
    if (claim) {
      const docsPending = claim.documentsSubmitted.required > claim.documentsSubmitted.submitted;
      if (docsPending) {
        return {
          action: 'Await medical records',
          blockingParty: 'Medical Provider',
          dueBy: calculateDueDate(claim.lastUpdated, 5), // 5 business days
        };
      }
    }
    
    if (tasks && tasks.length > 0) {
      const openTask = tasks.find(t => t.status === 'Open' || t.status === 'In Progress');
      if (openTask) {
        return mapTaskToAction(openTask, claim);
      }
    }
    
    return { action: 'Review claim' };
  }

  // Map common step names to task-oriented actions for claims
  if (stepLower.includes('document') || stepLower.includes('intake') || stepLower.includes('collection')) {
    const docsPending = claim && claim.documentsSubmitted.required > claim.documentsSubmitted.submitted;
    if (docsPending) {
      return {
        action: 'Await medical records',
        blockingParty: 'Medical Provider',
        dueBy: calculateDueDate(claim.lastUpdated, 5),
      };
    }
    return {
      action: 'Review medical documentation',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 3) : undefined,
    };
  }

  if (stepLower.includes('medical') || stepLower.includes('records') || stepLower.includes('verification')) {
    return {
      action: 'Review medical records',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 3) : undefined,
    };
  }

  if (stepLower.includes('investigation') || stepLower.includes('liability')) {
    return {
      action: 'Complete liability investigation',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 7) : undefined,
    };
  }

  if (stepLower.includes('damages') || stepLower.includes('assessment') || stepLower.includes('evaluation')) {
    return {
      action: 'Assess damages',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 5) : undefined,
    };
  }

  if (stepLower.includes('settlement') || stepLower.includes('negotiation')) {
    return {
      action: 'Review settlement offer',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 3) : undefined,
    };
  }

  if (stepLower.includes('approval') || stepLower.includes('final')) {
    return {
      action: 'Final approval decision',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 2) : undefined,
    };
  }

  if (stepLower.includes('waiting') || stepLower.includes('await')) {
    return {
      action: 'Await claimant response',
      blockingParty: 'Claimant',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 5) : undefined,
    };
  }

  if (stepLower.includes('review') || stepLower.includes('initial')) {
    return {
      action: 'Review claim documentation',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 3) : undefined,
    };
  }

  if (stepLower.includes('escalat') || stepLower.includes('exception')) {
    return {
      action: 'Review escalation',
      blockingParty: 'Internal',
      dueBy: claim ? calculateDueDate(claim.lastUpdated, 1) : undefined,
    };
  }

  // Default: format the step name nicely
  const formatted = stepName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
  
  return {
    action: formatted,
    blockingParty: 'Internal',
  };
}

/**
 * Maps a task to a next required action
 */
function mapTaskToAction(task: Task, claim?: Claim): NextRequiredAction {
  const taskTitle = task.title.toLowerCase();
  
  if (taskTitle.includes('document') || taskTitle.includes('intake')) {
    const docsPending = claim && claim.documentsSubmitted.required > claim.documentsSubmitted.submitted;
    if (docsPending) {
      return {
        action: 'Await medical records',
        blockingParty: 'Medical Provider',
        dueBy: task.dueDate || (claim ? calculateDueDate(claim.lastUpdated, 5) : undefined),
      };
    }
  }

  if (taskTitle.includes('medical') || taskTitle.includes('records')) {
    return {
      action: 'Review medical records',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (claim ? calculateDueDate(claim.lastUpdated, 3) : undefined),
    };
  }

  if (taskTitle.includes('investigation') || taskTitle.includes('liability')) {
    return {
      action: 'Complete liability investigation',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (claim ? calculateDueDate(claim.lastUpdated, 7) : undefined),
    };
  }

  if (taskTitle.includes('settlement') || taskTitle.includes('approval')) {
    return {
      action: 'Review settlement offer',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (claim ? calculateDueDate(claim.lastUpdated, 3) : undefined),
    };
  }

  // Use task title as action
  return {
    action: task.title,
    blockingParty: 'Internal',
    dueBy: task.dueDate,
  };
}

/**
 * Calculates a due date based on last update and business days
 */
function calculateDueDate(lastUpdated: Date, businessDays: number): Date {
  const dueDate = new Date(lastUpdated);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    dueDate.setDate(dueDate.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) {
      daysAdded++;
    }
  }
  
  // Set to end of business day (5 PM)
  dueDate.setHours(17, 0, 0, 0);
  
  return dueDate;
}

/**
 * Formats a date/time for display in the UI
 */
export function formatDueDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return 'Overdue';
  }

  if (diffHours < 24) {
    return `Due today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (diffDays === 1) {
    return `Due tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (diffDays <= 7) {
    return `Due ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  }

  return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}
