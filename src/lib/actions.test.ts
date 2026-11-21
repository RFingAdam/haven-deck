import { describe, expect, it } from "vitest";
import { resolveHttpUrl } from "./actions";
import { DEFAULT_CONFIG } from "./config";

describe("resolveHttpUrl", () => {
  it("maps template and backend prefixes onto same-origin proxy paths", () => {
    expect(resolveHttpUrl("/director/play/tap", DEFAULT_CONFIG)).toBe("/director/play/tap");
    expect(resolveHttpUrl("{directorBase}/play/tap", DEFAULT_CONFIG)).toBe("/director/play/tap");
  });
});
