import { describe, expect, it } from "vitest";
import { categoryChoices, categoryLabel, normalizeCategory, styleTarget, usedCategories } from "./categories";

const defs = (...categories: string[]) => categories.map((category) => ({ category }));

describe("categorías de componentes", () => {
  it("solo se listan las que tienen componentes, las conocidas primero", () => {
    expect(usedCategories(defs("cards", "Mis tarjetas", "navigation", "cards"))).toEqual(["navigation", "cards", "Mis tarjetas"]);
    expect(usedCategories([])).toEqual([]);
  });

  it("las propias siguen las reglas de «Secciones» y se muestran tal cual", () => {
    expect(styleTarget("Mis tarjetas")).toBe("sections");
    expect(styleTarget("hero")).toBe("hero");
    expect(categoryLabel("Mis tarjetas")).toBe("Mis tarjetas");
    expect(categoryLabel("hero")).toBe("Hero / CTA");
  });

  it("al crear se ofrecen las 5 conocidas, las propias y la que se edita", () => {
    expect(categoryChoices(defs("Mías"), "sections")).toEqual(["navigation", "sections", "cards", "buttons", "hero", "Mías"]);
    expect(categoryChoices([], "Nueva")).toContain("Nueva");
  });

  it("normaliza el nombre", () => {
    expect(normalizeCategory("  Mis   cosas  ")).toBe("Mis cosas");
  });
});
