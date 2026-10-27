import { describe, expect, it } from "vitest";
import { EXAMPLE_COMPONENTS } from "./component-templates";
import { hiddenItems, purgeHidden } from "./hidden-items";
import { INITIAL_SITE } from "./initial-site";
import { applyOverrides } from "./overrides";
import { removeBlocks, removeComponent, removeElements, setTitleRemoved } from "./removal-rules";
import { deletionPlan } from "./deletion-plan";
import { siteReducer } from "./site-reducer";
import { undoLabel } from "./undo-rules";
import type { SiteState } from "./types";

const card = EXAMPLE_COMPONENTS.find((c) => c.id === "card-service")!;
const first = card.elements[0].id;
const second = card.elements[1].id;

/** Un sitio con la tarjeta y dos bloques que la usan, uno en cada página. */
function site(): SiteState {
  const [home] = INITIAL_SITE.pages;
  const other = { ...home, id: "otra", name: "Otra", slug: "otra", isHome: false, blocks: [] };
  return {
    ...INITIAL_SITE,
    components: [...INITIAL_SITE.components, { ...card, links: { [first]: { kind: "page", pageId: other.id } } }],
    pages: [
      { ...home, titleRemoved: undefined, blocks: [{ id: "b1", componentId: card.id, bindings: { [first]: { sourceId: "s", path: "x" } } }] },
      { ...other, blocks: [{ id: "b2", componentId: card.id }] },
    ],
    selectedId: "b1",
    selectedElementId: first,
  };
}

const def = (state: SiteState) => state.components.find((c) => c.id === card.id)!;

describe("proyecto de partida", () => {
  it("trae una sola página en blanco y solo el bloque de código; los ejemplos se restauran", () => {
    expect(INITIAL_SITE.pages).toHaveLength(1);
    expect(INITIAL_SITE.pages[0]).toMatchObject({ blocks: [], media: [], titleRemoved: true });
    expect(INITIAL_SITE.components.map((c) => c.id)).toEqual(["code-block"]);
    const restored = siteReducer(INITIAL_SITE, { type: "components/restore" });
    expect(restored.components.length).toBe(EXAMPLE_COMPONENTS.length + 1);
    expect(siteReducer(restored, { type: "components/restore" })).toBe(restored);
  });
});

describe("removeComponent", () => {
  it("borra un componente de fábrica con sus bloques, reglas y selección", () => {
    const state = site();
    state.rules = [{ scope: { kind: "component", componentId: card.id }, target: "heading", props: { color: "#fff" } }];
    const next = removeComponent(state, card.id);
    expect(next.components.some((c) => c.id === card.id)).toBe(false);
    expect(next.pages.flatMap((p) => p.blocks)).toEqual([]);
    expect(next.rules).toEqual([]);
    expect(next.selectedId).toBe("title");
    expect(next.selectedElementId).toBeNull();
  });

  it("limpia animaciones y funciones de los bloques que se van", () => {
    const state = site();
    state.pages[0].animations = [
      { id: "a", name: "A", steps: [{ id: "s", blockId: "b1", key: first, prop: "opacity", from: 0, to: 1, at: 0, duration: 100 }] },
    ];
    state.functions = [{ id: "f", name: "f", code: "", scope: { kind: "block", blockId: "b1" } }];
    const next = removeBlocks(state, ["b1"]);
    expect(next.pages[0].animations).toBeUndefined();
    expect(next.functions).toEqual([]);
  });
});

describe("removeElements", () => {
  it("en todo el componente quita el elemento, su enlace y su dato de todos los bloques", () => {
    const next = removeElements(site(), "component", "inicio", "b1", [first]);
    expect(def(next).elements.some((e) => e.id === first)).toBe(false);
    expect(def(next).links[first]).toBeUndefined();
    expect(next.pages[0].blocks[0].bindings).toBeUndefined();
    expect(next.selectedElementId).toBeNull();
  });

  it("en solo este bloque queda eliminado ahí y el resto sigue igual", () => {
    const next = removeElements(site(), "block", "inicio", "b1", [first]);
    expect(def(next).elements.some((e) => e.id === first)).toBe(true);
    const view = applyOverrides(def(next), next.pages[0].blocks[0], () => undefined);
    expect(view.elements.some((e) => e.id === first)).toBe(false);
    const other = applyOverrides(def(next), next.pages[1].blocks[0], () => undefined);
    expect(other.elements.some((e) => e.id === first)).toBe(true);
  });
});

describe("ocultos", () => {
  it("se listan y se eliminan de golpe", () => {
    let state = site();
    state = siteReducer(state, { type: "hidden/set", target: { kind: "title", pageId: "inicio" }, hidden: true });
    state = siteReducer(state, { type: "hidden/set", target: { kind: "element", pageId: "inicio", blockId: "b1", elementId: second }, hidden: true });
    expect(hiddenItems(state.pages[0], state.components).map((i) => i.key)).toEqual(["title", `b1:${second}`]);

    const clean = purgeHidden(state, "inicio");
    expect(clean.pages[0].titleRemoved).toBe(true);
    expect(clean.pages[0].titleHidden).toBeUndefined();
    expect(hiddenItems(clean.pages[0], clean.components)).toEqual([]);
    const view = applyOverrides(def(clean), clean.pages[0].blocks[0], () => undefined);
    expect(view.elements.some((e) => e.id === second)).toBe(false);
  });

  it("una página nueva nace sin titular y se puede añadir", () => {
    const created = siteReducer(INITIAL_SITE, { type: "page/create", id: "nueva", name: "Nueva" });
    const page = created.pages.find((p) => p.id === "nueva")!;
    expect(page.titleRemoved).toBe(true);
    expect(setTitleRemoved(created, "nueva", false).pages.find((p) => p.id === "nueva")!.titleRemoved).toBeUndefined();
  });
});

describe("página de inicio", () => {
  it("se puede cambiar y la anterior se vuelve borrable", () => {
    const two = siteReducer(INITIAL_SITE, { type: "page/create", id: "servicios", name: "Servicios" });
    const moved = siteReducer(two, { type: "page/home", id: "servicios" });
    expect(moved.pages.filter((p) => p.isHome).map((p) => p.id)).toEqual(["servicios"]);
    const deleted = siteReducer(moved, { type: "page/delete", id: "inicio" });
    expect(deleted.pages.some((p) => p.id === "inicio")).toBe(false);
  });
});

describe("deletionPlan y deshacer", () => {
  it("Supr quita los elementos seleccionados o, sin elemento, la sección", () => {
    const state = site();
    const page = state.pages[0];
    expect(deletionPlan(page, { selectedId: "b1", selectedElementId: first, alsoSelectedIds: [second] }, "block")).toEqual({
      type: "element/remove",
      scope: "block",
      pageId: "inicio",
      blockId: "b1",
      elementIds: [first, second],
    });
    expect(deletionPlan(page, { selectedId: "b1", selectedElementId: null }, "block")).toEqual({ type: "block/remove", id: "b1" });
    expect(deletionPlan(page, { selectedId: "title", selectedElementId: null }, "block")).toBeNull();
  });

  it("las acciones destructivas avisan y las demás no", () => {
    expect(undoLabel({ type: "block/remove", id: "x" })).toBe("Sección eliminada");
    expect(undoLabel({ type: "title/removed", pageId: "p", removed: false })).toBeNull();
    expect(undoLabel({ type: "page/select", id: "x" })).toBeNull();
  });
});
