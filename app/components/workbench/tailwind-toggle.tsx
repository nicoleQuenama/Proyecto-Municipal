"use client";

import { codeOf, codePatchAction } from "../site/code-source";
import { useSite, useSiteDispatch } from "../site/site-context";

/** Activa o desactiva Tailwind CSS en el bloque de código: sin él, sus clases (`bg-sky-900`, `flex`…) no tienen estilo. */
export function TailwindToggle({ pageId, blockId }: { pageId: string; blockId: string }) {
  const { pages, components } = useSite();
  const dispatch = useSiteDispatch();
  const block = pages.flatMap((p) => p.blocks).find((b) => b.id === blockId);
  const code = block && codeOf(block, components);
  if (!block || !code) return null;

  return (
    <label className="flex items-center gap-1.5 text-[11px] text-ink-dim" title="Carga Tailwind CSS dentro de este bloque">
      <input
        type="checkbox"
        aria-label="Tailwind CSS"
        checked={code.tailwind}
        onChange={(e) => dispatch(codePatchAction(block, components, pageId, { tailwind: e.target.checked }))}
      />
      Tailwind
    </label>
  );
}
