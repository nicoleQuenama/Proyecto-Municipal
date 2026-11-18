import { describe, expect, it } from "vitest";
import { overlayPosition } from "./selection-overlay";

const editor = { width: 800, height: 500 };

describe("overlayPosition", () => {
  it("se sobrepone a la derecha, a la altura de la primera línea visible de la selección", () => {
    expect(overlayPosition({ lineTop: 120 }, editor)).toEqual({ top: 120, left: 800 - 288 - 24 });
  });

  it("si la selección empieza arriba de lo visible (Ctrl+A con scroll), queda junto al borde superior", () => {
    expect(overlayPosition({ lineTop: -300 }, editor).top).toBe(8);
  });

  it("nunca se sale por abajo: deja espacio para el panel", () => {
    expect(overlayPosition({ lineTop: 495 }, editor).top).toBe(500 - 120);
  });

  it("en un editor angosto no se sale por la izquierda", () => {
    expect(overlayPosition({ lineTop: 50 }, { width: 200, height: 500 }).left).toBe(8);
  });
});
