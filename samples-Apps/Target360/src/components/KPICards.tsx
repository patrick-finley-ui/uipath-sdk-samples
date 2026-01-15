import type { InvestigationKPIs, RiskLevel, CaseStatus } from '../types/investigation';

interface KPICardsProps {
  kpis: InvestigationKPIs;
  onFilterClick?: (filterType: 'risk' | 'status', filterValue: RiskLevel | CaseStatus) => void;
}

export const KPICards = ({ kpis, onFilterClick }: KPICardsProps) => {
  const cards = [
    {
      label: 'TOTAL CASES',
      value: kpis.activeCases,
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      bgColor: 'bg-[#252836]',
      iconBg: 'bg-gray-700/30',
      clickable: false,
    },
    {
      label: 'HIGH RISK',
      value: kpis.highRiskSubjects,
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bgColor: 'bg-[#252836]',
      iconBg: 'bg-red-500/10',
      clickable: true,
      filterType: 'risk' as const,
      filterValue: 'High' as RiskLevel,
    },
    {
      label: 'IN PROGRESS',
      value: kpis.casesRequiringReview,
      icon: (
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-[#252836]',
      iconBg: 'bg-orange-500/10',
      clickable: true,
      filterType: 'status' as const,
      filterValue: 'Analyst Review' as CaseStatus,
    },
    {
      label: 'COMPLETED TODAY',
      value: kpis.completedToday,
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-[#252836]',
      iconBg: 'bg-green-500/10',
      clickable: true,
      filterType: 'status' as const,
      filterValue: 'Completed' as CaseStatus,
    },
    {
      label: 'OVERRIDES',
      value: kpis.overrides,
      icon: (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      bgColor: 'bg-[#252836]',
      iconBg: 'bg-gray-700/30',
      clickable: false,
    },
  ];

  const handleCardClick = (card: typeof cards[0]) => {
    if (card.clickable && card.filterType && card.filterValue && onFilterClick) {
      onFilterClick(card.filterType, card.filterValue);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={() => handleCardClick(card)}
          className={`${card.bgColor} rounded-lg p-4 border border-gray-800 transition-all ${
            card.clickable
              ? 'hover:border-gray-600 hover:bg-[#2a2e3f] cursor-pointer hover:shadow-lg'
              : 'hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400 tracking-wide">
              {card.label}
            </span>
            <div className={`${card.iconBg} p-2 rounded-lg`}>
              {card.icon}
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};
