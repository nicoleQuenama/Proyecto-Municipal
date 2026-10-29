/** Disposiciones de una sección (fila, columna, cuadrícula responsiva, bento) como clases de Tailwind, sin escribirlas a mano. */

export type LayoutKey = "free" | "row" | "column" | "grid2" | "grid3" | "grid4" | "bento" | "carousel";

export interface ResponsiveGridConfig {
  desktopCols: number; // 1..6
  tabletCols: number;  // 1..4
  mobileCols: number;  // 1..2
  gap: number;         // 8, 12, 16, 24, 32...
  padding?: number;    // 0, 8, 16, 24, 32...
}

export type QuickPresetKey = "free" | "grid-4-2" | "grid-3-1" | "grid-2-1" | "row" | "column" | "bento" | "carousel";

export const QUICK_PRESETS: Record<QuickPresetKey, { label: string; help: string; config?: ResponsiveGridConfig }> = {
  free: { label: "Libre", help: "Posición libre y manual para cada elemento." },
  "grid-4-2": {
    label: "4 PC · 2 Móvil",
    help: "4 columnas en PC, 2 en tablet y 2 en celular.",
    config: { desktopCols: 4, tabletCols: 2, mobileCols: 2, gap: 16, padding: 0 },
  },
  "grid-3-1": {
    label: "3 PC · 1 Móvil",
    help: "3 columnas en PC, 2 en tablet y 1 en celular.",
    config: { desktopCols: 3, tabletCols: 2, mobileCols: 1, gap: 24, padding: 0 },
  },
  "grid-2-1": {
    label: "2 PC · 1 Móvil",
    help: "2 columnas en PC y 1 en celular.",
    config: { desktopCols: 2, tabletCols: 2, mobileCols: 1, gap: 16, padding: 0 },
  },
  row: { label: "Fila (Wrap)", help: "Uno junto a otro; si no caben, pasan a la línea de abajo." },
  column: { label: "Columna", help: "Uno debajo de otro en vertical." },
  bento: { label: "Bento", help: "Cuadrícula con celdas de varios tamaños." },
  carousel: { label: "Carrusel", help: "Fila desplazable horizontalmente." },
};

export const LAYOUT_LABELS: Record<LayoutKey, { label: string; help: string }> = {
  free: { label: "Libre", help: "Cada elemento donde lo pusiste." },
  row: { label: "Fila", help: "Uno junto a otro; si no caben, pasan a la línea de abajo." },
  column: { label: "Columna", help: "Uno debajo de otro." },
  grid2: { label: "Cuadrícula 2", help: "Dos columnas iguales." },
  grid3: { label: "Cuadrícula 3", help: "Tres columnas iguales." },
  grid4: { label: "Cuadrícula 4", help: "Cuatro columnas iguales." },
  carousel: { label: "Carrusel", help: "Una sola fila que se desliza; cada elemento es una tarjeta." },
  bento: { label: "Bento", help: "Cuadrícula de 4 columnas donde cada pieza puede ocupar varias columnas y filas." },
};

export const GAP_PRESETS: { px: number; label: string; className: string }[] = [
  { px: 8, label: "8px", className: "gap-2" },
  { px: 12, label: "12px", className: "gap-3" },
  { px: 16, label: "16px", className: "gap-4" },
  { px: 24, label: "24px", className: "gap-6" },
  { px: 32, label: "32px", className: "gap-8" },
];

export const PADDING_PRESETS: { px: number; label: string; className: string }[] = [
  { px: 0, label: "0px", className: "p-0" },
  { px: 8, label: "8px", className: "p-2" },
  { px: 16, label: "16px", className: "p-4" },
  { px: 24, label: "24px", className: "p-6" },
  { px: 32, label: "32px", className: "p-8" },
];

const GAP_TO_CLASS: Record<number, string> = {
  8: "gap-2",
  12: "gap-3",
  16: "gap-4",
  24: "gap-6",
  32: "gap-8",
};

const CLASS_TO_GAP: Record<string, number> = {
  "gap-1": 4,
  "gap-2": 8,
  "gap-3": 12,
  "gap-4": 16,
  "gap-5": 20,
  "gap-6": 24,
  "gap-8": 32,
  "gap-10": 40,
  "gap-12": 48,
};

const PAD_TO_CLASS: Record<number, string> = {
  0: "p-0",
  8: "p-2",
  16: "p-4",
  24: "p-6",
  32: "p-8",
};

const CLASS_TO_PAD: Record<string, number> = {
  "p-0": 0,
  "p-1": 4,
  "p-2": 8,
  "p-3": 12,
  "p-4": 16,
  "p-6": 24,
  "p-8": 32,
};

