import { describe, expect, it } from "vitest";
import { placeBeside } from "./place-beside";

const button = { left: 400, right: 440, top: 700, bottom: 740 };
const view = { width: 1000, height: 800 };

describe("placeBeside", () => {
  it("arriba: el menú crece hacia arriba desde el borde superior del botón", () => {
    const style = placeBeside(button, "top", view);
    expect(style.bottom).toBe(800 - 700 + 12);
    expect(style.left).toBe(420);
  });

  it("abajo a la derecha: alineado al borde derecho del botón", () => {
    const style = placeBeside(button, "bottom-end", view);
    expect(style.right).toBe(560);
    expect(style.top).toBe(748);
  });

  it("nunca deja menos de un mínimo de altura", () => {
    expect(placeBeside(button, "bottom", view).maxHeight).toBeGreaterThanOrEqual(120);
  });
});
