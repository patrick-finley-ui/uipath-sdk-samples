import { useState } from 'react';
import { ClaimService } from '../services/claimService';
import { useAuth } from '../hooks/useAuth';

interface DocumentUploadTaskProps {
  caseId: string;
  onUploadComplete?: () => void;
}

export const DocumentUploadTask = ({ caseId, onUploadComplete }: DocumentUploadTaskProps) => {
  const { sdk } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const claimService = new ClaimService(
    sdk,
    import.meta.env.VITE_UIPATH_ORG_NAME,
    import.meta.env.VITE_UIPATH_TENANT_NAME,
    import.meta.env.VITE_UIPATH_BASE_URL
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 && !notes.trim()) {
      alert('Please upload at least one document or add notes.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Send webhook and update entity record
      await claimService.submitDocumentUpload(caseId, notes, selectedFiles);
      
      setUploadStatus('success');
      setSelectedFiles([]);
      setNotes('');
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadStatus('error');
      alert('Failed to submit documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Upload Documents</h3>
        <p className="text-xs text-gray-600">
          Please upload required documents for this claim review.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Documents
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-uipath-orange transition-colors">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="document-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="document-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <svg
              className="w-8 h-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-gray-600">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-gray-500 mt-1">
              PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
            </span>
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  aria-label="Remove file"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Field */}
      <div className="mb-4">
        <label htmlFor="upload-notes" className="block text-xs font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="upload-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the uploaded documents..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-uipath-orange focus:border-uipath-orange resize-none"
          rows={4}
        />
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isUploading || (selectedFiles.length === 0 && !notes.trim())}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isUploading || (selectedFiles.length === 0 && !notes.trim())
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-uipath-orange text-white hover:bg-uipath-orange-light'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload Documents'
          )}
        </button>

        {uploadStatus === 'success' && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Uploaded successfully
          </span>
        )}

        {uploadStatus === 'error' && (
          <span className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Upload failed
          </span>
        )}
      </div>
    </div>
  );
};
