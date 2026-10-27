/** Contar de un número a otro sobre el texto de un elemento (una cuenta atrás, un porcentaje de carga, una cifra que crece). */

export const MAX_COUNT_SECONDS = 30;

/** El texto que se ve en un momento de la cuenta; `progress` va de 0 a 1. */
export function countText(from: number, to: number, progress: number, suffix: string): string {
  const clamped = Math.min(1, Math.max(0, progress));
  return `${Math.round(from + (to - from) * clamped)}${suffix}`;
}

/** El primer texto con contenido dentro del elemento: se cambia su valor sin tocar los nodos que maneja React. */
function firstText(root: Element): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue?.trim()) return node as Text;
  }
  return null;
}

/** Cuenta durante `seconds` segundos; sin movimiento (o con la preferencia del sistema) muestra directo el final. */
export function countElement(element: Element | null, from: number, to: number, seconds: number, suffix: string) {
  const node = element ? firstText(element) : null;
  if (!node) return;

  if (seconds <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    node.nodeValue = countText(from, to, 1, suffix);
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const progress = (now - start) / (seconds * 1000);
    node.nodeValue = countText(from, to, progress, suffix);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
