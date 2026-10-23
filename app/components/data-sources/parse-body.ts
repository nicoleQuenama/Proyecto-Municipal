/** Convierte lo que responde una API (JSON, XML, texto…) en datos con claves. */

type Node = Record<string, unknown> | string;

function fromXml(element: Element): Node {
  const children = [...element.children];
  if (children.length === 0) return element.textContent?.trim() ?? "";

  const result: Record<string, unknown> = {};
  for (const child of children) {
    const value = fromXml(child);
    const previous = result[child.tagName];
    // Una etiqueta repetida es una lista.
    result[child.tagName] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value];
  }
  return result;
}

const PARSERS: { test: (type: string, body: string) => boolean; parse: (body: string) => unknown }[] = [
  { test: (type, body) => type.includes("json") || /^\s*[[{]/.test(body), parse: (body) => JSON.parse(body) },
  {
    test: (type, body) => type.includes("xml") || /^\s*</.test(body),
    parse: (body) => {
      const doc = new DOMParser().parseFromString(body, "text/xml");
      if (doc.querySelector("parsererror")) throw new Error("XML no válido");
      return { [doc.documentElement.tagName]: fromXml(doc.documentElement) };
    },
  },
];

export function parseBody(contentType: string, body: string): unknown {
  const type = contentType.toLowerCase();
  for (const parser of PARSERS) {
    if (!parser.test(type, body)) continue;
    try {
      return parser.parse(body);
    } catch {
      break; // si no se puede leer con su formato, se enseña como texto
    }
  }
  return { texto: body };
}
