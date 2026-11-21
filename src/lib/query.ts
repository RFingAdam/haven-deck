/** Same-origin query hooks used by e2e and local debugging. */

function currentSearch(search?: string): string {
  return search ?? (typeof location === "undefined" ? "" : location.search);
}

export function packUrlFromSearch(search?: string): string | undefined {
  const value = new URLSearchParams(currentSearch(search)).get("packUrl");
  if (!value) return undefined;
  if (!/^\/packs\/[A-Za-z0-9_-]+$/.test(value)) return undefined;
  return value;
}

export function gridPageSizeFromSearch(fallback: number, search?: string): number {
  const raw = new URLSearchParams(currentSearch(search)).get("gridPageSize");
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 2 || value > 12) return fallback;
  return value;
}
