import { describe, expect, it } from "vitest";
import { parseCode } from "../../server/site/code-ast.ts";
import {
  EDIFICIO_MUNICIPAL_HTML,
  EDIFICIO_MUNICIPAL_CSS,
  EDIFICIO_MUNICIPAL_TS,
  ORGANIGRAMA_MUNICIPAL_HTML,
  ORGANIGRAMA_MUNICIPAL_CSS,
  ORGANIGRAMA_MUNICIPAL_TS,
  getEdificioMunicipalCode,
  getOrganigramaMunicipalCode,
} from "./gamc-custom-blocks.ts";

describe("GAMC Custom Blocks", () => {
  describe("Edificio Municipal Block", () => {
    it("posee código HTML válido parseable por parse5", () => {
      const res = parseCode("html", EDIFICIO_MUNICIPAL_HTML);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("parse5");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("posee código CSS válido parseable por postcss", () => {
      const res = parseCode("css", EDIFICIO_MUNICIPAL_CSS);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("postcss");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("posee código TypeScript válido parseable por babel", () => {
      const res = parseCode("typescript", EDIFICIO_MUNICIPAL_TS);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("babel");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("devuelve objeto CodeSource completo con exactamente 13 pisos", () => {
      const code = getEdificioMunicipalCode();
      expect(code.tailwind).toBe(true);
      expect(code.html).toContain("edificio-gamc");
      expect(code.css).toContain("--gamc-celeste");
      expect(code.js).toContain("PISOS");
      expect(code.html).toContain("Pisos del Edificio (13)");
      expect(code.js).toContain("piso: 13");
      expect(code.js).not.toContain("piso: 14");
      expect(code.js).not.toContain("piso: 23");
    });
  });

  describe("Organigrama Institucional Block", () => {
    it("posee código HTML válido parseable por parse5", () => {
      const res = parseCode("html", ORGANIGRAMA_MUNICIPAL_HTML);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("parse5");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("posee código CSS válido parseable por postcss", () => {
      const res = parseCode("css", ORGANIGRAMA_MUNICIPAL_CSS);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("postcss");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("posee código TypeScript válido parseable por babel", () => {
      const res = parseCode("typescript", ORGANIGRAMA_MUNICIPAL_TS);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.code.parser).toBe("babel");
        expect(res.code.ast).toBeDefined();
      }
    });

    it("devuelve estructura limpia por niveles sin coronas ni esquemas artificiales", () => {
      const code = getOrganigramaMunicipalCode();
      expect(code.tailwind).toBe(true);
      expect(code.html).toContain("org-gamc");
      expect(code.js).not.toContain("corona");
      expect(code.js).toContain("DEPENDENCIAS");
      expect(code.js).toContain("despacho-alcalde");
      expect(code.js).toContain("sec-finanzas");
    });
  });
});
