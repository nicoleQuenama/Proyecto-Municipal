import { isPageNameTaken } from "../../site/rules";
import { list, prompt } from "./steps";
import { currentPageOf } from "./targets";
import type { SlashContext, Step } from "./types";

/** /crear: una página, un componente (abre su constructor) o un bloque en la página actual. */
export function createStep({ site, dispatch, openBuilder, goTo }: SlashContext): Step {
  const page = currentPageOf(site);

  return list("¿Qué quieres crear?", [
    {
      id: "page",
      label: "Página",
      hint: "Una página nueva en el sitio",
      run: () =>
        prompt("Nombre de la página nueva", (name) => {
          const trimmed = name.trim();
          if (!trimmed) return "Escribe un nombre.";
          if (isPageNameTaken(site.pages, trimmed)) return "Ya existe una página con ese nombre.";

          const id = crypto.randomUUID();
          dispatch({ type: "page/create", id, name: trimmed });
          goTo(id);
        }),
    },
    {
      id: "component",
      label: "Componente",
      hint: "Abre el constructor de componentes",
      run: () => openBuilder("new"),
    },
    {
      id: "block",
      label: `Bloque en ${page.name}`,
      hint: "Agrega un componente a la página actual",
      run: () =>
        list(
          "Elige el componente",
          site.components.map((def) => ({
            id: def.id,
            label: def.name,
            hint: def.description,
            run: () => {
              const id = crypto.randomUUID();
              dispatch({ type: "block/add", id, componentId: def.id });
              goTo(page.id, id);
            },
          })),
        ),
    },
  ]);
}
