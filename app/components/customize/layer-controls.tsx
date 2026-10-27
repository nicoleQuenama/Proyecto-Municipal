"use client";

import { BLEND_MODES, BLEND_NAMES } from "../background/blend-modes";
import { useSiteDispatch } from "../site/site-context";
import type { BlendMode, BlockInstance } from "../site/types";
import { Collapsible } from "../ui/collapsible";

const fieldClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

/**
 * Cómo se comporta la sección sobre la página: fija en la pantalla (no se mueve al hacer scroll) y cómo se mezcla
 * con lo que tiene detrás. Sirve para barras, pantallas de carga, botones flotantes o textos que dejan ver el fondo.
 */
export function LayerControls({ pageId, block }: { pageId: string; block: BlockInstance }) {
  const dispatch = useSiteDispatch();
  const { placement } = block;
  const blend = block.box?.blend;

  return (
    <Collapsible title="Capa" defaultOpen={false}>
      {placement ? (
        <label className="flex items-start gap-2 text-xs text-ink">
          <input
            type="checkbox"
            checked={placement.fixed === true}
            onChange={(e) =>
              dispatch({ type: "block/place", pageId, blockId: block.id, placement: { ...placement, fixed: e.target.checked } })
            }
            className="mt-0.5"
          />
          <span>
            Fija en la pantalla
            <span className="block text-[11px] text-ink-dim">No se mueve al hacer scroll y queda por encima del resto.</span>
          </span>
        </label>
      ) : (
        <p className="text-[11px] text-ink-dim">Para fijarla en la pantalla, colócala libremente en la página (arrástrala).</p>
      )}

      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        Mezcla con el fondo
        <select
          aria-label="Modo de mezcla"
          value={blend ?? ""}
          onChange={(e) =>
            dispatch({ type: "block/box", pageId, blockId: block.id, patch: { blend: (e.target.value || undefined) as BlendMode | undefined } })
          }
          className={fieldClass}
        >
          <option value="">Normal</option>
          {BLEND_NAMES.map((name) => (
            <option key={name} value={name}>{BLEND_MODES[name].label}</option>
          ))}
        </select>
        {blend && <span>{BLEND_MODES[blend].hint}</span>}
      </label>
    </Collapsible>
  );
}
