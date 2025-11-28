import { useEffect, useState, useRef } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const typeStyles: Record<ToastMessage['type'], { bg: string; icon: string; border: string; iconColor: string }> = {
  success: { bg: 'xc-bg-brand-500/20', icon: '✓', border: 'xc-border-brand-500/50', iconColor: 'xc-text-brand-400' },
  error: { bg: 'xc-bg-red-500/20', icon: '✕', border: 'xc-border-red-500/50', iconColor: 'xc-text-red-400' },
  warning: { bg: 'xc-bg-amber-500/20', icon: '⚠', border: 'xc-border-amber-500/50', iconColor: 'xc-text-amber-400' },
  info: { bg: 'xc-bg-blue-500/20', icon: 'ℹ', border: 'xc-border-blue-500/50', iconColor: 'xc-text-blue-400' },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);
  const onRemoveRef = useRef(onRemove);
  const style = typeStyles[toast.type];

  // Keep onRemove ref updated
  onRemoveRef.current = onRemove;

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto remove after 4 seconds (if not pinned)
    const dismissTimer = setTimeout(() => {
      if (!isPinnedRef.current) {
        setIsVisible(false);
        setTimeout(() => onRemoveRef.current(), 300);
      }
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, []); // Empty deps - only run once on mount

  const handleClick = (e: React.MouseEvent) => {
    // Don't pin if clicking the close button
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Pin the toast so it stays visible
    setIsPinned(true);
    isPinnedRef.current = true;
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        xc-flex xc-items-center xc-gap-3 xc-px-4 xc-py-3 xc-rounded-xl xc-border
        ${style.bg} ${style.border}
        xc-backdrop-blur-sm xc-shadow-lg
        xc-transition-all xc-duration-300 xc-cursor-pointer
        ${isVisible ? 'xc-translate-x-0 xc-opacity-100' : 'xc-translate-x-full xc-opacity-0'}
        ${isPinned ? 'xc-ring-2 xc-ring-white/20' : ''}
      `}
    >
      <span className={`xc-text-base xc-flex-shrink-0 ${style.iconColor}`}>{style.icon}</span>
      <p className="xc-text-sm xc-text-white xc-flex-1">{toast.message}</p>
      <button
        onClick={handleClose}
        className="xc-text-surface-400 hover:xc-text-white xc-transition-colors xc-flex-shrink-0 xc-ml-2"
      >
        <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="xc-fixed xc-top-4 xc-right-4 xc-z-50 xc-flex xc-flex-col xc-gap-2 xc-max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}
