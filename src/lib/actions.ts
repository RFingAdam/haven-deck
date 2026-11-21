import type { CompanionStatus, DeckAction, DeckConfig } from "./types";

const TIMEOUT_MS = 2000;

export type ActionResult = {
  ok: boolean;
  simulated?: boolean;
  status?: number;
  error?: string;
};

function withTimeout(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

export function resolveHttpUrl(url: string, _config: DeckConfig): string {
  return url
    .replaceAll("{directorBase}", "/director")
    .replaceAll("{companionBase}", "/companion")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/?(director)\b/, "/director")
    .replace(/^\/?(companion)\b/, "/companion");
}

export async function runAction(action: DeckAction, config: DeckConfig): Promise<ActionResult> {
  if (action.type === "none" || action.type === "page" || action.type === "toggle") {
    return { ok: true };
  }

  if (config.simulate) {
    return { ok: true, simulated: true };
  }

  try {
    if (action.type === "companion") {
      const path = `/companion/api/location/${action.page}/${action.row}/${action.column}/press`;
      const res = await fetch(path, { method: "POST", signal: withTimeout() });
      if (!res.ok) return { ok: false, status: res.status, error: `Companion ${res.status}` };
      return { ok: true, status: res.status };
    }

    if (action.type === "scene") {
      const path = `/director/scene/${encodeURIComponent(action.scene)}`;
      const res = await fetch(path, { method: "POST", signal: withTimeout() });
      if (!res.ok) return { ok: false, status: res.status, error: `Scene ${res.status}` };
      return { ok: true, status: res.status };
    }

    if (action.type === "play") {
      const path = `/director/play/${encodeURIComponent(action.clipId)}`;
      const res = await fetch(path, { method: "POST", signal: withTimeout() });
      if (!res.ok) return { ok: false, status: res.status, error: `Play ${res.status}` };
      return { ok: true, status: res.status };
    }

    if (action.type === "http") {
      const url = resolveHttpUrl(action.url, config);
      if (!url.startsWith("/") && !url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost")) {
        return { ok: false, error: "HTTP actions must be same-origin or loopback" };
      }
      const res = await fetch(url, {
        method: action.method,
        body: action.body,
        headers: action.body ? { "Content-Type": "application/json" } : undefined,
        signal: withTimeout(),
      });
      if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
      return { ok: true, status: res.status };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

async function readCompanionVar(label: string, name: string): Promise<string> {
  const res = await fetch(
    `/companion/api/variable/${encodeURIComponent(label)}/${encodeURIComponent(name)}/value`,
    { cache: "no-store", signal: withTimeout() },
  );
  if (!res.ok) return "";
  return (await res.text()).trim();
}

export async function pollCompanion(config: DeckConfig): Promise<CompanionStatus> {
  const now = Date.now();
  if (config.simulate) {
    return { ok: true, scene: "—", streaming: false, recording: false, updatedAt: now };
  }
  try {
    const conn = await fetch("/companion/api/connections", { cache: "no-store", signal: withTimeout() });
    if (!conn.ok) {
      return { ok: false, scene: "—", streaming: false, recording: false, error: "Companion unreachable", updatedAt: now };
    }
    const label = config.companionLabel || "slobs";
    const [scene, streaming, recording] = await Promise.all([
      readCompanionVar(label, "current_scene"),
      readCompanionVar(label, "streaming_status"),
      readCompanionVar(label, "recording_status"),
    ]);
    const on = (value: string) => /^(true|1|on|live|streaming|recording)$/i.test(value);
    return {
      ok: true,
      scene: scene || "—",
      streaming: on(streaming),
      recording: on(recording),
      updatedAt: now,
    };
  } catch (err) {
    return {
      ok: false,
      scene: "—",
      streaming: false,
      recording: false,
      error: err instanceof Error ? err.message : "Companion unreachable",
      updatedAt: now,
    };
  }
}
