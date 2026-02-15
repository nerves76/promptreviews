"use client";

import React, { useState, useMemo } from "react";
import Icon from "@/components/Icon";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { WMTask, formatTimeEstimate } from "@/types/workManager";

type Period = "week" | "month";

interface ScheduledHoursSummaryProps {
  tasks: WMTask[];
}

export default function ScheduledHoursSummary({
  tasks,
}: ScheduledHoursSummaryProps) {
  const [period, setPeriod] = useState<Period>("week");

  const { estimated, logged, taskCount } = useMemo(() => {
    const now = new Date();
    const interval =
      period === "week"
        ? { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) }
        : { start: startOfMonth(now), end: endOfMonth(now) };

    let estimated = 0;
    let logged = 0;
    let taskCount = 0;

    for (const task of tasks) {
      if (!task.due_date || task.status === "done") continue;
      const dueDate = parseISO(task.due_date);
      if (!isWithinInterval(dueDate, interval)) continue;

      taskCount++;
      estimated += task.time_estimate_minutes ?? 0;
      logged += task.total_time_spent_minutes ?? 0;
    }

    return { estimated, logged, taskCount };
  }, [tasks, period]);

  if (taskCount === 0) return null;

  return (
    <div className="max-w-[1550px] mx-auto px-6 pb-2">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 px-5 py-3 flex items-center justify-between gap-6 flex-wrap">
        {/* Metrics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Icon name="FaClock" size={13} className="text-white/50" />
            <span className="text-white/60">Estimated</span>
            <span className="text-white font-semibold">
              {estimated > 0 ? formatTimeEstimate(estimated) : "0h"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="FaCheck" size={13} className="text-emerald-400" />
            <span className="text-white/60">Logged</span>
            <span className="text-emerald-400 font-semibold">
              {logged > 0 ? formatTimeEstimate(logged) : "0h"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="FaCheckCircle" size={13} className="text-white/50" />
            <span className="text-white/60">Tasks</span>
            <span className="text-white font-semibold">{taskCount}</span>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPeriod("week")}
            className={`flex items-center gap-2 px-4 py-1.5 font-medium text-sm rounded-lg transition-all duration-200 ease-out ${
              period === "week"
                ? "border border-white/50 text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`flex items-center gap-2 px-4 py-1.5 font-medium text-sm rounded-lg transition-all duration-200 ease-out ${
              period === "month"
                ? "border border-white/50 text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            This month
          </button>
        </div>
      </div>
    </div>
  );
}
