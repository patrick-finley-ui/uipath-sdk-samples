import { useEffect, useRef, useState } from 'react';
import Viewer from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

interface BpmnViewerProps {
  bpmnXml: string;
  currentStep?: string;
}

export const BpmnViewer = ({ bpmnXml, currentStep }: BpmnViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bpmnXml) {
      setLoading(false);
      setError('No BPMN diagram data available');
      return;
    }

    if (!containerRef.current) return;

    const initViewer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clean up existing viewer
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        // Create new viewer
        const viewer = new Viewer({
          container: containerRef.current!,
          width: '100%',
          height: '600px',
        });

        viewerRef.current = viewer;

        // Import BPMN XML
        await viewer.importXML(bpmnXml);

        // Get canvas and zoom to fit
        const canvas: any = viewer.get('canvas');
        canvas.zoom('fit-viewport');

        // Highlight current step if provided
        if (currentStep) {
          const elementRegistry: any = viewer.get('elementRegistry');
          const elements = elementRegistry.filter((element: any) => {
            return element.businessObject &&
                   element.businessObject.name === currentStep;
          });

          elements.forEach((element: any) => {
            try {
              // Add a marker to highlight current step
              canvas.addMarker(element.id, 'current-step');
            } catch (err) {
              console.warn('Could not highlight element:', element.id);
            }
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading BPMN diagram:', err);
        setError(err instanceof Error ? err.message : 'Failed to load BPMN diagram');
        setLoading(false);
      }
    };

    initViewer();

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [bpmnXml, currentStep]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-uipath-orange/20 border-t-uipath-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading process diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center p-6">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-900 font-medium mb-2">Unable to load process diagram</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-uipath-orange text-white rounded-lg hover:bg-uipath-orange-light transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div ref={containerRef} className="bpmn-container" style={{ height: '600px' }} />
      <style>{`
        .bpmn-container .current-step {
          stroke: #FA4616 !important;
          stroke-width: 3px !important;
        }
      `}</style>
    </div>
  );
};

