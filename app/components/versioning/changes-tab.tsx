"use client";

import { useMemo, useState } from "react";
import { ChangeGroupCard } from "./change-group-card";
import { CHANGE_KINDS, kindOfKey, type ChangeKindId } from "./change-kinds";
import { groupChanges, matchesQuery } from "./change-groups";
import { SearchBox } from "./search-box";
import { useWorkingChanges } from "./use-working-changes";

const chip = (active: boolean) =>
  `h-7 shrink-0 rounded-full px-3 text-xs transition-colors ${active ? "bg-accent text-white" : "bg-hover text-ink-dim hover:text-ink"}`;

/** Los cambios sin guardar: se buscan, se filtran por clase y se agrupan por página. Todos entran en la próxima versión. */
export function ChangesTab() {
  const { changes } = useWorkingChanges();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ChangeKindId | "all">("all");

  const shown = useMemo(
    () => changes.filter((c) => (kind === "all" || kindOfKey(c.key) === kind) && matchesQuery(c, query)),
    [changes, kind, query],
  );
  const groups = useMemo(() => groupChanges(shown), [shown]);
  const present = CHANGE_KINDS.filter((k) => changes.some((c) => kindOfKey(c.key) === k.id));

  if (changes.length === 0) {
    return (
      <p className="m-4 rounded-md border border-dashed border-line px-3 py-8 text-center text-[13px] text-ink-dim">
        No hay cambios sin guardar. Edita algo en el lienzo (un texto, un color, una imagen) y aparecerá aquí; todo esto entra en tu próxima versión.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex gap-2">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar un cambio, una página o un valor…" />
      </div>

      {present.length > 1 && (
        <div role="group" aria-label="Filtrar por clase" className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")} className={`${chip(kind === "all")} cursor-pointer`}>
            Todos · {changes.length}
          </button>
          {present.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={`${chip(kind === k.id)} cursor-pointer`}>
              {k.label} · {changes.filter((c) => kindOfKey(c.key) === k.id).length}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-dim">Ningún cambio coincide con la búsqueda.</p>
      ) : (
        groups.map((group) => (
          <ChangeGroupCard key={group.name} group={group} defaultOpen={groups.length <= 3} />
        ))
      )}
    </div>
  );
}