const CLASSES: Record<Exclude<LayoutKey, "free">, string> = {
  row: "flex flex-row flex-wrap gap-4 items-start",
  column: "flex flex-col gap-4",
  grid2: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  grid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  grid4: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  bento: "grid grid-cols-2 sm:grid-cols-4 auto-rows-[160px] grid-flow-dense gap-4",
  carousel: "flex flex-row flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&>[data-el]]:shrink-0 [&>[data-el]]:snap-start",
};

/** Lo que esta herramienta maneja de la sección: lo demás que haya escrito la persona se respeta. */
export const LAYOUT_CLASS =
  /^(flex|grid|inline-flex|inline-grid|((sm|md|lg):)?flex-(row|col|wrap|nowrap)|((sm|md|lg):)?grid-cols-\d+|grid-flow-dense|auto-rows-\[[^\]]+\]|((sm|md|lg):)?gap-\d+|((sm|md|lg):)?p-\d+|((sm|md|lg):)?items-(start|center|end|stretch)|((sm|md|lg):)?justify-(start|center|end|between)|((sm|md|lg):)?text-(xs|sm|base|lg)|((sm|md|lg):)?w-(fit|full)|mx-auto|my-\d+|m-\d+|overflow-x-auto|snap-x|snap-mandatory|scroll-smooth|\[scrollbar-width:none\]|\[&>\[data-el\]\]:(shrink-0|snap-start))$/;

/** Lo que maneja de un elemento dentro de una cuadrícula. */
const CELL_CLASS = /^(col-span-\d+|row-span-\d+|w-full|h-full)$/;

const words = (classes: string) => classes.split(/\s+/).filter(Boolean);
const join = (list: string[]) => list.join(" ");

/** Construye la cadena de clases de Tailwind a partir de una configuración responsiva. */
export function buildResponsiveGridClasses(config: ResponsiveGridConfig): string {
  const parts = [
    "grid",
    `grid-cols-${config.mobileCols}`,
    `sm:grid-cols-${config.tabletCols}`,
    `lg:grid-cols-${config.desktopCols}`,
  ];
  const gapClass = GAP_TO_CLASS[config.gap] ?? "gap-4";
  parts.push(gapClass);
  if (config.padding !== undefined && config.padding > 0) {
    const padClass = PAD_TO_CLASS[config.padding] ?? "p-4";
    parts.push(padClass);
  }
  return parts.join(" ");
}

/** Extrae la configuración responsiva de las clases actuales de una sección (si es una cuadrícula). */
export function parseResponsiveGridConfig(classes: string): ResponsiveGridConfig | null {
  const w = words(classes);
  if (!w.includes("grid")) return null;

  let mobileCols = 1;
  let tabletCols = 2;
  let desktopCols = 3;
  let gap = 16;
  let padding = 0;

  for (const item of w) {
    if (/^grid-cols-(\d+)$/.test(item)) {
      mobileCols = Number(item.replace("grid-cols-", "")) || 1;
    } else if (/^sm:grid-cols-(\d+)$/.test(item)) {
      tabletCols = Number(item.replace("sm:grid-cols-", "")) || mobileCols;
    } else if (/^md:grid-cols-(\d+)$/.test(item)) {
      tabletCols = Number(item.replace("md:grid-cols-", "")) || mobileCols;
    } else if (/^lg:grid-cols-(\d+)$/.test(item)) {
      desktopCols = Number(item.replace("lg:grid-cols-", "")) || tabletCols;
    } else if (CLASS_TO_GAP[item] !== undefined) {
      gap = CLASS_TO_GAP[item];
    } else if (CLASS_TO_PAD[item] !== undefined) {
      padding = CLASS_TO_PAD[item];
    }
  }

  // Si no había breakpoints específicos, tablet hereda de base y desktop hereda
  if (!w.some((item) => item.startsWith("sm:grid-cols-") || item.startsWith("md:grid-cols-"))) {
    tabletCols = mobileCols;
  }
  if (!w.some((item) => item.startsWith("lg:grid-cols-"))) {
    desktopCols = tabletCols;
  }

  return { mobileCols, tabletCols, desktopCols, gap, padding };
}

/** Aplica una configuración de cuadrícula responsiva conservando otras clases ajenas al layout. */
export function applyResponsiveGrid(classes: string, config: ResponsiveGridConfig): string {
  const rest = words(classes).filter((name) => !LAYOUT_CLASS.test(name));
  const gridClasses = buildResponsiveGridClasses(config);
  return join([...rest, ...words(gridClasses)]);
}

