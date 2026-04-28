import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  withDot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-soft text-[#047857]',
  warning: 'bg-warning-soft text-[#b45309]',
  danger: 'bg-danger-soft text-[#b91c1c]',
  info: 'bg-info-soft text-[#1d4ed8]',
  neutral: 'bg-surface-muted text-[#71717a]',
  purple: 'bg-[#f5f3ff] text-[#6d28d9]',
};

export function Badge({ variant = 'neutral', children, className, withDot = true }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium',
        variantStyles[variant],
        className
      )}
    >
      {withDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
