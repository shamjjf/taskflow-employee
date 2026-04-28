import type { DepartmentChartData } from '@/types';

interface BarChartProps {
  data: DepartmentChartData[];
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.completed, d.inProgress]));

  return (
    <>
      <div className="flex items-end gap-3.5 h-[180px] py-2.5">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-0.5 items-end h-40">
              <div
                className="flex-1 bg-primary rounded-t-[3px] min-h-[4px] transition-all duration-500"
                style={{ height: `${Math.round((d.completed / max) * 100)}%` }}
                title={`Completed: ${d.completed}`}
              />
              <div
                className="flex-1 bg-[#c4b5fd] rounded-t-[3px] min-h-[4px] transition-all duration-500"
                style={{ height: `${Math.round((d.inProgress / max) * 100)}%` }}
                title={`In progress: ${d.inProgress}`}
              />
            </div>
            <div className="text-[11px] text-[#71717a]">{d.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 pt-3 text-xs text-[#71717a]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#c4b5fd]" />
          In Progress
        </span>
      </div>
    </>
  );
}
