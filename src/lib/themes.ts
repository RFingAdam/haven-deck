export type ThemeManifest = {
  id: string;
  label: string;
  description?: string;
  variables: Record<string, string>;
};

export type ThemeIndexItem = { id: string; label: string };

export const DEFAULT_THEME_ID = "haven";

const THEME_ID = /^[a-z][a-z0-9-]{0,31}$/;

export function isThemeId(value: string): boolean {
  return THEME_ID.test(value);
}

export async function loadThemeIndex(): Promise<ThemeIndexItem[]> {
  try {
    const res = await fetch("/themes/index.json", { cache: "no-store" });
    if (!res.ok) return [{ id: DEFAULT_THEME_ID, label: "Haven" }];
    const data = (await res.json()) as { themes?: ThemeIndexItem[] };
    const list = (data.themes ?? []).filter((t) => t && isThemeId(t.id) && t.label);
    return list.length ? list : [{ id: DEFAULT_THEME_ID, label: "Haven" }];
  } catch {
    return [{ id: DEFAULT_THEME_ID, label: "Haven" }];
  }
}

export async function loadTheme(id: string): Promise<ThemeManifest | null> {
  if (!isThemeId(id)) return null;
  try {
    const res = await fetch(`/themes/${id}/theme.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const raw = (await res.json()) as ThemeManifest;
    if (!raw || raw.id !== id || !raw.variables || typeof raw.variables !== "object") return null;
    return raw;
  } catch {
    return null;
  }
}

export function applyTheme(theme: ThemeManifest, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme.variables)) {
    if (!key.startsWith("--")) continue;
    root.style.setProperty(key, value);
  }
}
