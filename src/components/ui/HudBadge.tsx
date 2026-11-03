import React from 'react';

interface HudBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'rose';
}

export const HudBadge: React.FC<HudBadgeProps> = ({
  children,
  variant = 'default',
}) => {
  const styles: Record<NonNullable<HudBadgeProps['variant']>, string> = {
    default: 'bg-slate-800/80 text-slate-200 border-slate-700/70',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

