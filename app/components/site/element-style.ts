/**
 * Los estilos base de un elemento (relleno, esquinas, color y tipografía), como CSS.
 *
 * Van en la capa `base` de Tailwind, que queda por debajo de `utilities` y del CSS sin capa del usuario: así
 * cualquier clase (`bg-primario`, `rounded-full`…) o regla propia los reemplaza sin trucos. (Declarar una capa
 * propia con `@layer miCapa, theme, …` no sirve: el empaquetador de CSS descarta esa declaración.)
 */

import { SECTION_KEY, type CanvasElement, type ComponentDef, type ElementKind } from "./types";

/** El texto: color, tamaño, peso, estilo y tipografía. */
function textCss(element: CanvasElement): string[] {
  return [
    `color: ${element.color}`,
    `font-size: ${element.fontSize}px`,
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
export function elementBaseCss(blockId: string, def: ComponentDef, flow: boolean): string {
  const section = `[data-target="${blockId}:${SECTION_KEY}"]`;
  const rules = [
    rule(section, ["position: relative", "flex-shrink: 0", ...(flow ? ["min-width: 0"] : [`width: ${def.width}px`, `height: ${def.height}px`])]),
    ...def.elements.map((element) =>
      rule(`[data-target="${blockId}:${element.id}"]`, [...placement(element), ...BASE_STYLES[element.kind](element)]),
    ),
    ...(flow ? [rule(`${section} > [data-el]`, ["position: relative", "left: auto", "top: auto"])] : []),
  ];
  return `@layer base {\n${rules.join("\n")}\n}`;
}

