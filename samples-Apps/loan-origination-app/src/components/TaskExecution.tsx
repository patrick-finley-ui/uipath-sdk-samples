import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { LoanService } from '../services/loanService';
import { Header } from './layout/Header';
import { getFolderId } from '../utils/config';

export const TaskExecution = () => {
  const { processInstanceId, taskId } = useParams<{ processInstanceId: string; taskId: string }>();
  const navigate = useNavigate();
  const { sdk } = useAuth();
  const loanService = new LoanService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const folderId = getFolderId() || 'default';
  const instanceId = processInstanceId; // Can be either caseInstanceId or processInstanceId

  const { data: tasks } = useQuery({
    queryKey: ['loan-tasks', instanceId],
    queryFn: () => loanService.getTasksForCaseInstance(instanceId!, folderId),
    enabled: !!instanceId,
  });

  const task = tasks?.find(t => t.id === taskId);

  const handleClose = () => {
    navigate(`/loans/${instanceId}`);
  };

  const handleRefresh = () => {
    navigate(`/loans/${instanceId}`);
    window.location.reload();
  };

  if (!task || !task.formUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-900 font-medium mb-2">Task not found</p>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or doesn't have a form URL.</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light"
            >
              Back to Loan Detail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Modal Header */}
        <div className="bg-white rounded-t-lg border border-b-0 border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <p className="text-sm text-gray-600 mt-1">Loan {processInstanceId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close and Refresh
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Loan
            </button>
          </div>
        </div>

        {/* iFrame Container */}
        <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
          <iframe
            src={task.formUrl}
            className="w-full h-[calc(100vh-250px)] min-h-[600px] border-0"
            title={task.title}
            allow="camera; microphone; geolocation"
          />
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Complete the task in the form above. When finished, click "Close and Refresh" to return to the loan detail page and see updated status.
          </p>
        </div>
      </div>
    </div>
  );
};

