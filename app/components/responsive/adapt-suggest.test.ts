import { describe, expect, it } from "vitest";
import { newElement } from "../site/component-templates";
import type { BlockInstance, ComponentDef } from "../site/types";
import { describeSuggestions, looksLikeHeader, suggestAll, suggestFor, type SuggestContext } from "./adapt-suggest";

const link = (id: string, x: number) => newElement("text", id, { x, y: 28, width: 80, height: 24, text: id });
const to = { kind: "external" as const, url: "/", newTab: false };
const header: ComponentDef = {
  id: "h", name: "Cabecera", description: "", category: "sections", width: 900, height: 80, custom: true,
  elements: [newElement("text", "logo", { x: 10, y: 20, width: 100, height: 40, text: "Marca" }), link("a", 300), link("b", 400), link("c", 500)],
  links: { a: to, b: to, c: to },
};
const card: ComponentDef = { ...header, id: "c", name: "Tarjeta", height: 200, elements: [newElement("text", "t", { width: 300, height: 100, text: "Hola" })], links: {} };
const tall: ComponentDef = { ...card, id: "t", width: 300, height: 900 };
const ctx = (copies = 0): SuggestContext => ({ device: "mobile", available: 294, copies: () => copies });
const block = (id: string, componentId: string, extra: Partial<BlockInstance> = {}): BlockInstance => ({ id, componentId, ...extra });

describe("sugerencias del asistente", () => {
  it("reconoce una cabecera por la categoría o por su fila de enlaces", () => {
    expect(looksLikeHeader({ ...card, category: "navigation" })).toBe(true);
    expect(looksLikeHeader(header)).toBe(true);
    expect(looksLikeHeader(card)).toBe(false);
  });

  it("propone menú a una cabecera ancha", () => {
    expect(suggestFor(block("b", "h"), header, ctx())?.strategy).toBe("menu");
  });

  it("propone carrusel a una lista de más de 3 copias, y nada a 3", () => {
    const repeated = block("b", "c", { repeat: { sourceId: "s", path: "x" } });
    expect(suggestFor(repeated, card, ctx(8))?.kind).toBe("carousel");
    expect(suggestFor(repeated, card, ctx(3))).toBeNull();
  });

  it("propone «Ver más» a una sección muy alta", () => {
    const found = suggestFor(block("b", "t"), tall, ctx());
    expect(found?.kind).toBe("more");
    expect(found?.fold).toMatchObject({ kind: "more", maxHeight: 360 });
  });

  it("respeta lo que la persona ya eligió y no toca lo oculto", () => {
    expect(suggestFor(block("b", "h", { adapt: { mobile: "scale" } }), header, ctx())).toBeNull();
    expect(suggestFor(block("b", "h", { hiddenOn: ["mobile"] }), header, ctx())).toBeNull();
  });

  it("resume en una frase", () => {
    const list = suggestAll([block("1", "h"), block("2", "t"), block("3", "c")], [header, tall, card], ctx());
    expect(describeSuggestions(list)).toBe("2 sugerencias: 1 menú, 1 «Ver más»");
    expect(describeSuggestions([])).toContain("Sin sugerencias");
  });
});
