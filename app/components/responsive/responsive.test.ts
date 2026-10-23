import { describe, expect, it } from "vitest";
import type { BlockInstance, CanvasElement, ComponentDef } from "../site/types";
import { adaptToDevice } from "./adapt";
import { autoLayout } from "./auto-layout";
import { availableWidth } from "./devices";
import { applyLayout, patchSize, seedLayout } from "./manual-layout";

const element = (over: Partial<CanvasElement>): CanvasElement => ({
  id: "a", kind: "text", role: "none", x: 100, y: 40, width: 400, height: 60, fill: "#fff", radius: 8,
  text: "Hola", fontSize: 30, color: "#000", bold: false, align: "left", fontFamily: "", src: "", ...over,
});

const def: ComponentDef = {
  id: "c", name: "Tarjeta", description: "", category: "hero" as ComponentDef["category"],
  width: 800, height: 200, elements: [element({})], links: {}, custom: true,
};
const block = (responsive?: BlockInstance["responsive"]): BlockInstance => ({ id: "b", componentId: "c", responsive });

describe("autoLayout", () => {
  it("no toca una sección que ya cabe", () => {
    expect(autoLayout(def, 900)).toBe(def);
  });

  it("reduce en proporción tamaño, posiciones y tipografía", () => {
    const out = autoLayout(def, 400);
    expect(out.width).toBe(400);
    expect(out.height).toBe(100);
    expect(out.elements[0]).toMatchObject({ x: 50, y: 20, width: 200, height: 30, fontSize: 15, radius: 4 });
  });

  it("no baja la letra del mínimo legible", () => {
    expect(autoLayout(def, 80).elements[0].fontSize).toBe(11);
  });
});

describe("adaptToDevice", () => {
  it("deja el escritorio como está", () => {
    expect(adaptToDevice(def, block(), "desktop", false)).toBe(def);
  });

  it("adapta solo en automático y respeta las secciones en flujo", () => {
    expect(adaptToDevice(def, block(), "mobile", false).width).toBe(availableWidth("mobile"));
    expect(adaptToDevice(def, block(), "mobile", true)).toBe(def);
  });

  it("usa el diseño propio cuando existe", () => {
    const layout = patchSize(seedLayout(autoLayout(def, 300)), { height: 500 });
    layout.frames.a = { x: 5, y: 6, width: 7, height: 8 };
    const out = adaptToDevice(def, block({ mobile: layout }), "mobile", false);
    expect(out).toMatchObject({ width: 300, height: 500 });
    expect(out.elements[0]).toMatchObject({ x: 5, y: 6, width: 7, height: 8 });
    expect(applyLayout(def, layout).elements[0].parentId).toBeUndefined();
  });
});
