import { plural } from "../../versioning/versioning-rules";
import { confirm, list } from "./steps";
import { currentPageOf, placedBlocks } from "./targets";
import type { SlashContext, Step, Suggestion } from "./types";

/** /eliminar: siempre pide confirmar antes de borrar. */
export function deleteStep({ site, dispatch, removeMedia }: SlashContext): Step {
  const page = currentPageOf(site);

  const choice = (id: string, label: string, hint: string, remove: () => void): Suggestion => ({
    id,
    label,
    hint,
    run: () => confirm(`¿Eliminar «${label}»? ${hint}`, remove),
  });

  const usageOf = (componentId: string) =>
    placedBlocks(site).filter(({ def }) => def.id === componentId).length;

  return list("¿Qué quieres eliminar?", [
    {
      id: "page",
      label: "Página",
      hint: "Se pierden sus bloques y medios",
      run: () =>
        list(
          "Elige la página",
          site.pages
            .filter((target) => !target.isHome)
            .map((target) =>
              choice(
                target.id,
                target.name,
                `Se perderán ${plural(target.blocks.length, "bloque", "bloques")} y ${plural(target.media.length, "medio", "medios")}.`,
                () => dispatch({ type: "page/delete", id: target.id }),
              ),
            ),
        ),
    },
    {
      id: "block",
      label: `Bloque de ${page.name}`,
      hint: "Quita un componente de la página actual",
      run: () =>
        list(
          "Elige el bloque",
          placedBlocks(site, page.id).map(({ block, def }) =>
            choice(block.id, def.name, "Se quita de esta página.", () => dispatch({ type: "block/remove", id: block.id })),
          ),
        ),
    },
    {
      id: "component",
      label: "Componente propio",
      hint: "Desaparece de todas las páginas",
      run: () =>
        list(
          "Elige el componente",
          site.components
            .filter((def) => def.custom)
            .map((def) =>
              choice(def.id, def.name, `Se quitará de ${plural(usageOf(def.id), "bloque", "bloques")}.`, () =>
                dispatch({ type: "component/delete", id: def.id }),
              ),
            ),
        ),
    },
    {
      id: "media",
      label: `Imagen o video de ${page.name}`,
      hint: "Quita un medio de la página actual",
      run: () =>
        list(
          "Elige el medio",
          page.media.map((item) => choice(item.id, item.name, "Se quita de esta página.", () => removeMedia(item.id))),
        ),
    },
    {
      id: "variable",
      label: "Variable de estilo",
      hint: "Las reglas que la usan dejan de tener valor",
      run: () =>
        list(
          "Elige la variable",
          site.variables.map((variable) =>
            choice(variable.id, `--${variable.name}`, variable.value, () =>
              dispatch({ type: "variable/delete", id: variable.id }),
            ),
          ),
        ),
    },
  ]);
}
