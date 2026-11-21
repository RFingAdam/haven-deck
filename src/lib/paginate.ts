export const KIOSK_COMPACT_MQ = "(max-width: 900px), (max-height: 520px)";
export const KIOSK_GRID_PAGE_SIZE = 12;
export const KIOSK_TAB_IDS = ["live", "sounds", "setup"] as const;

export function paginate<T>(items: T[], page: number, size: number): { page: number; pages: number; slice: T[] } {
  const pages = Math.max(1, Math.ceil(items.length / Math.max(1, size)));
  const p = Math.min(Math.max(0, page), pages - 1);
  return { page: p, pages, slice: items.slice(p * size, p * size + size) };
}

export function isSceneActive(sceneName: string | undefined, feedbackName: string | undefined): boolean {
  if (!sceneName || !feedbackName) return false;
  const a = sceneName.trim().toLowerCase();
  const b = feedbackName.trim().toLowerCase();
  if (!a || !b || a === "—" || a === "-") return false;
  return a === b || a.includes(b) || b.includes(a);
}
