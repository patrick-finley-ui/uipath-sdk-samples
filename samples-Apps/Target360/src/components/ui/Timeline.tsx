import type { TimelineEvent } from '../../utils/riskContent';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline = ({ events }: TimelineProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-4">
          {/* Date Column */}
          <div className="text-sm text-gray-400 w-32 text-right pt-1 flex-shrink-0">
            {event.date}
          </div>

          {/* Timeline Line & Dot */}
          <div className="relative flex flex-col items-center flex-shrink-0" style={{ minHeight: index < events.length - 1 ? '3rem' : 'auto' }}>
            <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)} border-2 border-[#252836] z-10`}></div>
            {index < events.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-700 absolute top-3 bottom-0"></div>
            )}
          </div>

          {/* Event Description */}
          <div className="flex-1 text-sm text-gray-300 pt-0.5 pb-2">
            {event.event}
          </div>
        </div>
      ))}
    </div>
  );
};
