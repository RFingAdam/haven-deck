import { describe, expect, it } from "vitest";
import { isAudioHookPath, isStopHookKey } from "./audio-hook";
import { parseAudioHook } from "./config";

describe("parseAudioHook", () => {
  it("accepts a same-origin /hooks path", () => {
    expect(parseAudioHook("/hooks/audio")).toBe("/hooks/audio");
    expect(isAudioHookPath("/hooks/audio")).toBe(true);
  });

  it("rejects anything that is not a local hooks path", () => {
    expect(parseAudioHook("")).toBe("");
    expect(parseAudioHook("/api/deck/mic-arm")).toBe("");
    expect(parseAudioHook("https://example.com/hooks/audio")).toBe("");
    expect(parseAudioHook("/hooks/../secret")).toBe("");
    expect(parseAudioHook("/hooks/audio?x=1")).toBe("");
    expect(isAudioHookPath("")).toBe(false);
  });
});

describe("isStopHookKey", () => {
  it("matches Stop All style ids", () => {
    expect(isStopHookKey("stop-all")).toBe(true);
    expect(isStopHookKey("hs-stopall")).toBe(true);
    expect(isStopHookKey("tt-stopall-combos")).toBe(true);
    expect(isStopHookKey("go-live")).toBe(false);
  });
});
