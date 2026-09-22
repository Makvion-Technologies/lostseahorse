import { compactTime } from "@/lib/formatTime";
import { isPresetTime } from "@/lib/types";

export function ClockGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 8v4.2l2.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function customTimeSlot(time: number, label?: string) {
  if (isPresetTime(time)) return <ClockGlyph />;
  if (time === 0) return <span className="normal-case tracking-tight">∞</span>;
  const text = label || compactTime(time);
  return <span className="normal-case tracking-tight">{text}</span>;
}