/** Cambia la separación (gap) de la sección sin tocar la estructura ni otras clases. */
export function applyGap(classes: string, gap: number): string {
  const gapClass = GAP_TO_CLASS[gap] ?? "gap-4";
  const rest = words(classes).filter((name) => !name.startsWith("gap-"));
  return join([...rest, gapClass]);
}

/** Obtiene la separación en px actual de la sección. */
export function gapOf(classes: string): number {
  const found = words(classes).find((name) => name.startsWith("gap-"));
  return found && CLASS_TO_GAP[found] !== undefined ? CLASS_TO_GAP[found] : 16;
}

/** Cambia el relleno interno (padding) de la sección. */
export function applyPadding(classes: string, padding: number): string {
  const padClass = PAD_TO_CLASS[padding] ?? "p-0";
  const rest = words(classes).filter((name) => !name.startsWith("p-"));
  return join(padding > 0 ? [...rest, padClass] : rest);
}

/** Obtiene el relleno en px actual de la sección. */
export function paddingOf(classes: string): number {
  const found = words(classes).find((name) => /^p-\d+$/.test(name));
  return found && CLASS_TO_PAD[found] !== undefined ? CLASS_TO_PAD[found] : 0;
}

/** Cambia la disposición de la sección conservando el resto de sus clases. */
export function applyLayout(classes: string, layout: LayoutKey): string {
  const rest = words(classes).filter((name) => !LAYOUT_CLASS.test(name));
  return join(layout === "free" ? rest : [...rest, ...words(CLASSES[layout])]);
}

/** Aplica un preset rápido (incluyendo combinaciones responsivas como 4 PC / 2 Móvil). */
export function applyQuickPreset(classes: string, preset: QuickPresetKey): string {
  if (preset === "free") return applyLayout(classes, "free");
  if (preset === "row") return applyLayout(classes, "row");
  if (preset === "column") return applyLayout(classes, "column");
  if (preset === "bento") return applyLayout(classes, "bento");
  if (preset === "carousel") return applyLayout(classes, "carousel");

  const conf = QUICK_PRESETS[preset]?.config;
  if (conf) return applyResponsiveGrid(classes, conf);
  return classes;
}

/** Detecta qué preset rápido coincide con las clases actuales. */
export function quickPresetOf(classes: string): QuickPresetKey {
  const w = words(classes);
  if (!w.some((name) => LAYOUT_CLASS.test(name))) return "free";
  if (w.includes("flex-row") && w.includes("flex-wrap")) return "row";
  if (w.includes("flex-col") && !w.includes("grid")) return "column";
  if (w.includes("overflow-x-auto")) return "carousel";
  if (w.includes("auto-rows-[160px]")) return "bento";

  const parsed = parseResponsiveGridConfig(classes);
  if (parsed) {
    if (parsed.desktopCols === 4 && parsed.mobileCols === 2) return "grid-4-2";
    if (parsed.desktopCols === 3 && parsed.mobileCols === 1) return "grid-3-1";
    if (parsed.desktopCols === 2 && parsed.mobileCols === 1) return "grid-2-1";
  }

  const legacy = layoutOf(classes);
  if (legacy === "grid2") return "grid-2-1";
  if (legacy === "grid3") return "grid-3-1";
  if (legacy === "grid4") return "grid-4-2";
  return legacy;
}

/** Qué disposición tienen esas clases (compatibilidad con layoutOf clásico). */
export function layoutOf(classes: string): LayoutKey {
  const w = words(classes);
  if (!w.some((name) => LAYOUT_CLASS.test(name))) return "free";
  if (w.includes("grid")) {
    if (w.includes("auto-rows-[160px]")) return "bento";
    if (w.some((c) => c.endsWith("grid-cols-4") || c === "grid-cols-4")) return "grid4";
    if (w.some((c) => c.endsWith("grid-cols-3") || c === "grid-cols-3")) return "grid3";
    if (w.some((c) => c.endsWith("grid-cols-2") || c === "grid-cols-2")) return "grid2";
    return "grid3";
  }
  if (w.includes("flex-row") && w.includes("overflow-x-auto")) return "carousel";
  if (w.includes("flex-row")) return "row";
  if (w.includes("flex-col")) return "column";
  return "free";
}

export const isGridLayout = (layout: LayoutKey | QuickPresetKey) =>
  layout.startsWith("grid") || layout === "bento";

export interface Cell {
  cols: number;
  rows: number;
}

/** Cuánto ocupa una pieza en la cuadrícula (1 × 1 si no dice nada). */
export function cellOf(classes: string): Cell {
  const span = (prefix: string) => Number(words(classes).find((name) => name.startsWith(prefix))?.slice(prefix.length)) || 1;
  return { cols: span("col-span-"), rows: span("row-span-") };
}

