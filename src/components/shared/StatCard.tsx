import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  suffix?: string;
}

export function StatCard({ label, value, change, changeDirection = 'up', icon: Icon, suffix }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-lg px-3.5 py-3 sm:px-5 sm:py-4">
      <div className="text-[11.5px] sm:text-[12.5px] text-[#71717a] font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-[20px] sm:text-[26px] font-semibold tracking-tight leading-none">
        {value}
        {suffix && <span className="text-xs sm:text-sm text-[#71717a] font-normal ml-1">{suffix}</span>}
      </div>
      {change && (
        <div
          className={cn(
            'text-[11px] sm:text-xs mt-1.5 flex items-center gap-0.5',
            changeDirection === 'up' && 'text-success',
            changeDirection === 'down' && 'text-danger',
            changeDirection === 'neutral' && 'text-[#71717a]'
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
