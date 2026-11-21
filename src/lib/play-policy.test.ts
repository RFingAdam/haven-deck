import { describe, expect, it } from "vitest";
import { planDeckAudio } from "./play-policy";

const quietKiosk = { kioskRoute: true, wantLocalPreview: false, simulate: true };

describe("planDeckAudio", () => {
  it("keeps the kiosk quiet in demo mode", () => {
    expect(planDeckAudio(quietKiosk)).toBe("hint");
  });

  it("plays locally only when preview is on", () => {
    expect(planDeckAudio({ kioskRoute: true, wantLocalPreview: true, simulate: true })).toBe("local");
  });

  it("sends to the backend when demo mode is off", () => {
    expect(planDeckAudio({ kioskRoute: true, wantLocalPreview: false, simulate: false })).toBe("backend");
  });

  it("uses the audio hook when Arm Mic is on and a hook is configured", () => {
    expect(
      planDeckAudio({
        kioskRoute: true,
        wantLocalPreview: false,
        simulate: false,
        armMic: true,
        hasAudioHook: true,
      }),
    ).toBe("hook");
  });

  it("does not call the hook in demo mode", () => {
    expect(
      planDeckAudio({
        kioskRoute: true,
        wantLocalPreview: false,
        simulate: true,
        armMic: true,
        hasAudioHook: true,
      }),
    ).toBe("hint");
  });

  it("stays quiet if Arm Mic is on but no hook is configured", () => {
    expect(
      planDeckAudio({
        kioskRoute: true,
        wantLocalPreview: false,
        simulate: false,
        armMic: true,
        hasAudioHook: false,
      }),
    ).toBe("hint");
  });
});
