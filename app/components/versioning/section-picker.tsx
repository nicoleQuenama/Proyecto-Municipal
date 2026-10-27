"use client";

import { useState } from "react";
import type { Scope } from "../auth/access";
import { canEditBlock } from "../auth/access";
import { useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Elegir en qué páginas (enteras) o secciones sueltas trabaja la persona, con búsqueda y atajos. */
export function SectionPicker({ scope, onChange }: { scope: Scope; onChange: (scope: Scope) => void }) {
  const { pages: allPages, components } = useSite();
  const { currentUser } = useAuth();
  // Solo se puede dar acceso a lo que uno mismo puede editar.
  const pages = allPages.filter((page) => page.blocks.some((block) => canEditBlock(currentUser, page.id, block.id)));
  const ownsWhole = (pageId: string) => !currentUser?.access?.scope || currentUser.access.scope.pageIds.includes(pageId);
  const [query, setQuery] = useState("");
  const nameOf = (componentId: string) => components.find((c) => c.id === componentId)?.name ?? "Sección";
  const needle = query.trim().toLowerCase();
  const total = scope.pageIds.length + scope.blockIds.length;

  const visible = pages
    .map((page) => ({
      page,
      blocks: page.blocks
        .map((block, index) => ({ block, label: `${index + 1}. ${nameOf(block.componentId)}` }))
        .filter(({ block }) => canEditBlock(currentUser, page.id, block.id)),
    }))
    .map(({ page, blocks }) => ({
      page,
      blocks: blocks.filter(({ label }) => !needle || label.toLowerCase().includes(needle) || page.name.toLowerCase().includes(needle)),
    }))
    .filter(({ page, blocks }) => !needle || blocks.length > 0 || page.name.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          aria-label="Buscar página o sección"
          placeholder="Buscar página o sección…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2.5 text-xs outline-none focus:border-accent"
        />
        <button type="button" onClick={() => onChange({ pageIds: pages.filter((p) => ownsWhole(p.id)).map((p) => p.id), blockIds: pages.filter((p) => !ownsWhole(p.id)).flatMap((p) => p.blocks.filter((b) => canEditBlock(currentUser, p.id, b.id)).map((b) => b.id)) })} className="h-8 rounded-md px-2 text-xs text-ink-dim hover:bg-hover hover:text-ink">
          Todas
        </button>
        <button type="button" onClick={() => onChange({ pageIds: [], blockIds: [] })} className="h-8 rounded-md px-2 text-xs text-ink-dim hover:bg-hover hover:text-ink">
          Ninguna
        </button>
      </div>

      <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border border-line bg-canvas p-2">
        {visible.length === 0 && <li className="p-2 text-xs text-ink-dim">Nada coincide con «{query}».</li>}
        {visible.map(({ page, blocks }) => {
          const whole = scope.pageIds.includes(page.id);
          return (
            <li key={page.id} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-xs font-medium">
                <input type="checkbox" disabled={!ownsWhole(page.id)} checked={whole} onChange={() => onChange({ ...scope, pageIds: toggle(scope.pageIds, page.id) })} />
                {page.name}
                <span className="font-normal text-ink-dim">{ownsWhole(page.id) ? "· página entera" : "· solo algunas secciones son tuyas"}</span>
              </label>
              {blocks.map(({ block, label }) => (
                <label key={block.id} className={`ml-6 flex items-center gap-2 text-xs ${whole ? "text-ink-dim" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={whole}
                    checked={whole || scope.blockIds.includes(block.id)}
                    onChange={() => onChange({ ...scope, blockIds: toggle(scope.blockIds, block.id) })}
                  />
                  {label}
                </label>
              ))}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-ink-dim">
        {total === 0 ? "Todavía no elegiste nada: la persona no podrá editar." : `Elegiste ${total} ${total === 1 ? "parte" : "partes"}.`}
      </p>
    </div>
  );
}
