import { describe, expect, it } from "vitest";
import { radiusFor } from "./radius-handles";

const box = { left: 100, top: 50, right: 300, bottom: 150 }; // 200 × 100
const size = { width: 200, height: 100 };

describe("radiusFor", () => {
  it("arrastrar la esquina superior izquierda hacia dentro da el radio por la diagonal", () => {
    expect(radiusFor("nw", { x: 120, y: 70 }, box, 1, size)).toBe(20);
  });

  it("las cuatro esquinas dan el mismo radio con el mismo desplazamiento: se mueven juntas", () => {
    const radii = [
      radiusFor("nw", { x: 120, y: 70 }, box, 1, size),
      radiusFor("ne", { x: 280, y: 70 }, box, 1, size),
      radiusFor("sw", { x: 120, y: 130 }, box, 1, size),
      radiusFor("se", { x: 280, y: 130 }, box, 1, size),
    ];
    expect(new Set(radii)).toEqual(new Set([20]));
  });

  it("tiene en cuenta el zoom", () => {
    expect(radiusFor("nw", { x: 110, y: 60 }, box, 0.5, size)).toBe(20);
  });

  it("nunca baja de 0 ni pasa de la mitad del lado más corto", () => {
    expect(radiusFor("nw", { x: 50, y: 20 }, box, 1, size)).toBe(0);
    expect(radiusFor("nw", { x: 250, y: 140 }, box, 1, size)).toBe(50);
  });
});
