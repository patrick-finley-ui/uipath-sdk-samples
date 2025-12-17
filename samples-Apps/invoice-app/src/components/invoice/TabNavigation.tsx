type TabType = 'clins' | 'evaluations' | 'execution' | 'invoice' | 'dd250' | 'dd1155';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  clinsCount?: number;
  evaluationsCount?: number;
  multiSelectMode: boolean;
  selectedTabs: TabType[];
  onToggleMultiSelect: () => void;
  onMultiSelectChange: (tabs: TabType[]) => void;
}

export const TabNavigation = ({ 
  activeTab, 
  onTabChange, 
  clinsCount, 
  evaluationsCount,
  multiSelectMode,
  selectedTabs,
  onToggleMultiSelect,
  onMultiSelectChange
}: TabNavigationProps) => {
  const tabs = [
    {
      id: 'clins' as TabType,
      label: 'Contract Line Items',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      count: clinsCount,
    },
    {
      id: 'evaluations' as TabType,
      label: 'AI Match Evaluations',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      count: evaluationsCount,
    },
    {
      id: 'execution' as TabType,
      label: 'Execution History',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'invoice' as TabType,
      label: 'Invoice',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'dd250' as TabType,
      label: 'DD250',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'dd1155' as TabType,
      label: 'DD1155',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  const handleTabClick = (tabId: TabType) => {
    if (multiSelectMode) {
      if (selectedTabs.includes(tabId)) {
        // Don't allow deselecting the last tab
        if (selectedTabs.length > 1) {
          onMultiSelectChange(selectedTabs.filter(id => id !== tabId));
        }
      } else {
        if (selectedTabs.length < 3) {
          onMultiSelectChange([...selectedTabs, tabId]);
        }
      }
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 pt-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const isSelected = multiSelectMode ? selectedTabs.includes(tab.id) : activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-white text-slate-700 border-t-2 border-l border-r border-slate-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`${tab.id}-panel`}
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={onToggleMultiSelect}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
            multiSelectMode
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={multiSelectMode ? "Disable Multi-Select Mode" : "Enable Multi-Select Mode"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          {multiSelectMode ? 'Multi-View Active' : 'Multi-View'}
        </button>
      </div>
    </div>
  );
};
