import { describe, expect, it } from "vitest";
import { EXAMPLE_COMPONENTS } from "../site/component-templates";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import { SECTION_KEY, TITLE_SELECTION, type SiteState } from "../site/types";
import { buildTree, type TreeNode } from "./tree";

const card = EXAMPLE_COMPONENTS.find((c) => c.id === "card-service")!;

/** Un sitio: la página actual sin plantilla (vacía) y otra con una sección de plantilla. */
function site(withCode = false): SiteState {
  const [home] = INITIAL_SITE.pages;
  const base: SiteState = {
    ...INITIAL_SITE,
    components: [...INITIAL_SITE.components, card],
    pages: [
      { ...home, blocks: [] },
      { ...home, id: "otra", name: "Otra", slug: "otra", isHome: false, blocks: [{ id: "b1", componentId: card.id }] },
    ],
    currentPageId: "otra",
    selectedId: "b1",
    selectedElementId: null,
  };
  return withCode
    ? siteReducer(base, { type: "block/code", pageId: "otra", blockId: "b1", patch: { html: "<p>Hola</p>", css: "", js: "", tailwind: false } })
    : base;
}

const flatten = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((node) => [node, ...(node.children ? flatten(node.children) : [])]);
const find = (state: SiteState, id: string) => flatten(buildTree(state)).find((node) => node.id === id);

describe("explorador sin plantilla", () => {
  it("muestra los archivos de la página actual aunque estén vacíos, y no los de las demás", () => {
    const state: SiteState = { ...site(), currentPageId: "inicio", selectedId: TITLE_SELECTION };
    const ids = flatten(buildTree(state)).map((node) => node.id);
    expect(ids).toContain("kind=page-css&pageId=inicio");
    expect(ids).toContain("kind=page-js&pageId=inicio");
    expect(ids).not.toContain("kind=page-css&pageId=otra");
  });

  it("sigue dejando abrir el CSS global", () => {
    const state: SiteState = { ...site(), currentPageId: "inicio", selectedId: TITLE_SELECTION };
    expect(find(state, "kind=global-css")).toBeUndefined(); // vacío y fuera de la página: se oculta
    expect(flatten(buildTree(state, new Set(["kind=global-css"]))).some((n) => n.id === "kind=global-css")).toBe(true);
  });

  it("una página recién creada (page/create) lista su código y sus estilos, vacíos", () => {
    const state = siteReducer(site(), { type: "page/create", id: "nueva", name: "Nueva" });
    const ids = flatten(buildTree(state)).map((node) => node.id);
    expect(ids).toContain("kind=page-js&pageId=nueva");
    expect(ids).toContain("kind=page-css&pageId=nueva");
  });
});

describe("código de una sección de plantilla", () => {
  it("la carpeta de la selección muestra su HTML, CSS y TypeScript sin tener que añadirlos antes", () => {
    const selection = find(site(), "selection");
    expect((selection?.children ?? []).map((child) => child.ref?.kind)).toEqual(["block-html", "block-css", "block-js"]);
    expect(selection?.action).toEqual({ type: "add-code", pageId: "otra", blockId: "b1" });
  });

  it("sus archivos tienen nombre distinto del CSS propio de la sección", () => {
    const state: SiteState = siteReducer(site(), { type: "block/custom", pageId: "otra", blockId: "b1", key: SECTION_KEY, patch: { css: ".a{}" } });
    const labels = (find(state, "selection")?.children ?? []).map((child) => child.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.some((label) => label.includes("estructura.html"))).toBe(true);
  });

  it("al tener código aparecen sus tres archivos y la oferta desaparece", () => {
    const state = site(true);
    const selection = find(state, "selection");
    expect(selection?.action).toBeUndefined();
    expect((selection?.children ?? []).map((child) => child.ref?.kind)).toEqual(["block-html", "block-css", "block-js"]);
    // También en su página, sin tener que estar seleccionada: la carpeta de la sección lista sus archivos.
    const section = flatten(buildTree(state)).find((node) => node.id === "otra:b1");
    expect((section?.children ?? []).map((child) => child.ref?.kind)).toEqual(["block-html", "block-css", "block-js"]);
  });
});
