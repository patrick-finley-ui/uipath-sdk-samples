import { useState, useEffect } from 'react';
import uipathLogo from '../assets/uipath-corporate-logo-digital-rgb-ob.png';
import driverLicenseJpg from '../assets/JohnSample_DriverLicense.jpg';
import { resolveAssetUrl } from '../utils/assetHelpers';
import sdk, { initializeSdk } from '../../uipath.js';

interface FormData {
  applicantName: string;
  loanAmount: number | '';
  creditScore: number | '';
  riskScore: number | '';
  reviewerComments: string;
}

export const LoanReviewForm = () => {
  const [activeTab, setActiveTab] = useState<'review' | 'attachments' | 'deepdive'>('review');
  const [activeDocument, setActiveDocument] = useState<'statement' | 'adp' | 'license'>('statement');
  const [formData, setFormData] = useState<FormData>({
    applicantName: '',
    loanAmount: '',
    creditScore: '',
    riskScore: '',
    reviewerComments: '',
  });

  useEffect(() => {
    // Initialize Action Center
    sdk.taskEvents.getTaskDetailsFromActionCenter((data: any) => {
      if (data.data) {
        setFormData({
          applicantName: data.data.applicantName || '',
          loanAmount: data.data.loanAmount || '',
          creditScore: data.data.creditScore || '',
          riskScore: data.data.riskScore || '',
          reviewerComments: data.data.reviewerComments || '',
        });
      }
      if (data.baseUrl && data.orgName && data.tenantName && data.token) {
        initializeSdk({
          baseUrl: data.baseUrl,
          orgName: data.orgName,
          tenantName: data.tenantName,
          token: data.token
        });
      }
      if (data.newToken) {
        sdk.updateToken(data.newToken);
      }
    });
    sdk.taskEvents.initializeInActionCenter();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    const updatedData = {
      ...formData,
      [field]: value,
    };
    setFormData(updatedData);
    // Notify Action Center of data changes
    sdk.taskEvents.dataChanged(updatedData);
  };

  const handleSubmit = (outcome: 'Approve' | 'Reject') => {
    const submitData = {
      applicantName: formData.applicantName,
      loanAmount: formData.loanAmount,
      creditScore: formData.creditScore,
      riskFactor: formData.riskScore ? Number(formData.riskScore) : undefined,
      reviewerComments: formData.reviewerComments,
    };
    sdk.taskEvents.completeTask(outcome, submitData);
  };

  // Use resolveAssetUrl for Action Center compatibility for assets in src/assets
  const logoUrl = resolveAssetUrl(uipathLogo);
  const driverLicenseUrl = resolveAssetUrl(driverLicenseJpg);
  
  // PDFs in public folder - use resolveAssetUrl for Action Center compatibility
  // Public folder files are served at root, but Action Center may change base path
  const statementPdfUrl = resolveAssetUrl('/statement.pdf');
  const adpStatementPdfUrl = resolveAssetUrl('/adp-sample-statement.pdf');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <img 
              src={logoUrl} 
              alt="UiPath Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-2xl font-bold text-gray-900">Loan Application Review</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'review'
                  ? 'border-uipath-orange text-uipath-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Application Review
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-uipath-orange text-uipath-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attachments
            </button>
            <button
              onClick={() => setActiveTab('deepdive')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'deepdive'
                  ? 'border-uipath-orange text-uipath-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applicant Deep Dive
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'review' && (
            <div className="space-y-6">
              {/* Property Overview */}
              <div className="bg-gradient-to-r from-uipath-orange-subtle to-orange-50 border border-uipath-orange-light rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Sunset Beach Villa</h2>
                    <p className="text-gray-600">123 Ocean Drive, Miami, Florida 33139</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Property Value</p>
                    <p className="text-3xl font-bold text-uipath-orange">$1,500,000</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">FICO Score</p>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">740</p>
                  <p className="text-xs text-gray-500 mt-1">Excellent</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">DTI Ratio</p>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">28.5%</p>
                  <p className="text-xs text-gray-500 mt-1">Threshold: 43%</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">LTV Ratio</p>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">75%</p>
                  <p className="text-xs text-gray-500 mt-1">25% Down Payment</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Reserves</p>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">13.6 mo</p>
                  <p className="text-xs text-gray-500 mt-1">Exceeds 12 mo req</p>
                </div>
              </div>

              {/* Summary Cards Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Credit History */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-blue-50 border-b border-blue-100 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Credit History</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Credit Utilization</span>
                      <span className="text-sm font-semibold text-green-600">12%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Late Payments (7yr)</span>
                      <span className="text-sm font-semibold text-green-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Derogatory Marks</span>
                      <span className="text-sm font-semibold text-green-600">None</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Excellent payment history with diverse credit mix</p>
                    </div>
                  </div>
                </div>

                {/* Employment */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-green-50 border-b border-green-100 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Employment</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Tenure</span>
                      <span className="text-sm font-semibold text-green-600">12 years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Annual Income</span>
                      <span className="text-sm font-semibold text-gray-900">$330,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Income Growth</span>
                      <span className="text-sm font-semibold text-green-600">+18% (5yr)</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Exceptional stability with consistent growth</p>
                    </div>
                  </div>
                </div>

                {/* Liquid Assets */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-purple-50 border-b border-purple-100 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Liquid Assets</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Liquid</span>
                      <span className="text-sm font-semibold text-gray-900">$425,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Required Reserves</span>
                      <span className="text-sm font-semibold text-gray-600">$312,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Excess</span>
                      <span className="text-sm font-semibold text-green-600">+$113,000</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Significantly exceeds reserve requirements</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                  <h3 className="text-lg font-bold text-gray-900">Quick Summary</h3>
                </div>
                <div className="p-6">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Strong Approval Recommendation:</strong> Applicant demonstrates excellent creditworthiness with 
                      a 740 FICO score, stable 12-year employment history, and substantial liquid assets ($425K) that exceed 
                      reserve requirements. DTI of 28.5% and LTV of 75% are well within acceptable ranges for jumbo loans.
                    </p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Jumbo loans typically require 6-12 months of post-closing reserves. Applicant 
                      has 13.6 months of PITI reserves, which exceeds the requirement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviewer Input Section */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <h3 className="text-lg font-bold text-gray-900">Reviewer Input</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="riskScore" className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Score
                    </label>
                    <input
                      type="number"
                      id="riskScore"
                      value={formData.riskScore}
                      onChange={(e) => handleInputChange('riskScore', e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-transparent outline-none transition-all"
                      placeholder="Enter risk score (0-100)"
                    />
                  </div>

                  <div>
                    <label htmlFor="reviewerComments" className="block text-sm font-medium text-gray-700 mb-2">
                      Reviewer Comments
                    </label>
                    <textarea
                      id="reviewerComments"
                      value={formData.reviewerComments}
                      onChange={(e) => handleInputChange('reviewerComments', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Enter your review comments and analysis..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => handleSubmit('Approve')}
                  className="flex-1 bg-uipath-orange text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-uipath-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-uipath-orange focus:ring-offset-2 shadow-md"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleSubmit('Reject')}
                  className="flex-1 bg-gray-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-md"
                >
                  Reject Application
                </button>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="w-full">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Document Tabs */}
                <div className="bg-gray-50 border-b border-gray-200">
                  <nav className="flex -mb-px">
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
                  </nav>
                </div>

                {/* Document Content */}
                <div className="bg-uipath-orange-subtle border-b border-uipath-orange-light p-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeDocument === 'statement' && 'Statement Document'}
                    {activeDocument === 'adp' && 'ADP Sample Statement'}
                    {activeDocument === 'license' && 'Driver License'}
                  </h3>
                  <p className="text-uipath-orange-dark mt-1">
                    {activeDocument === 'statement' && 'View statement PDF'}
                    {activeDocument === 'adp' && 'View ADP statement PDF'}
                    {activeDocument === 'license' && 'View driver license image'}
                  </p>
                </div>

                <div className="p-4">
                  {activeDocument === 'statement' && (
                    <iframe
                      src={statementPdfUrl}
                      className="w-full h-[800px] border border-gray-300 rounded"
                      title="Statement PDF"
                    />
                  )}
                  {activeDocument === 'adp' && (
                    <iframe
                      src={adpStatementPdfUrl}
                      className="w-full h-[800px] border border-gray-300 rounded"
                      title="ADP Statement PDF"
                    />
                  )}
                  {activeDocument === 'license' && (
                    <div className="flex items-center justify-center bg-gray-50 rounded border border-gray-300 p-4">
                      <img
                        src={driverLicenseUrl}
                        alt="Driver License"
                        className="max-w-full h-auto rounded shadow-lg"
                        style={{ maxHeight: '800px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deepdive' && (
            <div className="w-full space-y-6">
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
        </div>
      </div>
    </div>
  );
};
