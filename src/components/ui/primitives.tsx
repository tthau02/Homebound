import React from 'react';

/**
 * Phase 9 HUD design-system primitives.
 * Rules: text ≥ 12px (text-xs), solid surfaces (`.hud-panel`), one accent colour,
 * no gradient text / ping badges. Keep visual weight low so the 3D scene stays the focus.
 */

type Tone = 'neutral' | 'accent' | 'ghost' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-ink-800 hover:bg-ink-700 text-ink-100 border border-white/[0.08]',
  accent: 'bg-accent hover:bg-accent-soft text-ink-950 border border-accent-strong/40',
  ghost: 'bg-transparent hover:bg-white/[0.06] text-ink-200 border border-transparent',
  danger: 'bg-danger/15 hover:bg-danger/25 text-red-200 border border-danger/30',
};

export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div className={`hud-panel ${className}`} {...rest} />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  kbd?: string;
}

const BUTTON_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  tone = 'neutral',
  size = 'md',
  icon,
  kbd,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_SIZE_CLASSES[size]} ${TONE_CLASSES[tone]} ${className}`}
    {...rest}
  >
    {icon}
    {children !== undefined && <span className="truncate">{children}</span>}
    {kbd && <Kbd className={tone === 'accent' ? 'border-ink-950/20 bg-ink-950/15 text-ink-950' : ''}>{kbd}</Kbd>}
  </button>
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  badge?: number;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  active = false,
  badge,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${active ? 'bg-accent text-ink-950' : 'text-ink-200 hover:bg-white/[0.07] hover:text-white'
      } ${className}`}
    {...rest}
  >
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-xs font-bold leading-[18px] text-white">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

export const Kbd: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className = '', ...rest }) => (
  <kbd className={`hud-kbd ${className}`} {...rest} />
);

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
  ariaLabel: string;
}

export function Segmented<T extends string>({ value, options, onChange, compact, ariaLabel }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex gap-1 rounded-xl bg-ink-950/60 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint ?? opt.label}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${active ? 'bg-ink-700 text-white' : 'text-ink-300 hover:text-white'
              }`}
          >
            {opt.icon}
            <span className={compact ? 'sr-only' : ''}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange, disabled }) => (
  <label className={`flex items-center justify-between gap-4 py-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
    <span className="min-w-0">
      <span className="block text-sm font-medium text-ink-100">{label}</span>
      {description && <span className="block text-xs text-ink-400">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-ink-700'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
      />
    </button>
  </label>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xs font-semibold uppercase tracking-wider text-ink-400 ${className}`}>{children}</h3>
);
