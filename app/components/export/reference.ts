import type { CanvasElement, ComponentDef, ElementKind } from "../site/types";

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const px = (value: number) => `${Math.round(value)}px`;

/** El CSS que todo elemento comparte: su caja, exactamente donde está en el diseño. */
const box = (e: CanvasElement) => `position:absolute;left:${px(e.x)};top:${px(e.y)};width:${px(e.width)};height:${px(e.height)};`;

const decorationOf = (e: CanvasElement): string =>
  [e.underline && "underline", e.strike && "line-through", e.overline && "overline"].filter(Boolean).join(" ");

const font = (e: CanvasElement) =>
  `font-family:${e.fontFamily || "inherit"};font-size:${px(e.fontSize)};font-weight:${e.bold ? 700 : 400};color:${e.color};text-align:${e.align};` +
  `${e.italic ? "font-style:italic;" : ""}${decorationOf(e) ? `text-decoration:${decorationOf(e)};` : ""}`;

/** Un elemento con texto encima (una forma con etiqueta). */
const labelled = (e: CanvasElement) =>
  e.text ? `<span style="${font(e)}display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${esc(e.text)}</span>` : "";

/** Cómo se escribe cada tipo de elemento: su CSS propio y su HTML. Un tipo nuevo es una entrada nueva. */
const WRITERS: Record<ElementKind, (e: CanvasElement) => { style: string; html: string }> = {
  text: (e) => ({ style: `${font(e)}white-space:pre-wrap;line-height:1.2;`, html: esc(e.text) }),
  rect: (e) => ({ style: `background:${e.fill};border-radius:${px(e.radius)};`, html: labelled(e) }),
  ellipse: (e) => ({ style: `background:${e.fill};border-radius:50%;`, html: labelled(e) }),
  triangle: (e) => ({ style: `background:${e.fill};clip-path:polygon(50% 0,0 100%,100% 100%);`, html: "" }),
  line: (e) => ({
    style: "",
    html: `<svg width="100%" height="100%" viewBox="0 0 ${Math.max(1, e.width)} ${Math.max(1, e.height)}" preserveAspectRatio="none"><line x1="0" y1="${e.flipped ? e.height : 0}" x2="${e.width}" y2="${e.flipped ? 0 : e.height}" stroke="${e.fill}" stroke-width="${e.strokeWidth ?? 2}"/></svg>`,
  }),
  image: (e) => ({ style: `border-radius:${px(e.radius)};overflow:hidden;`, html: `<img src="${esc(e.src)}" alt="${esc(e.alt ?? "")}" style="width:100%;height:100%;object-fit:${e.fit ?? "cover"};">` }),
  video: (e) => ({
    style: `border-radius:${px(e.radius)};overflow:hidden;`,
    html: e.embed
      ? `<iframe src="${esc(e.src)}" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>`
      : `<video src="${esc(e.src)}" ${e.poster ? `poster="${esc(e.poster)}" ` : ""}${e.autoplay ? "autoplay " : ""}${e.muted ? "muted " : ""}${e.loop ? "loop " : ""}controls style="width:100%;height:100%;object-fit:${e.fit ?? "cover"};"></video>`,
  }),
  icon: (e) => ({ style: `color:${e.color};`, html: `<span data-icon="${esc(e.icon ?? "")}" aria-hidden="true">[icono: ${esc(e.icon ?? "?")}]</span>` }),
};

/**
 * La referencia «fiel»: HTML y CSS con cada elemento en su posición exacta. No es código para dejar así
 * (usa posiciones absolutas): sirve de verdad visual para rehacerlo bien en el proyecto.
 */
export function buildReference(view: ComponentDef): { html: string; css: string } {
  const shown = view.elements.filter((element) => !element.hidden);
  const rules: string[] = [`.cms-section{position:relative;width:${px(view.width)};height:${px(view.height)};}`];
  const parts = shown.map((element, index) => {
    const { style, html } = WRITERS[element.kind](element);
    const cls = `cms-el-${index + 1}`;
    rules.push(`.${cls}{${box(element)}${style}}`);
    const tag = element.kind === "text" ? "p" : "div";
    return `  <${tag} class="${cls}"${element.name ? ` data-name="${esc(element.name)}"` : ""}>${html}</${tag}>`;
  });
  return { html: `<section class="cms-section">\n${parts.join("\n")}\n</section>`, css: rules.join("\n") };
}
