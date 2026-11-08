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
  defaultOpen: boolean;
}

/** Los cambios de una página o ámbito: se pliegan y se muestran por tramos. */
export function ChangeGroupCard({ group, defaultOpen }: ChangeGroupCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { visible, remaining, showMore } = usePaged(group.items, 8);

  return (
    <section className="rounded-lg border border-line">
      <header className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] font-medium cursor-pointer"
        >
          <span aria-hidden className={`text-ink-dim transition-transform ${open ? "" : "-rotate-90"}`}>
            <ChevronIcon size={10} />
          </span>
          <span className="truncate">{group.name}</span>
          <span className="shrink-0 rounded bg-hover px-1.5 text-[11px] text-ink-dim">{group.items.length}</span>
        </button>
      </header>

      {open && (
        <div className="flex flex-col gap-1 border-t border-line p-2">
          <ul className="flex flex-col gap-1">
            {visible.map((change) => (
              <DiffRow key={change.key} change={change} />
            ))}
          </ul>
          <ShowMore remaining={remaining} onClick={showMore} />
        </div>
      )}
    </section>
  );
}
