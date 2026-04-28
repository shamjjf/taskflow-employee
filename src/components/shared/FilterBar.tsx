import { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <div className="flex gap-2 items-center mb-4 flex-wrap">{children}</div>;
}

interface FilterSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
}

export function FilterSelect({ value, onChange, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="px-2.5 py-1.5 pr-7 border border-border rounded-md bg-white text-[13px] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%276%27%20viewBox=%270%200%2010%206%27%3E%3Cpath%20d=%27M1%201l4%204%204-4%27%20stroke=%27%2371717a%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center] focus:border-primary focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
