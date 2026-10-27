import type { LinkTarget } from "../navigation/types";
import type { CanvasElement, ElementKind } from "../site/types";

/** Lo que el texto del diseño necesita saber del resto del sitio para nombrar páginas y datos. */
export interface SpecContext {
  pageName: (pageId: string) => string;
  sourceName: (sourceId: string) => string;
}

const px = (value: number) => `${Math.round(value)}px`;

/** Cómo se dice cada tipo de enlace. Uno nuevo es una entrada nueva. */
const LINKS: Record<LinkTarget["kind"], (link: never, ctx: SpecContext) => string> = {
  page: ((link: Extract<LinkTarget, { kind: "page" }>, ctx: SpecContext) => `lleva a la página «${ctx.pageName(link.pageId)}»`) as never,
  modal: ((link: Extract<LinkTarget, { kind: "modal" }>, ctx: SpecContext) => `abre «${ctx.pageName(link.pageId)}» en una ventana modal`) as never,
  "close-modal": (() => "cierra la ventana modal") as never,
  external: ((link: Extract<LinkTarget, { kind: "external" }>) => `abre ${link.url || "(sin URL)"}${link.newTab ? " en una pestaña nueva" : ""}`) as never,
};

export const describeLink = (link: LinkTarget, ctx: SpecContext): string => LINKS[link.kind](link as never, ctx);

const typography = (e: CanvasElement): string =>
  [
    e.fontFamily && `fuente ${e.fontFamily}`,
    `${px(e.fontSize)}`,
    e.bold && "negrita",
    e.italic && "cursiva",
    e.underline && "subrayado",
    `color ${e.color}`,
    `alineado ${e.align === "left" ? "a la izquierda" : e.align === "right" ? "a la derecha" : "al centro"}`,
  ]
    .filter(Boolean)
    .join(", ");

/** Lo propio de cada tipo de elemento, en una frase. Un tipo nuevo es una entrada nueva. */
const DETAILS: Record<ElementKind, (e: CanvasElement) => string> = {
  text: (e) => `texto «${e.text.replace(/\s+/g, " ").trim()}» (${typography(e)})${e.list && e.list !== "none" ? `, ${e.list === "ul" ? "lista con viñetas" : "lista numerada"}` : ""}`,
  rect: (e) => `rectángulo, relleno ${e.fill}, esquinas ${px(e.radius)}${e.text ? `, con la etiqueta «${e.text}» (${typography(e)})` : ""}`,
  ellipse: (e) => `elipse, relleno ${e.fill}${e.text ? `, con la etiqueta «${e.text}» (${typography(e)})` : ""}`,
  triangle: (e) => `triángulo, relleno ${e.fill}`,
  line: (e) => `línea ${e.flipped ? "ascendente" : "descendente"}, color ${e.fill}, grosor ${e.strokeWidth ?? 2}px`,
  image: (e) => `imagen ${e.src || "(sin origen)"}${e.alt ? `, alt «${e.alt}»` : ", sin texto alternativo"}, ajuste ${e.fit ?? "cover"}, esquinas ${px(e.radius)}`,
  video: (e) => `${e.embed ? "video incrustado" : "video"} ${e.src || "(sin origen)"}${e.autoplay ? ", autoplay" : ""}${e.muted ? ", sin sonido" : ""}${e.loop ? ", en bucle" : ""}`,
  icon: (e) => `icono «${e.icon ?? "?"}», color ${e.color}`,
};

/** Una línea que dice qué es un elemento, dónde está y a qué se enlaza o con qué dato se llena. */
export function describeElement(e: CanvasElement, links: Record<string, LinkTarget>, bindings: Record<string, string>, ctx: SpecContext): string {
  const name = e.name ? `**${e.name}** · ` : "";
  const link = links[e.id] ? `; ${describeLink(links[e.id], ctx)}` : "";
  const bound = bindings[e.id] ? `; se llena con el dato ${bindings[e.id]}` : "";
  return `${name}${DETAILS[e.kind](e)}; posición (${px(e.x)}, ${px(e.y)}), tamaño ${px(e.width)}×${px(e.height)}${link}${bound}`;
}
