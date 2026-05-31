export function matchesSearch(
  q: string | undefined,
  fields: (string | null | undefined)[]
): boolean {
  if (!q?.trim()) return true;
  const term = q.trim().toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(term));
}
