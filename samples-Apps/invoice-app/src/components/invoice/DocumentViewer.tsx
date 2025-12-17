interface DocumentViewerProps {
  documentUrl?: string;
  loading: boolean;
  error: string | null;
  title: string;
  subtitle: string;
}

export const DocumentViewer = ({ documentUrl, loading, error, title, subtitle }: DocumentViewerProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-orange-50 border-b border-orange-100 p-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-orange-700 mt-1">{subtitle}</p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : documentUrl ? (
          <iframe src={documentUrl} className="w-full h-[800px] border border-gray-300 rounded" title={title} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No {title.toLowerCase()} available</p>
          </div>
        )}
      </div>
    </div>
  );
};
