import { describe, expect, it } from "vitest";
import { BOTTOM_GAP, fitHeight, savedGap } from "./auto-height";
import { newElement } from "../site/component-templates";

const el = (id: string, x: number, y: number, width: number, height: number) => newElement("rect", id, { x, y, width, height });

describe("fitHeight", () => {
  const size = { width: 1000, height: 600 };

  it("se ajusta a lo más bajo del contenido, con aire", () => {
    expect(fitHeight([el("a", 0, 0, 100, 50), el("b", 0, 100, 100, 80)], size).height).toBe(180 + BOTTOM_GAP);
  });

  it("el fondo no cuenta como contenido y se estira con la sección", () => {
    const result = fitHeight([el("bg", 0, 0, 1000, 600), el("a", 10, 10, 100, 40)], size);
    expect(result.height).toBe(50 + BOTTOM_GAP);
    expect(result.elements.find((e) => e.id === "bg")).toMatchObject({ y: 0, height: 50 + BOTTOM_GAP });
  });

  it("con el aire que ya tenía, un diseño sin cambios no cambia de alto", () => {
    const header = { width: 1024, height: 72, elements: [el("bg", 0, 0, 1024, 72), el("logo", 21, 16, 40, 40), el("line", 0, 71, 1024, 1)] };
    expect(savedGap(header)).toBe(0);
    expect(fitHeight(header.elements, header, savedGap(header)).height).toBe(72);
  });

  it("quitar lo último acorta la sección conservando su aire", () => {
    const full = { width: 1000, height: 330, elements: [el("bg", 0, 0, 1000, 330), el("a", 10, 10, 100, 40), el("b", 10, 280, 100, 20)] };
    const gap = savedGap(full);
    expect(gap).toBe(30);
    expect(fitHeight(full.elements.filter((e) => e.id !== "b"), full, gap).height).toBe(50 + 30);
  });

  it("sin contenido no cambia nada", () => {
    expect(fitHeight([el("bg", 0, 0, 1000, 600)], size).height).toBe(600);
  });
});
