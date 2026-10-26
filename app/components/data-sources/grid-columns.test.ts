import { describe, expect, it } from "vitest";
import { cellWidth, columnsFor } from "./grid-columns";

const grid = { columns: 4, gap: 24 };

describe("columnas de la rejilla", () => {
  it("el escritorio usa siempre las suyas", () => {
    expect(columnsFor(grid, "desktop", 200)).toBe(4);
  });

  it("calcula solo cuántas caben en tablet y móvil", () => {
    expect(columnsFor(grid, "tablet", 180)).toBe(3);
    expect(columnsFor(grid, "mobile", 200)).toBe(1);
    expect(columnsFor(grid, "mobile", 100)).toBe(2);
  });

  it("nunca pasa de las del escritorio ni baja de una", () => {
    expect(columnsFor({ columns: 2, gap: 8 }, "tablet", 50)).toBe(2);
    expect(columnsFor(grid, "mobile", 2000)).toBe(1);
  });

  it("las columnas fijadas a mano mandan", () => {
    expect(columnsFor({ ...grid, columnsOn: { mobile: 2 } }, "mobile", 200)).toBe(2);
    expect(columnsFor({ ...grid, columnsOn: { mobile: 2 } }, "tablet", 180)).toBe(3);
    expect(columnsFor({ ...grid, columnsOn: { tablet: 99 } }, "tablet", 200)).toBe(8);
  });

  it("reparte el ancho entre las casillas", () => {
    expect(cellWidth(294, 2, 24)).toBe(127);
    expect(cellWidth(294, 1, 24)).toBe(294);
  });
});
