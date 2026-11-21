/**
 * Decide how a sound-key tap should play.
 * The kiosk route does not use the browser Audio element by default,
 * so a Pi's local speakers stay quiet.
 */
export const ARM_HINT = "Enable local preview or connect a sound backend";

export type DeckPlayAction = "backend" | "local" | "hint";

export function planDeckAudio(opts: {
  kioskRoute: boolean;
  wantLocalPreview: boolean;
  simulate: boolean;
}): DeckPlayAction {
  if (opts.wantLocalPreview) return "local";
  if (!opts.simulate && !opts.kioskRoute) return "backend";
  if (!opts.simulate) return "backend";
  return "hint";
}
