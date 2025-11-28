import { PhotoStatus } from '../types';

interface StatusBadgeProps {
  status: PhotoStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PhotoStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  UPLOADED: {
    label: 'Queued',
    color: 'xc-text-blue-400',
    bgColor: 'xc-bg-blue-500/20',
    icon: '◷',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'xc-text-amber-400',
    bgColor: 'xc-bg-amber-500/20',
    icon: '⟳',
  },
  DONE: {
    label: 'Done',
    color: 'xc-text-brand-400',
    bgColor: 'xc-bg-brand-500/20',
    icon: '✓',
  },
  FAILED: {
    label: 'Failed',
    color: 'xc-text-red-400',
    bgColor: 'xc-bg-red-500/20',
    icon: '✕',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`
        xc-inline-flex xc-items-center xc-gap-1.5 xc-font-medium xc-rounded-full
        ${config.color} ${config.bgColor}
        ${size === 'sm' ? 'xc-px-2 xc-py-0.5 xc-text-xs' : 'xc-px-3 xc-py-1 xc-text-sm'}
        ${status === 'PROCESSING' ? 'xc-animate-pulse' : ''}
      `}
    >
      <span className={status === 'PROCESSING' ? 'xc-animate-spin xc-inline-block' : ''}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}

