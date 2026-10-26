import { averageColor, blend, contrastRatio, readableOn } from "../color";
import { defineRule } from "../define-rule";
import { styleAction } from "../fix-helpers";
import { PAGE_BACKGROUND, pageElements, type AuditElement } from "../page-elements";
import { elementLabel } from "../../navigation/links";

const MIN_TEXT_PX = 12;
const MIN_TOUCH_PX = 44;
const hasText = (a: AuditElement) => a.element.text.trim() !== "";
const isShape = (a: AuditElement) => a.element.kind === "rect" || a.element.kind === "ellipse";

/** WCAG: el texto grande (24 px, o 18,7 px en negrita) solo necesita 3:1; el normal, 4,5:1. */
const neededRatio = ({ element }: AuditElement) => (element.fontSize >= 24 || (element.fontSize >= 18.66 && element.bold) ? 3 : 4.5);

/** El contraste real de un texto con su fondo, o null si el color no se puede calcular (variables sin valor…). */
function contrastOf(a: AuditElement) {
  const base = averageColor(PAGE_BACKGROUND)!;
  const bgRaw = averageColor(isShape(a) ? a.element.fill : a.background);
  const fgRaw = averageColor(a.element.color);
  if (!bgRaw || !fgRaw) return null;
  const bg = blend(bgRaw, base);
  const fg = blend(fgRaw, bg);
  return { ratio: contrastRatio(fg, bg), fg, bg };
}

export const contrast = defineRule({ id: "a11y-contrast", category: "accessibility", weight: 7, cap: 28, severity: "error" }, (site, page) =>
  pageElements(site, page)
    .filter(hasText)
    .flatMap((a) => {
      const measured = contrastOf(a);
      const needed = neededRatio(a);
      if (!measured || measured.ratio >= needed) return [];
      return [
        {
          title: `${elementLabel(a.element)}: contraste ${measured.ratio.toFixed(1)}:1 (mínimo ${needed}:1)`,
          why: "Si el texto se parece demasiado al color de fondo, se lee mal: sobre todo con sol, con pantallas pequeñas o con baja visión.",
          how: "Oscurece el texto o aclara el fondo hasta llegar al mínimo.",
          target: { blockId: a.block.id, elementId: a.element.id },
          fixes: [
            {
              label: "Subir contraste",
              build: () => [styleAction(page.id, a, { color: readableOn(measured.fg, measured.bg, needed) })],
            },
          ],
        },
      ];
    }),
);

export const smallText = defineRule({ id: "a11y-small-text", category: "accessibility", weight: 3, cap: 12 }, (site, page) =>
  pageElements(site, page)
    .filter((a) => hasText(a) && a.element.fontSize < MIN_TEXT_PX)
    .map((a) => ({
      title: `${elementLabel(a.element)} se ve muy pequeño (${a.element.fontSize} px)`,
      why: "Por debajo de 12 px el texto cuesta leerlo, y Google puede marcar la página como difícil de usar en móvil.",
      how: "Usa 12 px como mínimo (mejor 16 px para párrafos).",
      target: { blockId: a.block.id, elementId: a.element.id },
      fixes: [{ label: "Agrandar a 12 px", build: () => [styleAction(page.id, a, { fontSize: MIN_TEXT_PX })] }],
    })),
);

export const touchTarget = defineRule({ id: "a11y-touch-target", category: "accessibility", weight: 3, cap: 12 }, (site, page) =>
  pageElements(site, page)
    .filter((a) => a.link && Math.min(a.element.width, a.element.height) < MIN_TOUCH_PX)
    .map((a) => ({
      title: `${elementLabel(a.element)}: enlace difícil de tocar (${Math.round(a.element.width)}×${Math.round(a.element.height)} px)`,
      why: "En el móvil el dedo es grande: un enlace de menos de 44 px se falla al tocar o se toca el de al lado.",
      how: "Dale al menos 44 px de ancho y de alto.",
      target: { blockId: a.block.id, elementId: a.element.id },
      fixes: [
        {
          label: "Agrandar a 44 px",
          build: () => [
            styleAction(page.id, a, {
              width: Math.max(a.element.width, MIN_TOUCH_PX),
              height: Math.max(a.element.height, MIN_TOUCH_PX),
            }),
          ],
        },
      ],
    })),
);
