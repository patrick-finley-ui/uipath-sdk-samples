import { useState } from 'react';
import type { InvestigationFilters } from '../types/investigation';
import { CASE_STATUSES } from '../utils/caseStatus';

interface FilterControlsProps {
  filters: InvestigationFilters;
  onFiltersChange: (filters: InvestigationFilters) => void;
  onClearFilters: () => void;
}

export const FilterControls = ({ filters, onFiltersChange, onClearFilters }: FilterControlsProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters =
    filters.riskLevels.length > 0 ||
    filters.caseStatuses.length > 0 ||
    filters.checkOutcomes.length > 0 ||
    filters.dataSources.length > 0 ||
    filters.decisionStates.length > 0;

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const filterOptions = [
    {
      name: 'riskLevels',
      label: 'Risk Level',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
      options: ['High', 'Medium', 'Low'],
    },
    {
      name: 'caseStatuses',
      label: 'Status',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      options: CASE_STATUSES,
    },
    {
      name: 'checkOutcomes',
      label: 'Flagged Checks',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      options: ['Flagged', 'Warning', 'Clear'],
    },
    {
      name: 'dataSources',
      label: 'Source',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      options: ['Sanctions', 'PEP', 'Adverse Media', 'Watchlists', 'Financial', 'Criminal Records'],
    },
  ];

  const handleToggleOption = (filterName: string, option: string) => {
    const currentValues = filters[filterName as keyof InvestigationFilters] as string[];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v: string) => v !== option)
      : [...currentValues, option];

    const updatedFilters = {
      ...filters,
      [filterName]: newValues,
    };
    console.log('FilterControls: Updating filters', updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const getActiveCount = (filterName: string) => {
    return (filters[filterName as keyof InvestigationFilters] as string[]).length;
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {filterOptions.map((filter) => {
        const activeCount = getActiveCount(filter.name);
        const isOpen = openDropdown === filter.name;

        return (
          <div key={filter.name} className="relative">
            <button
              onClick={() => toggleDropdown(filter.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                activeCount > 0
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#252836] border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              {filter.icon}
              <span className="text-sm font-medium">{filter.label}</span>
              {activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activeCount}
                </span>
              )}
              <svg
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#1e2030] border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {filter.options.map((option) => {
                  const isSelected = (filters[filter.name as keyof InvestigationFilters] as string[]).includes(option);
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleOption(filter.name, option)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="text-sm text-gray-300">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {hasActiveFilters && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700" />
          <span>Needs Attention</span>
        </label>
      </div>
    </div>
  );
};
