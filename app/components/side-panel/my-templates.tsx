"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { myTemplates } from "../site/my-templates";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { uniquePageName } from "../site/unique-page-name";

/** Qué dice cada lista según a qué se aplican las plantillas. */
const COPY = {
  section: { title: "Mis plantillas de sección", kind: "Bloque de código" },
  page: { title: "Mis plantillas de página", kind: "TypeScript y CSS de página" },
} as const;

const button = "rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50";

/** Las plantillas que la persona guardó desde el editor de código, de sección o de página. */
export function MyTemplates({ target }: { target: "section" | "page" }) {
  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();
  const canEdit = hasPermission(currentUser, "editContent");
  const [done, setDone] = useState<string | null>(null);

  const list = myTemplates(site.components, target);
  if (list.length === 0) return null;

  const finish = (id: string) => {
    setDone(id);
    setTimeout(() => setDone(null), 1800);
  };

  const addSection = (id: string) => {
    dispatch({ type: "block/add", id: crypto.randomUUID(), componentId: id, pageId: page.id });
    finish(id);
  };

  const applyHere = (id: string) => {
    dispatch({ type: "page/apply-code-template", pageId: page.id, componentId: id });
    finish(id);
  };

  const createPage = (id: string, name: string) => {
    const pageId = crypto.randomUUID();
    dispatch({ type: "page/create", id: pageId, name: uniquePageName(site.pages, name) });
    dispatch({ type: "page/apply-code-template", pageId, componentId: id });
    finish(id);
  };

  return (
    <section aria-label={COPY[target].title} className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
        {COPY[target].title} ({list.length})
      </p>
      {list.map((def) => (
        <div key={def.id} className="flex flex-col gap-2 rounded-xl border border-line bg-canvas/40 p-3">
          {def.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={def.thumbnail} alt={`Imagen de ${def.name}`} className="h-32 w-full rounded-lg border border-line/50 bg-white object-contain" />
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-line text-[11px] text-ink-dim">Sin imagen</div>
          )}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-semibold text-ink">{def.name}</h4>
            <button
              type="button"
              aria-label={`Eliminar ${def.name}`}
              title="Eliminar plantilla"
              onClick={() => dispatch({ type: "component/delete", id: def.id })}
              className="text-ink-dim hover:text-red-400 cursor-pointer"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-ink-dim">{COPY[target].kind}</p>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line/50 pt-2">
            {target === "section" ? (
              <button type="button" disabled={!canEdit} onClick={() => addSection(def.id)} className={`${button} bg-accent text-white`}>
                {done === def.id ? "Agregado" : "+ Agregar a la página"}
              </button>
            ) : (
              <>
                <button type="button" disabled={!canEdit} onClick={() => applyHere(def.id)} className={`${button} bg-hover text-ink`}>
                  Aplicar a esta página
                </button>
                <button type="button" disabled={!canEdit} onClick={() => createPage(def.id, def.name)} className={`${button} bg-accent text-white`}>
                  {done === def.id ? "Creada" : "Crear página"}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
