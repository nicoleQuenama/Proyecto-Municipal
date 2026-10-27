import { describe, expect, it } from "vitest";
import { PLACE_LABELS, PLACE_STYLES, TONE_LABELS } from "./notify";

describe("avisos", () => {
  it("cada posición tiene su etiqueta y su estilo", () => {
    expect(Object.keys(PLACE_STYLES).sort()).toEqual(Object.keys(PLACE_LABELS).sort());
  });

  it("hay cuatro tonos", () => {
    expect(Object.keys(TONE_LABELS)).toHaveLength(4);
  });
});
