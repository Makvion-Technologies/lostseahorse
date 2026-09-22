export const CUSTOM_TEXT_MAX_BYTES = 1_048_576;

export const CUSTOM_TEXT_EXTS = [
  "txt",
  "md",
  "csv",
  "json",
  "log",
  "text",
  "html",
  "xml",
] as const;

const EXTRA_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/rtf",
  "application/csv",
]);

export function isSupportedTextFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if ((CUSTOM_TEXT_EXTS as readonly string[]).includes(ext)) return true;
  if (file.type.startsWith("text/")) return true;
  return EXTRA_TYPES.has(file.type);
}

export function transferHasFiles(transfer: DataTransfer | null): boolean {
  if (!transfer) return false;
  if (transfer.files?.length) return true;
  return Array.from(transfer.types).includes("Files");
}

export function fileFromTransfer(transfer: DataTransfer | null): File | null {
  return transfer?.files?.[0] ?? null;
}

export function normalizeCustomText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function customWordList(text: string): string[] {
  return normalizeCustomText(text).split(" ").filter(Boolean);
}

export function passageFromCustom(
  text: string,
  goal: "time" | "words",
  count: number,
): string {
  const words = customWordList(text);
  if (!words.length) return "";
  if (goal === "words" && count > 0) return words.slice(0, count).join(" ");
  return words.join(" ");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}
