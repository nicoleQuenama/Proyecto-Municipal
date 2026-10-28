import { describe, expect, it } from "vitest";
import { defaultFluid, fluidFontSize } from "./fluid-text";

describe("texto adaptable", () => {
  it("el tamaño sigue al ancho de la página dentro de sus límites", () => {
    expect(fluidFontSize(48, { min: 28, max: 64 })).toBe("clamp(28px, calc(var(--cms-w, 1024px) * 0.04688), 64px)");
  });

  it("si el mínimo supera al máximo, se ordenan", () => {
    expect(fluidFontSize(20, { min: 40, max: 10 })).toContain("clamp(10px,");
  });

  it("los límites de partida nunca bajan de 10 px", () => {
    expect(defaultFluid(12)).toEqual({ min: 10, max: 18 });
    expect(defaultFluid(48)).toEqual({ min: 24, max: 72 });
  });
});

import { fluidSizeAt } from "./fluid-text";

describe("tamaño según el ancho", () => {
  it("en móvil baja sin pasar del mínimo", () => {
    expect(fluidSizeAt(48, { min: 28, max: 64 }, 375)).toBe(28);
    expect(fluidSizeAt(48, { min: 10, max: 64 }, 375)).toBe(18);
  });

  it("en un ancho grande no pasa del máximo", () => {
    expect(fluidSizeAt(48, { min: 28, max: 64 }, 1920)).toBe(64);
  });
});
