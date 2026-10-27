import { describe, expect, it } from "vitest";
import { pointInPage, scrollNeeded } from "./demo-cursor";

describe("cursor de la demostración", () => {
  it("el centro de una zona cae según el zoom y la esquina de la página", () => {
    const page = { left: 100, top: 200, width: 256, designWidth: 1024 };
    expect(pointInPage(page, { x: 0, y: 0, width: 1024, height: 400 })).toEqual({ x: 228, y: 250 });
  });

  it("solo se desplaza el lienzo si el punto no se ve con holgura", () => {
    const view = { top: 100, bottom: 500 };
    expect(scrollNeeded(300, view)).toBe(0);
    expect(scrollNeeded(480, view)).toBe(180);
    expect(scrollNeeded(110, view)).toBe(-190);
  });
});
