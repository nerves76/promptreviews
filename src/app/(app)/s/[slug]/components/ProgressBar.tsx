'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  textColor: string;
}

export function ProgressBar({ current, total, textColor }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs mb-1 opacity-70" style={{ color: textColor }}>
        <span>{current} of {total} answered</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="bg-white/40 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
