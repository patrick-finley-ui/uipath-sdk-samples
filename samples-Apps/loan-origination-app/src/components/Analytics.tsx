import { useState } from 'react';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Simple Bar Chart Component
const BarChart = ({ data, height: _height = 200 }: { data: { label: string; value: number; max: number }[]; height?: number }) => {
  const maxValue = Math.max(...data.map(d => d.max), ...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-sm text-gray-600">{item.value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-uipath-orange h-3 rounded-full transition-all duration-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const formatCompactNumber = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '' as const;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
};

const TrendArea = ({
  data,
  valueKey,
  color = '#FF6B35',
  height = 192,
  valueSuffix,
}: {
  data: Array<Record<string, unknown>>;
  valueKey: string;
  color?: string;
  height?: number;
  valueSuffix?: string;
}) => {
  const gradientId = `trendGradient-${valueKey}`;
  
  // Calculate domain with padding at the bottom
  const values = data.map(d => Number(d[valueKey]));
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const padding = range * 0.3; // Add 30% padding below the minimum
  const domainMin = Math.max(0, dataMin - padding);
  const domainMax = dataMax;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="65%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={[domainMin, domainMax]} />

          <Tooltip
            cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 10,
              borderColor: '#e5e7eb',
              boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
            }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            formatter={(v: unknown) => [
              `${formatCompactNumber(v)}${valueSuffix ?? ''}`,
              '',
            ]}
          />

          <Area
            type="monotone"
            dataKey={valueKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced KPI Card with Info Button
const EnhancedKPICard = ({
  title,
  value,
  description,
  icon,
  onInfoClick,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  onInfoClick?: () => void;
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {onInfoClick && (
              <button
                onClick={onInfoClick}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="View details"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-uipath-orange-subtle flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  
  // Mock data based on the story
  const eligibilityData = {
    avgTaskTime: 42, // minutes
    medianConfidence: 0.78,
    manualOverrideRate: 63,
    escalationRate: 28,
    casesReopened: 47,
    avgDelay: 1.2, // days
  };
  
  const mostOverriddenChecks = [
    { name: 'Debt-to-income threshold', overrideRate: 73, cases: 142 },
    { name: 'Business tenure requirement', overrideRate: 68, cases: 128 },
    { name: 'Seasonal revenue volatility', overrideRate: 59, cases: 98 },
  ];
  
  const docsReferenced = [
    { doc: 'Prior exception approvals', frequency: 89, percentage: 47 },
    { doc: 'Policy clarifications (PDF)', frequency: 78, percentage: 41 },
    { doc: 'Historical similar cases', frequency: 65, percentage: 34 },
  ];
  
  const timeSpentTrend = [
    // subtle variations with gentle upward trend
    { label: 'Wk1', minutes: 41.0 },
    { label: 'Wk2', minutes: 41.3 },
    { label: 'Wk3', minutes: 41.1 },
    { label: 'Wk4', minutes: 41.5 },
    { label: 'Wk5', minutes: 41.6 },
    { label: 'Wk6', minutes: 41.4 },
    { label: 'Wk7', minutes: 41.8 },
    { label: 'Wk8', minutes: 41.7 },
  ];
  
  const confidenceTrend = [
    // small fluctuations with slight upward trend
    { label: 'Wk1', percent: 77.2 },
    { label: 'Wk2', percent: 77.4 },
    { label: 'Wk3', percent: 77.5 },
    { label: 'Wk4', percent: 77.3 },
    { label: 'Wk5', percent: 77.7 },
    { label: 'Wk6', percent: 77.8 },
    { label: 'Wk7', percent: 77.6 },
    { label: 'Wk8', percent: 77.9 },
  ];
  
  const overrideTrend = [
    // subtle ups and downs with gentle upward drift
    { label: 'Wk1', percent: 61.5 },
    { label: 'Wk2', percent: 61.8 },
    { label: 'Wk3', percent: 61.6 },
    { label: 'Wk4', percent: 62.0 },
    { label: 'Wk5', percent: 61.9 },
    { label: 'Wk6', percent: 62.2 },
    { label: 'Wk7', percent: 62.1 },
    { label: 'Wk8', percent: 62.3 },
  ];
  
  const escalationByRule = [
    { rule: 'Debt-to-income', rate: 28, max: 30 },
    { rule: 'Business tenure', rate: 22, max: 30 },
    { rule: 'Revenue volatility', rate: 19, max: 30 },
    { rule: 'Credit score', rate: 15, max: 30 },
    { rule: 'Collateral', rate: 12, max: 30 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 256px)' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Eligibility Review Task Performance & Insights</p>
              </div>
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-uipath-orange text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <EnhancedKPICard
                title="Avg Eligibility Task Time"
                value={`${eligibilityData.avgTaskTime} min`}
                description="Small Business Loans $50k–$250k"
                icon={
                  <svg className="w-6 h-6 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <EnhancedKPICard
                title="Median System Confidence"
                value={(eligibilityData.medianConfidence * 100).toFixed(0) + '%'}
                description="System recommendation confidence"
                icon={
                  <svg className="w-6 h-6 text-uipath-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <EnhancedKPICard
                title="Manual Overrides"
                value={`${eligibilityData.manualOverrideRate}%`}
                description="Of all eligibility reviews"
                icon={
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                onInfoClick={() => setModalOpen('manual-overrides')}
              />
              <EnhancedKPICard
                title="Escalation Rate"
                value={`${eligibilityData.escalationRate}%`}
                description="Cases requiring escalation"
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Time Spent Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Task Time Trend</h3>
                <TrendArea data={timeSpentTrend} valueKey="minutes" valueSuffix=" min" />
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-600">Weekly average (minutes)</span>
                </div>
              </div>

              {/* Confidence Score Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Confidence Trend</h3>
                <TrendArea data={confidenceTrend} valueKey="percent" valueSuffix="%" />
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-600">Weekly median confidence (%)</span>
                </div>
              </div>

              {/* Override Rate Trend */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Override Trend</h3>
                <TrendArea data={overrideTrend} valueKey="percent" valueSuffix="%" />
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-600">Weekly override rate (%)</span>
                </div>
              </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Most Overridden Checks */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Overridden Eligibility Checks</h3>
                <div className="space-y-4">
                  {mostOverriddenChecks.map((check, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{check.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{check.cases} cases</span>
                          <span className="text-sm font-semibold text-orange-600">{check.overrideRate}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${check.overrideRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escalation Rate by Rule */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation Rate by Eligibility Rule</h3>
                <BarChart 
                  data={escalationByRule.map(rule => ({
                    label: rule.rule,
                    value: rule.rate,
                    max: rule.max,
                  }))}
                  height={200}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Manual Overrides Modal */}
      <Modal
        isOpen={modalOpen === 'manual-overrides'}
        onClose={() => setModalOpen(null)}
        title="Manual Overrides Details"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Overridden Checks</h3>
            <div className="space-y-3">
              {mostOverriddenChecks.map((check, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{check.name}</span>
                    <span className="text-sm font-semibold text-orange-600">{check.overrideRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${check.overrideRate}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {check.cases} cases affected
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents Referenced</h3>
            <div className="space-y-3">
              {docsReferenced.map((doc, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{doc.doc}</span>
                    <span className="text-sm font-semibold text-gray-700">{doc.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-uipath-orange h-2 rounded-full"
                      style={{ width: `${doc.percentage}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Referenced in {doc.frequency} cases
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
