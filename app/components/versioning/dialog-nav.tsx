"use client";

import { NAV_ITEMS, type NavCounts, type TabId } from "./nav-items";

interface DialogNavProps {
  tab: TabId;
  onSelect: (tab: TabId) => void;
  counts: NavCounts;
  advanced: boolean;
  onAdvanced: (on: boolean) => void;
}

/** El menú lateral del panel: lo esencial siempre, y lo de trabajo en equipo solo con el modo avanzado. */
export function DialogNav({ tab, onSelect, counts, advanced, onAdvanced }: DialogNavProps) {
  const items = NAV_ITEMS.filter((item) => advanced || !item.advanced);

  return (
    <nav aria-label="Secciones de versiones" className="flex w-52 shrink-0 flex-col border-r border-line p-2">
      <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-0.5">
        {items.map((item) => {
          const count = item.count ? counts[item.count] : 0;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              onClick={() => onSelect(item.id)}
              className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors ${
                tab === item.id ? "bg-hover text-ink" : "text-ink-dim hover:bg-hover/60 hover:text-ink"
              }`}
            >
              {item.icon}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {advanced && item.term && <span className="shrink-0 text-[10px] text-ink-dim">{item.term}</span>}
              {count > 0 && (
                <span className="shrink-0 rounded-full bg-accent/25 px-1.5 text-[11px] text-accent">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <label className="mt-auto flex cursor-pointer items-start gap-2 rounded-md p-2 text-xs text-ink-dim hover:bg-hover/60">
        <input
          type="checkbox"
          checked={advanced}
          onChange={(e) => onAdvanced(e.target.checked)}
          className="mt-0.5 accent-accent"
        />
        <span>
          <span className="block text-ink">Modo avanzado</span>
          Borradores, revisiones y tareas para trabajar en equipo.
        </span>
      </label>
    </nav>
  );
}
