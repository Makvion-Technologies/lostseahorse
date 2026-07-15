/** Lightweight unique id helper for future word entities. */
let counter = 0;

export function createEntityId(prefix = "entity"): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now().toString(36)}`;
}

export function resetEntityIdCounter(): void {
  counter = 0;
}
