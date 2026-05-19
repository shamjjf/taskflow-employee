'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '@/components/ui';
import { employeeTasksService } from '../../tasks/services/employeeTasksService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function getWeekStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // JS: Sun=0, Mon=1, ..., Sat=6. We want Mon as week start.
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function WeeklyProgress() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => employeeTasksService.getMyTasks(),
  });

  const tasks = data || [];

  const weekStart = getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const t of tasks) {
    if (t.status !== 'completed' || !t.completedAt) continue;
    const completed = new Date(t.completedAt);
    if (completed < weekStart || completed >= weekEnd) continue;
    const idx = (completed.getDay() + 6) % 7;
    counts[idx] += 1;
  }

  const weekData = DAYS.map((day, i) => ({ day, completed: counts[i] }));
  const max = Math.max(...weekData.map((d) => d.completed));
  const total = weekData.reduce((sum, d) => sum + d.completed, 0);

  return (
    <Card>
      <CardHeader title="My Progress This Week" subtitle="Tasks completed daily" />
      <CardBody className="p-4 sm:p-5">
        {isLoading ? (
          <div className="py-8 text-center text-[#71717a] text-sm">Loading...</div>
        ) : (
          <>
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
            <div className="hidden sm:flex gap-3 h-[180px] py-2">
              {weekData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                  <div className="w-full flex-1 min-h-0 flex items-end">
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
          </>
        )}
      </CardBody>
    </Card>
  );
}
