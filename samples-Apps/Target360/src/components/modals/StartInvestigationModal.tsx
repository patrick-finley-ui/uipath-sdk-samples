
interface StartInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  setSubjectName: (value: string) => void;
  analystEmail: string;
  setAnalystEmail: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export const StartInvestigationModal = ({
  isOpen,
  onClose,
  subjectName,
  setSubjectName,
  analystEmail,
  setAnalystEmail,
  onSubmit,
  isLoading,
  error,
}: StartInvestigationModalProps) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1d2e] rounded-lg shadow-xl w-[500px] max-w-[90vw] border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            Start New Investigation
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Subject Name Input */}
          <div className="mb-6">
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-300 mb-2">
              Subject Name
            </label>
            <input
              id="subjectName"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Enter subject name"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#252836] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-400">Enter the name of the subject being investigated</p>
          </div>

          {/* Analyst Email Input */}
          <div className="mb-6">
            <label htmlFor="analystEmail" className="block text-sm font-medium text-gray-300 mb-2">
              Analyst Email
            </label>
            <input
              id="analystEmail"
              type="email"
              value={analystEmail}
              onChange={(e) => setAnalystEmail(e.target.value)}
              placeholder="analyst@example.com"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#252836] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-400">Enter the email address of the assigned analyst</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  Start Investigation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
