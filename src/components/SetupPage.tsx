import type { DeckConfig, SoundPack } from "../lib/types";

export function SetupPage({
  config,
  pack,
  hasOverrides,
  onPatch,
  onReset,
}: {
  config: DeckConfig;
  pack: SoundPack | null;
  hasOverrides: boolean;
  onPatch: (patch: Partial<DeckConfig>) => void;
  onReset: () => void;
}) {
  return (
    <section className="setup" data-testid="setup-page">
      <h1>Setup</h1>
      <p>
        Demo mode is on by default so a first run cannot press Go Live on a real
        stream computer. Turn it off only after you have mapped the buttons in
        this pack to your own Companion or Director setup.
      </p>
      <label className="toggle">
        <input
          type="checkbox"
          checked={config.simulate}
          onChange={(e) => onPatch({ simulate: e.target.checked })}
        />
        <span>Demo mode (no network actions)</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={config.wantLocalPreview}
          onChange={(e) => onPatch({ wantLocalPreview: e.target.checked })}
        />
        <span>Local preview (plays through this device's speakers)</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={config.kioskRoute}
          onChange={(e) => onPatch({ kioskRoute: e.target.checked })}
        />
        <span>Kiosk route (keeps local speakers muted unless preview is on)</span>
      </label>
      <dl className="meta">
        <dt>Companion</dt>
        <dd>{config.companionBase}</dd>
        <dt>Director</dt>
        <dd>{config.directorBase}</dd>
        <dt>Pack</dt>
        <dd>{pack ? `${pack.name} (${pack.clips.length} clips)` : config.packUrl}</dd>
      </dl>
      {pack ? <p className="credit">{pack.credit}</p> : null}
      <p className="fine">
        Edit <code>config.json</code> next to the built app (or in <code>public/</code>{" "}
        during development) to change loopback URLs. This screen only stores
        the toggles above on this device.
      </p>
      {hasOverrides ? (
        <button type="button" className="pager-btn" onClick={onReset}>
          Clear device overrides
        </button>
      ) : null}
    </section>
  );
}
