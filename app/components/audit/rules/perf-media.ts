import { defineRule } from "../define-rule";
import { dataUrlKb } from "../fix-helpers";
import { pageElements } from "../page-elements";
import { elementLabel } from "../../navigation/links";

const HEAVY_EXT = /\.(jpe?g|png|bmp|gif|tiff?)$/i;
const SIZE_HINT = /[?&](w|width|h|height|size|resize|fit|q|quality)=|\/(w|c|resize)_/i;
const BIG_UPLOAD_KB = 300;

/** Por qué una imagen pesa de más (o null si parece bien). */
function sizeProblem(src: string): string | null {
  const kb = dataUrlKb(src);
  if (kb > BIG_UPLOAD_KB) return `El archivo subido pesa ${kb} KB (más de ${BIG_UPLOAD_KB} KB)`;
  if (!src.startsWith("http")) return null;
  const path = src.split(/[?#]/)[0];
  return HEAVY_EXT.test(path) && !SIZE_HINT.test(src) ? "La imagen se pide a su tamaño original, sin reducirla" : null;
}

/** Imágenes más pesadas o más grandes de lo que la página necesita. */
export const imageSize = defineRule({ id: "perf-image-size", category: "performance", weight: 5, cap: 20 }, (site, page, dom) => {
  const fromElements = pageElements(site, page)
    .filter((a) => a.element.kind === "image" && a.element.src)
    .flatMap((a) => {
      const shown = dom?.images.find((i) => i.src === a.element.src);
      const oversize = shown && shown.shownWidth > 0 && shown.naturalWidth > shown.shownWidth * 2.5;
      const problem = oversize
        ? `La imagen real mide ${shown.naturalWidth} px y se muestra a ${Math.round(shown.shownWidth)} px`
        : sizeProblem(a.element.src);
      return problem ? [{ problem, name: elementLabel(a.element), target: { blockId: a.block.id, elementId: a.element.id } }] : [];
    });
  const fromMedia = page.media
    .filter((m) => m.kind === "image" && !m.embed)
    .flatMap((m) => {
      const problem = sizeProblem(m.src);
      return problem ? [{ problem, name: `Medio «${m.name}»`, target: { mediaId: m.id } }] : [];
    });

  return [...fromElements, ...fromMedia].map(({ problem, name, target }) => ({
    title: `${name}: ${problem}`,
    why: "Las imágenes son lo que más pesa en una página. Una foto de 4 MB en un teléfono con datos móviles tarda segundos y gasta datos de más.",
    how: "Comprímela (squoosh.app), exporta en WebP o AVIF a ~2× el tamaño con que se muestra y vuelve a subirla.",
    target,
  }));
});

/** Imágenes y videos sin tamaño reservado: la página «salta» al cargarlos. */
export const reservedSize = defineRule({ id: "perf-reserved-size", category: "performance", weight: 4, cap: 12 }, (site, page) => {
  const fromElements = pageElements(site, page)
    .filter((a) => (a.element.kind === "image" || a.element.kind === "video") && (a.element.width <= 0 || a.element.height <= 0))
    .map((a) => ({ name: elementLabel(a.element), target: { blockId: a.block.id, elementId: a.element.id } }));
  const fromMedia = page.media
    .filter((m) => !m.hidden && !m.placement)
    .map((m) => ({ name: `Medio «${m.name}»`, target: { mediaId: m.id } }));

  return [...fromElements, ...fromMedia].map(({ name, target }) => ({
    title: `${name} sin ancho y alto reservados`,
    why: "Si el navegador no sabe cuánto espacio ocupa la imagen, el texto de abajo da un salto cuando carga (se llama CLS y molesta al leer).",
    how: "Colócalo en una posición fija con ancho y alto definidos.",
    target,
  }));
});

/** Videos: el reproductor incrustado pesa, y el autoplay con sonido molesta (y los navegadores lo bloquean). */
export const embeddedVideo = defineRule({ id: "perf-video", category: "performance", weight: 4, cap: 12 }, (site, page) => {
  const videos = pageElements(site, page).filter((a) => a.element.kind === "video" && a.element.src);
  const sources = [
    ...videos.map((a) => ({
      embed: Boolean(a.element.embed),
      loud: a.element.embed ? /autoplay=1/i.test(a.element.src) && !/mute=1|muted=1/i.test(a.element.src) : a.element.autoplay === true && a.element.muted !== true,
      target: { blockId: a.block.id, elementId: a.element.id },
    })),
    ...page.media.filter((m) => m.kind === "video" && m.embed).map((m) => ({ embed: true, loud: /autoplay=1/i.test(m.src) && !/mute=1/i.test(m.src), target: { mediaId: m.id } })),
  ];
  return sources
    .filter((v) => v.embed || v.loud)
    .map(({ loud, target }) => ({
      severity: loud ? ("error" as const) : ("warning" as const),
      points: loud ? 8 : 3,
      title: loud ? "Video con reproducción automática y sonido" : "Video incrustado que se carga al abrir la página",
      why: loud
        ? "Los navegadores lo bloquean y a quien visita le molesta que suene solo."
        : "El reproductor de YouTube o Vimeo descarga cientos de KB aunque nadie lo reproduzca, y retrasa la carga.",
      how: loud ? "Quita la reproducción automática o silencia el video." : "Pon una imagen de portada y carga el video solo al tocarla.",
      target,
    }));
});
