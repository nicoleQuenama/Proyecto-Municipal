import { describe, expect, it } from "vitest";
import { drawShape } from "../drawing/draw-rules";
import { INITIAL_SITE } from "./initial-site";
import { copyBlocks, PASTE_OFFSET, pasteBlocks } from "./paste-rules";
import { siteReducer } from "./site-reducer";
import type { SiteState } from "./types";

const draw = (state: SiteState, n: number, x: number): SiteState =>
  drawShape(state, {
    pageId: "inicio",
    blockId: `b${n}`,
    componentId: `c${n}`,
    kind: "text",
    label: "Texto",
    overrides: { text: `Hola ${n}` },
    frame: { x, y: 50, width: 200, height: 40 },
  });

const two = (): SiteState => draw(draw(INITIAL_SITE, 1, 100), 2, 400);

describe("copiar y pegar secciones", () => {
  it("un texto dibujado se pega como copia independiente y corrida", () => {
    const state = two();
    const next = pasteBlocks(state, "inicio", copyBlocks(state, "inicio", ["b1"]), ["n1"], ["m1"]);

    const blocks = next.pages[0].blocks;
    expect(blocks.map((b) => b.id)).toEqual(["b1", "b2", "n1"]);
    expect(blocks[2].componentId).toBe("m1");
    expect(blocks[2].placement).toMatchObject({ x: 100 + PASTE_OFFSET, y: 50 + PASTE_OFFSET });
    expect(next.components.find((c) => c.id === "m1")?.elements[0].text).toBe("Hola 1");
    expect(next.selectedId).toBe("n1");
  });

  it("varias secciones se pegan juntas y quedan seleccionadas", () => {
    const state = two();
    const clips = copyBlocks(state, "inicio", ["b2", "b1"]);
    const next = pasteBlocks(state, "inicio", clips, ["n1", "n2"], ["m1", "m2"]);
    expect(next.pages[0].blocks.map((b) => b.id)).toEqual(["b1", "b2", "n1", "n2"]);
    expect(next.selectedBlockIds).toEqual(["n1", "n2"]);
  });

  it("cambiar el texto de la copia no cambia el original", () => {
    const state = two();
    const next = pasteBlocks(state, "inicio", copyBlocks(state, "inicio", ["b1"]), ["n1"], ["m1"]);
    const edited = siteReducer(next, { type: "component/text", componentId: "m1", pageId: "inicio", blockId: "n1", elementId: "c1-forma", text: "Otro" });
    expect(edited.components.find((c) => c.id === "c1")?.elements[0].text).toBe("Hola 1");
    expect(edited.components.find((c) => c.id === "m1")?.elements[0].text).toBe("Otro");
  });

  it("un componente de la biblioteca se reutiliza, no se duplica", () => {
    const state: SiteState = { ...INITIAL_SITE, pages: [{ ...INITIAL_SITE.pages[0], blocks: [{ id: "b1", componentId: "code-block" }] }] };
    const clips = copyBlocks(state, "inicio", ["b1"]);
    expect(clips[0].component).toBeUndefined();
    const next = pasteBlocks(state, "inicio", clips, ["n1"], ["m1"]);
    expect(next.pages[0].blocks[1].componentId).toBe("code-block");
    expect(next.components).toHaveLength(state.components.length);
  });

  it("sigue valiendo si la original se borra, y llega por el reductor", () => {
    const state = two();
    const clips = copyBlocks(state, "inicio", ["b1"]);
    const without = siteReducer(state, { type: "block/remove", id: "b1" });
    const next = siteReducer(without, { type: "block/paste", pageId: "inicio", clips, blockIds: ["n1"], componentIds: ["m1"] });
    expect(next.pages[0].blocks.map((b) => b.id)).toEqual(["b2", "n1"]);
  });

  it("no copia lo que no existe", () => {
    expect(copyBlocks(two(), "inicio", ["nada"])).toEqual([]);
  });
});
