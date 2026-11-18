import { describe, expect, it } from "vitest";
import { adoptExternal } from "./external-change";

describe("adoptExternal", () => {
  it("si lo guardado en el sitio es lo que el editor ya guardó, no hay cambio externo", () => {
    expect(adoptExternal("a", "a")).toBeNull();
  });
  it("si el sitio cambió por otro lado (modal, deshacer), el editor adopta ese texto", () => {
    expect(adoptExternal("nuevo", "viejo")).toBe("nuevo");
  });
});
