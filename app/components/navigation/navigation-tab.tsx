"use client";

import { Badge } from "../ui/badge";
import { Collapsible } from "../ui/collapsible";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import type { ComponentDef } from "../site/types";
import { FlowMap } from "./flow-map";
import { LinkEditor } from "./link-editor";
import { elementLabel, isLinkable, linkLabel } from "./links";
import { TransitionFields } from "./transition-fields";

/** Los elementos de un componente que se pueden marcar como enlace. */
function ComponentLinks({ def }: { def: ComponentDef }) {
  const { pages } = useSite();
  const dispatch = useSiteDispatch();
  const elements = def.elements.filter(isLinkable);
  const linked = elements.filter((element) => def.links[element.id]).length;

  return (
    <details className="rounded-lg border border-line">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13px] font-medium select-none hover:bg-hover">
        <span className="min-w-0 flex-1 truncate">{def.name}</span>
        {linked > 0 && <Badge tone="accent">{linked} {linked === 1 ? "enlace" : "enlaces"}</Badge>}
      </summary>

      <ul className="flex flex-col gap-3 border-t border-line p-3">
        {elements.map((element) => {
          const link = def.links[element.id];
          return (
            <li key={element.id} className="flex flex-col gap-1.5">
              <p className="flex items-center justify-between gap-2 text-xs font-medium">
                <span className="truncate">{elementLabel(element)}</span>
                {link && <span className="shrink-0 text-ink-dim">{linkLabel(link, pages)}</span>}
              </p>
              <LinkEditor
                label={elementLabel(element)}
                link={link}
                onChange={(next) =>
                  dispatch({ type: "link/set", componentId: def.id, elementId: element.id, link: next })
                }
              />
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** Cómo se mueve el visitante: la transición por defecto, el mapa de flujo y los enlaces de la página. */
export function NavigationTab() {
  const { navigation, components } = useSite();
  const dispatch = useSiteDispatch();
  const page = useCurrentPage();

  // Cada componente una sola vez, aunque esté repetido en la página.
  const defs = [...new Set(page.blocks.map((block) => block.componentId))].flatMap((id) => {
    const def = components.find((c) => c.id === id);
    return def && def.elements.some(isLinkable) ? [def] : [];
  });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-ink-dim">
        Para enlazar, pasa el cursor sobre cualquier texto, botón o imagen (en una barra, en el contenido o en un
        pie) y arrastra su ícono de enlace hasta una página. Un clic en el ícono abre más opciones.
      </p>

      <Collapsible title="Transición entre páginas">
        <TransitionFields
          label="Por defecto"
          value={navigation.defaultTransition}
          onChange={(transition) => dispatch({ type: "nav/transition", transition })}
        />
        <p className="text-xs text-ink-dim">
          Se reproduce al probar la navegación. Cada enlace puede tener la suya.
        </p>
      </Collapsible>

      <Collapsible title="Mapa de navegación">
        <FlowMap />
      </Collapsible>

      <Collapsible title={`Enlaces de ${page.name}`}>
        {defs.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {defs.map((def) => (
              <ComponentLinks key={def.id} def={def} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-dim">
            Esta página no tiene componentes con texto o imágenes. Agrega una barra de navegación o un botón desde
            Componentes.
          </p>
        )}
        <p className="text-xs text-ink-dim">
          Los enlaces de un componente valen en todas las páginas donde se use.
        </p>
      </Collapsible>
    </div>
  );
}
