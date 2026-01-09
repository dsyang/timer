import { useState, useEffect } from 'react';
import { getCurrentTimezoneAbbrev } from '../lib/database';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Format date as "Wed, Jan 8"
  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Get timezone abbreviation (e.g., "PST")
  const timezone = getCurrentTimezoneAbbrev();

  return (
    <div className="live-clock text-center">
      <div className="clock-display font-bold text-5xl md:text-6xl tracking-tight tabular-nums leading-none">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>
      <div className="text-sm text-muted-foreground">
        {dateString} · {timezone}
      </div>
    </div>
  );
}
