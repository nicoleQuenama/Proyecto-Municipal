"use client";

interface ScopePage {
  id: string;
  name: string;
}

interface ScopeBlock {
  id: string;
  label: string;
}

interface PageScopeRowProps {
  page: ScopePage;
  blocks: ScopeBlock[];
  whole: boolean;
  ownsWhole: boolean;
  expanded: boolean;
  selectedBlockIds: string[];
  onExpand: () => void;
  onToggleWhole: () => void;
  onToggleBlock: (id: string) => void;
}

/** Una página del desplegable: se marca entera o se abre para elegir solo algunas secciones. */
export function PageScopeRow({
  page,
  blocks,
  whole,
  ownsWhole,
  expanded,
  selectedBlockIds,
  onExpand,
  onToggleWhole,
  onToggleBlock,
}: PageScopeRowProps) {
  const chosen = blocks.filter((block) => selectedBlockIds.includes(block.id)).length;

  return (
    <li className="rounded-md border border-line bg-panel/60">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          aria-label={`${expanded ? "Ocultar" : "Ver"} secciones de ${page.name}`}
          aria-expanded={expanded}
          onClick={onExpand}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
        >
          {expanded ? "▾" : "▸"}
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-ink">
          <input
            type="checkbox"
            disabled={!ownsWhole}
            checked={whole}
            onChange={onToggleWhole}
          />
          <span className="truncate">{page.name}</span>
          <span className="shrink-0 text-[10px] font-normal text-ink-dim">
            {whole ? "página entera" : `${chosen} de ${blocks.length} secciones`}
          </span>
        </label>
      </div>

      {expanded && (
        <ul className="flex flex-col gap-1 border-t border-line px-2 py-1.5 pl-9">
          {blocks.length === 0 && <li className="text-[11px] text-ink-dim">Sin secciones propias.</li>}
          {blocks.map((block) => (
            <li key={block.id}>
              <label className={`flex items-center gap-2 text-xs ${whole ? "text-ink-dim" : "text-ink"}`}>
                <input
                  type="checkbox"
                  disabled={whole}
                  checked={whole || selectedBlockIds.includes(block.id)}
                  onChange={() => onToggleBlock(block.id)}
                />
                <span className="truncate">{block.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
