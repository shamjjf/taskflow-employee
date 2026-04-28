import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight mb-1">{title}</h1>
        {subtitle && <p className="text-[#71717a] text-[13.5px]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
