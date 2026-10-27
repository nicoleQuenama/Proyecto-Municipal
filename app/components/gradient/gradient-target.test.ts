import { describe, expect, it } from "vitest";
import { drawShape } from "../drawing/draw-rules";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import { backgroundAction, currentBackground } from "./gradient-target";

const state = drawShape(INITIAL_SITE, {
  pageId: "inicio",
  blockId: "b",
  componentId: "c",
  kind: "rect",
  label: "R",
  frame: { x: 0, y: 0, width: 100, height: 100 },
});
const GRADIENT = "linear-gradient(90deg, #000 0%, #fff 100%)";

describe("degradado: destino", () => {
  it("se aplica a la página, a la sección y a un elemento, y se lee de vuelta", () => {
    const page = siteReducer(state, backgroundAction({ kind: "page", pageId: "inicio" }, GRADIENT));
    expect(currentBackground(page, { kind: "page", pageId: "inicio" })).toBe(GRADIENT);

    const block = siteReducer(state, backgroundAction({ kind: "block", pageId: "inicio", blockId: "b" }, GRADIENT));
    expect(currentBackground(block, { kind: "block", pageId: "inicio", blockId: "b" })).toBe(GRADIENT);

    const target = { kind: "element", pageId: "inicio", blockId: "b", elementId: "c-forma" } as const;
    const element = siteReducer(state, backgroundAction(target, GRADIENT));
    expect(currentBackground(element, target)).toBe(GRADIENT);
  });

  it("sin cambios, el elemento da su relleno original", () => {
    expect(currentBackground(state, { kind: "element", pageId: "inicio", blockId: "b", elementId: "c-forma" })).toBe("#cbd5e1");
  });
});
