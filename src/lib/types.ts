export type KeyTone = "steel" | "live" | "idle" | "warn";

export type DeckAction =
  | { type: "none" }
  | { type: "toggle"; key: string }
  | { type: "scene"; scene: string }
  | { type: "page"; pageId: string }
  | { type: "companion"; page: number; row: number; column: number }
  | { type: "http"; method: "GET" | "POST"; url: string; body?: string }
  | { type: "play"; clipId: string };

export type DeckFeedback =
  | { kind: "stream_live" }
  | { kind: "recording" }
  | { kind: "scene"; name: string }
  | { kind: "toggle"; key: string };

export type DeckKey = {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  tone: KeyTone;
  action: DeckAction;
  feedback?: DeckFeedback;
  /** Require a second tap within confirmMs. Use this for Go Live. */
  confirmMs?: number;
  pinned?: boolean;
  section?: string;
  /** Local preview clip, relative to the pack root. */
  previewSrc?: string;
  previewClipId?: string;
  previewDurationMs?: number;
};

export type DeckPage = {
  id: string;
  label: string;
  keys: DeckKey[];
};

export type DeckLayout = {
  name: string;
  theme?: string;
  sceneRail: string[];
  pages: DeckPage[];
};

export type PackClip = {
  id: string;
  label: string;
  category: string;
  file: string;
  seconds: number;
  usage?: string;
  license: string;
  credit: string;
  peak?: number;
  rms_db?: number;
};

export type SoundPack = {
  name: string;
  version: string;
  license: string;
  credit: string;
  author: string;
  rate: number;
  clips: PackClip[];
};

export type DeckConfig = {
  simulate: boolean;
  companionBase: string;
  companionLabel: string;
  directorBase: string;
  packUrl: string;
  kioskRoute: boolean;
  wantLocalPreview: boolean;
  theme: string;
};

export type CompanionStatus = {
  ok: boolean;
  scene: string;
  streaming: boolean;
  recording: boolean;
  error?: string;
  updatedAt: number;
};
