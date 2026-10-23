import { toHex, toPixels } from "./css-values";
import type { PatchKind } from "../types";

export type InputKind = "text" | "textarea" | "color" | "px" | "align";

/** Una cosa que se puede cambiar de un elemento: qué es, cómo se edita y cuándo tiene sentido ofrecerla. */
export interface EditSpec {
  id: string;
  label: string;
  kind: Extract<PatchKind, "text" | "attr" | "style">;
  /** Atributo o propiedad CSS; el texto no lo necesita. */
  name: string;
  input: InputKind;
  applies: (el: Element) => boolean;
  read: (el: Element) => string;
}

const tagIs = (...tags: string[]) => (el: Element) => tags.includes(el.tagName.toLowerCase());
const computed = (el: Element, prop: string) => el.ownerDocument.defaultView?.getComputedStyle(el).getPropertyValue(prop) ?? "";
const style = (id: string, label: string, name: string, input: InputKind, read: EditSpec["read"]): EditSpec => ({
  id, label, kind: "style", name, input, applies: () => true, read,
});

/** Lo que se ofrece cambiar, en orden. Algo nuevo es una entrada nueva. */
export const EDIT_SPECS: EditSpec[] = [
  {
    id: "text", label: "Texto", kind: "text", name: "", input: "textarea",
    applies: (el) => el.children.length === 0 && !!el.textContent?.trim(),
    read: (el) => el.textContent ?? "",
  },
  { id: "src", label: "Imagen (URL)", kind: "attr", name: "src", input: "text", applies: tagIs("img"), read: (el) => el.getAttribute("src") ?? "" },
  { id: "alt", label: "Texto alternativo", kind: "attr", name: "alt", input: "text", applies: tagIs("img"), read: (el) => el.getAttribute("alt") ?? "" },
  { id: "href", label: "Enlace (URL)", kind: "attr", name: "href", input: "text", applies: tagIs("a"), read: (el) => el.getAttribute("href") ?? "" },
  style("color", "Color de texto", "color", "color", (el) => toHex(computed(el, "color"))),
  style("background", "Fondo", "background-color", "color", (el) => toHex(computed(el, "background-color"))),
  style("size", "Tamaño de letra (px)", "font-size", "px", (el) => toPixels(computed(el, "font-size"))),
  style("align", "Alineación", "text-align", "align", (el) => computed(el, "text-align")),
  style("radius", "Esquinas (px)", "border-radius", "px", (el) => toPixels(computed(el, "border-top-left-radius"))),
  style("padding", "Relleno (px)", "padding", "px", (el) => toPixels(computed(el, "padding-top"))),
];

/** El valor a guardar de un campo: los píxeles llevan su unidad. */
export const cssValue = (input: InputKind, value: string): string => (input === "px" && value ? `${value}px` : value);