/** Pone cuántas columnas y filas ocupa una pieza; ocupando 1 × 1 y sin más, la deja como estaba. */
export function applyCell(classes: string, cell: Cell): string {
  const rest = words(classes).filter((name) => !CELL_CLASS.test(name));
  return join([...rest, "w-full", "h-full", ...(cell.cols > 1 ? [`col-span-${cell.cols}`] : []), ...(cell.rows > 1 ? [`row-span-${cell.rows}`] : [])]);
}

export type DeviceBreakpoint = "desktop" | "tablet" | "mobile";

export interface BreakpointLayoutConfig {
  direction: "row" | "col";
  align: "start" | "center" | "end" | "stretch";
  justify: "start" | "center" | "between" | "end";
  gap: number;
  textSize: "xs" | "sm" | "base" | "lg";
}

export interface ResponsiveBreakpointOverrides {
  desktop: BreakpointLayoutConfig;
  tablet: BreakpointLayoutConfig;
  mobile: BreakpointLayoutConfig;
}

const BREAKPOINT_PREFIXES: Record<DeviceBreakpoint, string> = {
  mobile: "",
  tablet: "md:",
  desktop: "lg:",
};

/** Extrae la configuración responsive por cada breakpoint (desktop, tablet, mobile). */
export function parseBreakpointOverrides(classes: string): ResponsiveBreakpointOverrides {
  const w = words(classes);

  const getDir = (prefix: string, fallback: "row" | "col"): "row" | "col" => {
    if (w.includes(`${prefix}flex-col`)) return "col";
    if (w.includes(`${prefix}flex-row`)) return "row";
    return fallback;
  };

  const getAlign = (prefix: string, fallback: "start" | "center" | "end" | "stretch"): "start" | "center" | "end" | "stretch" => {
    const found = w.find((name) => name.startsWith(`${prefix}items-`));
    if (found) {
      const val = found.replace(`${prefix}items-`, "");
      if (val === "start" || val === "center" || val === "end" || val === "stretch") return val;
    }
    return fallback;
  };

  const getJustify = (prefix: string, fallback: "start" | "center" | "between" | "end"): "start" | "center" | "between" | "end" => {
    const found = w.find((name) => name.startsWith(`${prefix}justify-`));
    if (found) {
      const val = found.replace(`${prefix}justify-`, "");
      if (val === "start" || val === "center" || val === "between" || val === "end") return val;
    }
    return fallback;
  };

  const getGap = (prefix: string, fallback: number): number => {
    const found = w.find((name) => name.startsWith(`${prefix}gap-`));
    if (found) {
      const key = found.replace(prefix, "");
      if (CLASS_TO_GAP[key] !== undefined) return CLASS_TO_GAP[key];
    }
    return fallback;
  };

  const getTextSize = (prefix: string, fallback: "xs" | "sm" | "base" | "lg"): "xs" | "sm" | "base" | "lg" => {
    const found = w.find((name) => name.startsWith(`${prefix}text-`));
    if (found) {
      const val = found.replace(`${prefix}text-`, "");
      if (val === "xs" || val === "sm" || val === "base" || val === "lg") return val;
    }
    return fallback;
  };

  // Mobile (base)
  const mobileDir = getDir("", "col");
  const mobileAlign = getAlign("", "start");
  const mobileJustify = getJustify("", "start");
  const mobileGap = getGap("", 16);
  const mobileText = getTextSize("", "sm");

  const mobile: BreakpointLayoutConfig = {
    direction: mobileDir,
    align: mobileAlign,
    justify: mobileJustify,
    gap: mobileGap,
    textSize: mobileText,
  };

  // Tablet (hereda de móvil si no tiene su propio prefijo)
  const tabletDir = getDir("md:", mobileDir);
  const tabletAlign = getAlign("md:", mobileAlign);
  const tabletJustify = getJustify("md:", mobileJustify);
  const tabletGap = getGap("md:", mobileGap);
  const tabletText = getTextSize("md:", mobileText);

  const tablet: BreakpointLayoutConfig = {
    direction: tabletDir,
    align: tabletAlign,
    justify: tabletJustify,
    gap: tabletGap,
    textSize: tabletText,
  };

  // Desktop (hereda de tablet si no tiene su propio prefijo)
  const desktopDir = getDir("lg:", tabletDir);
  const desktopAlign = getAlign("lg:", tabletAlign);
  const desktopJustify = getJustify("lg:", tabletJustify);
  const desktopGap = getGap("lg:", tabletGap);
  const desktopText = getTextSize("lg:", tabletText);

  const desktop: BreakpointLayoutConfig = {
    direction: desktopDir,
    align: desktopAlign,
    justify: desktopJustify,
    gap: desktopGap,
    textSize: desktopText,
  };

  return { mobile, tablet, desktop };
}

