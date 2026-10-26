"use client";

import { useState } from "react";
import { useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { normalizeRoute, paramsOf } from "./route-params";

const field = "h-8 min-w-0 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** Campo de la ruta: se valida al terminar de escribir. */
function RouteField({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();
  const [draft, setDraft] = useState(page.route ?? "");
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const route = normalizeRoute(draft);
    if (!route) return setError("Escribe al menos un parámetro, por ejemplo /pokemon/:id");
    setError(null);
    setDraft(route);
    dispatch({ type: "page/route", id: page.id, route });
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        aria-label="Ruta de la página dinámica"
        aria-invalid={error !== null}
        placeholder="/pokemon/:id"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={`${field} font-mono ${error ? "border-red-500" : ""}`}
      />
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}

/** Convierte una página en dinámica (ruta con `:parámetros`) y pide un valor de ejemplo por parámetro para verla en el editor. */
export function PageRouteForm({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();
  const params = paramsOf(page.route);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-2 text-xs">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={page.route !== undefined}
          onChange={(e) =>
            dispatch({ type: "page/route", id: page.id, route: e.target.checked ? `/${page.slug}/:id` : null })
          }
          className="h-3.5 w-3.5 accent-accent"
        />
        Página dinámica
      </label>

      {page.route !== undefined && (
        <>
          <RouteField key={page.route} page={page} />
          <p className="text-[11px] text-ink-dim">
            Cada <code>:nombre</code> es un parámetro. Úsalo en una fuente de datos como <code>{"{param:nombre}"}</code>.
          </p>
          {params.map((name) => (
            <label key={name} className="flex items-center gap-2 text-ink-dim">
              <code className="w-14 shrink-0 truncate" title={name}>:{name}</code>
              <input
                aria-label={`Valor de ejemplo de ${name}`}
                placeholder="valor de ejemplo"
                value={page.previewParams?.[name] ?? ""}
                onChange={(e) => dispatch({ type: "page/preview-param", id: page.id, param: name, value: e.target.value })}
                className={`${field} flex-1`}
              />
            </label>
          ))}
        </>
      )}
    </div>
  );
}
