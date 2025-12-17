import { useEffect, useRef, useState } from 'react';
import Viewer from 'bpmn-js/lib/Viewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import type { ProcessInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript';

interface BpmnViewerProps {
  bpmnXml: string;
  executionHistory?: ProcessInstanceExecutionHistoryResponse[];
}

export const BpmnViewer = ({ bpmnXml, executionHistory }: BpmnViewerProps) => {
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

        // Highlight completed activities based on execution history
        if (executionHistory && executionHistory.length > 0) {
          const elementRegistry: any = viewer.get('elementRegistry');

          executionHistory.forEach((event: any) => {
            if (event.name && event.status === 1) { // Status 1 = completed
              // Try to find the element by name
              const elements = elementRegistry.filter((element: any) => {
                return element.businessObject &&
                       element.businessObject.name === event.name;
              });

              elements.forEach((element: any) => {
                try {
                  // Add a green stroke to completed activities
                  canvas.addMarker(element.id, 'completed-activity');
                } catch (err) {
                  console.warn('Could not highlight element:', element.id);
                }
              });
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
  }, [bpmnXml, executionHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-md font-semibold text-gray-900 mb-1">Loading BPMN Diagram</h3>
          <p className="text-gray-600 text-sm">Rendering process visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-6">
          <div className="p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load BPMN Diagram</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`
        .completed-activity .djs-visual > :nth-child(1) {
          stroke: #10b981 !important;
          stroke-width: 3px !important;
          fill: #d1fae5 !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="bpmn-container w-full h-[600px] bg-white rounded-lg border border-gray-200"
      />
    </div>
  );
};
