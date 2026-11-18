import { isPageNameTaken } from "./rules";
import type { Page } from "./types";

/** El nombre pedido o, si ya existe una página con él, el mismo con un número: «Portal», «Portal 2»… */
export function uniquePageName(pages: Page[], baseName: string): string {
  if (!isPageNameTaken(pages, baseName)) return baseName;
  let counter = 2;
  while (isPageNameTaken(pages, `${baseName} ${counter}`)) counter++;
  return `${baseName} ${counter}`;
}
