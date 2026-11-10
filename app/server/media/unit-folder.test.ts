import { describe, expect, it } from "vitest";
import { mediaFolder } from "./unit-folder";

describe("mediaFolder", () => {
  it("lo global va a su propia carpeta", () => {
    expect(mediaFolder("o", "p", null)).toBe("/org/o/p/global");
  });

  it("cada unidad tiene la suya, para que el mismo archivo de dos unidades no choque en ImageKit", () => {
    expect(mediaFolder("o", "p", "u1")).toBe("/org/o/p/u1");
    expect(mediaFolder("o", "p", "u2")).not.toBe(mediaFolder("o", "p", "u1"));
  });

  it("siempre cuelga de la carpeta de su organización (lo exige el CHECK de imagekit_path)", () => {
    expect(mediaFolder("org-1", "p", "u1").startsWith("/org/org-1/")).toBe(true);
  });
});
