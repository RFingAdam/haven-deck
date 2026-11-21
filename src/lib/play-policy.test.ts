import { describe, expect, it } from "vitest";
import { planDeckAudio } from "./play-policy";

describe("planDeckAudio", () => {
  it("keeps the kiosk quiet in demo mode", () => {
    expect(planDeckAudio({ kioskRoute: true, wantLocalPreview: false, simulate: true })).toBe("hint");
  });

  it("plays locally only when preview is on", () => {
    expect(planDeckAudio({ kioskRoute: true, wantLocalPreview: true, simulate: true })).toBe("local");
  });

  it("sends to the backend when demo mode is off", () => {
    expect(planDeckAudio({ kioskRoute: true, wantLocalPreview: false, simulate: false })).toBe("backend");
  });
});
