import { describe, expect, it } from "vitest";
import { alphaOf, coversSection, solidPaint } from "./full-bleed";

const style = (backgroundColor: string, extra = {}) => ({ borderTopLeftRadius: "0px", backgroundImage: "none", opacity: "1", backgroundColor, ...extra });

describe("solidPaint", () => {
  it("acepta colores lisos en cualquier notación, también oklch de Tailwind", () => {
    expect(solidPaint(style("rgb(255, 45, 63)"))).toBe("rgb(255, 45, 63)");
    expect(solidPaint(style("oklch(0.637 0.237 25.331)"))).toBe("oklch(0.637 0.237 25.331)");
    expect(solidPaint(style("#d5dbf0"))).toBe("#d5dbf0");
  });

  it("rechaza lo transparente o semitransparente", () => {
    expect(solidPaint(style("rgba(0, 0, 0, 0)"))).toBeNull();
    expect(solidPaint(style("transparent"))).toBeNull();
    expect(solidPaint(style("rgba(255, 0, 0, 0.5)"))).toBeNull();
    expect(solidPaint(style("oklch(0.6 0.2 25 / 50%)"))).toBeNull();
  });

  it("rechaza esquinas redondeadas, degradados, imágenes y piezas con opacidad", () => {
    expect(solidPaint(style("#fff", { borderTopLeftRadius: "12px" }))).toBeNull();
    expect(solidPaint(style("#fff", { backgroundImage: "linear-gradient(red, blue)" }))).toBeNull();
    expect(solidPaint(style("#fff", { opacity: "0.5" }))).toBeNull();
  });
});

describe("alphaOf y coversSection", () => {
  it("lee la opacidad de cada notación", () => {
    expect(alphaOf("rgba(1, 2, 3, 0.25)")).toBe(0.25);
    expect(alphaOf("oklch(0.6 0.2 25 / 40%)")).toBeCloseTo(0.4);
    expect(alphaOf("rgb(1, 2, 3)")).toBe(1);
  });

  it("una pieza cubre la sección si llega casi a todo", () => {
    expect(coversSection({ width: 1024, height: 80 }, { width: 1024, height: 80 })).toBe(true);
    expect(coversSection({ width: 900, height: 80 }, { width: 1024, height: 80 })).toBe(false);
  });
});
