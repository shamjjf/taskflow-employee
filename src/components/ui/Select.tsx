import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium mb-1.5 text-[#18181b]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2.5 pr-8 border border-border rounded-[8px] bg-white text-[#18181b]',
            'focus:border-primary focus:ring-4 focus:ring-primary-soft focus:outline-none',
            'appearance-none cursor-pointer transition-all',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%276%27%20viewBox=%270%200%2010%206%27%3E%3Cpath%20d=%27M1%201l4%204%204-4%27%20stroke=%27%2371717a%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_10px_center]',
            error && 'border-danger focus:border-danger',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
