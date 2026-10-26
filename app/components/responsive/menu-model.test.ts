import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import type { BlockInstance, ComponentDef } from "../site/types";
import { defaultMenu, menuButtonFrame, menuSetup, menuSplit, toggleItem } from "./menu-model";
import { panelBackground, panelText } from "./menu-colors";
import { stackLayout } from "./stack-layout";

const logo = newElement("text", "logo", { x: 20, y: 20, width: 100, height: 40, text: "Mi marca" });
const link = (id: string, x: number) => newElement("text", id, { x, y: 28, width: 80, height: 24, text: id });
const header: ComponentDef = {
  id: "h", name: "Cabecera", description: "", category: "navigation", width: 900, height: 80, custom: true,
  elements: [logo, link("inicio", 300), link("servicios", 400), link("contacto", 500)],
  links: { inicio: { kind: "external", url: "/a", newTab: false }, servicios: { kind: "external", url: "/b", newTab: false }, contacto: { kind: "external", url: "/c", newTab: false } },
};
const block = (extra: Partial<BlockInstance> = {}): BlockInstance => ({ id: "b", componentId: "h", adapt: { mobile: "menu" }, ...extra });

describe("menú responsive", () => {
  it("por defecto mete dentro los textos con enlace y deja la marca", () => {
    const config = defaultMenu(header);
    expect(config.itemIds).toEqual(["inicio", "servicios", "contacto"]);
    expect(config.panel).toBe("right");
  });

  it("separa lo que va al menú de lo que queda en la cabecera", () => {
    const { items, rest } = menuSplit(header, defaultMenu(header));
    expect(items.map((e) => e.id)).toEqual(["inicio", "servicios", "contacto"]);
    expect(rest.elements.map((e) => e.id)).toEqual(["logo"]);
  });

  it("la cabecera restante se apila al ancho del móvil", () => {
    const { rest } = menuSplit(header, defaultMenu(header));
    expect(stackLayout(rest, 300).width).toBe(300);
  });

  it("solo hay menú en el dispositivo donde se eligió", () => {
    expect(menuSetup(header, block(), "mobile")?.items).toHaveLength(3);
    expect(menuSetup(header, block(), "tablet")).toBeNull();
    expect(menuSetup(header, block(), "desktop")).toBeNull();
    expect(menuSetup(header, block({ responsive: { mobile: { size: { width: 1, height: 1 }, frames: {} } } }), "mobile")).toBeNull();
  });

  it("respeta los elementos que la persona eligió", () => {
    const setup = menuSetup(header, block({ menu: { ...defaultMenu(header), itemIds: ["contacto"] } }), "mobile");
    expect(setup?.items.map((e) => e.id)).toEqual(["contacto"]);
  });

  it("pone el botón a la derecha, centrado con la fila de arriba", () => {
    const frame = menuButtonFrame({ ...header, elements: [logo] }, defaultMenu(header));
    expect(frame.size).toBe(28 + 24);
    expect(frame.top).toBe(Math.round(40 - frame.size / 2));
  });

  it("marca y desmarca elementos", () => {
    const config = defaultMenu(header);
    expect(toggleItem(config, "inicio", false)).toEqual(["servicios", "contacto"]);
    expect(toggleItem(config, "logo", true)).toContain("logo");
  });
});

describe("colores del panel", () => {
  const dark = { ...header, elements: [newElement("rect", "fondo", { width: 900, height: 80, fill: "#0f172a" }), ...header.elements] };

  it("usa el fondo elegido, el de la sección o el rectángulo que la cubre", () => {
    const config = defaultMenu(header);
    expect(panelBackground(dark, config)).toBe("#0f172a");
    expect(panelBackground(dark, config, "#111111")).toBe("#111111");
    expect(panelBackground(dark, { ...config, panelBackground: "#ff0000" }, "#111111")).toBe("#ff0000");
    expect(panelBackground(header, config)).toBe("#ffffff");
  });

  it("cambia el texto que no se lee y respeta el que sí", () => {
    expect(panelText("#ffffff", "#ffffff")).toBe("#0f172a");
    expect(panelText("#0f172a", "#0f172a")).toBe("#ffffff");
    expect(panelText("#0f172a", "#ffffff")).toBe("#ffffff");
    expect(panelText("#ffffff", "#ffffff", "#ff0000")).toBe("#ff0000");
    expect(panelText("var(--x)", "#ffffff")).toBe("#ffffff");
  });
});
