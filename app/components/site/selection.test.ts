import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { TITLE_SELECTION } from "./types";

// Creates base state for selection tests
const base = () => ({ ...INITIAL_SITE, selectedId: TITLE_SELECTION, selectedElementId: null, alsoSelectedIds: undefined });

describe("selection", () => {
  // Selects and clears element
  it("selects element", () => {
    const n1 = siteReducer(base(), { type: "element/select", id: "e1" });
    expect(n1.selectedElementId).toBe("e1");
    const n2 = siteReducer(n1, { type: "element/select", id: null });
    expect(n2.selectedElementId).toBeNull();
  });

  // Multi-select with toggle
  it("multi-select", () => {
    let s = siteReducer(base(), { type: "element/select", id: "e1" });
    s = siteReducer(s, { type: "element/select", id: "e2", add: true });
    expect(s.alsoSelectedIds).toContain("e2");
    s = siteReducer(s, { type: "element/select", id: "e2", add: true });
    expect(s.alsoSelectedIds?.includes("e2")).toBe(false);
  });

  // Sets main if none
  it("sets main on add", () => {
    const s = siteReducer(base(), { type: "element/select", id: "e1", add: true });
    expect(s.selectedElementId).toBe("e1");
  });

  // Clears on block select
  it("clears on block select", () => {
    let s = siteReducer(base(), { type: "element/select", id: "e1" });
    s = { ...s, alsoSelectedIds: ["e2"] };
    const n = siteReducer(s, { type: "block/select", id: "b1" });
    expect(n.selectedElementId).toBeNull();
    expect(n.alsoSelectedIds).toBeUndefined();
  });

  // Loads project
  it("loads project", () => {
    const loaded = { ...INITIAL_SITE, globalCss: "body{margin:0}" };
    const n = siteReducer(base(), { type: "project/load", state: loaded });
    expect(n).toBe(loaded);
  });

  // Sets css
  it("sets global css", () => {
    const n = siteReducer(base(), { type: "global-css/set", css: ".a{color:red}" });
    expect(n.globalCss).toBe(".a{color:red}");
  });
});
