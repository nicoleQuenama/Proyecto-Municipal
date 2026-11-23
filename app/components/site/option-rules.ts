import type { CanvasElement, ComponentDef } from "./types";

/** El control que lista las opciones (pestañas o radios) de un componente de tarjetas por opción. */
const isOptionsControl = (element: CanvasElement): boolean =>
  element.control?.name === "opcion" || (element.control?.kind === "input" && element.control?.inputType === "radio");

/** El número de opción que lleva un id (`…-opt2-c1-card` → 2), o `null` si no es de una opción. */
const optionNumberOf = (id: string): number | null => {
  const match = id.match(/-opt(\d+)-/);
  return match ? Number(match[1]) : null;
};

/** El mismo id, pero de la opción `to`. */
const renumber = (id: string, from: number, to: number): string => id.replace(`-opt${from}-`, `-opt${to}-`);

/** Agrega una opción al final, sin tarjetas: las tarjetas se le agregan con «Agregar tarjeta». */
export function addOption(def: ComponentDef, label?: string): { component: ComponentDef; optionKey: string } | null {
  const index = def.elements.findIndex(isOptionsControl);
  if (index < 0) return null;

  const options = def.elements[index].control?.options ?? [];
  const name = label?.trim() || `Opción ${options.length + 1}`;
  const elements = def.elements.map((element, i) =>
    i === index ? { ...element, control: { ...element.control!, options: [...options, name] } } : element,
  );
  return { component: { ...def, elements }, optionKey: `opt${options.length + 1}` };
}

/**
 * Quita una opción con todas sus tarjetas y renumera las que venían después, para que las opciones sigan siendo
 * `opt1…optN` sin huecos (el número del id es lo que une cada tarjeta con su opción). Siempre queda al menos una.
 */
export function removeOption(def: ComponentDef, optionIndex: number): ComponentDef {
  const index = def.elements.findIndex(isOptionsControl);
  if (index < 0) return def;

  const options = def.elements[index].control?.options ?? [];
  if (options.length <= 1 || optionIndex < 0 || optionIndex >= options.length) return def;

  const removed = optionIndex + 1;
  const dropped = new Set<string>();
  const kept = def.elements.filter((element) => {
    const number = optionNumberOf(element.id);
    if (number === removed) dropped.add(element.id);
    return number !== removed;
  });

  const shift = (id: string): string => {
    const number = optionNumberOf(id);
    return number !== null && number > removed ? renumber(id, number, number - 1) : id;
  };

  const elements = kept.map((element) => {
    const moved = { ...element, id: shift(element.id), ...(element.parentId ? { parentId: shift(element.parentId) } : {}) };
    return isOptionsControl(element)
      ? { ...moved, control: { ...element.control!, options: options.filter((_, i) => i !== optionIndex) } }
      : moved;
  });

  const links = Object.fromEntries(
    Object.entries(def.links ?? {})
      .filter(([id]) => !dropped.has(id))
      .map(([id, target]) => [shift(id), target]),
  );

  return { ...def, elements, links };
}
