import type { LoanApplication, Task } from '../types/loan';

// Mock loan applications data
export const mockLoanApplications: LoanApplication[] = [
  {
    id: 'LOAN-001',
    processInstanceId: 'proc-inst-001',
    applicant: 'John Sample',
    loanAmount: 1200000,
    productType: 'Home Mortgage',
    status: 'Under Review',
    currentStep: 'Document Review',
    documentsSubmitted: { submitted: 4, required: 4 },
    lastUpdated: new Date('2024-01-15T10:30:00'),
    folderId: 'folder-1',
  },
  {
    id: 'LOAN-002',
    processInstanceId: 'proc-inst-002',
    applicant: 'Sarah Johnson',
    loanAmount: 45000,
    productType: 'Auto Loan',
    status: 'Under Review',
    currentStep: 'Waiting for Documents',
    documentsSubmitted: { submitted: 2, required: 4 },
    lastUpdated: new Date('2024-01-14T14:20:00'),
    folderId: 'folder-1',
  },
  {
    id: 'LOAN-003',
    processInstanceId: 'proc-inst-003',
    applicant: 'Michael Chen',
    loanAmount: 150000,
    productType: 'Small Business',
    status: 'Approved',
    currentStep: 'Final Approval',
    documentsSubmitted: { submitted: 5, required: 5 },
    lastUpdated: new Date('2024-01-13T09:15:00'),
    folderId: 'folder-1',
  },
  {
    id: 'LOAN-004',
    processInstanceId: 'proc-inst-004',
    applicant: 'Emily Davis',
    loanAmount: 320000,
    productType: 'Home Mortgage',
    status: 'Under Review',
    currentStep: 'Initial Review',
    documentsSubmitted: { submitted: 1, required: 5 },
    lastUpdated: new Date('2024-01-16T08:45:00'),
    folderId: 'folder-1',
  },
  {
    id: 'LOAN-005',
    processInstanceId: 'proc-inst-005',
    applicant: 'Robert Wilson',
    loanAmount: 75000,
    productType: 'Auto Loan',
    status: 'Escalated',
    currentStep: 'Rejection',
    documentsSubmitted: { submitted: 3, required: 4 },
    lastUpdated: new Date('2024-01-12T16:30:00'),
    folderId: 'folder-1',
  },
];

// Mock BPMN XML (simplified)
export const mockBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1"/>
    <bpmn2:task id="Task_1" name="Initial Review"/>
    <bpmn2:task id="Task_2" name="Document Review"/>
    <bpmn2:task id="Task_3" name="Credit Check"/>
    <bpmn2:task id="Task_4" name="Final Approval"/>
    <bpmn2:endEvent id="EndEvent_1"/>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2"/>
    <bpmn2:sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Task_3"/>
    <bpmn2:sequenceFlow id="Flow_4" sourceRef="Task_3" targetRef="Task_4"/>
    <bpmn2:sequenceFlow id="Flow_5" sourceRef="Task_4" targetRef="EndEvent_1"/>
  </bpmn2:process>
</bpmn2:definitions>`;

// Mock tasks
export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Review Application Documents',
    type: 'Form',
    status: 'Open',
    assignee: 'Unassigned',
    createdDate: new Date('2024-01-15T10:30:00'),
    dueDate: new Date('2024-01-17T17:00:00'),
    formUrl: 'https://cloud.uipath.com/tasks/form/task-001',
    processInstanceId: 'proc-inst-001',
  },
  {
    id: 'task-002',
    title: 'Verify Income Documents',
    type: 'Form',
    status: 'Open',
    assignee: 'Unassigned',
    createdDate: new Date('2024-01-14T14:20:00'),
    dueDate: new Date('2024-01-16T17:00:00'),
    formUrl: 'https://cloud.uipath.com/tasks/form/task-002',
    processInstanceId: 'proc-inst-002',
  },
];

// Mock KPIs
export const mockKPIs = {
  newApplicationsToday: 12,
  applicationsInReview: 8,
  averageTimeToDecision: 3.5,
  totalLoanVolume: 2450000,
};

