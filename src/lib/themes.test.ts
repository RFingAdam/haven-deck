import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isThemeId } from "./themes";

const root = resolve(process.cwd(), "themes");
const index = JSON.parse(readFileSync(`${root}/index.json`, "utf8")) as {
  themes: Array<{ id: string; label: string }>;
};

describe("shipped themes", () => {
  it("lists the four built-in themes, with haven first", () => {
    expect(index.themes.map((t) => t.id)).toEqual(["haven", "tactical-hud", "clean-dark", "neon"]);
  });

  it("each theme.json has an id, label, and CSS variables", () => {
    for (const item of index.themes) {
      expect(isThemeId(item.id)).toBe(true);
      const manifest = JSON.parse(readFileSync(`${root}/${item.id}/theme.json`, "utf8")) as {
        id: string;
        label: string;
        variables: Record<string, string>;
      };
      expect(manifest.id).toBe(item.id);
      expect(manifest.label).toBeTruthy();
      expect(manifest.variables["--bg"]).toMatch(/^#/);
      expect(manifest.variables["--accent"]).toMatch(/^#/);
      expect(manifest.variables["--text"]).toMatch(/^#/);
    }
  });
});

describe("isThemeId", () => {
  it("accepts simple ids and rejects paths", () => {
    expect(isThemeId("haven")).toBe(true);
    expect(isThemeId("tactical-hud")).toBe(true);
    expect(isThemeId("../secret")).toBe(false);
    expect(isThemeId("Haven")).toBe(false);
  });
});
