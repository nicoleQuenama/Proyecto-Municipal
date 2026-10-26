import { describe, expect, it } from "vitest";
import { MAX_ZOOM, MIN_ZOOM, clampZoom, fitScale, scrollAfterZoom, stepZoom, wheelZoom, zoomLabel } from "./builder-zoom";

describe("fitScale", () => {
  it("un lienzo pequeño se queda al 100 %", () => {
    expect(fitScale({ width: 800, height: 600 }, { width: 320, height: 200 })).toBe(1);
  });

  it("un lienzo de 1024×1200 se reduce hasta caber en la ventana", () => {
    const zoom = fitScale({ width: 700, height: 500 }, { width: 1024, height: 1200 });
    expect(zoom).toBeLessThan(0.4);
    expect(1200 * zoom + 64).toBeLessThanOrEqual(500 + 1);
  });

  it("nunca baja del mínimo", () => {
    expect(fitScale({ width: 10, height: 10 }, { width: 1024, height: 1200 })).toBe(MIN_ZOOM);
  });
});

describe("stepZoom", () => {
  it("salta al siguiente nivel y se detiene en los extremos", () => {
    expect(stepZoom(1, 1)).toBe(1.5);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(0.3, 1)).toBe(0.5);
    expect(stepZoom(0.3, -1)).toBe(0.25);
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });
});

describe("rueda y scroll", () => {
  it("la rueda hacia arriba acerca y hacia abajo aleja, siempre dentro de los límites", () => {
    expect(wheelZoom(1, -100)).toBeGreaterThan(1);
    expect(wheelZoom(1, 100)).toBeLessThan(1);
    expect(wheelZoom(MAX_ZOOM, -10000)).toBe(MAX_ZOOM);
    expect(clampZoom(0)).toBe(MIN_ZOOM);
  });

  it("el punto bajo el cursor no se mueve al cambiar de zoom", () => {
    const scroll = 120, cursor = 200, from = 1, to = 2;
    const next = scrollAfterZoom(scroll, cursor, from, to);
    expect((scroll + cursor) / from).toBeCloseTo((next + cursor) / to);
  });

  it("el porcentaje se redondea", () => {
    expect(zoomLabel(0.333)).toBe("33 %");
  });
});
