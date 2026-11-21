import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Lock, Settings } from "lucide-react";
import { Icon } from "./components/Icon";
import { DeckKeyButton } from "./components/DeckKeyButton";
import { SetupPage } from "./components/SetupPage";
import { runAction, pollCompanion } from "./lib/actions";
import {
  DEFAULT_CONFIG,
  clearStoredOverrides,
  fetchFileConfig,
  loadStoredOverrides,
  mergeConfig,
  saveStoredOverrides,
} from "./lib/config";
import { clipSrc, validateLayout, validatePack } from "./lib/pack";
import { KIOSK_GRID_PAGE_SIZE, paginate } from "./lib/paginate";
import { callAudioHook, isAudioHookPath, isStopHookKey } from "./lib/audio-hook";
import { ARM_HINT, HOOK_HINT, planDeckAudio } from "./lib/play-policy";
import { gridPageSizeFromSearch, packUrlFromSearch, themeFromSearch } from "./lib/query";
import { applyTheme, DEFAULT_THEME_ID, loadTheme, loadThemeIndex, type ThemeIndexItem } from "./lib/themes";
import type { CompanionStatus, DeckConfig, DeckKey, DeckLayout, SoundPack } from "./lib/types";

const EMPTY_STATUS: CompanionStatus = {
  ok: false,
  scene: "—",
  streaming: false,
  recording: false,
  updatedAt: 0,
};

