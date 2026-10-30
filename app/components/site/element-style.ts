/**
 * Los estilos base de un elemento (relleno, esquinas, color y tipografía), como CSS.
 *
 * Van en la capa `base` de Tailwind, que queda por debajo de `utilities` y del CSS sin capa del usuario: así
 * cualquier clase (`bg-primario`, `rounded-full`…) o regla propia los reemplaza sin trucos. (Declarar una capa
 * propia con `@layer miCapa, theme, …` no sirve: el empaquetador de CSS descarta esa declaración.)
 */

import { fluidFontSize } from "../responsive/fluid-text";
import type { Device } from "../responsive/devices";
import { parseResponsiveGridConfig } from "../customize/layout-presets";
import { SECTION_KEY, type CanvasElement, type ComponentDef, type ElementKind } from "./types";

/** El texto: color, tamaño, peso, estilo y tipografía. */
function textCss(element: CanvasElement): string[] {
  return [
    `color: ${element.color}`,
    `font-size: ${element.fluid ? fluidFontSize(element.fontSize, element.fluid) : `${element.fontSize}px`}`,
    `font-weight: ${element.bold ? 700 : 400}`,
    ...(element.italic ? ["font-style: italic"] : []),
    ...(element.fontFamily ? [`font-family: ${element.fontFamily}`] : []),
    ...[element.underline && "underline", element.overline && "overline", element.strike && "line-through"]
      .filter((value): value is string => Boolean(value))
      .slice(0, 1)
      .map((first) => `text-decoration: ${first}`),
  ];
}

const box = (radius: string) => (element: CanvasElement) => [
  `background: ${element.fill}`,
  `border-radius: ${radius === "own" ? `${element.radius}px` : radius}`,
  ...textCss(element),
];

/** Una imagen o un video: esquinas propias y recorte de lo que sobresale. */
const media = (element: CanvasElement) => [`border-radius: ${element.radius}px`, "overflow: hidden"];

/** Los estilos base de cada tipo de elemento. Un tipo nuevo es una entrada nueva. */
const BASE_STYLES: Record<ElementKind, (element: CanvasElement) => string[]> = {
  rect: box("own"),
  ellipse: box("50%"),
  // Las figuras vectoriales se pintan con el color del contenedor (`currentColor`), no con un fondo.
  triangle: (element) => [`color: ${element.fill}`],
  line: (element) => [`color: ${element.fill}`],
  text: box("own"),
  image: media,
  video: media,
  icon: (element) => [`color: ${element.color}`, `font-size: ${element.fontSize}px`],
};

/** El elemento con su posición medida desde su contenedor, si lo tiene. */
function inside(element: CanvasElement, all: CanvasElement[]): CanvasElement {
  const parent = element.parentId === undefined ? undefined : all.find((e) => e.id === element.parentId);
  if (!parent) return element;
  // Si las coordenadas ya fueron especificadas de forma relativa al contenedor padre, no restar las coordenadas globales del padre.
  const isAlreadyLocalX = element.x < parent.x;
  const isAlreadyLocalY = element.y < parent.y;
  const x = isAlreadyLocalX ? element.x : element.x - parent.x;
  const y = isAlreadyLocalY ? element.y : element.y - parent.y;
  return { ...element, x: Math.max(0, x), y: Math.max(0, y) };
}

/** Dónde va y cuánto mide un elemento. En la capa base, para que `width`, `height`, `position`… propios lo reemplacen. */
const placement = (element: CanvasElement) => [
  "position: absolute",
  `left: ${element.x}px`,
  `top: ${element.y}px`,
  `width: ${element.width}px`,
  `height: ${element.height}px`,
];

const rule = (selector: string, declarations: string[]) => `${selector} {\n  ${declarations.join(";\n  ")};\n}`;

/**
 * El `<style>` con la capa de estilos base de una sección y de todos sus elementos: su posición y tamaño, su
 * relleno, esquinas y texto. Con `flow` (la sección usa `display: flex` o `grid`) los elementos dejan de ir
 * en su posición y se acomodan según el layout; cada uno conserva su tamaño.
 */
