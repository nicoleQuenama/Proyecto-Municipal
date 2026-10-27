import { describe, expect, it } from "vitest";
import { drawShape } from "../drawing/draw-rules";
import { INITIAL_SITE } from "./initial-site";
import { EMPTY_TEXT, setElementIcon, setElementText } from "./text-rules";
import type { SiteState } from "./types";

const FRAME = { x: 10, y: 20, width: 300, height: 60 };

function withText(): SiteState {
  return drawShape(INITIAL_SITE, {
    pageId: "inicio",
    blockId: "b",
    componentId: "c",
    kind: "text",
    label: "Texto",
    overrides: { text: "" },
    frame: FRAME,
  });
}

describe("setElementText", () => {
  it("un texto recién dibujado nace vacío y seleccionado, listo para escribir", () => {
    const state = withText();
    expect(state.components.find((c) => c.id === "c")!.elements[0].text).toBe("");
    expect(state.selectedElementId).toBe("c-forma");
  });

  it("guarda lo escrito en el elemento del componente", () => {
    const next = setElementText(withText(), "c", "c-forma", "Centinela");
    expect(next.components.find((c) => c.id === "c")!.elements[0].text).toBe("Centinela");
  });

  it("un texto vacío vuelve a «Texto» para no perder el elemento", () => {
    const next = setElementText(withText(), "c", "c-forma", "   ");
    expect(next.components.find((c) => c.id === "c")!.elements[0].text).toBe(EMPTY_TEXT);
  });

  it("no cambia nada si el elemento no existe", () => {
    const state = withText();
    expect(setElementText(state, "c", "nada", "x")).toBe(state);
  });
});

describe("setElementIcon", () => {
  it("cambia el icono de un elemento", () => {
    const state = drawShape(INITIAL_SITE, {
      pageId: "inicio",
      blockId: "b",
      componentId: "c",
      kind: "icon",
      label: "Icono",
      overrides: { icon: "star" },
      frame: FRAME,
    });
    const next = setElementIcon(state, "c", "c-forma", "instagram");
    expect(next.components.find((c) => c.id === "c")!.elements[0].icon).toBe("instagram");
    expect(setElementIcon(next, "c", "c-forma", "instagram")).toBe(next);
  });
});
