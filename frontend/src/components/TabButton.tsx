import { TabType } from '../types';

interface TabButtonProps {
  tab: TabType;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

export default function TabButton({ tab, activeTab, onClick, icon, label, count }: TabButtonProps) {
  const isActive = tab === activeTab;
  
  return (
    <button
      onClick={() => onClick(tab)}
      className={`
        xc-flex xc-items-center xc-gap-2 xc-px-4 xc-py-2.5 xc-rounded-xl xc-font-medium xc-transition-all xc-duration-200
        ${isActive 
          ? 'xc-bg-brand-500 xc-text-white xc-shadow-lg xc-shadow-brand-500/25' 
          : 'xc-text-surface-400 hover:xc-text-white hover:xc-bg-surface-800'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`
          xc-text-xs xc-px-1.5 xc-py-0.5 xc-rounded-full xc-min-w-[20px] xc-text-center
          ${isActive ? 'xc-bg-white/20' : 'xc-bg-surface-700'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

