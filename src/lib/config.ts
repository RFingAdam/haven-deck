import type { DeckConfig } from "./types";

export const CONFIG_STORAGE_KEY = "haven-deck-settings-v1";

export const DEFAULT_CONFIG: DeckConfig = {
  simulate: true,
  companionBase: "http://127.0.0.1:8000",
  companionLabel: "slobs",
  directorBase: "http://127.0.0.1:8781",
  packUrl: "/packs/starter",
  kioskRoute: true,
  wantLocalPreview: false,
  theme: "haven",
};

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(v)) return true;
    if (["0", "false", "no", "off"].includes(v)) return false;
  }
  return fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\/$/, "") : fallback;
}

export function parseConfig(raw: unknown, fallback: DeckConfig = DEFAULT_CONFIG): DeckConfig {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    simulate: asBool(src.simulate, fallback.simulate),
    companionBase: asString(src.companionBase, fallback.companionBase),
    companionLabel: asString(src.companionLabel, fallback.companionLabel),
    directorBase: asString(src.directorBase, fallback.directorBase),
    packUrl: asString(src.packUrl, fallback.packUrl),
    kioskRoute: asBool(src.kioskRoute, fallback.kioskRoute),
    wantLocalPreview: asBool(src.wantLocalPreview, fallback.wantLocalPreview),
    theme: asString(src.theme, fallback.theme).toLowerCase(),
  };
}

export function mergeConfig(base: DeckConfig, overlay: Partial<DeckConfig>): DeckConfig {
  return { ...base, ...overlay };
}

export function loadStoredOverrides(): Partial<DeckConfig> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<DeckConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStoredOverrides(overlay: Partial<DeckConfig>): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(overlay));
}

export function clearStoredOverrides(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export async function fetchFileConfig(): Promise<DeckConfig> {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) return DEFAULT_CONFIG;
    return parseConfig(await res.json());
  } catch {
    return DEFAULT_CONFIG;
  }
}
