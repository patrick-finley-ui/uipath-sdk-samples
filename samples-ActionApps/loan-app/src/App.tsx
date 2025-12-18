import { useEffect, useState } from 'react';
import sdk, { initializeSdk } from './uipath';
import LoanForm from './components/LoanForm';
import { resolveAssetUrl } from './utils/assetUtils';
import './App.css';

interface LoanFormData {
  applicantName: string;
  loanAmount: number;
  creditScore: number;
  riskFactor: number;
  reviewerComments: string;
}

function App() {
  const [formData, setFormData] = useState<LoanFormData>({
    applicantName: '',
    loanAmount: 0,
    creditScore: 0,
    riskFactor: 0,
    reviewerComments: '',
  });

  useEffect(() => {
    sdk.taskEvents.getTaskDetailsFromActionCenter((data: any) => {
      if (data.data) {
        setFormData(data.data);
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

  const handleDataChange = (newData: LoanFormData) => {
    setFormData(newData);
    sdk.taskEvents.dataChanged(newData);
  };

  const handleApprove = () => {
    sdk.taskEvents.completeTask('Approve', formData);
  };

  const handleReject = () => {
    sdk.taskEvents.completeTask('Reject', formData);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img 
          src={resolveAssetUrl('/src/assets/react.svg')} 
          className="logo" 
          alt="logo" 
        />
        <h1>Loan Application Review</h1>
      </header>
      <main>
        <LoanForm 
          data={formData} 
          onDataChange={handleDataChange} 
          onApprove={handleApprove} 
          onReject={handleReject} 
        />
      </main>
    </div>
  );
}

export default App;
