import { describe, expect, it } from "vitest";
import { CODE_COMPONENT_ID, DEFAULT_CODE } from "./code-defaults";
import { codeOf, codePatchAction, isCodeBlock, sharedDefOf } from "./code-source";
import { INITIAL_SITE } from "./initial-site";
import { siteReducer } from "./site-reducer";
import type { BlockInstance, CodeSource, ComponentDef, SiteState } from "./types";

const CODE: CodeSource = { tailwind: false, html: "<p>a</p>", css: "", js: "const x = 1;" };
const def = (id: string, extra: Partial<ComponentDef>): ComponentDef => ({
  id, name: id, description: "", category: "code", width: 800, height: 400, elements: [], links: {}, custom: true, ...extra,
});
const codeDef = { id: CODE_COMPONENT_ID, name: "Código", description: "", category: "code", width: 800, height: 400, elements: [], links: {}, custom: false };

/** Un sitio con dos páginas y un bloque de código suelto en la primera. */
function site(): SiteState {
  let s: SiteState = { ...INITIAL_SITE, pages: [], components: [...INITIAL_SITE.components, codeDef] };
  s = siteReducer(s, { type: "page/create", id: "p1", name: "Uno" });
  s = siteReducer(s, { type: "page/create", id: "p2", name: "Dos" });
  s = siteReducer(s, { type: "block/add", id: "b1", pageId: "p1", componentId: CODE_COMPONENT_ID });
  return siteReducer(s, { type: "block/code", pageId: "p1", blockId: "b1", patch: CODE });
}
const block = (s: SiteState, id: string, page = "p1") => s.pages.find((p) => p.id === page)!.blocks.find((b) => b.id === id)!;

describe("codeOf", () => {
  const shared = def("c1", { codeKind: "component", code: CODE });
  it("prefiere el código propio del bloque", () => {
    const own = { ...CODE, js: "propio" };
    expect(codeOf({ id: "b", componentId: "c1", code: own }, [shared])).toBe(own);
  });
  it("usa el del componente compartido si el bloque no tiene", () => {
    expect(codeOf({ id: "b", componentId: "c1" }, [shared])).toBe(CODE);
  });
  it("una plantilla no comparte su código", () => {
    expect(codeOf({ id: "b", componentId: "t1" }, [def("t1", { codeKind: "template", code: CODE })])).toBeUndefined();
  });
  it("sharedDefOf solo devuelve componentes compartidos sin código propio", () => {
    expect(sharedDefOf({ id: "b", componentId: "c1" }, [shared])).toBe(shared);
    expect(sharedDefOf({ id: "b", componentId: "c1", code: CODE }, [shared])).toBeUndefined();
  });
  it("isCodeBlock reconoce el bloque de código, el componente y la plantilla", () => {
    const b = (componentId: string, code?: CodeSource): BlockInstance => ({ id: "b", componentId, code });
    expect(isCodeBlock(b(CODE_COMPONENT_ID, CODE), [])).toBe(true);
    expect(isCodeBlock(b("c1"), [shared])).toBe(true);
    expect(isCodeBlock(b("t1", CODE), [def("t1", { codeKind: "template", code: CODE })])).toBe(true);
    expect(isCodeBlock(b("x", CODE), [def("x", { category: "sections" })])).toBe(false);
  });
});

describe("block/set-kind", () => {
  it("a componente: crea la definición y el bloque deja de tener código propio", () => {
    const s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "Header" });
    const b = block(s, "b1");
    const d = s.components.find((c) => c.id === b.componentId)!;
    expect(d).toMatchObject({ name: "Header", codeKind: "component", custom: true, code: CODE });
    expect(b.code).toBeUndefined();
  });

  it("a plantilla: el bloque conserva su copia y la definición guarda el molde", () => {
    const s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "template", thumbnail: "https://ik.test/t.png", name: "Cards" });
    const b = block(s, "b1");
    expect(s.components.find((c) => c.id === b.componentId)).toMatchObject({ codeKind: "template", code: CODE });
    expect(b.code).toEqual(CODE);
  });

  it("volver a suelto un componente usado en otra página no rompe a las demás instancias (foco 5)", () => {
    let s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "Header" });
    const id = block(s, "b1").componentId;
    s = siteReducer(s, { type: "block/add", id: "b2", pageId: "p2", componentId: id });
    s = siteReducer(s, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "loose" });
    expect(block(s, "b1")).toMatchObject({ componentId: CODE_COMPONENT_ID, code: CODE });
    expect(codeOf(block(s, "b2", "p2"), s.components)).toEqual(CODE);
  });
});

