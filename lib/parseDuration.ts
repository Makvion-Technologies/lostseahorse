function readCount(raw: string | undefined): number | null {
  if (!raw) return 0;
  if (raw.length > 15) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return n;
}

function safeSum(parts: number[]): number | null {
  let total = 0;
  for (const part of parts) {
    const next = total + part;
    if (!Number.isSafeInteger(next)) return null;
    total = next;
  }
  return total;
}

export function parseDuration(raw: string): number | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!text) return null;
  if (/^\d+$/.test(text)) return readCount(text);

  if (!/^(\d+h)?(\d+m)?(\d+s)?$/.test(text)) return null;
  const hours = readCount(/(\d+)h/.exec(text)?.[1]);
  const minutes = readCount(/(\d+)m/.exec(text)?.[1]);
  const seconds = readCount(/(\d+)s/.exec(text)?.[1]);
  if (hours == null || minutes == null || seconds == null) return null;
  if (!hours && !minutes && !seconds && !/0[hms]/.test(text)) return null;
  if (
    hours > Number.MAX_SAFE_INTEGER / 3600 ||
    minutes > Number.MAX_SAFE_INTEGER / 60
  ) {
    return null;
  }
  return safeSum([hours * 3600, minutes * 60, seconds]);
}
