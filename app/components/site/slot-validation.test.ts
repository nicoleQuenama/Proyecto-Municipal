import { describe, expect, it } from "vitest";
import {
  canInsertComponent,
  canInsertElement,
  filterAllowedComponents,
  getContainerSlotRule,
} from "./slot-validation";
import type { ComponentDef } from "./types";

const makeDef = (id: string, category: string, overrides: Partial<ComponentDef> = {}): ComponentDef => ({
  id,
  name: id,
  description: "",
  category,
  width: 320,
  height: 200,
  elements: [],
  links: {},
  custom: false,
  ...overrides,
});

describe("validación de slots y compatibilidad de tipos (Bento / Columnas vs Componentes)", () => {
  const ctaButtons = makeDef("cta-buttons", "buttons");
  const bentoGrid = makeDef("bento-section", "sections", {
    styles: { section: { classes: "grid bento auto-rows-[160px]", css: "" } },
  });
  const cardService = makeDef("card-service", "cards");
  const heroBanner = makeDef("hero-banner", "hero");
  const normalButtons = makeDef("btn-group", "buttons");

  it("reconoce las reglas para Set de Botones CTA", () => {
    const rule = getContainerSlotRule(ctaButtons);
    expect(rule).not.toBeNull();
    expect(rule?.allowedCategories).toContain("buttons");
  });

  it("bloquea insertar una Card dentro de un Set de Botones CTA", () => {
    const result = canInsertComponent(ctaButtons, cardService);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("solo acepta elementos de tipo botón o enlace");
  });

  it("bloquea insertar un Banner dentro de un Set de Botones CTA", () => {
    const result = canInsertComponent(ctaButtons, heroBanner);
    expect(result.allowed).toBe(false);
  });

  it("permite insertar un componente de botones dentro de Set de Botones", () => {
    const result = canInsertComponent(ctaButtons, normalButtons);
    expect(result.allowed).toBe(true);
  });

  it("valida elementos directos: permite role='button' y rechaza roles incompatibles", () => {
    expect(canInsertElement(ctaButtons, { kind: "rect", role: "button" }).allowed).toBe(true);
    expect(canInsertElement(ctaButtons, { kind: "text", role: "link" }).allowed).toBe(true);
  });

  it("Bento grid configurado para cards solo acepta categorías cards", () => {
    expect(canInsertComponent(bentoGrid, cardService).allowed).toBe(true);
    expect(canInsertComponent(bentoGrid, ctaButtons).allowed).toBe(false);
  });

  it("filtra automáticamente la lista de componentes disponibles", () => {
    const all = [ctaButtons, cardService, heroBanner, normalButtons];
    const forButtons = filterAllowedComponents(all, ctaButtons);
    expect(forButtons.map((c) => c.id)).toEqual(["cta-buttons", "btn-group"]);
    expect(forButtons.some((c) => c.category === "cards")).toBe(false);

    const forBento = filterAllowedComponents(all, bentoGrid);
    expect(forBento.map((c) => c.id)).toContain("card-service");
    expect(forBento.some((c) => c.id === "cta-buttons")).toBe(false);
  });
});
