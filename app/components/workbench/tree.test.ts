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

describe("explorador con un componente compartido", () => {
  const codeDef = { id: "code-block", name: "Código", description: "", category: "code", width: 800, height: 400, elements: [], links: {}, custom: false };

  /** «Header» como componente, colocado en dos páginas, y una plantilla «Cards» colocada dos veces en la primera. */
  function shared(): SiteState {
    let s: SiteState = { ...INITIAL_SITE, pages: [], components: [...INITIAL_SITE.components, codeDef] };
    s = siteReducer(s, { type: "page/create", id: "p1", name: "Uno" });
    s = siteReducer(s, { type: "page/create", id: "p2", name: "Dos" });
    s = siteReducer(s, { type: "block/add", id: "b1", pageId: "p1", componentId: "code-block" });
    s = siteReducer(s, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "Header" });
    const id = s.pages.find((p) => p.id === "p1")!.blocks[0].componentId;
    s = siteReducer(s, { type: "block/add", id: "b2", pageId: "p2", componentId: id });
    s = siteReducer(s, { type: "block/add", id: "b3", pageId: "p1", componentId: "code-block" });
    s = siteReducer(s, { type: "block/set-kind", pageId: "p1", blockId: "b3", kind: "template", thumbnail: "https://ik.test/t.png", name: "Cards" });
    const cards = s.pages.find((p) => p.id === "p1")!.blocks.find((b) => b.id === "b3")!.componentId;
    return siteReducer(s, { type: "block/add", id: "b4", pageId: "p1", componentId: cards });
  }

  it("las copias de un componente compartido no se numeran como si fueran variantes", () => {
    const labels = flatten(buildTree(shared())).map((n) => n.label);
    expect(labels.filter((l) => l === "Header · componente")).toHaveLength(2);
    expect(labels.some((l) => /^Header \d/.test(l))).toBe(false);
  });

  it("una carpeta Componentes lo lista una sola vez, con los lugares donde se usa", () => {
    const folderNode = flatten(buildTree(shared())).find((n) => n.id === "components");
    expect(folderNode?.children?.map((c) => c.label)).toEqual(["Header · 2 lugares"]);
  });

  it("las plantillas siguen numeradas: cada copia es independiente", () => {
    const labels = flatten(buildTree(shared())).map((n) => n.label);
    expect(labels.filter((l) => /^Cards \d/.test(l))).toHaveLength(2);
  });
});
