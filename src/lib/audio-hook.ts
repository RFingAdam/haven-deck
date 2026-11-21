import { parseAudioHook } from "./config";
import type { ActionResult } from "./actions";

export type AudioHookBody = {
  action: "start" | "stop";
  clipId?: string;
  durationMs?: number;
};

export function isAudioHookPath(path: string | undefined): path is string {
  return Boolean(parseAudioHook(path, ""));
}

export function isStopHookKey(id: string): boolean {
  return id === "stop-all" || id.includes("stopall") || /(^|-)stop$/.test(id);
}

const CLIP_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

export async function callAudioHook(hook: string, body: AudioHookBody): Promise<ActionResult> {
  const path = parseAudioHook(hook, "");
  if (!path) return { ok: false, error: "No audio hook configured" };
  if (body.action === "start") {
    const id = (body.clipId ?? "").trim();
    if (!CLIP_ID.test(id)) return { ok: false, error: "Invalid clip id" };
    if (!Number.isFinite(body.durationMs) || (body.durationMs ?? 0) <= 0) {
      return { ok: false, error: "durationMs must be a positive number" };
    }
  }
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: body.action === "stop",
      signal: body.action === "stop" ? undefined : AbortSignal.timeout(2000),
    });
    if (!res.ok) return { ok: false, status: res.status, error: `Hook ${res.status}` };
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Audio hook failed" };
  }
}
