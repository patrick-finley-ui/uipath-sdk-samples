interface StartProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceFilePath: string;
  setInvoiceFilePath: (value: string) => void;
  sendToEmail: string;
  setSendToEmail: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export const StartProcessModal = ({
  isOpen,
  onClose,
  invoiceFilePath,
  setInvoiceFilePath,
  sendToEmail,
  setSendToEmail,
  onSubmit,
  isLoading,
  error,
}: StartProcessModalProps) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            Start Invoice Processing
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="invoiceFilePath" className="block text-sm font-medium text-gray-700 mb-2">
              Invoice File Path
            </label>
            <input
              id="invoiceFilePath"
              type="text"
              value={invoiceFilePath}
              onChange={(e) => setInvoiceFilePath(e.target.value)}
              placeholder="e.g., Invoice-INV-1025.pdf"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-2 flex gap-2">
              <span className="text-xs text-gray-500 self-center">Quick Select:</span>
              {[
                { label: '1025', value: 'Invoice-INV-1025.pdf' },
                { label: '1026', value: 'Invoice-INV-1026.pdf' },
                { label: '1027', value: 'Invoice-INV-1027.pdf' },
              ].map((snippet) => (
                <button
                  key={snippet.label}
                  onClick={() => setInvoiceFilePath(snippet.value)}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {snippet.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter the file path or name of the invoice to process</p>
          </div>

          <div className="mb-6">
            <label htmlFor="sendToEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Send To Email
            </label>
            <input
              id="sendToEmail"
              type="text"
              value={sendToEmail}
              onChange={(e) => setSendToEmail(e.target.value)}
              placeholder="@uipath.com"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-500">Enter the email address to send the results to</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
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
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Start Process
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
