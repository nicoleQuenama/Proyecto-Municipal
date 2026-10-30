import { describe, expect, it } from "vitest";
import {
  applyCell,
  applyGap,
  applyLayout,
  applyPadding,
  applyQuickPreset,
  applyResponsiveGrid,
  buildResponsiveGridClasses,
  cellOf,
  gapOf,
  isGridLayout,
  layoutOf,
  paddingOf,
  parseResponsiveGridConfig,
  quickPresetOf,
  applyBreakpointOverride,
  parseBreakpointOverrides,
  applyWrapperConfig,
  parseWrapperConfig,
} from "./layout-presets";

describe("disposición de una sección", () => {
  it("aplica un preset y lo reconoce", () => {
    expect(layoutOf(applyLayout("", "bento"))).toBe("bento");
    expect(layoutOf(applyLayout("", "grid3"))).toBe("grid3");
    expect(layoutOf("")).toBe("free");
  });

  it("al cambiar de disposición conserva las clases de la persona", () => {
    const next = applyLayout("rounded-xl bg-primario flex flex-col gap-4", "grid2");
    expect(next).toContain("rounded-xl");
    expect(next).toContain("bg-primario");
    expect(next).not.toContain("flex");
    expect(layoutOf(next)).toBe("grid2");
  });

  it("«Libre» quita solo lo de la disposición", () => {
    expect(applyLayout("rounded-xl grid grid-cols-2 gap-4", "free")).toBe("rounded-xl");
  });

  it("las cuadrículas se distinguen de las filas", () => {
    expect(isGridLayout("bento")).toBe(true);
    expect(isGridLayout("row")).toBe(false);
  });
});

describe("cuadrícula responsiva (4 PC / 2 Móvil, etc.)", () => {
  it("construye clases mobile-first con sm: y lg:", () => {
    const classes = buildResponsiveGridClasses({
      desktopCols: 4,
      tabletCols: 2,
      mobileCols: 2,
      gap: 16,
    });
    expect(classes).toBe("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4");
  });

  it("incluye padding si se especifica", () => {
    const classes = buildResponsiveGridClasses({
      desktopCols: 3,
      tabletCols: 2,
      mobileCols: 1,
      gap: 24,
      padding: 16,
    });
    expect(classes).toBe("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4");
  });

  it("parsea clases responsivas existentes", () => {
    const parsed = parseResponsiveGridConfig("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4");
    expect(parsed).toEqual({
      mobileCols: 2,
      tabletCols: 2,
      desktopCols: 4,
      gap: 16,
      padding: 0,
    });
  });

  it("devuelve null si no es una cuadrícula", () => {
    expect(parseResponsiveGridConfig("flex flex-row gap-4")).toBeNull();
  });

  it("aplica responsive grid conservando estilos ajenos", () => {
    const next = applyResponsiveGrid("bg-slate-900 shadow-2xl", {
      desktopCols: 4,
      tabletCols: 2,
      mobileCols: 2,
      gap: 16,
    });
    expect(next).toContain("bg-slate-900");
    expect(next).toContain("shadow-2xl");
    expect(next).toContain("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4");
  });
});

describe("presets rápidos", () => {
  it("aplica y detecta el preset 4 PC · 2 Móvil", () => {
    const applied = applyQuickPreset("bg-white", "grid-4-2");
    expect(applied).toContain("grid-cols-2");
    expect(applied).toContain("lg:grid-cols-4");
    expect(applied).toContain("bg-white");
    expect(quickPresetOf(applied)).toBe("grid-4-2");
  });

  it("aplica y detecta el preset 3 PC · 1 Móvil", () => {
    const applied = applyQuickPreset("", "grid-3-1");
    expect(applied).toContain("grid-cols-1");
    expect(applied).toContain("lg:grid-cols-3");
    expect(quickPresetOf(applied)).toBe("grid-3-1");
  });

  it("aplica y detecta el preset 2 PC · 1 Móvil", () => {
    const applied = applyQuickPreset("", "grid-2-1");
    expect(applied).toContain("grid-cols-1");
    expect(applied).toContain("grid-cols-2");
    expect(quickPresetOf(applied)).toBe("grid-2-1");
  });
});

