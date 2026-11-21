import { describe, expect, it } from "vitest";
import { gridPageSizeFromSearch, packUrlFromSearch } from "./query";

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
