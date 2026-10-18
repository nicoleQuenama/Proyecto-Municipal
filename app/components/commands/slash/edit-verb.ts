import { elementLabel } from "../../navigation/links";
import { duplicateComponent, isComponentNameTaken, isPageNameTaken } from "../../site/rules";
import { list, prompt } from "./steps";
import { currentPageOf, usedElements } from "./targets";
import type { SlashContext, Step } from "./types";

/** /editar: el nombre de una página, el titular, el texto de un elemento o un componente. */
export function editStep({ site, dispatch, openBuilder }: SlashContext): Step {
  const page = currentPageOf(site);

  // Los textos de los componentes de fábrica no se tocan: se editan en una copia desde «Componente».
  const editableTexts = usedElements(site).filter(({ def, element }) => def.custom && element.kind !== "image");

  return list("¿Qué quieres editar?", [
    {
      id: "page",
      label: "Nombre de una página",
      hint: "Cambia también su ruta",
      run: () =>
        list(
          "Elige la página",
          site.pages.map((target) => ({
            id: target.id,
            label: target.name,
            run: () =>
              prompt(
                `Nuevo nombre de «${target.name}»`,
                (name) => {
                  const trimmed = name.trim();
                  if (!trimmed) return "Escribe un nombre.";
                  if (isPageNameTaken(site.pages, trimmed, target.id)) return "Ya existe una página con ese nombre.";
                  dispatch({ type: "page/rename", id: target.id, name: trimmed });
                },
                target.name,
              ),
          })),
        ),
    },
    {
      id: "title",
      label: `Titular de ${page.name}`,
      hint: page.title.text,
      run: () =>
        prompt("Texto del titular", (text) => dispatch({ type: "title/patch", patch: { text } }), page.title.text),
    },
    {
      id: "text",
      label: "Texto de un elemento",
      hint: "Botones, párrafos y títulos de tus componentes",
      run: () =>
        list(
          "Elige el elemento",
          editableTexts.map(({ def, element }) => ({
            id: `${def.id}:${element.id}`,
            label: elementLabel(element),
            hint: def.name,
            run: () =>
              prompt(
                "Nuevo texto",
                (text) =>
                  dispatch({
                    type: "component/save",
                    component: {
                      ...def,
                      elements: def.elements.map((e) => (e.id === element.id ? { ...e, text } : e)),
                    },
                  }),
                element.text,
              ),
          })),
        ),
    },
    {
      id: "component",
      label: "Componente",
      hint: "Abre el constructor",
      run: () =>
        list(
          "Elige el componente",
          site.components.map((def) => ({
            id: def.id,
            label: def.name,
            hint: def.custom ? "Propio" : "De fábrica: se edita una copia",
            run: () => {
              if (def.custom) return openBuilder(def);

              let name = `${def.name} (copia)`;
              for (let n = 2; isComponentNameTaken(site.components, name); n += 1) name = `${def.name} (copia ${n})`;
              openBuilder(duplicateComponent(def, crypto.randomUUID(), name));
            },
          })),
        ),
    },
  ]);
}