describe("component/code y colocar", () => {
  it("component/code cambia el código de la definición y todas las instancias lo ven", () => {
    let s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "H" });
    const id = block(s, "b1").componentId;
    s = siteReducer(s, { type: "block/add", id: "b2", pageId: "p2", componentId: id });
    s = siteReducer(s, { type: "component/code", componentId: id, patch: { js: "nuevo" } });
    expect(codeOf(block(s, "b1"), s.components)?.js).toBe("nuevo");
    expect(codeOf(block(s, "b2", "p2"), s.components)?.js).toBe("nuevo");
  });

  it("colocar una plantilla copia su código; colocar un componente no", () => {
    let s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "template", thumbnail: "https://ik.test/t.png", name: "T" });
    const id = block(s, "b1").componentId;
    s = siteReducer(s, { type: "block/add", id: "b2", pageId: "p2", componentId: id });
    expect(block(s, "b2", "p2").code).toEqual(CODE);

    s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "C" });
    s = siteReducer(s, { type: "block/add", id: "b3", pageId: "p2", componentId: block(s, "b1").componentId });
    expect(block(s, "b3", "p2").code).toBeUndefined();
  });

  it("el bloque de código de fábrica sigue naciendo con el ejemplo", () => {
    const s = siteReducer(site(), { type: "block/add", id: "b9", pageId: "p2", componentId: CODE_COMPONENT_ID });
    expect(block(s, "b9", "p2").code).toEqual(DEFAULT_CODE);
  });
});

describe("page/add-code-block", () => {
  const add = (state: SiteState, kind: "component" | "template") =>
    siteReducer(state, { type: "page/add-code-block", pageId: "p2", kind, name: "Menú", blockId: "n1", code: { js: "const a = [{ x: 1 }];" }, thumbnail: "https://ik.test/t.png" });

  it("componente: crea la definición y un bloque que la sigue", () => {
    const s = add(site(), "component");
    const b = block(s, "n1", "p2");
    expect(codeOf(b, s.components)).toMatchObject({ js: "const a = [{ x: 1 }];", html: "", css: "" });
    expect(s.components.find((c) => c.id === b.componentId)).toMatchObject({ name: "Menú", codeKind: "component" });
    expect(b.code).toBeUndefined();
    expect(s.selectedId).toBe("n1");
  });

  it("plantilla: el bloque tiene su propia copia", () => {
    const s = add(site(), "template");
    expect(block(s, "n1", "p2").code?.js).toBe("const a = [{ x: 1 }];");
  });

  it("un trozo de CSS o de HTML llena solo ese archivo", () => {
    const s = siteReducer(site(), { type: "page/add-code-block", pageId: "p2", kind: "component", name: "E", blockId: "n2", code: { css: "p { color: red; }" } });
    expect(codeOf(block(s, "n2", "p2"), s.components)).toMatchObject({ css: "p { color: red; }", js: "", html: "" });
  });

  it("en una página que no existe no hace nada", () => {
    const before = site();
    expect(siteReducer(before, { type: "page/add-code-block", pageId: "nada", kind: "component", name: "X", blockId: "n1", code: { js: "x" } })).toBe(before);
  });
});

describe("plantillas de página", () => {
  const savePageTemplate = (state: SiteState) =>
    siteReducer(state, { type: "page/add-code-block", pageId: "p1", kind: "template", thumbnail: "https://ik.test/t.png", scope: "page", name: "Animada", blockId: "x", code: { js: "api.log(1);", css: "p{}" } });

  it("guardar una plantilla de página crea solo la definición, sin bloque", () => {
    const before = site();
    const s = savePageTemplate(before);
    expect(s.components.find((c) => c.name === "Animada")).toMatchObject({ codeKind: "template", templateFor: "page", code: { js: "api.log(1);", css: "p{}" } });
    expect(s.pages.find((p) => p.id === "p1")!.blocks).toHaveLength(before.pages[0].blocks.length);
    expect(s.selectedId).toBe(before.selectedId);
  });

  it("aplicarla pone su TS y CSS en la página y deja los bloques", () => {
    let s = savePageTemplate(site());
    const id = s.components.find((c) => c.name === "Animada")!.id;
    s = siteReducer(s, { type: "page/apply-code-template", pageId: "p2", componentId: id });
    const page = s.pages.find((p) => p.id === "p2")!;
    expect(page).toMatchObject({ js: "api.log(1);", css: "p{}" });
  });

  it("aplicar una definición que no existe o no es de página no cambia nada", () => {
    const s = site();
    expect(siteReducer(s, { type: "page/apply-code-template", pageId: "p2", componentId: "nada" })).toBe(s);
    expect(siteReducer(s, { type: "page/apply-code-template", pageId: "p2", componentId: CODE_COMPONENT_ID })).toBe(s);
  });
});

