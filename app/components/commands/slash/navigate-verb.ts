import { routeOf } from "../../site/rules";
import { list } from "./steps";
import { placedBlocks } from "./targets";
import type { SlashContext, Step, Suggestion } from "./types";

/** /navegar: salta a una página o a una de sus secciones (la muestra y la selecciona). */
export function navigateStep({ site, goTo }: SlashContext): Step {
  const suggestions: Suggestion[] = site.pages.flatMap((page) => [
    { id: page.id, label: page.name, hint: `Página · ${routeOf(page)}`, run: () => goTo(page.id) },
    ...placedBlocks(site, page.id).map(({ block, def }) => ({
      id: block.id,
      label: `${page.name} › ${def.name}`,
      hint: "Sección",
      run: () => goTo(page.id, block.id),
    })),
  ]);

  return list("¿A qué página o sección vas?", suggestions);
}
