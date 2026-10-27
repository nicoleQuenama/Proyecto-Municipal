import { describe, expect, it } from "vitest";
import type { CanvasElement } from "../site/types";
import { fitToContent, SIZE_PRESETS } from "./size-presets";

const el = (x: number, y: number, width: number, height: number) => ({ x, y, width, height }) as CanvasElement;

describe("tamaños sugeridos", () => {
  it("ajustar abraza a los elementos con margen", () => {
    expect(fitToContent([el(0, 0, 100, 50), el(20, 80, 200, 40)], 10)).toEqual({ width: 220 + 10, height: 120 + 10 });
  });

  it("sin elementos no hay tamaño que ajustar", () => {
    expect(fitToContent([])).toBeNull();
  });

  it("los tamaños tienen nombre propio", () => {
    expect(new Set(SIZE_PRESETS.map((p) => p.label)).size).toBe(SIZE_PRESETS.length);
  });
});
