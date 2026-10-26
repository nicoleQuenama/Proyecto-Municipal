"use client";

import { hiddenItems } from "../site/hidden-items";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";

/** Lo oculto de la página, con un botón por cosa y otro para limpiar todo de golpe. */
export function HiddenList({ page }: { page: Page }) {
  const { components } = useSite();
  const dispatch = useSiteDispatch();
  const items = hiddenItems(page, components);
  if (items.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
      <p className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
        Ocultos · {items.length}
        <button
          type="button"
          onClick={() => dispatch({ type: "hidden/purge", pageId: page.id })}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-red-400 normal-case hover:bg-red-500/15"
        >
          Eliminar todos
        </button>
      </p>
      <ul aria-label="Elementos ocultos" className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-1 text-[12px] text-ink-dim">
            <span className="min-w-0 flex-1 truncate px-2">{item.label}</span>
            <button
              type="button"
              aria-label={`Eliminar definitivamente ${item.label}`}
              title="Eliminar definitivamente"
              onClick={() => dispatch(item.remove)}
              className="h-6 w-6 shrink-0 rounded-md hover:bg-hover hover:text-red-400"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
