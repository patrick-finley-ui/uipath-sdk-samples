import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '../types/loan';
import { resolveAssetUrl } from '../utils/assetHelpers';
import adpStatementImage from '../assets/adp-sample-statement-1.png';
import driverLicenseImage from '../assets/JohnSample_DriverLicense.jpg';
import statementImage from '../assets/statement-1.png';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  processInstanceId: string;
  caseInstanceId?: string;
  onTaskComplete?: () => void;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getStatusColor = (status: Task['status']): string => {
  const colors = {
    'Open': 'bg-blue-100 text-blue-800 border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const TaskList = ({ tasks, isLoading, processInstanceId: _processInstanceId, caseInstanceId: _caseInstanceId, onTaskComplete }: TaskListProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'deepdive' | 'documents'>('deepdive');
  const [activeDocument, setActiveDocument] = useState<'adp' | 'license' | 'statement'>('adp');
  const [notes, setNotes] = useState<string>('');

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setActiveTab('deepdive');
    setActiveDocument('adp');
    // Refresh tasks when modal closes
    if (onTaskComplete) {
      onTaskComplete();
    }
  }, [onTaskComplete]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, handleCloseModal]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-uipath-orange"></div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No open tasks for this loan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{task.title}</h3>
                <p className="text-xs text-gray-500">{task.type}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-600">
                <span className="font-medium mr-2">Assignee:</span>
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="font-medium mr-2">Created:</span>
                <span>{formatDate(task.createdDate)}</span>
              </div>
              {task.dueDate && (
                <div className="flex items-center text-xs text-gray-600">
                  <span className="font-medium mr-2">Due:</span>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>
            {task.status !== 'Completed' && (
              <>
                <button
                  onClick={() => handleOpenTask(task)}
                  className="w-full px-4 py-2 bg-uipath-orange hover:bg-uipath-orange-light text-white font-semibold rounded-lg transition-colors mb-4"
                >
                  Open Task
                </button>
                <div className="mt-4">
                  <label htmlFor={`notes-${task.id}`} className="block text-xs font-medium text-gray-700 mb-2">
                    Loan Notes & Activities
                  </label>
                  <textarea
                    id={`notes-${task.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter loan-specific notes and activities performed..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-uipath-orange resize-none"
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Record notes and activities related to this loan application
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {isModalOpen && selectedTask && createPortal(
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-[90vw] h-[95vh] flex flex-col transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.type}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
                aria-label="Close modal (ESC)"
                title="Close (ESC)"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col rounded-b-lg overflow-hidden">
              {/* Main Tabs */}
              <div className="border-b border-gray-200 bg-white">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('deepdive')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'deepdive'
                        ? 'border-uipath-orange text-uipath-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Application Details
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'documents'
                        ? 'border-uipath-orange text-uipath-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Documents
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {activeTab === 'deepdive' && (
                  <div className="p-6 space-y-6">
                    {/* Property Information */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Property Information</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Property Name</p>
                            <p className="text-lg text-gray-900">Sunset Beach Villa</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Property Address</p>
                            <p className="text-lg text-gray-900">123 Ocean Drive, Miami, Florida 33139</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Property Value</p>
                            <p className="text-lg font-semibold text-gray-900">$1,500,000</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Loan Type</p>
                            <p className="text-lg text-gray-900">Jumbo Loan</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agent Analysis and Recommendations */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Agent Analysis and Recommendations</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-800">
                                Alert: Jumbo loans often require significant post-closing reserves (6-12+ months of PITI)
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="prose max-w-none">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Summary</h4>
                          <p className="text-gray-700 leading-relaxed">
                            Strong financial profile with a FICO score of 740, stable employment history, and sufficient liquid assets. 
                            Debt-to-Income (DTI) ratio is 28.5%, which is well below the 43% threshold typically required for jumbo loans. 
                            Loan-to-Value (LTV) ratio is 75%, indicating a substantial 25% down payment of $375,000, which demonstrates 
                            strong equity position and reduces lender risk. The applicant has maintained excellent credit history with 
                            no late payments in the past 7 years and has demonstrated consistent income growth over the past 5 years.
                          </p>
                          <p className="text-gray-700 leading-relaxed mt-3">
                            The property is located in a desirable Miami Beach location with strong appreciation potential. The applicant 
                            has verified liquid reserves of $425,000, which exceeds the recommended 6-12 months of PITI reserves for 
                            jumbo loans. Employment stability is excellent with 12 years at current employer and consistent annual income 
                            of $285,000. The applicant's credit utilization is low at 12%, and there are no derogatory marks or 
                            collections on the credit report.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credit History Evaluation */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Credit History Evaluation</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">FICO Score</p>
                            <p className="text-2xl font-bold text-green-600">740</p>
                            <p className="text-xs text-gray-500 mt-1">Excellent Credit Tier</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Credit Utilization</p>
                            <p className="text-2xl font-bold text-green-600">12%</p>
                            <p className="text-xs text-gray-500 mt-1">Well below 30% threshold</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Credit Account Summary</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Total Credit Accounts</span>
                              <span className="text-sm font-medium text-gray-900">18</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Open Accounts</span>
                              <span className="text-sm font-medium text-gray-900">12</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Total Credit Limit</span>
                              <span className="text-sm font-medium text-gray-900">$485,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Current Balance</span>
                              <span className="text-sm font-medium text-gray-900">$58,200</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Late Payments (7 years)</span>
                              <span className="text-sm font-medium text-green-600">0</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-700">Derogatory Marks</span>
                              <span className="text-sm font-medium text-green-600">None</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-green-800">
                            <strong>Assessment:</strong> Credit history demonstrates excellent payment behavior with no late payments, 
                            collections, or derogatory marks. Credit utilization is well-managed, and the applicant has a diverse 
                            mix of credit accounts including mortgages, auto loans, and credit cards. The 740 FICO score places the 
                            applicant in the excellent credit tier, qualifying for competitive jumbo loan rates.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Employment History Evaluation */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Employment History Evaluation</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Current Employer</p>
                            <p className="text-lg font-semibold text-gray-900">Tech Solutions Inc.</p>
                            <p className="text-sm text-gray-600">Senior Vice President, Engineering</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Employment Tenure</p>
                            <p className="text-2xl font-bold text-green-600">12 years</p>
                            <p className="text-xs text-gray-500 mt-1">Exceptional stability</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Income Details</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Annual Base Salary</span>
                              <span className="text-sm font-medium text-gray-900">$285,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Annual Bonus (3-yr avg)</span>
                              <span className="text-sm font-medium text-gray-900">$45,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Total Annual Income</span>
                              <span className="text-sm font-semibold text-gray-900">$330,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Monthly Gross Income</span>
                              <span className="text-sm font-medium text-gray-900">$27,500</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-700">Income Growth (5 years)</span>
                              <span className="text-sm font-medium text-green-600">+18%</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Employment History</h4>
                          <div className="space-y-4">
                            <div className="border-l-4 border-uipath-orange pl-4">
                              <p className="text-sm font-semibold text-gray-900">Tech Solutions Inc. - Senior VP, Engineering</p>
                              <p className="text-xs text-gray-600">January 2012 - Present (12 years)</p>
                              <p className="text-xs text-gray-500 mt-1">Promoted from Director to VP in 2016, then to Senior VP in 2020</p>
                            </div>
                            <div className="border-l-4 border-gray-300 pl-4">
                              <p className="text-sm font-semibold text-gray-900">Global Systems Corp. - Engineering Manager</p>
                              <p className="text-xs text-gray-600">March 2008 - December 2011 (3 years 9 months)</p>
                            </div>
                            <div className="border-l-4 border-gray-300 pl-4">
                              <p className="text-sm font-semibold text-gray-900">Digital Innovations LLC - Senior Software Engineer</p>
                              <p className="text-xs text-gray-600">June 2005 - February 2008 (2 years 8 months)</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-green-800">
                            <strong>Assessment:</strong> Exceptional employment stability with 12 years at current employer and 
                            consistent career progression. Income has shown steady growth over the past 5 years, and the current 
                            position is in a stable, high-demand field. Employment verification confirms full-time status with 
                            no gaps in employment history. The applicant's income level comfortably supports the proposed mortgage 
                            payment and meets jumbo loan income requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Liquid Assets Availability */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Liquid Assets Availability</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Liquid Assets</p>
                            <p className="text-2xl font-bold text-green-600">$425,000</p>
                            <p className="text-xs text-gray-500 mt-1">Verified and documented</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Required Reserves (12 months PITI)</p>
                            <p className="text-2xl font-bold text-gray-700">$312,000</p>
                            <p className="text-xs text-gray-500 mt-1">Exceeds requirement by $113,000</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Asset Breakdown</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Checking Accounts</span>
                              <span className="text-sm font-medium text-gray-900">$125,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Savings Accounts</span>
                              <span className="text-sm font-medium text-gray-900">$180,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Money Market Accounts</span>
                              <span className="text-sm font-medium text-gray-900">$85,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Investment Accounts (Liquid)</span>
                              <span className="text-sm font-medium text-gray-900">$35,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm font-semibold text-gray-900">Total Liquid Assets</span>
                              <span className="text-sm font-semibold text-gray-900">$425,000</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Assets (Non-Liquid)</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Retirement Accounts (401k, IRA)</span>
                              <span className="text-sm font-medium text-gray-900">$485,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Investment Portfolio (Stocks/Bonds)</span>
                              <span className="text-sm font-medium text-gray-900">$320,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-sm text-gray-700">Real Estate Equity (Primary Residence)</span>
                              <span className="text-sm font-medium text-gray-900">$285,000</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm font-semibold text-gray-900">Total Net Worth</span>
                              <span className="text-sm font-semibold text-gray-900">$1,515,000</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>Monthly PITI Breakdown:</strong>
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                            <div>Principal & Interest: $7,245</div>
                            <div>Property Taxes: $1,875</div>
                            <div>Insurance: $625</div>
                            <div className="font-semibold">Total PITI: $9,745/month</div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-green-800">
                            <strong>Assessment:</strong> Applicant demonstrates exceptional liquidity with $425,000 in verified liquid 
                            assets, significantly exceeding the recommended 12-month PITI reserve requirement of $312,000. The asset 
                            mix shows strong diversification across checking, savings, and investment accounts. Additionally, the 
                            applicant has substantial non-liquid assets including retirement accounts and investment portfolios, 
                            providing additional financial security. The total net worth of $1.515M demonstrates strong financial 
                            capacity and reduces risk for the jumbo loan. All assets have been verified through bank statements and 
                            account statements covering the past 2 months.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Ratios Summary */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">Financial Ratios Summary</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">Debt-to-Income (DTI)</p>
                            <p className="text-3xl font-bold text-green-600">28.5%</p>
                            <p className="text-xs text-gray-500 mt-1">Threshold: 43%</p>
                            <p className="text-xs text-green-600 mt-2 font-medium">✓ Excellent</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">Loan-to-Value (LTV)</p>
                            <p className="text-3xl font-bold text-green-600">75%</p>
                            <p className="text-xs text-gray-500 mt-1">Down Payment: 25%</p>
                            <p className="text-xs text-green-600 mt-2 font-medium">✓ Strong Equity</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">Reserve Coverage</p>
                            <p className="text-3xl font-bold text-green-600">13.6 mo</p>
                            <p className="text-xs text-gray-500 mt-1">Required: 12 mo</p>
                            <p className="text-xs text-green-600 mt-2 font-medium">✓ Exceeds Requirement</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="p-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                      {/* Document Tabs */}
                      <div className="bg-gray-50 border-b border-gray-200">
                        <nav className="flex -mb-px">
                          <button
                            onClick={() => setActiveDocument('adp')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeDocument === 'adp'
                                ? 'border-uipath-orange text-uipath-orange bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>ADP Statement</span>
                            </div>
                          </button>
                          <button
                            onClick={() => setActiveDocument('license')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeDocument === 'license'
                                ? 'border-uipath-orange text-uipath-orange bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              <span>Driver License</span>
                            </div>
                          </button>
                          <button
                            onClick={() => setActiveDocument('statement')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                              activeDocument === 'statement'
                                ? 'border-uipath-orange text-uipath-orange bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>Statement</span>
                            </div>
                          </button>
                        </nav>
                      </div>

                      {/* Document Content */}
                      <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {activeDocument === 'adp' && 'ADP Sample Statement'}
                          {activeDocument === 'license' && 'Driver License'}
                          {activeDocument === 'statement' && 'Statement Document'}
                        </h3>
                        <p className="text-uipath-orange-dark mt-1">
                          {activeDocument === 'adp' && 'View ADP earnings statement'}
                          {activeDocument === 'license' && 'View driver license image'}
                          {activeDocument === 'statement' && 'View statement document'}
                        </p>
                      </div>

                      <div className="p-4">
                        {activeDocument === 'adp' && (
                          <div className="flex items-center justify-center bg-gray-50 rounded border border-gray-300 p-4">
                            <img
                              src={resolveAssetUrl(adpStatementImage)}
                              alt="ADP Sample Statement"
                              className="max-w-full h-auto rounded shadow-lg"
                              style={{ maxHeight: '70vh' }}
                            />
                          </div>
                        )}
                        {activeDocument === 'license' && (
                          <div className="flex items-center justify-center bg-gray-50 rounded border border-gray-300 p-4">
                            <img
                              src={resolveAssetUrl(driverLicenseImage)}
                              alt="Driver License"
                              className="max-w-full h-auto rounded shadow-lg"
                              style={{ maxHeight: '70vh' }}
                            />
                          </div>
                        )}
                        {activeDocument === 'statement' && (
                          <div className="flex items-center justify-center bg-gray-50 rounded border border-gray-300 p-4">
                            <img
                              src={resolveAssetUrl(statementImage)}
                              alt="Statement"
                              className="max-w-full h-auto rounded shadow-lg"
                              style={{ maxHeight: '70vh' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

