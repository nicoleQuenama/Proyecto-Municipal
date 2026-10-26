import { describe, expect, it } from "vitest";
import type { CanvasElement, ComponentDef } from "../site/types";
import { stackLayout } from "./stack-layout";

const el = (id: string, over: Partial<CanvasElement>): CanvasElement => ({
  id, kind: "text", role: "none", x: 0, y: 0, width: 100, height: 40, fill: "#fff", radius: 0,
  text: "", fontSize: 16, color: "#000", bold: false, align: "left", fontFamily: "", src: "", ...over,
});

const section = (width: number, height: number, elements: CanvasElement[]): ComponentDef => ({
  id: "c", name: "S", description: "", category: "hero" as ComponentDef["category"], width, height, elements, links: {}, custom: true,
});

const byId = (def: ComponentDef, id: string) => def.elements.find((e) => e.id === id)!;
const W = 300;

describe("stackLayout", () => {
  it("no toca una sección que ya cabe", () => {
    const def = section(250, 100, [el("a", {}), el("b", { y: 50 })]);
    expect(stackLayout(def, W)).toBe(def);
  });

  it("hero: texto a la izquierda e imagen a la derecha quedan uno bajo otro, de izquierda a derecha", () => {
    const def = section(1000, 400, [
      el("title", { x: 40, y: 60, width: 400, height: 60, text: "Titular", fontSize: 40 }),
      el("sub", { x: 40, y: 140, width: 400, height: 40, text: "Texto" }),
      el("img", { kind: "image", x: 520, y: 40, width: 440, height: 320 }),
    ]);
    const out = stackLayout(def, W);
    const [title, sub, img] = ["title", "sub", "img"].map((id) => byId(out, id));
    expect(out.width).toBe(W);
    for (const e of [title, sub, img]) expect(e.x + e.width).toBeLessThanOrEqual(W);
    expect(sub.y).toBeGreaterThanOrEqual(title.y + title.height);
    expect(img.y).toBeGreaterThanOrEqual(sub.y + sub.height);
    // La imagen conserva su proporción 440:320.
    expect(img.width / img.height).toBeCloseTo(440 / 320, 1);
    expect(out.height).toBeGreaterThanOrEqual(img.y + img.height);
  });

  it("una fila de 4 botones se vuelve una columna a todo el ancho", () => {
    const buttons = [0, 1, 2, 3].map((i) => el(`b${i}`, { kind: "rect", x: 20 + i * 140, y: 20, width: 120, height: 44, text: "Ir" }));
    const out = stackLayout(section(600, 84, buttons), W);
    const placed = buttons.map((b) => byId(out, b.id));
    placed.forEach((b, i) => {
      expect(b.width).toBe(W);
      expect(b.x).toBe(0);
      if (i > 0) expect(b.y).toBeGreaterThanOrEqual(placed[i - 1].y + placed[i - 1].height);
    });
  });

  it("conserva el fondo estirado detrás y mete el contenido dentro de él", () => {
    const def = section(800, 300, [
      el("bg", { kind: "rect", width: 800, height: 300 }),
      el("img", { kind: "image", x: 500, y: 40, width: 260, height: 220 }),
      el("t1", { x: 40, y: 60, width: 400, height: 50, text: "Hola" }),
      el("t2", { x: 40, y: 140, width: 400, height: 50, text: "Mundo" }),
    ]);
    const out = stackLayout(def, W);
    const bg = byId(out, "bg");
    expect(out.elements[0].id).toBe("bg");
    expect(bg).toMatchObject({ x: 0, y: 0, width: W, height: out.height });
    for (const id of ["img", "t1", "t2"]) {
      const e = byId(out, id);
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x + e.width).toBeLessThanOrEqual(W);
      expect(e.y + e.height).toBeLessThanOrEqual(out.height);
    }
  });

  it("el texto sobre un panel se queda dentro del panel", () => {
    const def = section(700, 400, [
      el("title", { x: 20, y: 10, width: 400, height: 40, text: "Arriba" }),
      el("panel", { kind: "rect", x: 20, y: 80, width: 660, height: 200 }),
      el("in1", { x: 50, y: 100, width: 300, height: 40, text: "Dentro 1" }),
      el("in2", { x: 50, y: 160, width: 300, height: 40, text: "Dentro 2" }),
      el("after", { x: 20, y: 320, width: 300, height: 40, text: "Abajo" }),
    ]);
    const out = stackLayout(def, W);
    const panel = byId(out, "panel");
    for (const id of ["in1", "in2"]) {
      const e = byId(out, id);
      expect(e.x).toBeGreaterThanOrEqual(panel.x);
      expect(e.x + e.width).toBeLessThanOrEqual(panel.x + panel.width);
      expect(e.y).toBeGreaterThanOrEqual(panel.y);
      expect(e.y + e.height).toBeLessThanOrEqual(panel.y + panel.height);
    }
    expect(byId(out, "after").y).toBeGreaterThanOrEqual(panel.y + panel.height);
    expect(byId(out, "title").y).toBeLessThan(panel.y);
  });

  it("un texto largo crece en alto al estrecharse y las letras grandes se reducen", () => {
    const long = "palabra ".repeat(40);
    const out = stackLayout(section(900, 200, [
      el("big", { x: 20, y: 20, width: 800, height: 60, text: "Titular enorme", fontSize: 64 }),
      el("long", { x: 20, y: 100, width: 800, height: 60, text: long }),
    ]), W);
    expect(byId(out, "long").height).toBeGreaterThan(60);
    expect(byId(out, "big").fontSize).toBeLessThan(64);
    expect(byId(out, "big").fontSize).toBeGreaterThanOrEqual(24);
  });

  it("no cuenta los elementos ocultos", () => {
    const def = section(600, 200, [el("a", { x: 10, y: 10 }), el("gone", { x: 10, y: 80, hidden: true }), el("b", { x: 300, y: 10 })]);
    const out = stackLayout(def, W);
    expect(byId(out, "gone")).toMatchObject({ x: 10, y: 80 });
    expect(out.height).toBeLessThan(200);
  });
});
