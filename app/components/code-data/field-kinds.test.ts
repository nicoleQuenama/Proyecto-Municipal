import { describe, expect, it } from "vitest";
import { fieldKind } from "./field-kinds";

describe("fieldKind", () => {
  it.each([
    ["link", "/", "link"], ["href", "x", "link"], ["urlImagen", "x", "link"], ["ruta", "x", "link"],
    ["img", "a.png", "media"], ["foto", "x", "media"], ["src", "x", "media"],
    ["edad", 3, "number"], ["activo", true, "boolean"], ["name", "x", "text"],
  ])("%s → %s", (key, value, kind) => expect(fieldKind(key, value)).toBe(kind));

  it("un valor calculado es de solo lectura", () => expect(fieldKind("name", null)).toBe("readonly"));
  it("el tipo del valor manda sobre el nombre", () => expect(fieldKind("link", 5)).toBe("number"));
});
