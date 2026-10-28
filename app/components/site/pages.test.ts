import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { TITLE_SELECTION } from "./types";

// Creates base state for tests
const base = () => ({ ...INITIAL_SITE, pages: [], components: INITIAL_SITE.components });

describe("page actions", () => {
  // Creates page with correct defaults
  it("creates a page", () => {
    const next = siteReducer(base(), { type: "page/create", id: "p1", name: "About" });
    expect(next.pages[0].name).toBe("About");
    expect(next.pages[0].slug).toBe("about");
    expect(next.currentPageId).toBe("p1");
    expect(next.selectedId).toBe(TITLE_SELECTION);
  });

  // Blocks invalid names
  it("blocks empty or duplicate names", () => {
    const s1 = siteReducer(base(), { type: "page/create", id: "p1", name: "   " });
    expect(s1.pages).toHaveLength(0);
    const s2 = siteReducer(base(), { type: "page/create", id: "p1", name: "Home" });
    const s3 = siteReducer(s2, { type: "page/create", id: "p2", name: "Home" });
    expect(s3.pages).toHaveLength(1);
  });

  // Renames and updates slug
  it("renames page", () => {
    let s = siteReducer(base(), { type: "page/create", id: "p1", name: "Old" });
    s = siteReducer(s, { type: "page/rename", id: "p1", name: "New Name" });
    expect(s.pages[0].name).toBe("New Name");
    expect(s.pages[0].slug).toBe("new-name");
  });

  // Home keeps slug
  it("keeps home slug", () => {
    const h = { ...INITIAL_SITE.pages[0] };
    const n = siteReducer({ ...base(), pages: [h] }, { type: "page/rename", id: h.id, name: "Landing" });
    expect(n.pages[0].slug).toBe(h.slug);
  });

  // Deletes current page moves to home
  it("moves to home on delete", () => {
    const h = { ...INITIAL_SITE.pages[0], id: "home", isHome: true };
    let s = { ...base(), pages: [h], currentPageId: "home" };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Temp" });
    const n = siteReducer(s, { type: "page/delete", id: "p1" });
    expect(n.currentPageId).toBe("home");
  });
});
