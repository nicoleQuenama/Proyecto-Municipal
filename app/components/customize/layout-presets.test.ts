import { describe, expect, it } from "vitest";
import { applyCell, applyLayout, cellOf, isGridLayout, layoutOf } from "./layout-presets";

describe("disposición de una sección", () => {
  it("aplica un preset y lo reconoce", () => {
    expect(layoutOf(applyLayout("", "bento"))).toBe("bento");
    expect(layoutOf(applyLayout("", "grid3"))).toBe("grid3");
    expect(layoutOf("")).toBe("free");
  });

  it("al cambiar de disposición conserva las clases de la persona", () => {
    const next = applyLayout("rounded-xl bg-primario flex flex-col gap-4", "grid2");
    expect(next).toContain("rounded-xl");
    expect(next).toContain("bg-primario");
    expect(next).not.toContain("flex");
    expect(layoutOf(next)).toBe("grid2");
  });

  it("«Libre» quita solo lo de la disposición", () => {
    expect(applyLayout("rounded-xl grid grid-cols-2 gap-4", "free")).toBe("rounded-xl");
  });

  it("las cuadrículas se distinguen de las filas", () => {
    expect(isGridLayout("bento")).toBe(true);
    expect(isGridLayout("row")).toBe(false);
  });
});

describe("carrusel", () => {
  it("se aplica, se reconoce y se quita sin dejar restos", () => {
    const carousel = applyLayout("rounded-xl", "carousel");
    expect(layoutOf(carousel)).toBe("carousel");
    expect(carousel).toContain("snap-x");
    expect(applyLayout(carousel, "free")).toBe("rounded-xl");
    expect(isGridLayout("carousel")).toBe(false);
  });
});

describe("celda de la cuadrícula", () => {
  it("guarda y lee cuántas columnas y filas ocupa", () => {
    const classes = applyCell("shadow-lg", { cols: 2, rows: 3 });
    expect(classes).toContain("shadow-lg");
    expect(cellOf(classes)).toEqual({ cols: 2, rows: 3 });
  });

  it("1 × 1 no deja clases de ocupación y cambiar reemplaza lo anterior", () => {
    const once = applyCell("", { cols: 2, rows: 2 });
    const back = applyCell(once, { cols: 1, rows: 1 });
    expect(back).not.toContain("span");
    expect(cellOf("")).toEqual({ cols: 1, rows: 1 });
  });
});
