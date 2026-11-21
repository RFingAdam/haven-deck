/**
 * Decide how a sound-key tap should play.
 * The kiosk route does not use the browser Audio element by default,
 * so a Pi's local speakers stay quiet.
 */
export const ARM_HINT = "Enable local preview or connect a sound backend";
export const HOOK_HINT = "Arm Mic is on, but this deck has no audio hook configured";

export type DeckPlayAction = "backend" | "local" | "hint" | "hook";

export function planDeckAudio(opts: {
  kioskRoute: boolean;
  wantLocalPreview: boolean;
  simulate: boolean;
  armMic?: boolean;
  hasAudioHook?: boolean;
}): DeckPlayAction {
  if (opts.armMic && opts.hasAudioHook && !opts.simulate) return "hook";
  if (opts.armMic && !opts.hasAudioHook && !opts.wantLocalPreview) return "hint";
  if (opts.wantLocalPreview) return "local";
  if (!opts.simulate && !opts.kioskRoute) return "backend";
  if (!opts.simulate) return "backend";
  return "hint";
}
