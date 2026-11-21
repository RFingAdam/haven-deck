import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, parseConfig } from "./config";

describe("parseConfig", () => {
  it("returns defaults for empty input", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it("uses loopback defaults, never a LAN address", () => {
    expect(DEFAULT_CONFIG.companionBase).toBe("http://127.0.0.1:8000");
    expect(DEFAULT_CONFIG.directorBase).toBe("http://127.0.0.1:8781");
    expect(DEFAULT_CONFIG.simulate).toBe(true);
  });

  it("strips trailing slashes and parses flags", () => {
    const cfg = parseConfig({
      companionBase: "http://127.0.0.1:8000/",
      simulate: "0",
      wantLocalPreview: "yes",
    });
    expect(cfg.companionBase).toBe("http://127.0.0.1:8000");
    expect(cfg.simulate).toBe(false);
    expect(cfg.wantLocalPreview).toBe(true);
  });

  it("accepts a same-origin audio hook and ignores bad values", () => {
    expect(parseConfig({ audioHook: "/hooks/audio" }).audioHook).toBe("/hooks/audio");
    expect(parseConfig({ audioHook: "http://127.0.0.1/hooks/audio" }).audioHook).toBe("");
    expect(DEFAULT_CONFIG.audioHook).toBe("");
  });
});
