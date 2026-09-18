export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (total >= 3600) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    return `${hours}:${pad(minutes)}:${pad(rest)}`;
  }
  if (total >= 60) {
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${pad(rest)}`;
  }
  return String(total);
}

const YEAR = 365 * 24 * 3600;
const MONTH = 30 * 24 * 3600;
const WEEK = 7 * 24 * 3600;
const DAY = 24 * 3600;
const HOUR = 3600;
const MINUTE = 60;

function label(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

function joinParts(parts: string[]): string {
  if (parts.length === 0) return "0 seconds";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds === 0) return "No limit";
  let left = Math.round(seconds);
  const years = Math.floor(left / YEAR);
  left %= YEAR;
  const months = Math.floor(left / MONTH);
  left %= MONTH;
  const weeks = Math.floor(left / WEEK);
  left %= WEEK;
  const days = Math.floor(left / DAY);
  left %= DAY;
  const hours = Math.floor(left / HOUR);
  left %= HOUR;
  const minutes = Math.floor(left / MINUTE);
  const rest = left % MINUTE;
  const parts: string[] = [];
  if (years) parts.push(label(years, "year", "years"));
  if (months) parts.push(label(months, "month", "months"));
  if (weeks) parts.push(label(weeks, "week", "weeks"));
  if (days) parts.push(label(days, "day", "days"));
  if (hours) parts.push(label(hours, "hour", "hours"));
  if (minutes) parts.push(label(minutes, "minute", "minutes"));
  if (rest) parts.push(label(rest, "second", "seconds"));
  return joinParts(parts);
}
