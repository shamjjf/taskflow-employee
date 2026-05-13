import { Card, CardHeader, CardBody } from '@/components/ui';

const weekData = [
  { day: 'Mon', completed: 3 },
  { day: 'Tue', completed: 4 },
  { day: 'Wed', completed: 2 },
  { day: 'Thu', completed: 5 },
  { day: 'Fri', completed: 3 },
  { day: 'Sat', completed: 1 },
  { day: 'Sun', completed: 0 },
];

export function WeeklyProgress() {
  const max = Math.max(...weekData.map((d) => d.completed));

  const total = weekData.reduce((sum, d) => sum + d.completed, 0);

  return (
    <Card>
      <CardHeader title="My Progress This Week" subtitle="Tasks completed daily" />
      <CardBody className="p-4 sm:p-5">
        {/* Mobile: vertical list with horizontal bars */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {weekData.map((d) => (
            <div key={d.day} className="flex items-center gap-3">
              <div className="w-9 text-[11px] text-[#71717a] font-medium">{d.day}</div>
              <div className="flex-1 h-5 bg-[#f4f4f5] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-primary rounded-[3px] min-w-[4px] transition-all duration-500"
                  style={{ width: `${max > 0 ? (d.completed / max) * 100 : 0}%` }}
                  title={`${d.completed} tasks`}
                />
              </div>
              <div className="w-6 text-right text-[11px] font-semibold">{d.completed}</div>
            </div>
          ))}
        </div>

        {/* Desktop: vertical bars laid out horizontally */}
        <div className="hidden sm:flex items-end gap-3 h-[160px] py-2">
          {weekData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end h-36">
                <div
                  className="w-full bg-primary rounded-t-[3px] min-h-[4px] transition-all duration-500"
                  style={{ height: `${max > 0 ? (d.completed / max) * 100 : 0}%` }}
                  title={`${d.completed} tasks`}
                />
              </div>
              <div className="text-[11px] text-[#71717a]">{d.day}</div>
              <div className="text-[11px] font-semibold">{d.completed}</div>
            </div>
          ))}
        </div>

        <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[12px] sm:text-[13px]">
          <span className="text-[#71717a]">Total this week</span>
          <span className="font-semibold">{total} tasks</span>
        </div>
      </CardBody>
    </Card>
  );
}
