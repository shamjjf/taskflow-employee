import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-[18px] sm:text-[22px] font-semibold tracking-tight mb-0.5 sm:mb-1">{title}</h1>
        {subtitle && <p className="text-[#71717a] text-[12.5px] sm:text-[13.5px]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
