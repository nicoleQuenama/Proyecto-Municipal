"use client";

import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { pageMoveActions } from "./move-page";
import { isPageReadOnly } from "./own-pages";
import { useUnitNames } from "./use-unit-names";

/** «Mover a otra unidad…» en el menú de una página: elegir la unidad y confirmar. No aparece si no hay unidades o la página es de solo lectura. */
export function MovePageItem({ page, onDone }: { page: Page; onDone: () => void }) {
  const { currentUser } = useAuth();
  const site = useSite();
  const dispatch = useSiteDispatch();
  const names = useUnitNames();
  const [open, setOpen] = useState(false);
  const canGlobal = currentUser?.role === "superadmin" || currentUser?.canEditGlobal === true;
  const targets = names.filter((unit) => unit.id !== page.unitId);
  const [target, setTarget] = useState<string>("");
  if (names.length === 0 || isPageReadOnly(currentUser, page)) return null;

  const chosen = target === "global" ? null : target || null;
  const ready = target !== "" && (target !== "global" || canGlobal);
  const confirm = () => {
    for (const action of pageMoveActions(site, page.id, chosen)) dispatch(action);
    setOpen(false);
    onDone();
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-ink hover:bg-hover hover:text-accent transition-colors cursor-pointer">
        <span className="text-xs">⇄</span>
        <span>Mover a otra unidad…</span>
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 border-t border-line px-2.5 py-1.5">
      <select aria-label="Unidad de destino" value={target} onChange={(event) => setTarget(event.target.value)} className="h-7 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent">
        <option value="" disabled>
          Elige la unidad…
        </option>
        {targets.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
        {canGlobal && page.unitId && <option value="global">Global (de todos)</option>}
      </select>
      <p className="text-[10px] leading-snug text-ink-dim">La página pasa a esa unidad y dejará de ser tuya; solo ella (o quien administra) podrá devolverla.</p>
      <span className="flex gap-2">
        <button type="button" disabled={!ready} onClick={confirm} className="h-7 rounded-md bg-accent px-3 text-xs text-white disabled:opacity-40 cursor-pointer">
          Mover
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-7 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink cursor-pointer">
          Cancelar
        </button>
      </span>
    </div>
  );
}
