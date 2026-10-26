import { describe, expect, it } from "vitest";
import { DEFAULT_MODAL_OPTIONS, overlayStyle, panelStyle, resolveModalOptions } from "./modal-options";

describe("resolveModalOptions", () => {
  it("completa lo que falta con los valores por defecto", () => {
    expect(resolveModalOptions()).toEqual(DEFAULT_MODAL_OPTIONS);
    expect(resolveModalOptions({ size: "large" })).toEqual({ ...DEFAULT_MODAL_OPTIONS, size: "large" });
  });
});

describe("panelStyle", () => {
  it("en el centro limita el ancho y redondea las esquinas", () => {
    const style = panelStyle(DEFAULT_MODAL_OPTIONS);
    expect(style.width).toBe("640px");
    expect(style.borderRadius).toBe(12);
    expect(style.animationName).toBe("modal-fade");
  });

  it("un panel lateral ocupa todo el alto", () => {
    const style = panelStyle({ ...DEFAULT_MODAL_OPTIONS, position: "right", size: "small" });
    expect(style).toMatchObject({ width: "420px", height: "100vh", borderRadius: 0 });
  });

  it("el panel de abajo ocupa todo el ancho y la pantalla completa ocupa todo", () => {
    expect(panelStyle({ ...DEFAULT_MODAL_OPTIONS, position: "bottom" })).toMatchObject({ width: "100vw", height: "55vh" });
    expect(panelStyle({ ...DEFAULT_MODAL_OPTIONS, size: "full" })).toMatchObject({ width: "100vw", height: "100vh" });
  });
});

describe("overlayStyle", () => {
  it("pone el velo y alinea según la posición", () => {
    expect(overlayStyle({ ...DEFAULT_MODAL_OPTIONS, position: "left", backdrop: "red" })).toMatchObject({
      background: "red",
      justifyContent: "flex-start",
    });
  });
});
