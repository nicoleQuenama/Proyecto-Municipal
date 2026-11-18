import type { ComponentDef } from "./types";

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * El nombre pedido o, si ya hay un componente con él, el mismo con un número: «Header», «Header 2»…
 * La base de datos exige un nombre distinto por componente en cada proyecto; sin esto, el guardado falla.
 */
export function uniqueComponentName(components: Pick<ComponentDef, "name">[], wanted: string): string {
  const base = wanted.trim() || "Bloque de código";
  const taken = (name: string) => components.some((c) => same(c.name, name));
  if (!taken(base)) return base;

  let counter = 2;
  while (taken(`${base} ${counter}`)) counter++;
  return `${base} ${counter}`;
}
