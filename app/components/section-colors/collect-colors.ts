import type { CanvasElement, ComponentDef } from "../site/types";

/** Lo que de un elemento tiene color: su relleno y el de su texto. */
export type ElementColorProp = "fill" | "color";

/** Un color de la sección y todo lo que lo usa. */
export interface ColorGroup {
  /** El color tal como se muestra y se compara (minúsculas). */
  value: string;
  /** Los elementos que lo usan, por propiedad. */
  elements: Record<ElementColorProp, string[]>;
  /** La caja de la sección lo usa de fondo. */
  box: boolean;
}

const HEX_3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const NO_COLOR = new Set(["", "transparent", "none", "inherit", "currentcolor"]);

/** `#abc` → `#aabbcc`; cualquier otro valor se compara en minúsculas. */
export function normalizeColor(value: string): string {
  const short = HEX_3.exec(value.trim());
  return (short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : value.trim()).toLowerCase();
}

/** Cada tipo de elemento declara qué propiedades de color se ven en él. */
const COLOR_PROPS: Record<CanvasElement["kind"], (element: CanvasElement) => ElementColorProp[]> = {
  rect: (element) => (element.text ? ["fill", "color"] : ["fill"]),
  ellipse: (element) => (element.text ? ["fill", "color"] : ["fill"]),
  triangle: () => ["fill"],
  line: () => ["fill"],
  text: () => ["fill", "color"],
  image: () => [],
  video: () => [],
  icon: () => ["color"],
};

/** Los colores distintos que se ven en una sección, en el orden en que aparecen (primero el fondo de la caja). */
export function collectColors(view: ComponentDef, boxBackground: string | undefined): ColorGroup[] {
  const groups = new Map<string, ColorGroup>();

  const groupOf = (raw: string | undefined): ColorGroup | null => {
    if (!raw || NO_COLOR.has(raw.trim().toLowerCase())) return null;
    const value = normalizeColor(raw);
    if (!groups.has(value)) groups.set(value, { value, elements: { fill: [], color: [] }, box: false });
    return groups.get(value)!;
  };

  const boxGroup = groupOf(boxBackground);
  if (boxGroup) boxGroup.box = true;

  for (const element of view.elements) {
    if (element.hidden) continue;
    for (const prop of COLOR_PROPS[element.kind](element)) groupOf(element[prop])?.elements[prop].push(element.id);
  }
  return [...groups.values()];
}
