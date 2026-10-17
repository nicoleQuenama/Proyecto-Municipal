"use client";

import type { KeyboardEvent } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { ComponentView, type ElementInteraction } from "./component-view";
import { splitBlocks } from "./rules";
import { useSite, useSiteDispatch } from "./site-context";
import type { Page } from "./types";

interface PageBlocksProps {
  page: Page;
  /** Solo los bloques de la página actual se seleccionan y se quitan. */
  interactive: boolean;
  /** Las barras de navegación van arriba, antes del titular; el resto, debajo. */
  slot: "top" | "body";
}

/** Los componentes colocados en la página actual, con las reglas de apariencia aplicadas. */
export function PageBlocks({ page, interactive, slot }: PageBlocksProps) {
  const { components, pages, selectedId } = useSite();
  const dispatch = useSiteDispatch();
  const styles = useStyles(page.id);
  const { mode, followLink, startConnect } = useNavigation();

  const blocks = splitBlocks(page, components)[slot === "top" ? "top" : "body"];
  if (blocks.length === 0) return null;

  const editing = interactive && mode === "edit";

  return (
    <div
      className={`flex flex-col gap-6 ${slot === "top" ? "mb-6" : "mt-8"}`}
      style={{ gap: styles.page.gap }}
    >
      {blocks.map((block) => {
        const def = components.find((c) => c.id === block.componentId);
        if (!def) return null;

        const selected = editing && block.id === selectedId;
        const select = () => dispatch({ type: "block/select", id: block.id });
        const box = boxStyle(styles.block(def));

        // Conectar y probar valen en todas las páginas; editar, solo en la actual.
        const interaction: ElementInteraction | undefined = mode === "edit"
          ? undefined
          : {
              mode,
              links: def.links,
              pages,
              onFollow: followLink,
              onConnect: (elementId, origin) => startConnect(def.id, elementId, origin),
            };

        return (
          <div
            key={block.id}
            className={`group relative w-fit max-w-full rounded-md ${
              selected ? "ring-2 ring-accent" : editing ? "hover:ring-1 hover:ring-accent/50" : ""
            }`}
            style={{ margin: box.margin }}
          >
            <div
              {...(editing
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-pressed": selected,
                    "aria-label": `Seleccionar ${def.name}`,
                    onClick: select,
                    onKeyDown: (e: KeyboardEvent) => e.key === "Enter" && select(),
                  }
                : {})}
              className="max-w-full overflow-x-auto p-1"
              style={{ padding: box.padding, background: box.background, borderRadius: box.borderRadius }}
            >
              <ComponentView def={styles.component(def)} interaction={interaction} />
            </div>

            {editing && (
              <button
                type="button"
                aria-label={`Quitar ${def.name} de la página`}
                onClick={() => dispatch({ type: "block/remove", id: block.id })}
                className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white group-hover:flex focus:flex"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
