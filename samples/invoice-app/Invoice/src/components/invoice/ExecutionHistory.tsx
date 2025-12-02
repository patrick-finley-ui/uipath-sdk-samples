import { formatDateTime } from '../../utils/formatters';

interface ExecutionEvent {
  name?: string;
  status?: number;
  endTime?: string;
}

interface ExecutionHistoryProps {
  executionHistory: ExecutionEvent[];
}

export const ExecutionHistory = ({ executionHistory }: ExecutionHistoryProps) => {
  if (!executionHistory || executionHistory.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No execution history available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-orange-50 to-indigo-50 border-b border-orange-100 p-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Execution History
          </h3>
          <p className="text-orange-700 mt-1">Activity trail for this invoice process</p>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          <div className="space-y-4">
            {[...executionHistory].reverse().map((event, index) => {
              const isCompleted = event.status === 1;
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-200 border-t-orange-600"></div>
                      </div>
                    )}
                    {index < executionHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="text-sm font-semibold text-gray-900">{event.name || 'Activity'}</h4>
                    <p className="text-xs text-gray-500 mt-1">{event.endTime && formatDateTime(event.endTime)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
