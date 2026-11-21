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

const THEME_ID = /^[a-z][a-z0-9-]{0,31}$/;

/** Optional `?theme=` selector used by docs capture and kiosk bookmarks. */
export function themeFromSearch(search: string = window.location.search): string | null {
  const value = new URLSearchParams(search).get("theme");
  if (!value || !THEME_ID.test(value)) return null;
  return value;
}
