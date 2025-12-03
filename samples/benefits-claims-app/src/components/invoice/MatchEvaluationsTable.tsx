interface MatchEvaluation {
  MismatchType: string;
  Status: string;
  Severity: string;
  Reason: string;
  Justification: string;
}

interface MatchEvaluationsTableProps {
  evaluations: MatchEvaluation[];
}

export const MatchEvaluationsTable = ({ evaluations }: MatchEvaluationsTableProps) => {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No match evaluations available</p>
      </div>
    );
  }

  return (
    <div id="evaluations-panel" role="tabpanel" aria-labelledby="evaluations-tab">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-orange-50 border-b border-orange-100 p-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            AI Match Evaluations
          </h3>
          <p className="text-orange-700 mt-1">Detailed AI mismatch analysis</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mismatch Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Justification
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {evaluation.MismatchType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        evaluation.Status === 'Passed'
                          ? 'bg-green-100 text-green-800'
                          : evaluation.Status === 'Not Passed'
                            ? 'bg-red-100 text-red-800'
                            : evaluation.Status === 'Flagged'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {evaluation.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        evaluation.Severity === 'High'
                          ? 'bg-red-50 text-red-700'
                          : evaluation.Severity === 'Medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {evaluation.Severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md">{evaluation.Reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">{evaluation.Justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
