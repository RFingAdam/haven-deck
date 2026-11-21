import type { CompanionStatus, DeckKey } from "../lib/types";
import { isSceneActive } from "../lib/paginate";
import { Icon } from "./Icon";

export function DeckKeyButton({
  deckKey,
  status,
  pendingConfirm,
  onPress,
}: {
  deckKey: DeckKey;
  status: CompanionStatus;
  pendingConfirm: boolean;
  onPress: (key: DeckKey) => void;
}) {
  const hot = isHot(deckKey, status);
  const label = pendingConfirm ? "Tap again" : deckKey.label;
  const sub = pendingConfirm ? "Confirm go live" : deckKey.sublabel;
  return (
    <button
      type="button"
      data-testid={`key-${deckKey.id}`}
      aria-pressed={pendingConfirm || hot}
      className={`key tone-${deckKey.tone}${hot ? " is-hot" : ""}${pendingConfirm ? " is-confirm" : ""}`}
      onClick={() => onPress(deckKey)}
    >
      <span className="key-icon">
        <Icon name={deckKey.icon} />
      </span>
      <span className="key-label">{label}</span>
      {sub ? <span className="key-sub">{sub}</span> : null}
    </button>
  );
}

function isHot(key: DeckKey, status: CompanionStatus): boolean {
  if (!key.feedback) return false;
  if (key.feedback.kind === "stream_live") return status.streaming;
  if (key.feedback.kind === "recording") return status.recording;
  if (key.feedback.kind === "scene") return isSceneActive(status.scene, key.feedback.name);
  return false;
}
