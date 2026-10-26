"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { PageBackground } from "../background/page-background";
import { PageRouteForm } from "../dynamic/page-route-form";
import { PageSeoForm } from "./page-seo-form";
import { InlineForm } from "../ui/inline-form";
import { isPageNameTaken, routeOf, slugify } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { plural } from "../versioning/versioning-rules";
import { CodeIcon } from "../viewport/icons";
import { useWorkbench } from "../workbench/workbench-context";

const iconButton =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink";

interface PageRowProps {
  page: Page;
  pages: Page[];
  isCurrent: boolean;
}

function PageRow({ page, pages, isCurrent }: PageRowProps) {
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser?.role, "editCode");
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [routing, setRouting] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [styling, setStyling] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const [error, setError] = useState<string | null>(null);

  const stopRenaming = () => {
    setRenaming(false);
    setError(null);
  };

  const commitRename = () => {
    const name = draft.trim();
    if (!name) return setError("Escribe un nombre.");
    if (isPageNameTaken(pages, name, page.id)) return setError("Ya existe una página con ese nombre.");

    dispatch({ type: "page/rename", id: page.id, name });
    stopRenaming();
  };

  if (renaming) {
    return (
      <li className="flex flex-col gap-1 px-1">
        <input
          autoFocus
          aria-label="Nuevo nombre de la página"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              e.stopPropagation();
              stopRenaming();
            }
          }}
          onBlur={stopRenaming}
          className="h-9 rounded-md border border-accent bg-canvas px-3 text-[13px] outline-none"
        />
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </li>
    );
  }

  if (confirming) {
    return (
      <li className="flex flex-col gap-2 rounded-md bg-red-500/10 p-2">
        <p role="alert" className="text-xs text-red-300">
          ¿Eliminar «{page.name}»? Se perderán {plural(page.blocks.length, "bloque", "bloques")} y{" "}
          {plural(page.media.length, "medio", "medios")}.
        </p>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "page/delete", id: page.id })}
            className="h-7 rounded-md border border-red-500/60 px-3 text-xs text-red-400 hover:bg-red-500/15"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-7 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
          >
            Cancelar
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="group flex items-center gap-1">
        <button
          type="button"
          aria-current={isCurrent ? "page" : undefined}
          onClick={() => dispatch({ type: "page/select", id: page.id })}
          className={`flex h-10 min-w-0 flex-1 flex-col justify-center rounded-md px-3 text-left ${
            isCurrent ? "bg-accent/25" : "hover:bg-hover"
          }`}
        >
          <span className="truncate text-[13px] font-medium">{page.name}</span>
          <span className="truncate text-[11px] text-ink-dim">{routeOf(page)}</span>
        </button>

        {!page.isHome && (
          <button
            type="button"
            aria-label={`Ruta dinámica de ${page.name}`}
            title="Página dinámica (ruta con parámetros, p. ej. /pokemon/:id)"
            aria-pressed={routing}
            onClick={() => setRouting(!routing)}
            className={`${iconButton} font-mono text-[11px] ${page.route ? "text-accent" : "hidden group-hover:flex focus:flex"}`}
          >
            :id
          </button>
        )}
        <button
          type="button"
          aria-label={`Fondo de ${page.name}`}
          title="Fondo de la página (imagen o video)"
          aria-pressed={styling}
          onClick={() => setStyling(!styling)}
          className={`${iconButton} text-[13px] ${page.backdrop ? "text-accent" : "hidden group-hover:flex focus:flex"}`}
        >
          ▨
        </button>
        <button
          type="button"
          aria-label={`Buscadores de ${page.name}`}
          title="Título, descripción, imagen e idioma para Google y redes"
          aria-pressed={seoOpen}
          onClick={() => setSeoOpen(!seoOpen)}
          className={`${iconButton} text-[11px] font-semibold ${page.seo?.title && page.seo?.description ? "text-accent" : "hidden group-hover:flex focus:flex"}`}
        >
          SEO
        </button>
        {canEditCode && (
          <button
            type="button"
            aria-label={`Programar ${page.name} en código`}
            title="Programar esta página en código (CSS y TypeScript)"
            onClick={() => openFile({ kind: "page-js", pageId: page.id })}
            className={`${iconButton} hidden group-hover:flex focus:flex`}
          >
            <CodeIcon />
          </button>
        )}
        <button
          type="button"
          aria-label={`Renombrar ${page.name}`}
          title="Renombrar"
          onClick={() => {
            setDraft(page.name);
            setRenaming(true);
          }}
          className={`${iconButton} hidden group-hover:flex focus:flex`}
        >
          ✎
        </button>
        {!page.isHome && (
          <button
            type="button"
            aria-label={`Eliminar ${page.name}`}
            title="Eliminar"
            onClick={() => setConfirming(true)}
            className={`${iconButton} hidden hover:text-red-400 group-hover:flex focus:flex`}
          >
            ×
          </button>
        )}
      </div>
      {routing && <PageRouteForm page={page} />}
      {seoOpen && <PageSeoForm page={page} />}
      {styling && <PageBackground page={page} />}
    </li>
  );
}

export function PagesTab() {
  const { pages, currentPageId } = useSite();
  const dispatch = useSiteDispatch();
  const [dynamic, setDynamic] = useState(false);

  const createPage = (name: string) => {
    if (isPageNameTaken(pages, name)) return "Ya existe una página con ese nombre.";
    const id = crypto.randomUUID();
    dispatch({ type: "page/create", id, name });
    // Una página dinámica nace con una ruta de ejemplo que se edita con el botón «:id».
    if (dynamic) dispatch({ type: "page/route", id, route: `/${slugify(name)}/:id` });
  };

  return (
    <div className="flex flex-col gap-4">
      <InlineForm
        label="Nombre de la nueva página"
        placeholder="Nueva página…"
        submitLabel="Crear"
        onSubmit={createPage}
      >
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-ink-dim" title="Ruta con parámetros, p. ej. /pokemon/:id">
          <input type="checkbox" checked={dynamic} onChange={(e) => setDynamic(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
          Dinámica
        </label>
      </InlineForm>

      <ul className="flex flex-col gap-0.5">
        {pages.map((page) => (
          <PageRow key={page.id} page={page} pages={pages} isCurrent={page.id === currentPageId} />
        ))}
      </ul>
    </div>
  );
}