export default function App() {
  const [config, setConfig] = useState<DeckConfig>(DEFAULT_CONFIG);
  const [overrides, setOverrides] = useState<Partial<DeckConfig>>({});
  const [themeList, setThemeList] = useState<ThemeIndexItem[]>([{ id: DEFAULT_THEME_ID, label: "Haven" }]);
  const [armMic, setArmMic] = useState(false);
  const [layout, setLayout] = useState<DeckLayout | null>(null);
  const [pack, setPack] = useState<SoundPack | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState("live");
  const [gridPage, setGridPage] = useState(0);
  const [status, setStatus] = useState<CompanionStatus>(EMPTY_STATUS);
  const [hint, setHint] = useState("Demo mode is on. Taps stay on this device.");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const file = await fetchFileConfig();
      const stored = loadStoredOverrides();
      const queryPack = packUrlFromSearch();
      const queryTheme = themeFromSearch();
      if (cancelled) return;
      setOverrides(stored);
      setConfig(mergeConfig(file, {
        ...stored,
        ...(queryPack ? { packUrl: queryPack } : {}),
        ...(queryTheme ? { theme: queryTheme } : {}),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadThemeIndex().then((list) => {
      if (!cancelled) setThemeList(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = config.theme || DEFAULT_THEME_ID;
    void loadTheme(id).then((theme) => {
      if (theme) applyTheme(theme);
    });
  }, [config.theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [packRes, layoutRes] = await Promise.all([
          fetch(`${config.packUrl}/pack.json`, { cache: "no-store" }),
          fetch(`${config.packUrl}/layout.json`, { cache: "no-store" }),
        ]);
        if (!packRes.ok || !layoutRes.ok) throw new Error("Could not load the sound pack");
        const nextPack = validatePack(await packRes.json());
        const nextLayout = validateLayout(await layoutRes.json());
        if (cancelled) return;
        setPack(nextPack);
        setLayout(nextLayout);
        setLoadError(null);
        if (nextLayout.theme && !loadStoredOverrides().theme && !themeFromSearch()) {
          setConfig((prev) => (prev.theme === DEFAULT_THEME_ID ? { ...prev, theme: nextLayout.theme! } : prev));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load the pack");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.packUrl]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await pollCompanion(config);
      if (!cancelled) setStatus(next);
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [config]);

  const activePage = layout?.pages.find((p) => p.id === tab) ?? layout?.pages[0];
  const railKeys = useMemo(() => {
    if (!layout) return [];
    const byId = new Map(layout.pages.flatMap((p) => p.keys.map((k) => [k.id, k] as const)));
    return layout.sceneRail.map((id) => byId.get(id)).filter((k): k is DeckKey => Boolean(k));
  }, [layout]);

  const gridKeys = useMemo(() => {
    if (!activePage) return [];
    const rail = new Set(layout?.sceneRail ?? []);
    return activePage.keys.filter((k) => !k.pinned && !rail.has(k.id));
  }, [activePage, layout]);

  const footerKeys = useMemo(() => {
    if (!layout) return [];
    const byId = new Map(layout.pages.flatMap((p) => p.keys.map((k) => [k.id, k] as const)));
    return ["clip-it", "stop-all"].map((id) => byId.get(id)).filter((k): k is DeckKey => Boolean(k));
  }, [layout]);
  const pageSize = gridPageSizeFromSearch(KIOSK_GRID_PAGE_SIZE);
  const paged = paginate(gridKeys, gridPage, pageSize);

  const playLocal = useCallback((src: string) => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = src;
    void audio.play().catch(() => undefined);
  }, []);

  const audioHook = isAudioHookPath(config.audioHook) ? config.audioHook : "";

  useEffect(() => {
    if (!audioHook) return;
    const onHide = () => {
      void callAudioHook(audioHook, { action: "stop" });
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [audioHook]);

  const press = useCallback(
    async (key: DeckKey) => {
      if (key.confirmMs && confirmId !== key.id) {
        setConfirmId(key.id);
        setHint("Tap again to confirm");
        if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
        confirmTimer.current = window.setTimeout(() => setConfirmId(null), key.confirmMs);
        return;
      }
      setConfirmId(null);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);

      if (key.action.type === "page") {
        setTab(key.action.pageId);
        setGridPage(0);
        return;
      }

      const plan = planDeckAudio({
        kioskRoute: config.kioskRoute,
        wantLocalPreview: config.wantLocalPreview,
        simulate: config.simulate,
        armMic,
        hasAudioHook: Boolean(audioHook),
      });
      const isSound = key.action.type === "play" || Boolean(key.previewSrc);
      const clipId = key.action.type === "play" ? key.action.clipId : key.previewClipId;
      const durationMs = key.previewDurationMs ?? 1000;

      if (audioHook && !config.simulate && armMic && isStopHookKey(key.id)) {
        const stop = await callAudioHook(audioHook, { action: "stop" });
        if (!stop.ok) setHint(stop.error || "Audio hook stop failed");
      } else if (audioHook && plan === "hook" && isSound && clipId) {
        const result = await callAudioHook(audioHook, { action: "start", clipId, durationMs });
        setHint(result.ok ? key.label : result.error || "Audio hook failed");
        return;
      } else if (isSound && plan === "local" && key.previewSrc) {
        playLocal(clipSrc(config.packUrl, key.previewSrc));
        setHint(`Preview: ${key.label}`);
      } else if (isSound && plan === "hint") {
        setHint(armMic && !audioHook ? HOOK_HINT : ARM_HINT);
      }

      if (key.id === "clip-it") {
        setHint("Clip It is not mapped");
        return;
      }
      if (key.action.type === "none") return;
      const result = await runAction(key.action, config);
      if (result.simulated) setHint(`Demo: ${key.label}`);
      else if (!result.ok) setHint(result.error || "Action failed");
      else if (!isSound || plan !== "local") setHint(key.label);
    },
    [audioHook, armMic, config, confirmId, playLocal],
  );

  const patchConfig = (patch: Partial<DeckConfig>) => {
    const nextOverrides = { ...overrides, ...patch };
    setOverrides(nextOverrides);
    saveStoredOverrides(nextOverrides);
    setConfig((prev) => mergeConfig(prev, nextOverrides));
  };

  const resetConfig = async () => {
    clearStoredOverrides();
    setOverrides({});
    setConfig(await fetchFileConfig());
  };


  const statusLine = [
    config.simulate ? "Demo" : status.ok ? "Online" : "Offline",
    status.recording ? "Rec" : "Rec idle",
    status.streaming ? "Live" : "Off",
    status.scene && status.scene !== "—" ? status.scene : null,
    config.simulate ? "Demo mode" : "Companion",
  ].filter(Boolean).join(" · ");

  const tabCount = (layout?.pages.length ?? 0) + 1;

  return (
    <div className="shell" data-testid="deck-shell" data-theme={config.theme} style={{ ["--tab-count"]: String(tabCount) } as CSSProperties}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-name">Haven Deck</span>
          <span className="status-line" data-testid="connection-badge">{statusLine}</span>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className={armMic ? "arm-mic is-on" : "arm-mic"}
            aria-pressed={armMic}
            onClick={() => {
              setArmMic((on) => {
                const next = !on;
                if (!next && audioHook && !config.simulate) {
                  void callAudioHook(audioHook, { action: "stop" });
                }
                if (next && !audioHook) setHint(HOOK_HINT);
                else setHint(next ? "Mic armed" : "Mic idle");
                return next;
              });
            }}
          >
            <Icon name="mic" size={16} />
            Arm Mic
          </button>
          <button type="button" className="icon-btn" aria-label="Lock display" onClick={() => setHint("Display lock is a kiosk hint only")}>
            <Lock size={16} />
          </button>
          <button type="button" className="icon-btn" aria-label="Setup" data-testid="tab-setup-icon" onClick={() => setTab("setup")}>
            <Settings size={16} />
          </button>
        </div>
      </header>

      {tab !== "setup" ? (
      <div className="scene-rail" aria-label="Scenes" data-testid="scene-rail">
        {railKeys.map((key) => (
          <DeckKeyButton
            key={key.id}
            deckKey={key}
            status={status}
            pendingConfirm={confirmId === key.id}
            onPress={press}
          />
        ))}
      </div>
      ) : <div />}

      <nav className="tabs" aria-label="Deck pages">
        {(layout?.pages ?? []).map((page) => (
          <button
            key={page.id}
            type="button"
            data-testid={`tab-${page.id}`}
            className={tab === page.id ? "tab is-on" : "tab"}
            onClick={() => {
              setTab(page.id);
              setGridPage(0);
            }}
          >
            {page.label}
          </button>
        ))}
        <button
          type="button"
          data-testid="tab-setup"
          className={tab === "setup" ? "tab is-on" : "tab"}
          onClick={() => setTab("setup")}
        >
          Setup
        </button>
      </nav>

      <main className="main">
        {loadError ? <p className="banner warn">{loadError}</p> : null}
        {tab === "setup" || !activePage ? (
          <SetupPage
            config={config}
            pack={pack}
            themes={themeList}
            hasOverrides={Object.keys(overrides).length > 0}
            onPatch={patchConfig}
            onReset={() => void resetConfig()}
          />
        ) : (
          <div className="grid" data-testid="key-grid">
            {paged.slice.map((key) => (
              <DeckKeyButton
                key={key.id}
                deckKey={key}
                status={status}
                pendingConfirm={confirmId === key.id}
                onPress={press}
              />
            ))}
          </div>
        )}
      </main>

      {tab !== "setup" && activePage && paged.pages > 1 ? (
        <div className="pager" data-testid="pager">
          <button type="button" className="pager-btn" onClick={() => setGridPage(Math.max(0, paged.page - 1))}>
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="pager-count">
            {paged.page + 1} / {paged.pages}
          </span>
          <button
            type="button"
            className="pager-btn"
            onClick={() => setGridPage(Math.min(paged.pages - 1, paged.page + 1))}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      ) : <div />}

      <footer className="footer">
        <p className="status-msg" data-testid="status-msg">
          <span>{hint}</span>
          {status.scene && status.scene !== "—" ? <span className="status-sub">{status.scene}</span> : null}
        </p>
        {footerKeys.map((key) => (
          <DeckKeyButton
            key={key.id}
            deckKey={key}
            status={status}
            pendingConfirm={confirmId === key.id}
            onPress={press}
          />
        ))}
      </footer>
    </div>
  );
}