export function elementBaseCss(
  blockId: string,
  def: ComponentDef,
  flow: boolean,
  device?: Device,
  sectionClasses?: string,
  isHeaderOrFooter?: boolean,
): string {
  const isNavOrFooter =
    Boolean(isHeaderOrFooter) ||
    def.category === "navigation" ||
    def.id.toLowerCase().includes("footer") ||
    def.id.toLowerCase().includes("navbar") ||
    def.id.toLowerCase().includes("nav") ||
    def.name.toLowerCase().includes("footer") ||
    def.name.toLowerCase().includes("pie") ||
    def.name.toLowerCase().includes("navegaci") ||
    def.name.toLowerCase().includes("header");

  const section = `[data-target="${blockId}:${SECTION_KEY}"]`;
  const gridConfig = sectionClasses ? parseResponsiveGridConfig(sectionClasses) : null;
  const cols =
    gridConfig && device
      ? device === "mobile"
        ? gridConfig.mobileCols
        : device === "tablet"
          ? gridConfig.tabletCols
          : gridConfig.desktopCols
      : null;

  const rules = [
    rule(section, [
      "position: relative",
      "flex-shrink: 0",
      ...(flow || isNavOrFooter
        ? ["min-width: 0", "width: 100%"]
        : [`width: ${def.width}px`, `height: ${def.height}px`]),
      ...(isNavOrFooter ? [`min-height: ${def.height}px`] : []),
    ]),
    ...(cols !== null
      ? [
          rule(section, [
            "display: grid !important",
            `grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important`,
          ]),
        ]
      : []),
    ...def.elements.map((element) => {
      // Solo una figura rectangular sin texto ni contenedor padre que cubra toda la sección es un backdrop.
      const isBackdropElement =
        !flow &&
        isNavOrFooter &&
        element.kind === "rect" &&
        !element.text &&
        !element.parentId &&
        element.x === 0 &&
        element.y === 0 &&
        element.width >= def.width * 0.85 &&
        element.height >= def.height * 0.85;

      const isNavbar =
        isNavOrFooter &&
        (def.id.toLowerCase().includes("navbar") ||
          def.id.toLowerCase().includes("nav") ||
          def.name.toLowerCase().includes("navegaci") ||
          def.name.toLowerCase().includes("header")) &&
        !def.id.toLowerCase().includes("footer") &&
        !def.name.toLowerCase().includes("footer") &&
        !def.name.toLowerCase().includes("pie");

      // Solo botones o enlaces CTA al extremo derecho en barras de navegación (no en footers ni en general).
      const isRightSide =
        !flow &&
        isNavbar &&
        !isBackdropElement &&
        (element.role === "button" || element.x >= def.width * 0.7);

      const placeStyles = isBackdropElement
        ? [
            "position: absolute",
            "left: 0px !important",
            "top: 0px !important",
            "width: 100% !important",
            "height: 100% !important",
            "max-width: 100% !important",
            "box-sizing: border-box",
          ]
        : isRightSide && device === "desktop"
          ? [
              "position: absolute",
              `top: ${element.y}px`,
              `right: ${Math.max(16, def.width - (element.x + element.width))}px`,
              "left: auto !important",
              `width: ${element.width}px`,
              `height: ${element.height}px`,
            ]
          : placement(flow ? inside(element, def.elements) : element);

      return rule(`[data-target="${blockId}:${element.id}"]`, [
        ...placeStyles,
        ...BASE_STYLES[element.kind](element),
      ]);
    }),
    ...(flow
      ? [
          rule(`${section} > [data-el]`, [
            "position: relative !important",
            "left: auto !important",
            "top: auto !important",
            "min-width: 0 !important",
            "max-width: 100% !important",
            "box-sizing: border-box !important",
          ]),
          rule(`${section}[class*="grid"] > [data-el]`, [
            "width: 100% !important",
          ]),
          rule(`${section}[class*="flex-row"] > [data-el]`, [
            device === "mobile" ? "flex: 1 1 100% !important" : "flex: 1 1 220px !important",
            device === "mobile" ? "width: 100% !important" : "min-width: 0 !important",
          ]),
          rule(`${section} > [data-el] > [data-el]`, [
            "max-width: 100% !important",
            "min-width: 0 !important",
            "box-sizing: border-box !important",
          ]),
          ...(def.id.toLowerCase().includes("bento") || def.name.toLowerCase().includes("bento")
            ? [
                rule(`${section} > [data-el]:first-child`, [
                  device === "mobile" ? "grid-column: span 1 !important" : "grid-column: span 2 !important",
                  device === "mobile" ? "grid-row: span 1 !important" : "grid-row: span 2 !important",
                ]),
                rule(`${section} > [data-el]:nth-child(2)`, [
                  device === "mobile" ? "grid-column: span 1 !important" : "grid-column: span 2 !important",
                ]),
              ]
            : []),
        ]
      : []),
  ];

  const unlayeredRules: string[] = [];
  if (cols !== null) {
    unlayeredRules.push(
      rule(section, [
        "display: grid !important",
        `grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important`,
      ])
    );
  }
  if (flow) {
    unlayeredRules.push(
      rule(`${section} > [data-el]`, [
        "position: relative !important",
        "left: auto !important",
        "top: auto !important",
        "min-width: 0 !important",
        "max-width: 100% !important",
        "box-sizing: border-box !important",
      ]),
      rule(`${section}[class*="grid"] > [data-el]`, [
        "width: 100% !important",
      ]),
      rule(`${section}[class*="flex-row"] > [data-el]`, [
        device === "mobile" ? "flex: 1 1 100% !important" : "flex: 1 1 220px !important",
        device === "mobile" ? "width: 100% !important" : "min-width: 0 !important",
      ])
    );
  }

  return `@layer base {\n${rules.join("\n")}\n}${unlayeredRules.length > 0 ? `\n${unlayeredRules.join("\n")}` : ""}`;
}

