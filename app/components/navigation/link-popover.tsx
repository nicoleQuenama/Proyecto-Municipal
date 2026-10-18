"use client";

import { useRef } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import { useDismiss } from "../ui/use-dismiss";
import { LinkEditor } from "./link-editor";
import { elementLabel } from "./links";
import { useNavigation } from "./navigation-context";

const WIDTH = 288;
const MARGIN = 12;

/** El editor del enlace de un elemento, junto al ícono que se pulsó. */
export function LinkPopover() {
  const { linkEditor, closeLinkEditor } = useNavigation();
  const { components } = useSite();
  const dispatch = useSiteDispatch();
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, linkEditor !== null, closeLinkEditor);

  const def = components.find((c) => c.id === linkEditor?.componentId);
  const element = def?.elements.find((e) => e.id === linkEditor?.elementId);
  if (!linkEditor || !def || !element) return null;

  const left = Math.min(Math.max(MARGIN, linkEditor.anchor.x - WIDTH / 2), window.innerWidth - WIDTH - MARGIN);
  const top = Math.min(linkEditor.anchor.y + MARGIN, window.innerHeight - 320);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Enlace de ${elementLabel(element)}`}
      className="fixed z-[70] flex flex-col gap-3 rounded-xl border border-line bg-panel p-3 text-ink shadow-2xl"
      style={{ left, top, width: WIDTH }}
    >
      <p className="flex items-center justify-between gap-2 text-xs font-medium">
        <span className="truncate">{elementLabel(element)}</span>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={closeLinkEditor}
          className="rounded px-1.5 text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </p>

      <LinkEditor
        label={elementLabel(element)}
        link={def.links[element.id]}
        onChange={(link) =>
          dispatch({ type: "link/set", componentId: def.id, elementId: element.id, link })
        }
      />
      <p className="text-[11px] text-ink-dim">Vale en todas las páginas donde se use este componente.</p>
    </div>
  );
}
