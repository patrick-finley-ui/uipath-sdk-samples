import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Investigation, AgentOutput, CheckOutcome } from '../types/investigation';
import type { UiPath } from '@uipath/uipath-typescript';
import { getStatusBadgeConfig } from '../utils/caseStatus';
import { getRiskContent } from '../utils/riskContent';
import { ImageModal } from './ui/ImageModal';
import { Timeline } from './ui/Timeline';

interface InvestigationDetailsProps {
  investigation: Investigation | null;
  processDetails: {
    agentOutput?: AgentOutput;
    rawVariables?: any;
    loading: boolean;
    error?: string;
  };
  sdk?: UiPath;
  onClose: () => void;
}

export const InvestigationDetails = ({
  investigation,
  processDetails,
  sdk,
  onClose,
}: InvestigationDetailsProps) => {


  // Document fetching state
  const [documentUrls, setDocumentUrls] = useState<{
    passport?: string;
    financial?: string;
    subjectPhoto?: string;
  }>({});
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Image modal state
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // Tab navigation state
  const [activeDetailTab, setActiveDetailTab] = useState<'summary' | 'checks'>('summary');

  // Get environment variables
  const PROCESS_DEFINITION_KEY = import.meta.env.VITE_MAESTRO_PROCESS_KEY;
  const BUCKET_ID = parseInt(import.meta.env.VITE_UIPATH_BUCKET_ID || '0');
  const FOLDER_ID = parseInt(import.meta.env.VITE_MAESTRO_FOLDER_KEY_ID || '0');
  const showDebugBox = import.meta.env.VITE_SHOW_DEBUG_BOX === 'true';

  const openMaestroProcess = () => {
    if (!investigation?.maestroProcessInstanceKey || !investigation?.folderId) {
      console.error('Missing maestroProcessInstanceKey or folderId');
      return;
    }

    const baseUrl = import.meta.env.VITE_UIPATH_BASE_URL;
    const orgName = import.meta.env.VITE_UIPATH_ORG_NAME;
    const tenantName = import.meta.env.VITE_UIPATH_TENANT_NAME;
    const processKey = investigation.maestroProcessTypeKey || PROCESS_DEFINITION_KEY;
    const url = `${baseUrl}${orgName}/${tenantName}/maestro_/processes/${processKey}/instances/${investigation.maestroProcessInstanceKey}?folderKey=${investigation.folderId}`;
    window.open(url, '_blank');
  };

  // Fetch documents from bucket
  const fetchDocumentUrls = async () => {
    if (!investigation || !sdk) return;

    try {
      setLoadingDocuments(true);

      // Determine file paths based on risk level
      const isHighRisk = investigation.overallRisk === 'High';
      const passportPath = isHighRisk ? '/sergei_passport3.jpg' : '/minapark_passport.jpg';
      const subjectPhotoPath = isHighRisk ? '/Sergei_Volkov_Headshot.png' : '/Mina_Park_Headshot.png';
      const financialPath = '/SergeiVolkov_Quarterly financial report overview.jpg';

      // Fetch passport document
      const passportUrl = await sdk.buckets.getReadUri({
        bucketId: BUCKET_ID,
        folderId: FOLDER_ID,
        path: passportPath,
      });

      // Fetch subject photo
      const subjectPhotoUrl = await sdk.buckets.getReadUri({
        bucketId: BUCKET_ID,
        folderId: FOLDER_ID,
        path: subjectPhotoPath,
      });

      const urls: any = {
        passport: passportUrl.uri,
        subjectPhoto: subjectPhotoUrl.uri
      };

      // Fetch financial document
      const financialUrl = await sdk.buckets.getReadUri({
        bucketId: BUCKET_ID,
        folderId: FOLDER_ID,
        path: financialPath,
      });
      urls.financial = financialUrl.uri;

      setDocumentUrls(urls);
    } catch (err) {
      console.error('Error fetching document URLs:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fetch documents when investigation changes
  useEffect(() => {
    if (investigation && sdk) {
      fetchDocumentUrls();
    }
  }, [investigation?.id, sdk]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modalImage) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, modalImage]);



  const getCheckOutcome = (result: string): CheckOutcome => {
    if (result === 'Fail') return 'Flagged';
    if (result === 'Warning' || result === 'Inconclusive') return 'Warning';
    return 'Clear';
  };

  const getOutcomeBadge = (outcome: CheckOutcome) => {
    const configs = {
      Flagged: { styles: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Flagged' },
      Warning: { styles: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Warning' },
      Clear: { styles: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Clear' },
    };
    const config = configs[outcome];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${config.styles}`}>
        {config.label}
      </span>
    );
  };

  const getCheckOutcomeCounts = () => {
    if (!processDetails.agentOutput?.output?.checks) return { flagged: 0, warning: 0, clear: 0 };

    const counts = { flagged: 0, warning: 0, clear: 0 };
    processDetails.agentOutput.output.checks.forEach(check => {
      const outcome = getCheckOutcome(check.result);
      if (outcome === 'Flagged') counts.flagged++;
      else if (outcome === 'Warning') counts.warning++;
      else counts.clear++;
    });
    return counts;
  };

  if (!investigation) return null;

  const outcomeCounts = getCheckOutcomeCounts();
  const agentRecommendation = processDetails.agentOutput?.output?.overall_assessment?.risk_level || investigation.overallRisk;
  const riskContent = getRiskContent(investigation.overallRisk);
  const isHighRisk = investigation.overallRisk === 'High';

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1d29] rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col border border-gray-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#252836] rounded-t-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Investigation Details</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeConfig(investigation.caseStatus).styles}`}>
              {getStatusBadgeConfig(investigation.caseStatus).icon}
              {getStatusBadgeConfig(investigation.caseStatus).label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {investigation.maestroProcessInstanceKey && investigation.folderId && (
              <button
                onClick={openMaestroProcess}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Open in Maestro"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.42.8l.13-.13a5 5 0 000-7.08 5.01 5.01 0 00-7.07-.01l-3 3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 00-7.42-.8l-.13.13a5 5 0 000 7.08 5.01 5.01 0 007.07.01l3-3" />
                </svg>
                Open in Maestro
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              aria-label="Close modal (ESC)"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-800 pb-4">
            <button
              onClick={() => setActiveDetailTab('summary')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeDetailTab === 'summary'
                ? 'bg-[#252836] text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              Risk Summary
            </button>
            <button
              onClick={() => setActiveDetailTab('checks')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeDetailTab === 'checks'
                ? 'bg-[#252836] text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              Source Checks
            </button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Subject Profile */}
              <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Subject Profile
                </h3>
                <div className="flex gap-6 items-center">
                  <div className="flex-1 grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Full Name</label>
                      <p className="text-white font-medium mt-1">{investigation.subjectName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Date of Birth</label>
                      <p className="text-white font-medium mt-1">{investigation.subjectDob || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Nationality</label>
                      <p className="text-white font-medium mt-1">{investigation.subjectNationality}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Government ID / Passport</label>
                      <p className="text-white font-medium mt-1 font-mono">{investigation.subjectId}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Internal Subject ID</label>
                      <p className="text-white font-medium mt-1 font-mono">{investigation.id}</p>
                    </div>
                  </div>
                  {/* Subject Photo - Headshot Style */}
                  {documentUrls.subjectPhoto && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={documentUrls.subjectPhoto}
                        alt="Subject Photo"
                        className="w-32 h-40 object-cover rounded-lg border-2 border-gray-600 shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setModalImage({ url: documentUrls.subjectPhoto!, title: 'Subject Photo' })}
                      />
                      {loadingDocuments && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-red-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Section - Passport */}
              {documentUrls.passport && (
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Passport / ID Document
                  </h3>
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setModalImage({ url: documentUrls.passport!, title: 'Passport Document' })}
                  >
                    <img
                      src={documentUrls.passport}
                      alt="Passport"
                      className="w-full h-48 object-cover rounded-lg border border-gray-600 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
                      <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Risk Assessment */}
              <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Agent Risk Assessment
                </h3>
                {processDetails.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-red-500"></div>
                  </div>
                ) : processDetails.error ? (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{processDetails.error}</p>
                  </div>
                ) : processDetails.agentOutput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Agent Recommendation</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${agentRecommendation === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        agentRecommendation === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                        {agentRecommendation} Risk
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Agent Risk Summary</label>
                      <p className="text-white mt-2 leading-relaxed">
                        {processDetails.agentOutput.output.overall_assessment.summary}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Check Outcome Roll-Up</label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getOutcomeBadge('Flagged')}
                          <span className="text-white font-semibold">{outcomeCounts.flagged}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getOutcomeBadge('Warning')}
                          <span className="text-white font-semibold">{outcomeCounts.warning}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getOutcomeBadge('Clear')}
                          <span className="text-white font-semibold">{outcomeCounts.clear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No agent assessment available</p>
                )}
              </div>

              {/* Financial Summary Card */}
              {documentUrls.financial && isHighRisk && (
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Financial Summary
                  </h3>
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setModalImage({ url: documentUrls.financial!, title: 'Quarterly Financial Report' })}
                  >
                    <img
                      src={documentUrls.financial}
                      alt="Financial Report"
                      className="w-full h-48 object-cover rounded-lg border border-gray-600 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
                      <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">{activeDetailTab === 'summary' ? (
              <>
                {/* Risk Summary Card */}
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risk Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Overall Risk</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${investigation.overallRisk === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          investigation.overallRisk === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            'bg-green-500/20 text-green-400 border-green-500/30'
                          }`}>
                          {investigation.overallRisk}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Risk Confidence</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${riskContent.riskConfidence === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          riskContent.riskConfidence === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            'bg-green-500/20 text-green-400 border-green-500/30'
                          }`}>
                          {riskContent.riskConfidence}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {riskContent.riskSummary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Risk Drivers */}
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Key Risk Drivers
                  </h3>
                  <ul className="space-y-2">
                    {riskContent.keyDrivers.map((driver, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-red-400 mt-1">â€¢</span>
                        <span className="text-gray-300 text-sm">{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Timeline of Significant Events */}
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline of Significant Events
                  </h3>
                  <Timeline events={riskContent.timeline} />
                </div>

                {/* Associations / Network Context */}
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Associations / Network Context
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Vessels Linked</label>
                      <p className="text-white font-medium mt-1">
                        {riskContent.associations.vessels} {riskContent.associations.vesselsHighRisk && <span className="text-red-400 text-xs">(high risk)</span>}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">High-Risk Associates</label>
                      <p className="text-white font-medium mt-1">{riskContent.associations.highRiskAssociates}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Linked Investigations</label>
                      <p className="text-white font-medium mt-1">{riskContent.associations.linkedInvestigations ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Active Warrants</label>
                      <p className="text-white font-medium mt-1">{riskContent.associations.activeWarrants ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Source Checks */}
                <div className="bg-[#252836] rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Source Checks
                  </h3>
                  {processDetails.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-700 border-t-red-500"></div>
                    </div>
                  ) : processDetails.agentOutput?.output?.checks ? (
                    <div className="space-y-3">
                      {processDetails.agentOutput.output.checks.map((check, index) => {
                        const outcome = getCheckOutcome(check.result);
                        return (
                          <div key={index} className="bg-[#1a1d29] rounded-lg border border-gray-800 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-white font-medium">{check.name}</h4>
                                  {getOutcomeBadge(outcome)}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{check.details}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No source checks available</p>
                  )}
                </div>
              </>
            )}
            </div>
          </div>

          {/* Debug Box - Only shown when VITE_SHOW_DEBUG_BOX=true */}
          {showDebugBox && processDetails.rawVariables && (
            <div className="bg-[#252836] rounded-lg border border-yellow-500/50 p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Debug: Raw Process Variables
                <span className="ml-auto text-xs font-normal text-gray-400">VITE_SHOW_DEBUG_BOX=true</span>
              </h3>
              <div className="bg-[#1a1d29] rounded-lg border border-gray-800 p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(processDetails.rawVariables, null, 2)}
                </pre>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={modalImage?.url || ''}
        title={modalImage?.title || ''}
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
      />
    </div>,
    document.body
  );
};