/** Aplica una configuración responsive a un breakpoint dado sin perder las demás reglas. */
export function applyBreakpointOverride(
  classes: string,
  breakpoint: DeviceBreakpoint,
  patch: Partial<BreakpointLayoutConfig>,
): string {
  const prefix = BREAKPOINT_PREFIXES[breakpoint];
  const list = words(classes);

  // Asegurar display flex si se configura dirección o alineación flex
  const hasFlex = list.includes("flex");
  const base = hasFlex ? list : ["flex", ...list];

  // Filtrar las clases que este parche va a reemplazar
  const filtered = base.filter((c) => {
    if (patch.direction && (c === `${prefix}flex-row` || c === `${prefix}flex-col`)) return false;
    if (patch.align && c.startsWith(`${prefix}items-`)) return false;
    if (patch.justify && c.startsWith(`${prefix}justify-`)) return false;
    if (patch.gap !== undefined && c.startsWith(`${prefix}gap-`)) return false;
    if (patch.textSize && c.startsWith(`${prefix}text-`)) return false;
    return true;
  });

  const additions: string[] = [];
  if (patch.direction) additions.push(`${prefix}flex-${patch.direction}`);
  if (patch.align) additions.push(`${prefix}items-${patch.align}`);
  if (patch.justify) additions.push(`${prefix}justify-${patch.justify}`);
  if (patch.gap !== undefined) additions.push(`${prefix}${GAP_TO_CLASS[patch.gap] ?? "gap-4"}`);
  if (patch.textSize) additions.push(`${prefix}text-${patch.textSize}`);

  return join([...filtered, ...additions]);
}

export type WidthMode = "fit" | "full" | "custom";

export interface ContainerWrapperConfig {
  widthMode: WidthMode;
  padding: number;
  margin: "none" | "center" | "sm" | "md" | "lg";
  align: "start" | "center" | "end" | "between";
}

/** Extrae el dimensionamiento y alineación del wrapper de una sección/componente. */
export function parseWrapperConfig(classes: string): ContainerWrapperConfig {
  const w = words(classes);

  let widthMode: WidthMode = "full";
  if (w.includes("w-fit")) widthMode = "fit";
  else if (w.includes("w-full")) widthMode = "full";
  else if (w.some((c) => c.startsWith("max-w-") || c.startsWith("w-["))) widthMode = "custom";

  const pad = paddingOf(classes);

  let margin: "none" | "center" | "sm" | "md" | "lg" = "none";
  if (w.includes("mx-auto")) margin = "center";
  else if (w.includes("my-2")) margin = "sm";
  else if (w.includes("my-4")) margin = "md";
  else if (w.includes("my-8")) margin = "lg";

  let align: "start" | "center" | "end" | "between" = "start";
  if (w.includes("justify-center")) align = "center";
  else if (w.includes("justify-end")) align = "end";
  else if (w.includes("justify-between")) align = "between";

  return { widthMode, padding: pad, margin, align };
}

/** Aplica dimensiones y alineación al wrapper del componente sin romper otras clases. */
export function applyWrapperConfig(classes: string, patch: Partial<ContainerWrapperConfig>): string {
  const list = words(classes);

  const filtered = list.filter((c) => {
    if (patch.widthMode && (c === "w-fit" || c === "w-full")) return false;
    if (patch.padding !== undefined && /^p-\d+$/.test(c)) return false;
    if (patch.margin && (c === "mx-auto" || c === "m-0" || /^my-\d+$/.test(c))) return false;
    if (patch.align && /^justify-(start|center|end|between)$/.test(c)) return false;
    return true;
  });

  const additions: string[] = [];
  if (patch.widthMode) {
    if (patch.widthMode === "fit") additions.push("w-fit");
    else if (patch.widthMode === "full") additions.push("w-full");
  }

  if (patch.padding !== undefined && patch.padding >= 0) {
    additions.push(PAD_TO_CLASS[patch.padding] ?? "p-4");
  }

  if (patch.margin) {
    if (patch.margin === "center") additions.push("mx-auto");
    else if (patch.margin === "sm") additions.push("my-2");
    else if (patch.margin === "md") additions.push("my-4");
    else if (patch.margin === "lg") additions.push("my-8");
  }

  if (patch.align) {
    additions.push(`justify-${patch.align}`);
  }

  return join([...filtered, ...additions]);
}

