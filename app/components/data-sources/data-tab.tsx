"use client";

import { useSite, useSiteDispatch } from "../site/site-context";
import { DEFAULT_CACHE } from "./cache-strategies";
import { SourceEditor } from "./source-editor";
import type { DataSource } from "./types";

const newSource = (count: number): DataSource => ({
  id: crypto.randomUUID(),
  name: `API ${count + 1}`,
  url: "",
  method: "GET",
  query: [],
  headers: [],
  transform: "",
  cache: DEFAULT_CACHE,
});

/** Las APIs HTTP del proyecto: se piden desde el servidor y sus claves se arrastran a la página. */
export function DataTab() {
  const { sources } = useSite();
  const dispatch = useSiteDispatch();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-dim">Pide una API (JSON, XML o texto) y arrastra sus claves a los elementos y secciones de la página.</p>
      {sources.map((source) => (
        <SourceEditor
          key={source.id}
          source={source}
          onChange={(next) => dispatch({ type: "source/save", source: next })}
          onRemove={() => dispatch({ type: "source/remove", id: source.id })}
        />
      ))}
      <button
        type="button"
        onClick={() => dispatch({ type: "source/save", source: newSource(sources.length) })}
        className="h-9 rounded-md bg-hover text-xs font-medium hover:bg-accent hover:text-white"
      >
        + Nueva API
      </button>
    </div>
  );
}
