import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { CODE_COMPONENT_ID } from "./code-defaults";

// Creates base state for tests
const base = () => ({ ...INITIAL_SITE, pages: [], components: INITIAL_SITE.components });
// Creates a test component
const comp = (id: string) => ({ id, name: "C", description: "", category: "sections", width: 800, height: 400, elements: [], links: {}, custom: true });

describe("block actions", () => {
  // Adds block to current page
  it("adds block", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, comp("c1")] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    const n = siteReducer(s, { type: "block/add", id: "b1", componentId: "c1" });
    expect(n.pages[0].blocks).toHaveLength(1);
    expect(n.selectedId).toBe("b1");
  });

  // Adds code block with defaults
  it("adds code block", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, { ...comp(CODE_COMPONENT_ID), category: "code" }] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    const n = siteReducer(s, { type: "block/add", id: "b1", componentId: CODE_COMPONENT_ID });
    expect(n.pages[0].blocks[0].code).toBeDefined();
  });

  // Blocks add with missing data
  it("blocks invalid add", () => {
    expect(siteReducer(base(), { type: "block/add", id: "b1", componentId: "x" })).toEqual(base());
  });

  // Removes block
  it("removes block", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, comp("c1")] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    s = siteReducer(s, { type: "block/add", id: "b1", componentId: "c1" });
    s = siteReducer(s, { type: "block/add", id: "b2", componentId: "c1" });
    const n = siteReducer(s, { type: "block/remove", id: "b1" });
    expect(n.pages[0].blocks[0].id).toBe("b2");
  });

  // Clears selection on block select
  it("clears selection on block select", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, comp("c1")] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    s = siteReducer(s, { type: "block/add", id: "b1", componentId: "c1" });
    s = siteReducer(s, { type: "element/select", id: "e1" });
    const n = siteReducer(s, { type: "block/select", id: "b1" });
    expect(n.selectedId).toBe("b1");
    expect(n.selectedElementId).toBeNull();
  });
});
