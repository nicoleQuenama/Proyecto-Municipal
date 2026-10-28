import { describe, expect, it } from "vitest";
import { shouldFinishLoading } from "./page-readiness";

describe("fin de la pantalla de carga", () => {
  it("espera al mínimo aunque la página ya esté lista", () => {
    expect(shouldFinishLoading(500, 2, true)).toBe(false);
  });

  it("pasado el mínimo, se quita cuando la página está lista", () => {
    expect(shouldFinishLoading(2100, 2, true)).toBe(true);
  });

  it("si la página sigue cargando, se queda", () => {
    expect(shouldFinishLoading(6000, 2, false)).toBe(false);
  });

  it("no espera para siempre", () => {
    expect(shouldFinishLoading(15000, 2, false)).toBe(true);
  });
});
