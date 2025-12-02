import type { InvestigationSubject } from '../types/investigation';

interface InvestigationListProps {
  subjects: InvestigationSubject[];
  onSelectSubject: (subject: InvestigationSubject) => void;
  selectedSubjectId?: string;
}

export const InvestigationList = ({ subjects, onSelectSubject, selectedSubjectId }: InvestigationListProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Subjects</h3>
        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
          {subjects.length} Records
        </span>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-300px)]">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() => onSelectSubject(subject)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedSubjectId === subject.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{subject.name}</h4>
                <p className="text-xs text-gray-500 font-mono">{subject.id}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(subject.riskLevel)}`}>
                {subject.riskLevel} Risk
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M3 21l9-9 9 9M12 12v9" />
                </svg>
                <span className="text-xs">{subject.nationality}</span>
              </div>
              <div className="flex items-center gap-1">
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-medium">
                  {subject.flaggedChecks}/{subject.totalChecks} Flags
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
