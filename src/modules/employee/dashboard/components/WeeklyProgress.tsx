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

  return (
    <Card>
      <CardHeader title="My Progress This Week" subtitle="Tasks completed daily" />
      <CardBody>
        <div className="flex items-end gap-3 h-[160px] py-2">
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
        <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[13px]">
          <span className="text-[#71717a]">Total this week</span>
          <span className="font-semibold">
            {weekData.reduce((sum, d) => sum + d.completed, 0)} tasks
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
