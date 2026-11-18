import { describe, expect, it } from "vitest";
import { cornerOf, edgesIn, innerSize } from "./page-geometry";

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, right: left + width, bottom: top + height, width, height });
/** Una página con borde: `left`/`top` es su borde exterior; `border` lo que mide el borde. */
const page = (left: number, top: number, border: number, scale = 1) =>
  ({ getBoundingClientRect: () => rect(left, top, 1000 * scale, 800 * scale), clientLeft: border, clientTop: border, clientWidth: 1000 - 2 * border, clientHeight: 800 - 2 * border }) as unknown as HTMLElement;
const item = (left: number, top: number, width: number, height: number) => ({ getBoundingClientRect: () => rect(left, top, width, height) }) as unknown as HTMLElement;

describe("la posición se mide desde el interior del borde de la página (donde CSS coloca lo absoluto)", () => {
  it("un elemento pegado al interior del borde está en 0, 0", () => {
    expect(edgesIn(page(100, 50, 3), item(103, 53, 200, 100), 1)).toMatchObject({ left: 0, top: 0, right: 200, bottom: 100 });
  });

  it("con zoom el borde también se escala", () => {
    // Al 50 % un borde de 4 mide 2 píxeles de pantalla.
    expect(edgesIn(page(0, 0, 4, 0.5), item(2, 2, 100, 50), 0.5)).toMatchObject({ left: 0, top: 0 });
  });

  it("la esquina del elemento bajo el puntero usa el mismo origen", () => {
    expect(cornerOf(page(100, 50, 3), { clientX: 213, clientY: 153 }, { x: 10, y: 20 }, 1)).toEqual({ x: 100, y: 80 });
  });

  it("el tamaño interior descuenta el borde", () => {
    expect(innerSize(page(0, 0, 3))).toEqual({ width: 994, height: 794 });
  });
});
