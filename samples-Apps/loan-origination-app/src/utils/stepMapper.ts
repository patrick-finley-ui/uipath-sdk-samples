import type { LoanApplication, Task } from '../types/loan';

export type BlockingParty = 'Borrower' | 'Third-party' | 'Internal';

export interface NextRequiredAction {
  action: string;
  blockingParty?: BlockingParty;
  dueBy?: Date;
}

/**
 * Maps opaque step names to human-readable, task-oriented actions.
 * This makes the UI more realistic for human reviewers.
 */
export function mapStepToAction(
  stepName: string | undefined | null,
  loan?: LoanApplication,
  tasks?: Task[]
): NextRequiredAction {
  if (!stepName) {
    return { action: 'Initial review' };
  }

  const stepLower = stepName.toLowerCase();
  const stepNoSpaces = stepLower.replace(/\s/g, '');
  
  // Check if it's an opaque ID (like "Agentic case-8271692" or "case-8271692")
  // Opaque IDs typically:
  // - Contain "agentic" or "case-" followed by numbers
  // - Are simple alphanumeric IDs without spaces or common words
  // - Don't contain common loan processing terms
  const isOpaqueId = 
    stepLower.includes('agentic') || 
    /case-\d+/.test(stepLower) ||
    (/^[a-z0-9-]+$/.test(stepNoSpaces) && 
     !stepLower.includes('review') && 
     !stepLower.includes('document') && 
     !stepLower.includes('credit') && 
     !stepLower.includes('income') && 
     !stepLower.includes('approval') &&
     stepNoSpaces.length < 30); // Short IDs are likely opaque
  
  if (isOpaqueId) {
    // Try to infer from context (tasks, documents, status)
    if (loan) {
      const docsPending = loan.documentsSubmitted.required > loan.documentsSubmitted.submitted;
      if (docsPending) {
        return {
          action: 'Await borrower documents',
          blockingParty: 'Borrower',
          dueBy: calculateDueDate(loan.lastUpdated, 3), // 3 business days
        };
      }
    }
    
    // Check tasks for context
    if (tasks && tasks.length > 0) {
      const openTask = tasks.find(t => t.status === 'Open' || t.status === 'In Progress');
      if (openTask) {
        return mapTaskToAction(openTask, loan);
      }
    }
    
    // Default fallback for opaque IDs
    return { action: 'Review application' };
  }

  // Map common step names to task-oriented actions
  if (stepLower.includes('document') || stepLower.includes('intake') || stepLower.includes('collection')) {
    const docsPending = loan && loan.documentsSubmitted.required > loan.documentsSubmitted.submitted;
    if (docsPending) {
      return {
        action: 'Await borrower documents',
        blockingParty: 'Borrower',
        dueBy: calculateDueDate(loan.lastUpdated, 3),
      };
    }
    return {
      action: 'Review income verification',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 2) : undefined,
    };
  }

  if (stepLower.includes('income') || stepLower.includes('verification')) {
    return {
      action: 'Review income verification',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 2) : undefined,
    };
  }

  if (stepLower.includes('credit') || stepLower.includes('check') || stepLower.includes('score')) {
    return {
      action: 'Approve credit exception',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 1) : undefined,
    };
  }

  if (stepLower.includes('risk') || stepLower.includes('assessment')) {
    return {
      action: 'Complete risk assessment',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 2) : undefined,
    };
  }

  if (stepLower.includes('underwriting') || stepLower.includes('final') || stepLower.includes('approval')) {
    return {
      action: 'Final underwriting decision',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 1) : undefined,
    };
  }

  if (stepLower.includes('waiting') || stepLower.includes('await')) {
    return {
      action: 'Await borrower documents',
      blockingParty: 'Borrower',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 3) : undefined,
    };
  }

  if (stepLower.includes('review') || stepLower.includes('initial')) {
    return {
      action: 'Review income verification',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 2) : undefined,
    };
  }

  if (stepLower.includes('escalat') || stepLower.includes('exception')) {
    return {
      action: 'Approve credit exception',
      blockingParty: 'Internal',
      dueBy: loan ? calculateDueDate(loan.lastUpdated, 1) : undefined,
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
function mapTaskToAction(task: Task, loan?: LoanApplication): NextRequiredAction {
  const taskTitle = task.title.toLowerCase();
  
  if (taskTitle.includes('document') || taskTitle.includes('intake')) {
    const docsPending = loan && loan.documentsSubmitted.required > loan.documentsSubmitted.submitted;
    if (docsPending) {
      return {
        action: 'Await borrower documents',
        blockingParty: 'Borrower',
        dueBy: task.dueDate || (loan ? calculateDueDate(loan.lastUpdated, 3) : undefined),
      };
    }
  }

  if (taskTitle.includes('income') || taskTitle.includes('verification')) {
    return {
      action: 'Review income verification',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (loan ? calculateDueDate(loan.lastUpdated, 2) : undefined),
    };
  }

  if (taskTitle.includes('credit') || taskTitle.includes('exception')) {
    return {
      action: 'Approve credit exception',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (loan ? calculateDueDate(loan.lastUpdated, 1) : undefined),
    };
  }

  if (taskTitle.includes('underwriting') || taskTitle.includes('final')) {
    return {
      action: 'Final underwriting decision',
      blockingParty: 'Internal',
      dueBy: task.dueDate || (loan ? calculateDueDate(loan.lastUpdated, 1) : undefined),
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
