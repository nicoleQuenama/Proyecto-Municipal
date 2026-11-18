import { describe, expect, it } from "vitest";
import { CODE_COMPONENT_ID } from "../site/code-defaults";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import type { SiteState } from "../site/types";
import { dataSource } from "./data-target";

const codeDef = { id: CODE_COMPONENT_ID, name: "Código", description: "", category: "code", width: 800, height: 400, elements: [], links: {}, custom: false };

function site(): SiteState {
  let s: SiteState = { ...INITIAL_SITE, pages: [], components: [...INITIAL_SITE.components, codeDef] };
  s = siteReducer(s, { type: "page/create", id: "p1", name: "Uno" });
  s = siteReducer(s, { type: "page/code", pageId: "p1", patch: { js: "const a = [{ x: 1 }];" } });
  s = siteReducer(s, { type: "block/add", id: "b1", pageId: "p1", componentId: CODE_COMPONENT_ID });
  return siteReducer(s, { type: "block/code", pageId: "p1", blockId: "b1", patch: { js: "const b = 2;" } });
}

describe("dataSource", () => {
  it("la página lee y escribe su código", () => {
    const source = dataSource(site(), { kind: "page", pageId: "p1" });
    expect(source.js).toBe("const a = [{ x: 1 }];");
    expect(source.save("x")).toEqual({ type: "page/code", pageId: "p1", patch: { js: "x" } });
    expect(source.places).toBe(0);
  });

  it("un bloque suelto escribe en su propio código", () => {
    const source = dataSource(site(), { kind: "block", pageId: "p1", blockId: "b1" });
    expect(source.js).toBe("const b = 2;");
    expect(source.save("x")).toMatchObject({ type: "block/code", blockId: "b1", patch: { js: "x" } });
  });

  it("un componente compartido escribe en su definición y cuenta sus lugares", () => {
    const s = siteReducer(site(), { type: "block/set-kind", pageId: "p1", blockId: "b1", kind: "component", name: "H" });
    const source = dataSource(s, { kind: "block", pageId: "p1", blockId: "b1" });
    expect(source.save("x")).toMatchObject({ type: "component/code", patch: { js: "x" } });
    expect(source.places).toBe(1);
  });

  it("un destino que no existe da código vacío", () => {
    expect(dataSource(site(), { kind: "page", pageId: "nada" }).js).toBe("");
  });
});
