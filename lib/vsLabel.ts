/** "Hana", "Hana, Rhys" or "Hana, Rhys +1": first few names, the rest as a count. */
export function vsLabel(names: string[], show = 2): string {
  if (!names.length) return "";
  const head = names.slice(0, show).join(", ");
  const rest = names.length - show;
  return rest > 0 ? `${head} +${rest}` : head;
}
