"use client";

import { useState } from "react";
import type { Scope } from "../auth/access";
import { canEditBlock } from "../auth/access";
import { useAuth } from "../auth/auth-context";
import { useSite } from "../site/site-context";
import { PageScopeRow } from "./page-scope-row";

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Elegir dónde trabaja una persona: cada página es un desplegable con sus secciones. */
export function SectionPicker({ scope, onChange }: { scope: Scope; onChange: (scope: Scope) => void }) {
  const { pages: allPages, components } = useSite();
  const { currentUser } = useAuth();
  // Solo se puede dar acceso a lo que uno mismo puede editar.
  const pages = allPages.filter((page) => page.blocks.some((block) => canEditBlock(currentUser, page.id, block.id)));
  const ownsWhole = (pageId: string) => !currentUser?.access?.scope || currentUser.access.scope.pageIds.includes(pageId);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(pages.filter((page) => page.blocks.some((block) => scope.blockIds.includes(block.id))).map((page) => page.id)),
  );
  const nameOf = (componentId: string) => components.find((c) => c.id === componentId)?.name ?? "Sección";
  const needle = query.trim().toLowerCase();
  const total = scope.pageIds.length + scope.blockIds.length;

  const toggleExpand = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visible = pages
    .map((page) => ({
      page,
      blocks: page.blocks
        .filter((block) => canEditBlock(currentUser, page.id, block.id))
        .map((block, index) => ({ id: block.id, label: `${index + 1}. ${nameOf(block.componentId)}` }))
        .filter(({ label }) => !needle || label.toLowerCase().includes(needle) || page.name.toLowerCase().includes(needle)),
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

      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-line bg-canvas p-1.5">
        {visible.length === 0 && <li className="p-2 text-xs text-ink-dim">Nada coincide con «{query}».</li>}
        {visible.map(({ page, blocks }) => (
          <PageScopeRow
            key={page.id}
            page={page}
            blocks={blocks}
            whole={scope.pageIds.includes(page.id)}
            ownsWhole={ownsWhole(page.id)}
            expanded={expanded.has(page.id)}
            selectedBlockIds={scope.blockIds}
            onExpand={() => toggleExpand(page.id)}
            onToggleWhole={() => onChange({ ...scope, pageIds: toggle(scope.pageIds, page.id) })}
            onToggleBlock={(id) => onChange({ ...scope, blockIds: toggle(scope.blockIds, id) })}
          />
        ))}
      </ul>
      <p className="text-[11px] text-ink-dim">
        {total === 0 ? "Todavía no elegiste nada: la persona no podrá editar." : `Elegiste ${total} ${total === 1 ? "parte" : "partes"}.`}
      </p>
    </div>
  );
}
