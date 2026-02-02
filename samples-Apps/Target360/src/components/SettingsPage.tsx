import { useState } from 'react';
import { ENTITY_CONFIG } from '../config/mockData.config';
import type { UiPath } from '@uipath/uipath-typescript';

interface SettingsPageProps {
  demoResetTime: string | null;
  onResetTimeToNow: () => void;
  onClearResetTime: () => void;
  sdk?: UiPath;
  onRefresh?: () => void;
}

export const SettingsPage = ({ demoResetTime, onResetTimeToNow, onClearResetTime, sdk, onRefresh }: SettingsPageProps) => {
  // Delete investigations state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

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

  const deleteOldestInvestigations = async () => {
    if (!window.confirm('⚠️ WARNING: This will DELETE the 20 oldest investigations (by updateTime). This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!sdk) {
      setDeleteError('SDK not available. Please authenticate first.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteResult(null);

    try {
      console.group('🗑️ Deleting oldest 20 investigations');

      // Fetch records WITHOUT sorting to get the first 20 (oldest by updateTime)
      const records = await sdk.entities.getRecordsById(ENTITY_CONFIG.entityId, {
        pageSize: 20,
        // No $orderby - this gets the natural order (oldest first)
      });

      console.log('Fetched records to delete:', records);

      if (!records?.items || records.items.length === 0) {
        setDeleteResult('No investigations found to delete.');
        console.log('No items to delete');
        console.groupEnd();
        return;
      }

      const itemsToDelete = records.items;
      const recordIds = itemsToDelete.map((item: any) => item.id);

      console.log(`Attempting to delete ${recordIds.length} investigations...`);
      console.log('Record IDs:', recordIds);

      // Delete all records in one call
      const deleteResponse = await sdk.entities.deleteById(ENTITY_CONFIG.entityId, recordIds);

      console.log('Delete response:', deleteResponse);
      console.groupEnd();

      const resultMessage = `Successfully deleted ${recordIds.length} investigations.`;
      setDeleteResult(resultMessage);

      console.log('✅ Deletion summary:', {
        attempted: recordIds.length,
        deleted: recordIds.length,
        response: deleteResponse,
      });

      // Refresh the investigations list if callback is provided
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 500);
      }

    } catch (err: any) {
      console.error('❌ Error during deletion process:', err);
      const errorMessage = err?.message || 'Failed to delete investigations';
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
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

      {/* Delete Oldest Investigations Section */}
      {sdk && (
        <div className="bg-[#1a1d29] rounded-lg border border-gray-800 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 rounded-full p-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Delete Oldest Investigations</h2>
                <p className="text-sm text-gray-400 mt-1">
                  ⚠️ DANGER: Deletes the 20 oldest investigations (by updateTime)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-400 mb-2">Warning: Destructive Action</p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>This will permanently delete the 20 oldest investigations</li>
                    <li>Oldest = natural order (earliest updateTime)</li>
                    <li>No sorting is applied before deletion</li>
                    <li>This action cannot be undone</li>
                    <li>Use only in development/testing environments</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={deleteOldestInvestigations}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete 20 Oldest Investigations</span>
                </>
              )}
            </button>

            {/* Success Message */}
            {deleteResult && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-400">Success</p>
                    <p className="text-sm text-gray-300">{deleteResult}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-400">Error</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">{deleteError}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
