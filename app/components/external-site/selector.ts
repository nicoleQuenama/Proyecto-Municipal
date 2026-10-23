/** Cómo se llama cada etiqueta en el panel. Una etiqueta nueva es una entrada nueva. */
const TAG_NAMES: Record<string, string> = {
  h1: "Título", h2: "Subtítulo", h3: "Subtítulo", h4: "Subtítulo", p: "Párrafo", a: "Enlace", button: "Botón",
  img: "Imagen", li: "Elemento de lista", span: "Texto", section: "Sección", header: "Cabecera", footer: "Pie",
  nav: "Menú", form: "Formulario", input: "Campo", label: "Etiqueta", div: "Bloque", video: "Video",
};

const SNIPPET_LENGTH = 28;

export function labelOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? el.getAttribute("alt") ?? "").replace(/\s+/g, " ").trim();
  const snippet = text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text;
  return `${TAG_NAMES[tag] ?? tag}${snippet ? ` · ${snippet}` : ""}`;
}

/** Un tramo del camino: la etiqueta, y su posición entre hermanos del mismo tipo si hace falta. */
function segmentOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const sameTag = [...(el.parentElement?.children ?? [])].filter((other) => other.tagName === el.tagName);
  return sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(el) + 1})` : tag;
}

const matchesOnly = (doc: Document, selector: string, el: Element): boolean => {
  try {
    const found = doc.querySelectorAll(selector);
    return found.length === 1 && found[0] === el;
  } catch {
    return false;
  }
};

/** El selector más corto que encuentra solo a ese elemento: por id, o por el camino desde la raíz acortado. */
export function selectorOf(el: Element): string {
  const doc = el.ownerDocument;
  if (el.id && matchesOnly(doc, `#${CSS.escape(el.id)}`, el)) return `#${CSS.escape(el.id)}`;

  const path: string[] = [];
  for (let node: Element | null = el; node && node !== doc.documentElement; node = node.parentElement) {
    path.unshift(segmentOf(node));
    const selector = path.join(" > ");
    if (matchesOnly(doc, selector, el)) return selector;
  }
  return path.join(" > ");
}
