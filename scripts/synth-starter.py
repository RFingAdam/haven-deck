#!/usr/bin/env python3
"""Synthesize the original Haven Deck starter tones (48 kHz mono WAV)."""
from __future__ import annotations

import math
import wave
from pathlib import Path

RATE = 48000
PEAK = 0.23
ROOT = Path(__file__).resolve().parents[1] / "packs" / "starter" / "sounds"


def render(seconds: float, fn) -> list[float]:
    n = int(RATE * seconds)
    return [fn(i / RATE, seconds) for i in range(n)]


def env(t: float, dur: float, attack: float = 0.004, release: float = 0.06) -> float:
    if t < attack:
        return t / attack
    remain = dur - t
    if remain < release:
        return max(0.0, remain / release)
    return 1.0


def tone(freq: float, dur: float, *, shape: str = "sine") -> list[float]:
    def fn(t: float, d: float) -> float:
        phase = 2 * math.pi * freq * t
        wave_s = math.sin(phase)
        if shape == "tick":
            wave_s = math.sin(phase) * math.exp(-t * 40)
        return wave_s * env(t, d) 
    return render(dur, fn)


def write_wav(name: str, samples: list[float]) -> None:
    peak = max((abs(s) for s in samples), default=0.0) or 1.0
    scale = PEAK / peak
    frames = b"".join(int(max(-1.0, min(1.0, s * scale)) * 32767).to_bytes(2, "little", signed=True) for s in samples)
    ROOT.mkdir(parents=True, exist_ok=True)
    path = ROOT / name
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(RATE)
        wf.writeframes(frames)
    print(path.name, f"{len(samples) / RATE:.3f}s")


def main() -> None:
    write_wav("tap.wav", tone(2000, 0.18, shape="tick"))

    conf = tone(523.25, 0.18) + tone(783.99, 0.24)
    write_wav("confirm.wav", conf)

    def rise(t: float, d: float) -> float:
        freq = 440 + (220 * (t / d))
        return math.sin(2 * math.pi * freq * t) * env(t, d, release=0.08)
    write_wav("go.wav", render(0.4, rise))

    write_wav("rec.wav", tone(880, 0.16, shape="tick"))

    def bell(t: float, d: float) -> float:
        a = math.sin(2 * math.pi * 659.25 * t) * math.exp(-t * 4)
        b = math.sin(2 * math.pi * 1318.5 * t) * 0.35 * math.exp(-t * 6)
        return (a + b) * env(t, d, attack=0.002, release=0.2)
    write_wav("scene.wav", render(0.5, bell))

    def fall(t: float, d: float) -> float:
        freq = 400 - (200 * (t / d))
        return math.sin(2 * math.pi * freq * t) * env(t, d, release=0.1)
    write_wav("stop.wav", render(0.32, fall))


if __name__ == "__main__":
    main()
