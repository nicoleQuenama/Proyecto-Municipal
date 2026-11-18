import { describe, expect, it } from "vitest";
import { anchoredPlacement } from "./anchored-placement";

const placement = { x: 100, y: 50, width: 300 };
const from = { width: 300, height: 200 };

describe("anchoredPlacement", () => {
  it("agarrar el lado izquierdo y ensanchar mueve la posición hacia la izquierda: el lado derecho se queda", () => {
    expect(anchoredPlacement(placement, from, { width: 400, height: 200 }, { left: true, top: false })).toEqual({ x: 0, y: 50, width: 300 });
  });

  it("agarrar el lado izquierdo y achicar mueve la posición hacia la derecha", () => {
    expect(anchoredPlacement(placement, from, { width: 250, height: 200 }, { left: true, top: false }).x).toBe(150);
  });

  it("agarrar el borde de arriba mueve la posición vertical", () => {
    expect(anchoredPlacement(placement, from, { width: 300, height: 260 }, { left: false, top: true }).y).toBe(0);
  });

  it("agarrar el lado derecho o el de abajo no mueve nada", () => {
    expect(anchoredPlacement(placement, from, { width: 500, height: 500 }, { left: false, top: false })).toEqual(placement);
  });

  it("una esquina superior izquierda mueve los dos ejes", () => {
    expect(anchoredPlacement(placement, from, { width: 350, height: 230 }, { left: true, top: true })).toMatchObject({ x: 50, y: 20 });
  });

  it("no se sale por la izquierda ni por arriba de la página", () => {
    expect(anchoredPlacement(placement, from, { width: 900, height: 900 }, { left: true, top: true })).toMatchObject({ x: 0, y: 0 });
  });
});
