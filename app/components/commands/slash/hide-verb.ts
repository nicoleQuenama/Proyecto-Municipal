import { elementLabel } from "../../navigation/links";
import { isHidden } from "../../site/hiding";
import type { HideTarget } from "../../site/types";
import { list } from "./steps";
import { placedBlocks, placedElements } from "./targets";
import type { SlashContext, Step, Suggestion } from "./types";

/** /ocultar: oculta o vuelve a mostrar una página, sección, titular, texto, imagen o cualquier elemento. */
export function hideStep({ site, dispatch }: SlashContext): Step {
  const toggle = (target: HideTarget, label: string, where?: string): Suggestion => {
    const hidden = isHidden(site, target);
    const state = hidden ? "Oculto · Enter para mostrar" : "Visible · Enter para ocultar";
    return {
      id: JSON.stringify(target),
      label,
      hint: where ? `${where} · ${state}` : state,
      run: () => dispatch({ type: "hidden/set", target, hidden: !hidden }),
    };
  };

  return list("¿Qué quieres ocultar o mostrar?", [
    {
      id: "page",
      label: "Página",
      hint: "No aparece en la vista previa",
      run: () => list("Elige la página", site.pages.map((page) => toggle({ kind: "page", pageId: page.id }, page.name))),
    },
    {
      id: "block",
      label: "Sección o bloque",
      hint: "Un componente colocado en una página",
      run: () =>
        list(
          "Elige el bloque",
          placedBlocks(site).map(({ page, block, def }) =>
            toggle({ kind: "block", pageId: page.id, blockId: block.id }, def.name, page.name),
          ),
        ),
    },
    {
      id: "element",
      label: "Elemento de un bloque",
      hint: "Texto, botón, imagen o forma; solo en ese bloque",
      run: () =>
        list(
          "Elige el elemento",
          placedElements(site).map(({ page, block, def, element }) =>
            toggle(
              { kind: "element", pageId: page.id, blockId: block.id, elementId: element.id },
              elementLabel(element),
              `${page.name} · ${def.name}`,
            ),
          ),
        ),
    },
    {
      id: "title",
      label: "Titular",
      hint: "El título principal de una página",
      run: () =>
        list(
          "Elige la página",
          site.pages.map((page) => toggle({ kind: "title", pageId: page.id }, `Titular de ${page.name}`)),
        ),
    },
    {
      id: "media",
      label: "Imagen o video",
      hint: "Un medio de una página",
      run: () =>
        list(
          "Elige el medio",
          site.pages.flatMap((page) =>
            page.media.map((item) => toggle({ kind: "media", pageId: page.id, mediaId: item.id }, item.name, page.name)),
          ),
        ),
    },
  ]);
}
