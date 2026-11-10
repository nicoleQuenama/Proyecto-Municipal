import type { Page } from "./paginate";

interface Props {
  page: Page<unknown>;
  onPage: (page: number) => void;
}

const button = "h-8 rounded-md border border-line px-3 text-xs text-ink hover:bg-hover disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer";

/** «Mostrando 1–15 de 230» con anterior y siguiente. */
export function Pager({ page, onPage }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
      <p className="text-xs text-ink-dim">Mostrando {page.from}–{page.to} de {page.total}</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page.page <= 1} onClick={() => onPage(page.page - 1)} className={button}>Anterior</button>
        <span className="text-xs text-ink-dim">{page.page} / {page.pages}</span>
        <button type="button" disabled={page.page >= page.pages} onClick={() => onPage(page.page + 1)} className={button}>Siguiente</button>
      </div>
    </div>
  );
}
