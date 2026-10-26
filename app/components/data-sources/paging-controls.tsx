"use client";

import { useSite, useSiteDispatch } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import { ColorInput } from "../ui/color-input";
import { field } from "./binding-controls";
import { clampSize, MAX_SIZE } from "./paging";
import type { RepeatPaging } from "./types";
import { useDataDrop } from "./use-data-drop";
import { usesServerPaging } from "./url-tokens";

/** Paginación sin código: cuántos elementos por página, de dónde sale el total y cómo se ve la barra. */
export function PagingControls({ pageId, block }: { pageId: string; block: BlockInstance }) {
  const dispatch = useSiteDispatch();
  const { sources } = useSite();
  const source = sources.find((s) => s.id === block.repeat?.sourceId);
  const paging = block.repeatPaging;
  const server = !!source && usesServerPaging(source.url, ...source.query.map((q) => q.value));

  const save = (next: RepeatPaging | null) => dispatch({ type: "repeat/paging", pageId, blockId: block.id, paging: next });
  const change = (patch: Partial<RepeatPaging>) => paging && save({ ...paging, ...patch });
  const totalDrop = useDataDrop((ref) => ref.sourceId === source?.id && change({ totalPath: ref.path }), !!paging);

  return (
    <div className="flex flex-col gap-2 border-t border-emerald-600/30 pt-2">
      <label className="flex flex-col gap-1 text-ink-dim">
        Mostrar de … en … (páginas)
        <input
          type="number"
          min={1}
          max={MAX_SIZE}
          aria-label="Elementos por página"
          placeholder="Todo junto, sin páginas"
          value={paging?.size ?? ""}
          onChange={(e) =>
            save(e.target.value === "" ? null : { resetOnChange: true, ...paging, size: clampSize(Number(e.target.value)) })
          }
          className={field}
        />
      </label>

      {paging && (
        <>
          <p className="text-[11px] text-ink-dim">
            {server
              ? "La URL usa {page} u {offset}: la API entrega solo la página que se ve."
              : `Se parte la lista que ya llegó. Para listas enormes, pon {offset} y {limit} (o {page}) en la URL de la fuente y la API entregará de a ${paging.size}.`}
          </p>
          {server && (
            <label className="flex flex-col gap-1 text-ink-dim" {...totalDrop.handlers}>
              Total de elementos (clave de la respuesta)
              <input
                type="text"
                aria-label="Clave del total"
                placeholder="Arrastra aquí la clave, p. ej. count"
                value={paging.totalPath ?? ""}
                spellCheck={false}
                onChange={(e) => change({ totalPath: e.target.value.trim() || undefined })}
                className={`${field} font-mono ${totalDrop.over ? "border-accent" : ""}`}
              />
              <span className="text-[11px]">Vacío: hay más páginas mientras la API siga devolviendo elementos.</span>
            </label>
          )}
          <label className="flex items-center gap-2 text-ink-dim">
            <input
              type="checkbox"
              checked={paging.resetOnChange}
              onChange={(e) => change({ resetOnChange: e.target.checked })}
            />
            Ir a la página 1 al cambiar los datos
          </label>
          <div className="flex flex-col gap-1 text-ink-dim">
            Color de la página actual
            <ColorInput label="Color de la página actual" value={paging.accent ?? "#0d99ff"} onChange={(accent) => change({ accent })} />
          </div>
          <label className="flex flex-col gap-1 text-ink-dim">
            Redondeo de los botones (px)
            <input
              type="number"
              min={0}
              max={30}
              aria-label="Redondeo de los botones"
              value={paging.radius ?? 8}
              onChange={(e) => change({ radius: Math.min(30, Math.max(0, Number(e.target.value))) })}
              className={field}
            />
          </label>
        </>
      )}
    </div>
  );
}
