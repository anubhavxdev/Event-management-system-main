import { useState, useEffect } from "react";

export default function CountdownTimer({ eventDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date(eventDate).getTime();

    const tick = () => setTimeLeft(target - Date.now());

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  if (timeLeft === null) return null;

  // Hide if event ended more than 1 hour ago
  if (timeLeft < -3600000) return null;

  // "Happening now" badge
  if (timeLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-500 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Happening now
      </span>
    );
  }

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
      <span className="text-orange-500 font-medium">⏱</span>
      {days > 0 && <span>{days}d </span>}
      <span>{pad(hours)}h {pad(minutes)}m {pad(seconds)}s</span>
    </span>
  );
}