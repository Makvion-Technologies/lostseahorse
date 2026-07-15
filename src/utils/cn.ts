type ClassValue = string | false | null | undefined;

/** Lightweight className merger for conditional Tailwind classes. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
