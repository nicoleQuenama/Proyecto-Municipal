import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "./initial-site";
import { siteReducer } from "./site-reducer";
import type { ComponentDef, SiteState } from "./types";

const card: ComponentDef = { id: "c1", name: "C", description: "", category: "sections", width: 400, height: 200, elements: [], links: {}, custom: true };

/** Un bloque de 400 × 200 colocado en x=100, y=50. */
function placed(): SiteState {
  let s: SiteState = { ...INITIAL_SITE, pages: [], components: [...INITIAL_SITE.components, card] };
  s = siteReducer(s, { type: "page/create", id: "p1", name: "Uno" });
  s = siteReducer(s, { type: "block/add", id: "b1", pageId: "p1", componentId: "c1" });
  return siteReducer(s, { type: "block/place", pageId: "p1", blockId: "b1", placement: { x: 100, y: 50, width: 400 } });
}
const block = (s: SiteState) => s.pages[0].blocks[0];

describe("block/size con ancla", () => {
  it("agarrar el lado izquierdo y ensanchar deja el lado derecho donde estaba", () => {
    const s = siteReducer(placed(), { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 450, height: 200 }, anchor: { left: true, top: false } });
    expect(block(s).size).toEqual({ width: 450, height: 200 });
    expect(block(s).placement).toMatchObject({ x: 50, y: 50 });
    // El borde derecho: antes 100 + 400, ahora 50 + 450.
  });

  it("agarrar el borde de arriba mueve solo la posición vertical", () => {
    const s = siteReducer(placed(), { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 400, height: 230 }, anchor: { left: false, top: true } });
    expect(block(s).placement).toMatchObject({ x: 100, y: 20 });
  });

  it("agarrar el lado derecho o el de abajo no mueve la posición", () => {
    const s = siteReducer(placed(), { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 450, height: 260 }, anchor: { left: false, top: false } });
    expect(block(s).placement).toMatchObject({ x: 100, y: 50 });
  });

  it("sin ancla (como antes) la posición no cambia", () => {
    const s = siteReducer(placed(), { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 450, height: 200 } });
    expect(block(s).placement).toMatchObject({ x: 100, y: 50 });
  });

  it("un bloque sin colocar (en el flujo) solo cambia de tamaño", () => {
    let s = placed();
    s = siteReducer(s, { type: "block/placement-mode", pageId: "p1", blockId: "b1", mode: "flow" });
    s = siteReducer(s, { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 450, height: 200 }, anchor: { left: true, top: false } });
    expect(block(s).placement).toBeUndefined();
    expect(block(s).size?.width).toBe(450);
  });

  it("si el tamaño se limita (no cabe), la posición sigue al tamaño que de verdad quedó", () => {
    const s = siteReducer(placed(), { type: "block/size", pageId: "p1", blockId: "b1", size: { width: 5000, height: 200 }, anchor: { left: true, top: false } });
    const width = block(s).size!.width;
    expect(block(s).placement!.x).toBe(Math.max(0, 100 + 400 - width));
  });
});
