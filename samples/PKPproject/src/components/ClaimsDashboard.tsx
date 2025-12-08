import { useClaims } from '@/hooks/useClaims';
import { ClaimsTable } from './ClaimsTable';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { Header } from './Header';

export const ClaimsDashboard = () => {
  const { claims, isLoading, error, refetch } = useClaims();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ErrorDisplay message={error.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Claims Management Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Total Claims: {claims.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <ClaimsTable claims={claims} />
          </div>
        </div>
      </div>
    </div>
  );
};
