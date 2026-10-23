"use client";

import { useState } from "react";
import { ChevronIcon } from "../viewport/icons";
import type { ChangeGroup } from "./change-groups";
import { DiffRow } from "./diff-row";
import { ShowMore } from "./show-more";
import type { WorkingChange } from "./types";
import { usePaged } from "./use-paged";

interface ChangeGroupCardProps {
  group: ChangeGroup<WorkingChange>;
  /** Claves de los cambios elegidos para la próxima versión. */
  chosen: string[];
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[], on: boolean) => void;
  defaultOpen: boolean;
}

/** Los cambios de una página o ámbito: se pliegan, se eligen todos a la vez y se muestran por tramos. */
export function ChangeGroupCard({ group, chosen, onToggle, onToggleAll, defaultOpen }: ChangeGroupCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { visible, remaining, showMore } = usePaged(group.items, 8);

  const keys = group.items.map((change) => change.key);
  const picked = keys.filter((key) => chosen.includes(key)).length;

  return (
    <section className="rounded-lg border border-line">
      <header className="flex items-center gap-2 px-3 py-2">
        <input
          type="checkbox"
          aria-label={`Elegir todos los cambios de ${group.name}`}
          checked={picked === keys.length}
          ref={(el) => {
            if (el) el.indeterminate = picked > 0 && picked < keys.length;
          }}
          onChange={(e) => onToggleAll(keys, e.target.checked)}
          className="h-3.5 w-3.5 accent-accent"
        />
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] font-medium"
        >
          <span aria-hidden className={`text-ink-dim transition-transform ${open ? "" : "-rotate-90"}`}>
            <ChevronIcon size={10} />
          </span>
          <span className="truncate">{group.name}</span>
          <span className="shrink-0 rounded bg-hover px-1.5 text-[11px] text-ink-dim">{keys.length}</span>
        </button>
      </header>

      {open && (
        <div className="flex flex-col gap-1 border-t border-line p-2">
          <ul className="flex flex-col gap-1">
            {visible.map((change) => (
              <DiffRow
                key={change.key}
                change={change}
                leading={
                  <input
                    type="checkbox"
                    aria-label={`Elegir ${change.node} · ${change.property}`}
                    checked={chosen.includes(change.key)}
                    onChange={() => onToggle(change.key)}
                    className="h-3.5 w-3.5 shrink-0 accent-accent"
                  />
                }
              />
            ))}
          </ul>
          <ShowMore remaining={remaining} onClick={showMore} />
        </div>
      )}
    </section>
  );
}
