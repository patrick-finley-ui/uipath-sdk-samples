interface SettingsPageProps {
  demoResetTime: string | null;
  onResetTimeToNow: () => void;
  onClearResetTime: () => void;
}

export const SettingsPage = ({ demoResetTime, onResetTimeToNow, onClearResetTime }: SettingsPageProps) => {
  const formatResetTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-sm text-gray-400">
          Manage your application preferences and demo data configuration
        </p>
      </div>

      {/* Demo Data Settings Section */}
      <div className="bg-[#1a1d29] rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Demo Data Configuration</h2>
          <p className="text-sm text-gray-400 mt-1">
            Control how demo data is displayed and when it resets
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Demo Reset Time Setting */}
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-medium text-white">Demo Reset Time</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Set a timestamp to simulate older data. Records created after this time will be replaced with randomized demo data.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-sm">
                    <div className="bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3">
                      <div className="text-xs text-gray-500 mb-1">Current Reset Time</div>
                      <div className="text-sm text-gray-300 font-medium">
                        {formatResetTime(demoResetTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onResetTimeToNow}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                    >
                      Reset to Now
                    </button>

                    {demoResetTime && (
                      <button
                        onClick={onClearResetTime}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">How Demo Reset Time Works</h4>
                <p className="text-sm text-gray-300">
                  When set, any investigation records with a creation date after the reset time will be replaced with randomized demo data.
                  This allows you to populate your dashboard with sample data while preserving older, actual records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
