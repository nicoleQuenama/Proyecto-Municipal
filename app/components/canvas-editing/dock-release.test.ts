import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import { applyOverrides } from "../site/overrides";
import { removeElements } from "../site/removal-rules";
import { INITIAL_SITE } from "../site/initial-site";
import type { ComponentDef, SiteState } from "../site/types";
import { layoutDocked } from "./dock-layout";
import { releasedFrames, withoutElements } from "./dock-release";

/** Un panel con un hijo en una casilla y otro en posición libre, más un elemento ajeno encima de todo. */
const panel = newElement("rect", "panel", { x: 100, y: 50, width: 200, height: 120 });
const slotted = newElement("text", "slotted", { parentId: "panel", slot: { h: "end", v: "end" }, width: 60, height: 20 });
const offset = newElement("icon", "offset", { parentId: "panel", offset: { x: 30, y: 40 }, width: 24, height: 24 });
const other = newElement("rect", "other", { x: 0, y: 0, width: 50, height: 50 });
// x e y guardados "viejos" (0,0): lo que se ve sale del layout, no de ellos.
const elements = [other, panel, slotted, offset];

const seen = (list: typeof elements, id: string) => layoutDocked(list).find((e) => e.id === id)!;

describe("withoutElements", () => {
  it("lo acoplado al panel borrado conserva su posición visible y queda suelto", () => {
    const after = withoutElements(elements, new Set(["panel"]));
    for (const id of ["slotted", "offset"]) {
      const before = seen(elements, id);
      const now = after.find((e) => e.id === id)!;
      expect([now.x, now.y, now.width, now.height]).toEqual([before.x, before.y, before.width, before.height]);
      expect(now.parentId).toBeUndefined();
      expect(now.x).not.toBe(0);
    }
    expect(after.some((e) => e.id === "panel")).toBe(false);
  });

  it("los demás elementos no cambian de capa ni de sitio", () => {
    const after = withoutElements(elements, new Set(["panel"]));
    expect(after[0].id).toBe("other");
    expect(after.find((e) => e.id === "other")).toEqual(other);
  });
});

describe("releasedFrames", () => {
  it("solo trae los hijos directos de lo quitado", () => {
    expect(Object.keys(releasedFrames(elements, new Set(["panel"]))).sort()).toEqual(["offset", "slotted"]);
    expect(releasedFrames(elements, new Set(["other"]))).toEqual({});
  });
});

describe("element/remove en un bloque", () => {
  const def: ComponentDef = { id: "c", name: "C", description: "", category: "cards", width: 400, height: 300, elements, links: {}, custom: true };
  const state: SiteState = {
    ...INITIAL_SITE,
    components: [def],
    pages: [{ ...INITIAL_SITE.pages[0], blocks: [{ id: "b", componentId: "c" }] }],
  };

  it("el hijo queda donde se veía dentro del bloque", () => {
    const next = removeElements(state, "block", state.pages[0].id, "b", ["panel"]);
    const block = next.pages[0].blocks[0];
    const shown = applyOverrides(def, block, () => undefined).elements;
    const child = shown.find((e) => e.id === "slotted")!;
    const before = seen(elements, "slotted");
    expect([child.x, child.y]).toEqual([before.x, before.y]);
    expect(shown.some((e) => e.id === "panel")).toBe(false);
  });

  it("en el componente entero también", () => {
    const next = removeElements(state, "component", state.pages[0].id, "b", ["panel"]);
    const child = next.components[0].elements.find((e) => e.id === "offset")!;
    const before = seen(elements, "offset");
    expect([child.x, child.y, child.parentId]).toEqual([before.x, before.y, undefined]);
  });
});
