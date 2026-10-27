import { describe, expect, it } from "vitest";
import { drawShape } from "../drawing/draw-rules";
import { INITIAL_SITE } from "./initial-site";
import { joinBlocks } from "./join-rules";
import type { SiteState } from "./types";

const draw = (state: SiteState, n: number, kind: "rect" | "text", frame: { x: number; y: number; width: number; height: number }): SiteState =>
  drawShape(state, { pageId: "inicio", blockId: `b${n}`, componentId: `c${n}`, kind, label: "X", frame, ...(kind === "text" ? { overrides: { text: `T${n}` } } : {}) });

const two = (): SiteState => draw(draw(INITIAL_SITE, 1, "rect", { x: 100, y: 100, width: 300, height: 200 }), 2, "text", { x: 150, y: 120, width: 100, height: 40 });

describe("unir secciones", () => {
  it("las secciones se convierten en una sola que ocupa el rectángulo que las contiene", () => {
    const next = joinBlocks(two(), "inicio", ["b1", "b2"], "g", "cg");
    const [block] = next.pages[0].blocks;
    expect(next.pages[0].blocks).toHaveLength(1);
    expect(block.placement).toMatchObject({ x: 100, y: 100, width: 300 });
    const group = next.components.find((c) => c.id === "cg")!;
    expect(group).toMatchObject({ width: 300, height: 200, drawn: true });
    expect(next.selectedId).toBe("g");
  });

  it("cada elemento conserva su lugar relativo y su contenido, con ids propios", () => {
    const group = joinBlocks(two(), "inicio", ["b1", "b2"], "g", "cg").components.find((c) => c.id === "cg")!;
    const text = group.elements.find((e) => e.id === "b2-c2-forma")!;
    expect(text).toMatchObject({ x: 50, y: 20, text: "T2" });
    expect(group.elements.map((e) => e.id)).toEqual(["b1-c1-forma", "b2-c2-forma"]);
  });

  it("los componentes sueltos que quedan huérfanos se quitan", () => {
    const next = joinBlocks(two(), "inicio", ["b1", "b2"], "g", "cg");
    expect(next.components.some((c) => c.id === "c1" || c.id === "c2")).toBe(false);
  });

  it("el formato propio de la sección pasa a sus elementos", () => {
    const state = two();
    const recolored: SiteState = {
      ...state,
      pages: state.pages.map((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === "b1" ? { ...b, elements: { "c1-forma": { fill: "#ff0000" } } } : b)) })),
    };
    const group = joinBlocks(recolored, "inicio", ["b1", "b2"], "g", "cg").components.find((c) => c.id === "cg")!;
    expect(group.elements[0].fill).toBe("#ff0000");
  });

  it("con menos de dos secciones, o con alguna sin colocar, no hace nada", () => {
    const state = two();
    expect(joinBlocks(state, "inicio", ["b1"], "g", "cg")).toBe(state);
    expect(joinBlocks(state, "inicio", ["b1", "nada"], "g", "cg")).toBe(state);
  });
});
