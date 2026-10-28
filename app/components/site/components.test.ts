import { describe, expect, it } from "vitest";
import { siteReducer } from "./site-reducer";
import { INITIAL_SITE } from "./initial-site";
import { EXAMPLE_COMPONENTS } from "./component-templates";

// Creates base state with empty components
const base = () => ({ ...INITIAL_SITE, components: [] });
// Creates a test component
const comp = (id: string, name = id) => ({ id, name, description: "", category: "sections", width: 800, height: 400, elements: [], links: {}, custom: true });

describe("component actions", () => {
  // Saves new component
  it("saves component", () => {
    const n = siteReducer(base(), { type: "component/save", component: comp("c1") });
    expect(n.components).toHaveLength(1);
  });

  // Updates existing component
  it("updates component", () => {
    let s = siteReducer(base(), { type: "component/save", component: comp("c1", "A") });
    s = siteReducer(s, { type: "component/save", component: comp("c1", "B") });
    expect(s.components[0].name).toBe("B");
  });

  // Keeps styles on partial update
  it("keeps styles", () => {
    const c1 = { ...comp("c1"), styles: { $section: { classes: "py-4", css: "" } } };
    let s = siteReducer(base(), { type: "component/save", component: c1 });
    s = siteReducer(s, { type: "component/save", component: { ...c1, styles: undefined } });
    expect(s.components[0].styles?.$section?.classes).toBe("py-4");
  });

  // Deletes component
  it("deletes component", () => {
    let s = siteReducer(base(), { type: "component/save", component: comp("c1") });
    s = siteReducer(s, { type: "component/save", component: comp("c2") });
    const n = siteReducer(s, { type: "component/delete", id: "c1" });
    expect(n.components[0].id).toBe("c2");
  });

  // Restores examples without duplicates
  it("restores examples", () => {
    const s = siteReducer({ ...INITIAL_SITE, components: [comp("x")] }, { type: "components/restore" });
    expect(s.components.find((c) => c.id === "x")).toBeDefined();
    for (const ex of EXAMPLE_COMPONENTS) expect(s.components.filter((c) => c.id === ex.id)).toHaveLength(1);
  });
});
