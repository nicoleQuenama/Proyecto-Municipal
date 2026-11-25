import { SECTION_KEY, type CanvasElement, type ComponentDef } from "./types";

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const px = (value: number) => `${Math.round(value)}px`;

/** Lo que el elemento pinta por sí mismo: relleno, esquinas y texto (lo mismo que `element-style.ts` en el lienzo). */
function looks(element: CanvasElement): string[] {
  const decoration = [element.underline && "underline", element.overline && "overline", element.strike && "line-through"].filter(Boolean)[0];
  return [
    ...(element.kind === "image" || element.kind === "video" ? ["overflow:hidden"] : [`background:${element.fill}`]),
    `border-radius:${element.kind === "ellipse" ? "50%" : px(element.radius)}`,
    `color:${element.color}`,
    `font-size:${px(element.fontSize)}`,
    `font-weight:${element.bold ? 700 : 400}`,
    ...(element.italic ? ["font-style:italic"] : []),
    ...(decoration ? [`text-decoration:${decoration}`] : []),
    ...(element.fontFamily ? [`font-family:${element.fontFamily}`] : []),
    `text-align:${element.align}`,
  ];
}

/** Dónde va el elemento: suelto en su posición, o con su tamaño si la sección acomoda sola a sus piezas. */
const placed = (element: CanvasElement, flow: boolean): string[] =>
  flow
    ? [`width:${px(element.width)}`, `min-height:${px(element.height)}`, "max-width:100%"]
    : ["position:absolute", `left:${px(element.x)}`, `top:${px(element.y)}`, `width:${px(element.width)}`, `height:${px(element.height)}`];

/** La etiqueta que le corresponde: una imagen es `<img>`, un enlace `<a>`, un botón `<button>`, un titular `<h2>`… */
function tagOf(element: CanvasElement): string {
  if (element.kind === "image" && element.src) return "img";
  if (element.role === "link") return "a";
  if (element.role === "button") return "button";
  if (element.role === "heading") return "h2";
  return element.kind === "text" ? "p" : "div";
}

function elementHtml(element: CanvasElement, all: CanvasElement[], flow: boolean, depth: number): string {
  const pad = "  ".repeat(depth);
  const tag = tagOf(element);
  const reset = tag === "h2" || tag === "p" ? ["margin:0"] : [];
  const style = escapeHtml([...reset, ...placed(element, flow), ...looks(element)].join(";"));

  if (tag === "img") {
    const fit = `object-fit:${element.fit ?? "cover"}`;
    const pos = element.objectPosition ? `;object-position:${element.objectPosition}` : "";
    const transforms: string[] = [];
    if (element.imageZoom && element.imageZoom !== 1) transforms.push(`scale(${element.imageZoom})`);
    if (element.flipH) transforms.push("scaleX(-1)");
    if (element.flipV) transforms.push("scaleY(-1)");
    const tf = transforms.length ? `;transform:${transforms.join(" ")}` : "";
    return `${pad}<img src="${escapeHtml(element.src ?? "")}" alt="${escapeHtml(element.alt ?? "")}" style="${style};${fit}${pos}${tf}" />`;
  }

  const children = flow ? all.filter((child) => child.parentId === element.id && !child.hidden) : [];
  const inner = [
    ...(element.text ? [`${pad}  ${escapeHtml(element.text).replace(/\n/g, "<br />")}`] : []),
    ...children.map((child) => elementHtml(child, all, flow, depth + 1)),
  ];
  const href = tag === "a" ? ' href="#"' : tag === "button" ? ' type="button"' : "";
  return `${pad}<${tag}${href} style="${style}">${inner.length ? `\n${inner.join("\n")}\n${pad}` : ""}</${tag}>`;
}

/** ¿La sección acomoda sola a sus piezas (flex o grid) en lugar de ponerlas en su posición? */
export const isFlowSection = (classes: string): boolean => /(^|\s)(flex|inline-flex|grid)(\s|$)/.test(classes);

/**
 * El HTML de un componente hecho en el constructor tal como se ve: cada pieza con su posición, su tamaño y sus colores.
 * No inventa contenido; lo que ves en el lienzo es lo que queda escrito para editar.
 */
export function componentHtml(def: ComponentDef): string {
  const classes = def.styles?.[SECTION_KEY]?.classes ?? "";
  const flow = isFlowSection(classes);
  const visible = def.elements.filter((element) => !element.hidden);
  // En flujo solo las piezas de primer nivel van sueltas; lo acoplado va dentro de su tarjeta.
  const roots = flow ? visible.filter((element) => !element.parentId || !visible.some((other) => other.id === element.parentId)) : visible;
  const sectionStyle = flow ? "position:relative;width:100%" : `position:relative;width:${px(def.width)};height:${px(def.height)};max-width:100%`;

  return `<section class="${escapeHtml(classes)}" style="${sectionStyle}">\n${roots
    .map((element) => elementHtml(element, visible, flow, 1))
    .join("\n")}\n</section>`;
}
