import { describe, expect, it } from "vitest";
import type { BlockInstance, CanvasElement, ComponentDef } from "../site/types";
import { adaptToDevice, strategyFor } from "./adapt";
import { ADAPT_HANDLERS } from "./adapt-rules";
import { describeSummary, summarizeAdaptation } from "./adapt-summary";
import { isHiddenOn, toggleHiddenOn, visibleOn } from "./hidden-on";
import { sideMargin } from "./page-margin";
import { smartStrategy } from "./strategies";

const el = (id: string, over: Partial<CanvasElement> = {}): CanvasElement => ({
  id, kind: "text", role: "none", x: 10, y: 10, width: 300, height: 40, fill: "#fff", radius: 0,
  text: "Hola", fontSize: 16, color: "#000", bold: false, align: "left", fontFamily: "", src: "", ...over,
});
const def = (width: number, elements: CanvasElement[]): ComponentDef => ({
  id: "c", name: "S", description: "", category: "hero" as ComponentDef["category"], width, height: 200, elements, links: {}, custom: true,
});
const block = (over: Partial<BlockInstance> = {}): BlockInstance => ({ id: "b", componentId: "c", ...over });

describe("estrategia inteligente", () => {
  it("apila una sección ancha con varios elementos y escala una sola pieza", () => {
    expect(smartStrategy(def(900, [el("a"), el("b", { y: 80 })]), 300)).toBe("stack");
    expect(smartStrategy(def(900, [el("a")]), 300)).toBe("scale");
    expect(smartStrategy(def(200, [el("a"), el("b")]), 300)).toBe("scale");
  });

  it("la elegida a mano manda sobre la inteligente", () => {
    const wide = def(900, [el("a"), el("b", { y: 80 })]);
    expect(strategyFor(wide, block(), "mobile", 300)).toBe("stack");
    expect(strategyFor(wide, block({ adapt: { mobile: "scale" } }), "mobile", 300)).toBe("scale");
    expect(adaptToDevice(wide, block({ adapt: { mobile: "scale" } }), "mobile", false, 300).width).toBe(300);
  });
});

describe("ocultar por dispositivo", () => {
  const list = [el("a"), el("b", { hiddenOn: ["mobile"] }), el("c", { hiddenOn: ["tablet", "mobile"] })];

  it("filtra solo lo oculto en ese dispositivo", () => {
    expect(visibleOn(list, "desktop").map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(visibleOn(list, "tablet").map((e) => e.id)).toEqual(["a", "b"]);
    expect(visibleOn(list, "mobile").map((e) => e.id)).toEqual(["a"]);
  });

  it("devuelve la misma lista si nada está oculto", () => {
    const plain = [el("a")];
    expect(visibleOn(plain, "mobile")).toBe(plain);
  });

  it("adaptToDevice quita lo oculto antes de adaptar", () => {
    const out = adaptToDevice(def(200, list), block(), "mobile", false, 300);
    expect(out.elements.map((e) => e.id)).toEqual(["a"]);
  });

  it("alterna dispositivos sin dejar listas vacías", () => {
    expect(toggleHiddenOn(undefined, "mobile", true)).toEqual(["mobile"]);
    expect(toggleHiddenOn(["mobile"], "tablet", true)).toEqual(["mobile", "tablet"]);
    expect(toggleHiddenOn(["mobile"], "mobile", false)).toBeUndefined();
    expect(isHiddenOn(["tablet"], "mobile")).toBe(false);
  });
});

describe("acciones del asistente", () => {
  const state = {
    components: [],
    pages: [{
      id: "p",
      blocks: [
        block({ id: "m", responsive: { mobile: { size: { width: 1, height: 1 }, frames: {} } } }),
        block({ id: "s", adapt: { mobile: "scale", tablet: "scale" } }),
      ],
    }],
  } as never;
  const blocksOf = (s: { pages: { blocks: BlockInstance[] }[] }) => s.pages[0].blocks;

  it("adaptar la página respeta lo manual, salvo que se pida", () => {
    const run = (includeManual: boolean) =>
      blocksOf(ADAPT_HANDLERS["responsive/adapt-page"](state, { type: "responsive/adapt-page", pageId: "p", device: "mobile", includeManual }));
    expect(run(false)[0].responsive?.mobile).toBeDefined();
    expect(run(false)[1].adapt).toEqual({ tablet: "scale" });
    expect(run(true)[0].responsive).toBeUndefined();
  });

  it("oculta una sección y un elemento solo en un dispositivo", () => {
    const hid = ADAPT_HANDLERS["responsive/hide"](state, { type: "responsive/hide", pageId: "p", blockId: "s", device: "mobile", hidden: true });
    expect(blocksOf(hid)[1].hiddenOn).toEqual(["mobile"]);
    const hidEl = ADAPT_HANDLERS["responsive/hide"](state, { type: "responsive/hide", pageId: "p", blockId: "s", elementId: "x", device: "tablet", hidden: true });
    expect(blocksOf(hidEl)[1].elements?.x.hiddenOn).toEqual(["tablet"]);
  });

  it("resume y guarda el margen lateral por dispositivo", () => {
    expect(describeSummary(summarizeAdaptation(blocksOf(state), "mobile"))).toBe("1 sección adaptada automáticamente · 1 definida a mano");
    expect(sideMargin("mobile")).toBe(16);
    expect(sideMargin("mobile", { mobile: 8 })).toBe(8);
    expect(sideMargin("desktop", { mobile: 8 })).toBe(40);
    const set = ADAPT_HANDLERS["responsive/margin"](state, { type: "responsive/margin", pageId: "p", device: "mobile", margin: 500 });
    expect((set.pages[0] as { sideMargin?: unknown }).sideMargin).toEqual({ mobile: 80 });
  });
});
