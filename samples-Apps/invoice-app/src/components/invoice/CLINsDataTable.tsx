interface CLINsDataTableProps {
  clinsData: any[];
}

export const CLINsDataTable = ({ clinsData }: CLINsDataTableProps) => {
  if (!clinsData || clinsData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No contract line items available</p>
      </div>
    );
  }

  const headers = Object.keys(clinsData[0]);

  return (
    <div id="clins-panel" role="tabpanel" aria-labelledby="clins-tab">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100 p-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            Contract Line Items (CLINs)
          </h3>
          <p className="text-orange-700 mt-1">Detailed line item information</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clinsData.map((clin, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {Object.values(clin).map((value, valueIndex) => (
                    <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {value !== undefined && value !== null ? String(value) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
