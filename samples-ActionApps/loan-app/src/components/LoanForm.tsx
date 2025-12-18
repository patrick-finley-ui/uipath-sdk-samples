import React, { useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUtils';
import './LoanForm.css';

interface LoanFormData {
  applicantName: string;
  loanAmount: number;
  creditScore: number;
  riskFactor: number;
  reviewerComments: string;
}

interface LoanFormProps {
  data: LoanFormData;
  onDataChange: (data: LoanFormData) => void;
  onApprove: () => void;
  onReject: () => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ data, onDataChange, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState<'review' | 'attachments'>('review');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onDataChange({
      ...data,
      [name]: name === 'loanAmount' || name === 'creditScore' || name === 'riskFactor' 
        ? Number(value) 
        : value,
    });
  };

  return (
    <div className="loan-form-container">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Application Review
        </button>
        <button 
          className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
          onClick={() => setActiveTab('attachments')}
        >
          Attachments
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'review' && (
          <div className="review-tab">
            <div className="form-group">
              <label>Applicant Name</label>
              <input 
                type="text" 
                name="applicantName" 
                value={data.applicantName || ''} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter applicant full name"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Loan Amount</label>
                <input 
                  type="number" 
                  name="loanAmount" 
                  value={data.loanAmount || 0} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Credit Score</label>
                <input 
                  type="number" 
                  name="creditScore" 
                  value={data.creditScore || 0} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Risk Factor</label>
                <input 
                  type="number" 
                  name="riskFactor" 
                  value={data.riskFactor || 0} 
                  onChange={handleChange} 
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reviewer Comments</label>
              <textarea 
                name="reviewerComments" 
                value={data.reviewerComments || ''} 
                onChange={handleChange} 
                className="form-textarea"
              />
            </div>
            <div className="actions">
              <button onClick={onApprove} className="action-button approve">Approve</button>
              <button onClick={onReject} className="action-button reject">Reject</button>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="attachments-tab">
            <img 
              src={resolveAssetUrl('/src/assets/loanApplication.png')} 
              alt="Loan Application" 
              className="attachment-image"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanForm;
