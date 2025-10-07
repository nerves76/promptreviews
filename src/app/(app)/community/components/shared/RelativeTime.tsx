/**
 * RelativeTime Component
 *
 * Displays timestamps as relative time with tooltip showing full datetime.
 * Auto-updates every minute for accuracy.
 */

'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime, formatFullDateTime, formatISO } from '../../utils/timeFormatter';

interface RelativeTimeProps {
  date: Date | string;
  withTooltip?: boolean;
  className?: string;
}

export function RelativeTime({ date, withTooltip = true, className = '' }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(date));

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(date));
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [date]);

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const fullDateTime = formatFullDateTime(dateObj);
  const isoDateTime = formatISO(dateObj);

  if (withTooltip) {
    return (
      <time
        dateTime={isoDateTime}
        title={fullDateTime}
        className={`text-white/70 hover:text-white transition-colors cursor-help ${className}`}
      >
        {relativeTime}
      </time>
    );
  }

  return (
    <time dateTime={isoDateTime} className={`text-white/70 ${className}`}>
      {relativeTime}
    </time>
  );
}
