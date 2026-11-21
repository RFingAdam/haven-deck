import type { DeckLayout, PackClip, SoundPack } from "./types";

const CLIP_ID = /^[a-z][a-z0-9_]{0,47}$/;
const SAFE_FILE = /^(sounds|songs|spoken|faces)\/[A-Za-z0-9._-]+\.(wav|mp3)$/;

export function validatePack(raw: unknown): SoundPack {
  if (!raw || typeof raw !== "object") throw new Error("pack.json must be an object");
  const p = raw as Record<string, unknown>;
  const clips = p.clips;
  if (!Array.isArray(clips) || clips.length < 1) {
    throw new Error("pack.json must list at least one clip");
  }
  const pack: SoundPack = {
    name: mustString(p.name, "name"),
    version: mustString(p.version, "version"),
    license: mustString(p.license, "license"),
    credit: mustString(p.credit, "credit"),
    author: mustString(p.author, "author"),
    rate: mustNumber(p.rate, "rate"),
    clips: clips.map((clip, i) => validateClip(clip, i)),
  };
  const ids = new Set<string>();
  for (const clip of pack.clips) {
    if (ids.has(clip.id)) throw new Error(`Duplicate clip id: ${clip.id}`);
    ids.add(clip.id);
  }
  return pack;
}

function validateClip(raw: unknown, index: number): PackClip {
  if (!raw || typeof raw !== "object") throw new Error(`clips[${index}] must be an object`);
  const c = raw as Record<string, unknown>;
  const id = mustString(c.id, `clips[${index}].id`);
  if (!CLIP_ID.test(id)) {
    throw new Error(`clips[${index}].id must be a lowercase identifier (e.g. tap, scene_chime)`);
  }
  const file = mustString(c.file, `clips[${index}].file`);
  if (!SAFE_FILE.test(file)) {
    throw new Error(`clips[${index}].file must be a .wav or .mp3 under sounds/, songs/, spoken/, or faces/`);
  }
  const seconds = mustNumber(c.seconds, `clips[${index}].seconds`);
  if (!(seconds > 0) || seconds > 600) {
    throw new Error(`clips[${index}].seconds must be between 0 and 600`);
  }
  return {
    id,
    label: mustString(c.label, `clips[${index}].label`),
    category: mustString(c.category, `clips[${index}].category`),
    file,
    seconds,
    usage: typeof c.usage === "string" ? c.usage : undefined,
    license: mustString(c.license, `clips[${index}].license`),
    credit: mustString(c.credit, `clips[${index}].credit`),
    peak: typeof c.peak === "number" ? c.peak : undefined,
    rms_db: typeof c.rms_db === "number" ? c.rms_db : undefined,
  };
}

export function validateLayout(raw: unknown): DeckLayout {
  if (!raw || typeof raw !== "object") throw new Error("layout.json must be an object");
  const l = raw as Record<string, unknown>;
  const pages = l.pages;
  if (!Array.isArray(pages) || pages.length < 1) {
    throw new Error("layout.json must list at least one page");
  }
  const theme = typeof l.theme === "string" && l.theme.trim() ? l.theme.trim().toLowerCase() : "haven";
  const sceneRail = Array.isArray(l.sceneRail)
    ? l.sceneRail.filter((id): id is string => typeof id === "string")
    : [];
  const parsedPages = pages.map((page, i) => {
    if (!page || typeof page !== "object") throw new Error(`pages[${i}] must be an object`);
    const p = page as Record<string, unknown>;
    const keys = p.keys;
    if (!Array.isArray(keys)) throw new Error(`pages[${i}].keys must be an array`);
    return {
      id: mustString(p.id, `pages[${i}].id`),
      label: mustString(p.label, `pages[${i}].label`),
      keys: keys as DeckLayout["pages"][number]["keys"],
    };
  });
  const railIds = new Set(parsedPages.flatMap((page) => page.keys.map((k) => k.id)));
  for (const id of sceneRail) {
    if (!railIds.has(id)) throw new Error(`sceneRail id is not on any page: ${id}`);
  }
  return {
    name: mustString(l.name, "name"),
    theme,
    sceneRail,
    pages: parsedPages,
  };
}

function mustString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function mustNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${field} must be a number`);
  return value;
}

export function clipSrc(packUrl: string, file: string): string {
  return `${packUrl.replace(/\/$/, "")}/${file}`;
}
