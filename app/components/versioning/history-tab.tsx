"use client";

import { useMemo, useState } from "react";
import { groupByDay, matchesCommit } from "./history-groups";
import { HistoryEntry } from "./history-entry";
import { SearchBox } from "./search-box";
import { ShowMore } from "./show-more";
import { usePaged } from "./use-paged";
import { useVersioning } from "./versioning-context";

const select = "h-9 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent";

/** El historial de versiones: se busca, se filtra por rama y autor, se agrupa por día y se carga por tramos. */
export function HistoryTab() {
  const { state } = useVersioning();
  const { commits, current, releases } = state;
  const [query, setQuery] = useState("");
  const [allBranches, setAllBranches] = useState(false);
  const [author, setAuthor] = useState("");

  const scoped = useMemo(
    () => commits.filter((commit) => allBranches || commit.branch === current),
    [commits, current, allBranches],
  );
  const authors = useMemo(() => [...new Set(scoped.map((commit) => commit.author))], [scoped]);
  const shown = useMemo(
    () => scoped.filter((commit) => (!author || commit.author === author) && matchesCommit(commit, query)),
    [scoped, author, query],
  );

  const { visible, remaining, showMore } = usePaged(shown, 12);
  const days = groupByDay(visible);
  const live = releases[0]?.commitId;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap gap-2">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar por mensaje, autor o cambio…" />
        <select aria-label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} className={select}>
          <option value="">Todos los autores</option>
          {authors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Ramas"
          value={allBranches ? "all" : "current"}
          onChange={(e) => setAllBranches(e.target.value === "all")}
          className={select}
        >
          <option value="current">Solo «{current}»</option>
          <option value="all">Todos los borradores</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink-dim">
          {scoped.length === 0
            ? "Todavía no hay versiones guardadas. Cada vez que guardes una desde el Resumen aparecerá aquí, con quién la hizo y qué cambió, para que puedas volver a revisarla."
            : "Ninguna versión coincide con la búsqueda."}
        </p>
      ) : (
        days.map((day) => (
          <section key={day.label} className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{day.label}</h3>
            <ul className="flex flex-col gap-1.5">
              {day.commits.map((commit) => (
                <HistoryEntry key={commit.id} commit={commit} live={commit.id === live} showBranch={allBranches} />
              ))}
            </ul>
          </section>
        ))
      )}
      <ShowMore remaining={remaining} onClick={showMore} />
    </div>
  );
}
