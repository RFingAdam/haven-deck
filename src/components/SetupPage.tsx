import type { DeckConfig, SoundPack } from "../lib/types";
import type { ThemeIndexItem } from "../lib/themes";

export function SetupPage({
  config,
  pack,
  themes,
  hasOverrides,
  onPatch,
  onReset,
}: {
  config: DeckConfig;
  pack: SoundPack | null;
  themes: ThemeIndexItem[];
  hasOverrides: boolean;
  onPatch: (patch: Partial<DeckConfig>) => void;
  onReset: () => void;
}) {
  return (
    <section className="setup" data-testid="setup-page">
      <h1>Setup</h1>
      <p>
        Demo mode is on by default so a first run cannot press Go Live on a real
        stream computer. Turn it off only after you have mapped this pack.
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
      <h1>Theme</h1>
      <p>This device can switch looks. Packs and config.json can set a default.</p>
      <div className="theme-picker" data-testid="theme-picker">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            data-testid={`theme-${theme.id}`}
            className={config.theme === theme.id ? "theme-choice is-on" : "theme-choice"}
            aria-pressed={config.theme === theme.id}
            onClick={() => onPatch({ theme: theme.id })}
          >
            {theme.label}
            <small>{theme.id}</small>
          </button>
        ))}
      </div>
      <dl className="meta">
        <dt>Companion</dt>
        <dd>{config.companionBase}</dd>
        <dt>Director</dt>
        <dd>{config.directorBase}</dd>
        <dt>Pack</dt>
        <dd>{pack ? `${pack.name} (${pack.clips.length} clips)` : config.packUrl}</dd>
        <dt>Theme</dt>
        <dd>{config.theme}</dd>
      </dl>
      {hasOverrides ? (
        <button type="button" className="pager-btn" onClick={onReset}>
          Clear device overrides
        </button>
      ) : null}
    </section>
  );
}