describe("el código extraído del editor", () => {
  it("nace con Tailwind, porque suele usar sus clases", () => {
    const s = siteReducer(site(), { type: "page/add-code-block", pageId: "p2", kind: "component", name: "H", blockId: "n9", code: { js: "x" } });
    expect(codeOf(block(s, "n9", "p2"), s.components)?.tailwind).toBe(true);
  });
});

describe("codePatchAction", () => {
  it("un bloque suelto o plantilla guarda en su propio código", () => {
    const s = site();
    expect(codePatchAction(block(s, "b1"), s.components, "p1", { tailwind: true })).toEqual({ type: "block/code", pageId: "p1", blockId: "b1", patch: { tailwind: true } });
  });
  it("un componente compartido guarda en su definición", () => {
    const s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "H" });
    expect(codePatchAction(block(s, "b1"), s.components, "p1", { tailwind: true })).toMatchObject({ type: "component/code", patch: { tailwind: true } });
  });
});

describe("la imagen de una plantilla es obligatoria", () => {
  it("convertir un bloque en plantilla sin imagen no hace nada; con imagen la guarda", () => {
    const before = site();
    expect(siteReducer(before, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "template", name: "T" })).toBe(before);
    const s = siteReducer(before, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "template", name: "T", thumbnail: "https://ik.test/a.png" });
    expect(s.components.find((c) => c.name === "T")?.thumbnail).toBe("https://ik.test/a.png");
  });

  it("guardar una plantilla (de sección o de página) desde el editor sin imagen tampoco", () => {
    const before = site();
    for (const scope of ["section", "page"] as const) {
      expect(siteReducer(before, { type: "page/add-code-block", pageId: "p1", kind: "template", scope, name: "T", blockId: "z", code: { js: "x" } })).toBe(before);
    }
    const s = siteReducer(before, { type: "page/add-code-block", pageId: "p1", kind: "template", scope: "page", name: "T", blockId: "z", code: { js: "x" }, thumbnail: "https://ik.test/b.png" });
    expect(s.components.find((c) => c.name === "T")?.thumbnail).toBe("https://ik.test/b.png");
  });

  it("un componente no la necesita", () => {
    const s = siteReducer(site(), { type: "page/add-code-block", pageId: "p1", kind: "component", name: "C", blockId: "z", code: { js: "x" } });
    expect(s.components.some((c) => c.name === "C")).toBe(true);
  });
});

describe("los nombres de componente son únicos (la base de datos lo exige)", () => {
  const names = (s: SiteState) => s.components.filter((c) => c.codeKind).map((c) => c.name);

  it("dos conversiones con el mismo nombre no repiten el nombre", () => {
    let s = site();
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "component", name: "Header", blockId: "a", code: { js: "1" } });
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "component", name: "Header", blockId: "b", code: { js: "2" } });
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "template", name: "Header", blockId: "c", code: { js: "3" }, thumbnail: "https://ik.test/t.png", scope: "page" });
    expect(names(s)).toEqual(["Header", "Header 2", "Header 3"]);
  });

  it("convertir un bloque con un nombre ya usado también lo cambia", () => {
    let s = site();
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "component", name: "Menú", blockId: "a", code: { js: "1" } });
    s = siteReducer(s, { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "Menú" });
    expect(names(s)).toEqual(["Menú", "Menú 2"]);
  });

  it("no importan las mayúsculas ni los espacios sobrantes", () => {
    let s = site();
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "component", name: "Header", blockId: "a", code: { js: "1" } });
    s = siteReducer(s, { type: "page/add-code-block", pageId: "p2", kind: "component", name: "  header ", blockId: "b", code: { js: "2" } });
    expect(new Set(names(s).map((n) => n.toLowerCase())).size).toBe(2);
  });
});
