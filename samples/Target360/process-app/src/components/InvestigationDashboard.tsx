import { useState, useEffect } from 'react';
import { InvestigationList } from './InvestigationList';
import { InvestigationDetails } from './InvestigationDetails';
import { getMockSubjects } from '../services/mockInvestigationData';
import type { InvestigationSubject } from '../types/investigation';

export const InvestigationDashboard = () => {
  const [subjects, setSubjects] = useState<InvestigationSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<InvestigationSubject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
      const data = getMockSubjects();
      setSubjects(data);
      // Select first subject by default
      if (data.length > 0) {
        setSelectedSubject(data[0]);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
        <span className="text-gray-600 font-medium">Loading investigations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Persons of Interest
          </h2>
          <p className="text-gray-600 mt-1">Multi-agency screening at Ports of Entry</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import List
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run New Investigation
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 h-[calc(100vh-250px)]">
        {/* Left Side - List (30%) */}
        <div className="w-[30%]">
          <InvestigationList 
            subjects={subjects} 
            onSelectSubject={setSelectedSubject}
            selectedSubjectId={selectedSubject?.id}
          />
        </div>

        {/* Right Side - Details (70%) */}
        <div className="w-[70%]">
          <InvestigationDetails subject={selectedSubject} />
        </div>
      </div>
    </div>
  );
};
