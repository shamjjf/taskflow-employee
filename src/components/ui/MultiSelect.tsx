'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  emptyHint?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  disabled,
  emptyHint,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selectedOptions = value
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is Option => Boolean(o));

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-medium mb-1.5 text-[#18181b]">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            'w-full min-h-[42px] px-3 py-2 pr-9 border rounded-[8px] bg-white text-left',
            'focus:outline-none transition-all',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            open ? 'border-primary ring-4 ring-primary-soft' : 'border-border',
            error && 'border-danger',
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-[#a1a1aa] text-[14px]">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-primary-soft text-primary"
                >
                  {opt.label}
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => remove(opt.value, e)}
                      className="hover:text-danger leading-none text-[14px] cursor-pointer"
                      aria-label={`Remove ${opt.label}`}
                    >
                      ×
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
          >
            <path d="M1 1l4 4 4-4" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-border rounded-[8px] shadow-lg">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-[#a1a1aa]">
                {emptyHint || 'No options'}
              </div>
            ) : (
              options.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-2 text-[13.5px] cursor-pointer hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span className="text-[#18181b]">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
