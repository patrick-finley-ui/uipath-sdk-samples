import type { ScriptResponseData } from '../../types/invoices';

interface AIAgentSummaryCardProps {
  summaryData: ScriptResponseData['summaryData'];
  onClick?: () => void;
}

export const AIAgentSummaryCard = ({ summaryData, onClick }: AIAgentSummaryCardProps) => {
  if (!summaryData) return null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-6 shadow-sm border border-orange-200 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all duration-200"
    >
      <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
        AI Agent Match Summary
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </h3>
      <div className="space-y-5 text-lg">
        {/* Overall Status */}
        {summaryData.OverallStatus && (
          <div className="">
            <span className="text-gray-500 text-lg block mb-1">Status:</span>
            <span
              className={`px-4 py-2 rounded-full text-base font-semibold ${
                summaryData.OverallStatus === 'FullyMatched'
                  ? 'bg-green-100 text-green-800'
                  : summaryData.OverallStatus === 'PartiallyMatched'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {summaryData.OverallStatus}
            </span>
          </div>
        )}
        {/* Recommendations */}
        {summaryData.Recommendations && (
          <div>
            <span className="text-gray-500 block mb-2 text-lg">Recommendations:</span>
            <ul className="list-disc pl-8 text-gray-900 text-base leading-relaxed bg-gray-50 p-4 rounded space-y-2">
              {Array.isArray(summaryData.Recommendations) ? (
                summaryData.Recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)
              ) : (
                <li>{summaryData.Recommendations}</li>
              )}
            </ul>
          </div>
        )}
        {/* Check Breakdown - KPI Style */}
        <div>
          <span className="text-gray-500 block mb-2 text-lg">Validation Checks:</span>
          <div className="flex divide-x divide-gray-300">
            {/* Passed */}
            <div className="text-center flex-1 px-3">
              <div className="text-2xl font-bold text-green-700">{summaryData.ChecksPassed || 0}</div>
              <div className="text-xs text-green-600 font-medium mt-1">Passed</div>
            </div>

            {/* Failed High */}
            <div className="text-center flex-1 px-3">
              <div className="text-2xl font-bold text-red-700">{summaryData.ChecksFailed_High || 0}</div>
              <div className="text-xs text-red-600 font-medium mt-1">Failed High</div>
            </div>

            {/* Failed Medium */}
            <div className="text-center flex-1 px-3">
              <div className="text-2xl font-bold text-orange-700">{summaryData.ChecksFailed_Medium || 0}</div>
              <div className="text-xs text-orange-600 font-medium mt-1">Failed Medium</div>
            </div>

            {/* Failed Low */}
            <div className="text-center flex-1 px-3">
              <div className="text-2xl font-bold text-yellow-700">{summaryData.ChecksFailed_Low || 0}</div>
              <div className="text-xs text-yellow-600 font-medium mt-1">Failed Low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
