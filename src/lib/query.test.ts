import { describe, expect, it } from "vitest";
import { gridPageSizeFromSearch, packUrlFromSearch, themeFromSearch } from "./query";

describe("packUrlFromSearch", () => {
  it("accepts a same-origin pack path", () => {
    expect(packUrlFromSearch("?packUrl=/packs/starter")).toBe("/packs/starter");
  });

  it("rejects anything that is not a /packs/ folder", () => {
    expect(packUrlFromSearch("?packUrl=https://example.com/x")).toBeUndefined();
    expect(packUrlFromSearch("?packUrl=/packs/../secrets")).toBeUndefined();
    expect(packUrlFromSearch("?packUrl=/config.json")).toBeUndefined();
  });
});

describe("gridPageSizeFromSearch", () => {
  it("returns a clamped integer or the fallback", () => {
    expect(gridPageSizeFromSearch(12, "?gridPageSize=3")).toBe(3);
    expect(gridPageSizeFromSearch(12, "?gridPageSize=99")).toBe(12);
    expect(gridPageSizeFromSearch(12, "")).toBe(12);
  });
});

describe("themeFromSearch", () => {
  it("accepts a simple theme id", () => {
    expect(themeFromSearch("?theme=tactical-hud")).toBe("tactical-hud");
  });

  it("rejects paths and mixed case", () => {
    expect(themeFromSearch("?theme=../secret")).toBeNull();
    expect(themeFromSearch("?theme=Haven")).toBeNull();
  });
});
