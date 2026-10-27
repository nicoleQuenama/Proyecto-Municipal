"use client";

import { readClip } from "../site/clipboard";
import { ORDER_LABELS, type OrderMove } from "../site/order-rules";
import { selectionOf } from "../site/multi-select";
import { copySelection, pasteAction } from "../site/paste-actions";
import { useSite, useSiteDispatch } from "../site/site-context";
import { MenuGroup } from "./format-controls";

/** Copiar, duplicar, pegar y unir: valen para la sección sobre la que se abrió el menú o para todas las seleccionadas. */
export function SelectionActions({ pageId, blockId, close }: { pageId: string; blockId: string; close: () => void }) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const picked = selectionOf(site);
  const ids = picked.includes(blockId) ? picked : [blockId];
  const many = ids.length > 1;

  const actions = [
    { label: many ? `Copiar ${ids.length} secciones` : "Copiar", run: () => void copySelection(site, pageId, ids) },
    { label: "Duplicar", run: () => dispatch(pasteAction(pageId, copySelection(site, pageId, ids))) },
    ...(readClip().length > 0 ? [{ label: "Pegar", run: () => dispatch(pasteAction(pageId, readClip())) }] : []),
    ...(many
      ? [{ label: `Unir ${ids.length} secciones en una`, run: () => dispatch({ type: "blocks/join", pageId, blockIds: ids, blockId: crypto.randomUUID(), componentId: crypto.randomUUID() }) }]
      : []),
  ];

  const order = (Object.keys(ORDER_LABELS) as OrderMove[]).map((to) => ({
    label: ORDER_LABELS[to],
    run: () => dispatch({ type: "block/order", pageId, blockIds: ids, to }),
  }));

  return (
    <MenuGroup title="Selección">
      <div className="flex flex-col">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              action.run();
              close();
            }}
            className="h-8 rounded-md px-2 text-left text-xs text-ink hover:bg-hover"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="mt-1 flex flex-col border-t border-line pt-1">
        {order.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              action.run();
              close();
            }}
            className="h-8 rounded-md px-2 text-left text-xs text-ink hover:bg-hover"
          >
            {action.label}
          </button>
        ))}
      </div>
    </MenuGroup>
  );
}
