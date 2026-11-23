import { describe, expect, it } from "vitest";
import type { CanvasElement, ComponentDef } from "../site/types";
import { fitDesktopWidth } from "./desktop-fit";

const element: CanvasElement = {
  id: "a", kind: "text", role: "none", x: 100, y: 40, width: 400, height: 60, fill: "#fff", radius: 8,
  text: "Hola", fontSize: 30, color: "#000", bold: false, align: "left", fontFamily: "", src: "",
};

const def: ComponentDef = {
  id: "c", name: "Sección", description: "", category: "sections",
  width: 1024, height: 200, elements: [element], links: {}, custom: true,
};

const input = { flow: false, locked: false, placed: false };

describe("fitDesktopWidth", () => {
  it("escala la sección de escritorio al ancho que deja el margen", () => {
    const out = fitDesktopWidth(def, "desktop", 864, input);
    expect(out.width).toBe(864);
    expect(out.elements[0]).toMatchObject({ x: 84, width: 338 });
  });

  it("no toca tablet ni móvil", () => {
    expect(fitDesktopWidth(def, "tablet", 500, input)).toBe(def);
    expect(fitDesktopWidth(def, "mobile", 300, input)).toBe(def);
  });

  it("respeta secciones en flujo, cabeceras/pies y colocadas", () => {
    expect(fitDesktopWidth(def, "desktop", 500, { ...input, flow: true })).toBe(def);
    expect(fitDesktopWidth(def, "desktop", 500, { ...input, locked: true })).toBe(def);
    expect(fitDesktopWidth(def, "desktop", 500, { ...input, placed: true })).toBe(def);
  });

  it("no agranda una sección que ya cabe", () => {
    expect(fitDesktopWidth(def, "desktop", 1200, input)).toBe(def);
  });
});