describe("separación (gap) y relleno (padding)", () => {
  it("cambia y lee el gap", () => {
    const withGap = applyGap("grid grid-cols-2 gap-4", 24);
    expect(withGap).toContain("gap-6");
    expect(withGap).not.toContain("gap-4");
    expect(gapOf(withGap)).toBe(24);
  });

  it("cambia y lee el padding", () => {
    const withPadding = applyPadding("grid grid-cols-2", 16);
    expect(withPadding).toContain("p-4");
    expect(paddingOf(withPadding)).toBe(16);

    const zeroPadding = applyPadding(withPadding, 0);
    expect(zeroPadding).not.toContain("p-4");
    expect(paddingOf(zeroPadding)).toBe(0);
  });
});

describe("carrusel", () => {
  it("se aplica, se reconoce y se quita sin dejar restos", () => {
    const carousel = applyLayout("rounded-xl", "carousel");
    expect(layoutOf(carousel)).toBe("carousel");
    expect(carousel).toContain("snap-x");
    expect(applyLayout(carousel, "free")).toBe("rounded-xl");
    expect(isGridLayout("carousel")).toBe(false);
  });
});

describe("celda de la cuadrícula", () => {
  it("guarda y lee cuántas columnas y filas ocupa", () => {
    const classes = applyCell("shadow-lg", { cols: 2, rows: 3 });
    expect(classes).toContain("shadow-lg");
    expect(cellOf(classes)).toEqual({ cols: 2, rows: 3 });
  });

  it("1 × 1 no deja clases de ocupación y cambiar reemplaza lo anterior", () => {
    const once = applyCell("", { cols: 2, rows: 2 });
    const back = applyCell(once, { cols: 1, rows: 1 });
    expect(back).not.toContain("span");
    expect(cellOf("")).toEqual({ cols: 1, rows: 1 });
  });
});

describe("controles responsive (breakpoint overrides para desktop, tablet y mobile)", () => {
  it("extrae valores heredados mobile-first", () => {
    const classes = "flex flex-col gap-4 items-center justify-between text-sm";
    const conf = parseBreakpointOverrides(classes);
    expect(conf.mobile.direction).toBe("col");
    expect(conf.mobile.gap).toBe(16);
    expect(conf.mobile.align).toBe("center");
    expect(conf.mobile.justify).toBe("between");
    expect(conf.mobile.textSize).toBe("sm");

    // Tablet y Desktop heredan de mobile si no tienen override
    expect(conf.tablet.direction).toBe("col");
    expect(conf.desktop.direction).toBe("col");
  });

  it("aplica overrides específicos por breakpoint", () => {
    let classes = "flex flex-col gap-4 text-xs";
    classes = applyBreakpointOverride(classes, "tablet", { direction: "row", gap: 24, textSize: "sm" });
    classes = applyBreakpointOverride(classes, "desktop", { direction: "row", gap: 32, justify: "between", textSize: "base" });

    expect(classes).toContain("flex-col");
    expect(classes).toContain("md:flex-row");
    expect(classes).toContain("md:gap-6");
    expect(classes).toContain("md:text-sm");
    expect(classes).toContain("lg:flex-row");
    expect(classes).toContain("lg:gap-8");
    expect(classes).toContain("lg:justify-between");
    expect(classes).toContain("lg:text-base");

    const parsed = parseBreakpointOverrides(classes);
    expect(parsed.mobile.direction).toBe("col");
    expect(parsed.tablet.direction).toBe("row");
    expect(parsed.desktop.direction).toBe("row");
    expect(parsed.desktop.justify).toBe("between");
  });
});

describe("dimensionamiento y control del contenedor wrapper", () => {
  it("ajusta ancho fit-content y full", () => {
    let c = "flex gap-2";
    c = applyWrapperConfig(c, { widthMode: "fit" });
    expect(c).toContain("w-fit");
    expect(parseWrapperConfig(c).widthMode).toBe("fit");

    c = applyWrapperConfig(c, { widthMode: "full" });
    expect(c).toContain("w-full");
    expect(c).not.toContain("w-fit");
    expect(parseWrapperConfig(c).widthMode).toBe("full");
  });

  it("configura alineación interna (justify-start, center, end, between)", () => {
    let c = "flex gap-2";
    c = applyWrapperConfig(c, { align: "center", margin: "center", padding: 16 });
    expect(c).toContain("justify-center");
    expect(c).toContain("mx-auto");
    expect(c).toContain("p-4");

    const conf = parseWrapperConfig(c);
    expect(conf.align).toBe("center");
    expect(conf.margin).toBe("center");
    expect(conf.padding).toBe(16);
  });
});

