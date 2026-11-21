import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateLayout, validatePack } from "./pack";

const starter = resolve(process.cwd(), "packs/starter");

describe("starter pack", () => {
  it("validates pack.json", () => {
    const pack = validatePack(JSON.parse(readFileSync(`${starter}/pack.json`, "utf8")));
    expect(pack.clips.length).toBeGreaterThanOrEqual(1);
    expect(pack.license).toBe("CC-BY-4.0");
    expect(pack.credit).toMatch(/SwampBewdy/);
    expect(pack.credit).toMatch(/CC BY 4\.0/);
  });

  it("validates layout.json and the scene rail", () => {
    const layout = validateLayout(JSON.parse(readFileSync(`${starter}/layout.json`, "utf8")));
    expect(layout.pages.map((p) => p.id)).toEqual(["live", "sounds"]);
    expect(layout.sceneRail).toEqual(["sc-game", "sc-chat", "sc-brb", "sc-start", "sc-end"]);
    const goLive = layout.pages[0].keys.find((k) => k.id === "go-live");
    expect(goLive?.confirmMs).toBeGreaterThan(0);
  });

  it("rejects a path that escapes the pack folder", () => {
    expect(() =>
      validatePack({
        name: "x",
        version: "1",
        license: "CC-BY-4.0",
        credit: "x",
        author: "x",
        rate: 48000,
        clips: [
          {
            id: "bad",
            label: "Bad",
            category: "UI",
            file: "sounds/../../secret.wav",
            seconds: 1,
            license: "CC-BY-4.0",
            credit: "x",
          },
        ],
      }),
    ).toThrow(/sounds\/|must be a \.wav or \.mp3/);
  });

  it("allows a longer mp3 clip under songs/", () => {
    const pack = validatePack({
      name: "x",
      version: "1",
      license: "CC-BY-4.0",
      credit: "x",
      author: "x",
      rate: 48000,
      clips: [
        {
          id: "example_clip",
          label: "Example",
          category: "Songs",
          file: "songs/example_clip.mp3",
          seconds: 90,
          license: "CC-BY-4.0",
          credit: "x",
        },
      ],
    });
    expect(pack.clips[0].file).toBe("songs/example_clip.mp3");
  });
});
