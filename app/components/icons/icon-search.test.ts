import { describe, expect, it } from "vitest";
import { ICON_LABELS } from "./icon-labels";
import { ICON_NAMES, ICON_PATHS } from "./icon-set";
import { searchIcons } from "./icon-search";

describe("conjunto de íconos", () => {
  it("tiene unos 70 íconos, todos con trazos y con nombre en español", () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(70);
    for (const name of ICON_NAMES) {
      expect(ICON_PATHS[name].length).toBeGreaterThan(0);
      expect(ICON_LABELS[name]).toBeTruthy();
    }
  });

  it("busca sin importar acentos ni mayúsculas", () => {
    expect(searchIcons("MENÚ")).toContain("menu");
    expect(searchIcons("menu")).toContain("menu");
    expect(searchIcons("cámara")).toEqual(["camera"]);
  });

  it("sin texto devuelve todos, y sin coincidencias ninguno", () => {
    expect(searchIcons("  ")).toHaveLength(ICON_NAMES.length);
    expect(searchIcons("zzzz")).toEqual([]);
  });
});
