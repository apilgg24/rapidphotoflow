import { EventLogItem } from '../types';

interface EventLogProps {
  events: EventLogItem[];
}

const typeStyles: Record<EventLogItem['type'], { color: string; icon: string }> = {
  upload: { color: 'xc-text-blue-400', icon: '↑' },
  status_change: { color: 'xc-text-amber-400', icon: '⟳' },
  error: { color: 'xc-text-red-400', icon: '!' },
  info: { color: 'xc-text-surface-400', icon: 'ℹ' },
};

export default function EventLog({ events }: EventLogProps) {
  if (events.length === 0) {
    return (
      <div className="xc-flex xc-flex-col xc-items-center xc-justify-center xc-py-8 xc-text-center">
        <p className="xc-text-surface-500 xc-text-sm">No events yet</p>
      </div>
    );
  }

  return (
    <div className="xc-space-y-1 xc-max-h-[400px] xc-overflow-y-auto xc-pr-2">
      {events.map((event, index) => {
        const style = typeStyles[event.type];
        return (
          <div
            key={index}
            className="xc-flex xc-items-start xc-gap-2 xc-py-2 xc-px-3 xc-rounded-lg xc-bg-surface-800/30 xc-text-sm xc-animate-slide-down xc-font-mono"
          >
            <span className={`${style.color} xc-flex-shrink-0 xc-w-4 xc-text-center`}>
              {style.icon}
            </span>
            <span className="xc-text-surface-500 xc-flex-shrink-0 xc-w-20">
              {formatTime(event.timestamp)}
            </span>
            <span className="xc-text-surface-300 xc-flex-1">{event.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });
}

