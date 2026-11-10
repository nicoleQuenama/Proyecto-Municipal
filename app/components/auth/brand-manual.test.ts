import { describe, expect, it } from "vitest";
import {
  BRAND_FONT_OPTIONS,
  DEFAULT_BRAND_COLORS,
  getBrandColors,
  getBrandFonts,
  isRestrictedByBrand,
} from "./brand-manual";
import type { User } from "./types";
import type { Variable } from "../styles/types";

describe("brand-manual policy and helpers", () => {
  describe("isRestrictedByBrand", () => {
    it("returns false for null or undefined user", () => {
      expect(isRestrictedByBrand(null)).toBe(false);
      expect(isRestrictedByBrand(undefined)).toBe(false);
    });

    it("returns true for designer role", () => {
      const designer: User = {
        id: "d1",
        username: "disenador",
        name: "Diseñador Gráfico",
        email: "designer@muni.gob",
        role: "designer",
        access: { scope: null, denied: [] },
      };
      expect(isRestrictedByBrand(designer)).toBe(true);
    });

    it("returns false for superadmin or dev with full access", () => {
      const admin: User = {
        id: "a1",
        username: "admin",
        name: "Super Administrador",
        email: "admin@muni.gob",
        role: "superadmin",
        access: { scope: null, denied: [] },
      };
      const dev: User = {
        id: "dev1",
        username: "dev",
        name: "Developer",
        email: "dev@muni.gob",
        role: "dev",
        access: { scope: null, denied: [] },
      };
      expect(isRestrictedByBrand(admin)).toBe(false);
      expect(isRestrictedByBrand(dev)).toBe(false);
    });

    it("returns true for any user with editStyles denied", () => {
      const devWithoutStyles: User = {
        id: "dev2",
        username: "junior-dev",
        name: "Junior Dev",
        email: "junior@muni.gob",
        role: "dev",
        access: { scope: null, denied: ["editStyles"] },
      };
      expect(isRestrictedByBrand(devWithoutStyles)).toBe(true);
    });
  });

  describe("getBrandColors", () => {
    it("returns DEFAULT_BRAND_COLORS if no variables provided or empty", () => {
      expect(getBrandColors()).toEqual(DEFAULT_BRAND_COLORS);
      expect(getBrandColors([])).toEqual(DEFAULT_BRAND_COLORS);
    });

    it("extracts color variables and ensures contrast defaults", () => {
      const mockVars: Variable[] = [
        { id: "v1", name: "--azul-institucional", value: "#0044aa", kind: "color", scope: { kind: "global" } },
        { id: "v2", name: "--verde-alcaldia", value: "#00aa44", kind: "color", scope: { kind: "global" } },
        { id: "v3", name: "--tamano-base", value: "16px", kind: "size", scope: { kind: "global" } },
      ];

      const colors = getBrandColors(mockVars);
      expect(colors.some((c) => c.value === "#0044aa")).toBe(true);
      expect(colors.some((c) => c.value === "#00aa44")).toBe(true);
      // Ensures blanco (#ffffff) and texto-oscuro (#171717) are present
      expect(colors.some((c) => c.value === "#ffffff")).toBe(true);
      expect(colors.some((c) => c.value === "#171717")).toBe(true);
      // Ignores non-color variables
      expect(colors.some((c) => c.name === "--tamano-base")).toBe(false);
    });

    it("does not duplicate colors if white/black already present", () => {
      const mockVars: Variable[] = [
        { id: "v1", name: "--blanco", value: "#ffffff", kind: "color", scope: { kind: "global" } },
        { id: "v2", name: "--negro", value: "#171717", kind: "color", scope: { kind: "global" } },
        { id: "v3", name: "--primario", value: "#123456", kind: "color", scope: { kind: "global" } },
      ];
      const colors = getBrandColors(mockVars);
      const whiteOccurrences = colors.filter((c) => c.value === "#ffffff");
      expect(whiteOccurrences.length).toBe(1);
    });
  });

  describe("getBrandFonts", () => {
    it("returns BRAND_FONT_OPTIONS when no font variables exist", () => {
      expect(getBrandFonts()).toEqual(BRAND_FONT_OPTIONS);
      expect(getBrandFonts([])).toEqual(BRAND_FONT_OPTIONS);
    });

    it("returns variables of kind font when defined", () => {
      const mockVars: Variable[] = [
        { id: "f1", name: "Fuente Titular", value: "Montserrat, sans-serif", kind: "font", scope: { kind: "global" } },
        { id: "c1", name: "Color", value: "#123456", kind: "color", scope: { kind: "global" } },
      ];
      const fonts = getBrandFonts(mockVars);
      expect(fonts.length).toBe(1);
      expect(fonts[0].value).toBe("Montserrat, sans-serif");
      expect(fonts[0].label).toContain("Fuente Titular");
    });
  });
});
