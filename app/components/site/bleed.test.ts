import { describe, expect, it } from "vitest";
import { bleedsToEdges } from "./bleed";

const base = { fullPage: false, placed: false, stretches: false, autoFill: false, isHeaderOrFooter: false };

describe("bleedsToEdges", () => {
  it("en el lienzo, la barra de arriba y el pie llegan a los costados de la hoja, como en «Probar»", () => {
    expect(bleedsToEdges({ ...base, isHeaderOrFooter: true })).toBe(true);
  });

  it("en el lienzo, una sección marcada «todo el ancho» también llega a los costados", () => {
    expect(bleedsToEdges({ ...base, stretches: true })).toBe(true);
  });

  it("una sección normal se queda dentro de los márgenes", () => {
    expect(bleedsToEdges(base)).toBe(false);
  });

  it("en «Probar» llegan a los costados lo marcado «todo el ancho» y lo pintado de borde a borde (como antes)", () => {
    expect(bleedsToEdges({ ...base, fullPage: true, stretches: true })).toBe(true);
    expect(bleedsToEdges({ ...base, fullPage: true, autoFill: true })).toBe(true);
    expect(bleedsToEdges({ ...base, fullPage: true })).toBe(false);
  });

  it("en «Probar» el encabezado y el pie también llegan a los costados", () => {
    expect(bleedsToEdges({ ...base, fullPage: true, isHeaderOrFooter: true })).toBe(true);
  });

  it("lo colocado con posición libre nunca se estira", () => {
    expect(bleedsToEdges({ ...base, placed: true, isHeaderOrFooter: true, stretches: true })).toBe(false);
  });

  it("en el lienzo, una sección diseñada a todo el ancho del lienzo (>= 1000px) llega a los costados para no desbordar", () => {
    expect(bleedsToEdges({ ...base, defWidth: 1024 })).toBe(true);
    expect(bleedsToEdges({ ...base, defWidth: 800 })).toBe(false);
    expect(bleedsToEdges({ ...base, defWidth: 1024, hasExplicitContentSpan: true })).toBe(false);
  });
});
