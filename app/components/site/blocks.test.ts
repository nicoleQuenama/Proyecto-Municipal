import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { CODE_COMPONENT_ID } from "./code-defaults";
import type { SiteState } from "./types";

// Creates base state for tests
const base = (): SiteState => ({ ...INITIAL_SITE, pages: [], components: INITIAL_SITE.components });
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

  // Locks and unlocks a block (Canva style)
  it("locks and unlocks block", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, comp("c1")] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    s = siteReducer(s, { type: "block/add", id: "b1", componentId: "c1" });
    expect(s.pages[0].blocks[0].locked).toBeUndefined();

    // Toggle lock to true
    let locked = siteReducer(s, { type: "block/lock", pageId: "p1", blockId: "b1" });
    expect(locked.pages[0].blocks[0].locked).toBe(true);

    // Toggle lock to false
    let unlocked = siteReducer(locked, { type: "block/lock", pageId: "p1", blockId: "b1" });
    expect(unlocked.pages[0].blocks[0].locked).toBe(false);

    // Explicit lock false/true
    locked = siteReducer(unlocked, { type: "block/lock", pageId: "p1", blockId: "b1", locked: true });
    expect(locked.pages[0].blocks[0].locked).toBe(true);
  });

  // Prevents moveBlock and placeBlock when locked
  it("prevents moving or placing locked block", () => {
    let s = { ...base(), components: [...INITIAL_SITE.components, comp("c1")] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Home" });
    s = siteReducer(s, { type: "block/add", id: "b1", componentId: "c1" });
    s = siteReducer(s, { type: "block/add", id: "b2", componentId: "c1" });

    // Lock b1
    s = siteReducer(s, { type: "block/lock", pageId: "p1", blockId: "b1", locked: true });

    // Attempting to move b1 down should do nothing because it is locked
    const moved = siteReducer(s, { type: "block/move", pageId: "p1", blockId: "b1", direction: 1 });
    expect(moved.pages[0].blocks[0].id).toBe("b1");

    // Attempting to place b1 freely should do nothing because it is locked
    const placed = siteReducer(s, { type: "block/place", pageId: "p1", blockId: "b1", placement: { x: 100, y: 100, width: 300 } });
    expect(placed.pages[0].blocks[0].placement).toBeUndefined();
  });
});
