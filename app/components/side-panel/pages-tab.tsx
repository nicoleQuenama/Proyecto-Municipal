"use client";

import { PAGE_ROLES, ROLE_NAMES, type PageRole } from "../site/page-roles";
import { useEffect, useRef, useState } from "react";
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
  const canEditCode = hasPermission(currentUser, "editCode");
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [routing, setRouting] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [styling, setStyling] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

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
    <li className="relative flex flex-col gap-1">
      <div className="group relative flex items-center gap-1 rounded-md transition-colors">
        {/* Cuerpo principal del item: flex-1 para clic directo y enfocar/seleccionar */}
        <button
          type="button"
          aria-current={isCurrent ? "page" : undefined}
          onClick={() => dispatch({ type: "page/select", id: page.id })}
          className={`flex h-11 min-w-0 flex-1 flex-col justify-center rounded-md px-3 text-left transition-colors ${
            isCurrent ? "bg-accent/20 ring-1 ring-accent/40" : "hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-1.5 w-full">
            <span className={`truncate text-[13px] ${isCurrent ? "text-accent font-semibold" : "text-ink font-medium"}`}>
              {page.name}
            </span>
            {page.isHome && (
              <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.2 text-[9px] font-semibold text-accent uppercase">
                Inicio
              </span>
            )}
            {page.role && (
              <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 uppercase">
                {PAGE_ROLES[page.role]?.label ?? page.role}
              </span>
            )}
            {page.route && (
              <span className="shrink-0 rounded bg-canvas border border-line px-1 text-[9px] font-mono text-ink-dim">
                :id
              </span>
            )}
          </div>
          <span className="truncate text-[11px] text-ink-dim">{routeOf(page)}</span>
        </button>

        {/* Menú de opciones secundarias (tres puntos / kebab menu) */}
        <div ref={menuRef} className="relative shrink-0 pr-1">
          <button
            type="button"
            aria-label={`Opciones de ${page.name}`}
            title="Opciones de página"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-opacity ${
              menuOpen ? "opacity-100 bg-hover text-ink" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
            }`}
          >
            <span className="text-base leading-none font-bold tracking-tighter">•••</span>
          </button>

          {/* Menú desplegable flotante */}
          {menuOpen && (
            <div className="absolute right-0 top-8 z-40 flex w-52 flex-col rounded-xl border border-line bg-panel p-1 text-xs shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setDraft(page.name);
                  setRenaming(true);
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-ink hover:bg-hover hover:text-accent transition-colors"
              >
                <span className="text-xs">✎</span>
                <span>Renombrar página</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setLayoutOpen(!layoutOpen);
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  layoutOpen || page.hideHeader || page.hideFooter ? "bg-accent/15 text-accent font-medium" : "text-ink hover:bg-hover"
                }`}
              >
                <span className="text-xs">☷</span>
                <span>Estructura (Header / Footer)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setStyling(!styling);
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  styling || page.backdrop ? "bg-accent/15 text-accent font-medium" : "text-ink hover:bg-hover"
                }`}
              >
                <span className="text-xs">▨</span>
                <span>Fondo de página</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSeoOpen(!seoOpen);
                }}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                  seoOpen || (page.seo?.title && page.seo?.description) ? "bg-accent/15 text-accent font-medium" : "text-ink hover:bg-hover"
                }`}
              >
                <span className="text-[10px] font-bold">SEO</span>
                <span>Buscadores y redes</span>
              </button>

              {!page.isHome && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setRouting(!routing);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    routing || page.route ? "bg-accent/15 text-accent font-medium" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span className="font-mono text-[10px]">:id</span>
                  <span>Ruta dinámica</span>
                </button>
              )}

              {!page.isHome && (
                <div className="flex flex-col px-2.5 py-1 border-t border-line my-0.5">
                  <span className="text-[10px] font-medium text-ink-dim uppercase tracking-wider mb-1">
                    Función de página:
                  </span>
                  <select
                    aria-label={`Función de ${page.name}`}
                    value={page.role ?? ""}
                    onChange={(e) => {
                      dispatch({
                        type: "page/role",
                        id: page.id,
                        role: (e.target.value || null) as PageRole | null,
                      });
                      setMenuOpen(false);
                    }}
                    className="h-7 w-full rounded-md border border-line bg-canvas px-1.5 text-[11px] text-ink outline-none"
                  >
                    <option value="">Página Normal</option>
                    {ROLE_NAMES.map((role) => (
                      <option key={role} value={role}>
                        {PAGE_ROLES[role].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canEditCode && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openFile({ kind: "page-js", pageId: page.id });
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-ink hover:bg-hover transition-colors"
                >
                  <CodeIcon />
                  <span>Programar en código</span>
                </button>
              )}

              {!page.isHome && (
                <>
                  <div className="my-1 h-px bg-line" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirming(true);
                    }}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-red-500/10 font-medium transition-colors"
                  >
                    <span className="text-xs">×</span>
                    <span>Eliminar página</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {routing && <PageRouteForm page={page} />}
      {seoOpen && <PageSeoForm page={page} />}
      {styling && <PageBackground page={page} />}
      {layoutOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-canvas/60 p-2.5 text-xs">
          <p className="text-[11px] font-semibold text-ink">Encabezado y pie de página en esta página:</p>
          <label className="flex items-center gap-2 text-ink hover:text-accent cursor-pointer text-[12px]">
            <input
              type="checkbox"
              checked={!page.hideHeader}
              onChange={(e) =>
                dispatch({ type: "page/layout-toggles", pageId: page.id, patch: { hideHeader: !e.target.checked } })
              }
              className="h-3.5 w-3.5 rounded accent-accent"
            />
            Mostrar Encabezado (Header)
          </label>
          <label className="flex items-center gap-2 text-ink hover:text-accent cursor-pointer text-[12px]">
            <input
              type="checkbox"
              checked={!page.hideFooter}
              onChange={(e) =>
                dispatch({ type: "page/layout-toggles", pageId: page.id, patch: { hideFooter: !e.target.checked } })
              }
              className="h-3.5 w-3.5 rounded accent-accent"
            />
            Mostrar Pie de página (Footer)
          </label>
          <p className="text-[10px] text-ink-dim">
            Desmarca cualquiera para que esta página no muestre el encabezado o pie de página.
          </p>
        </div>
      )}
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
