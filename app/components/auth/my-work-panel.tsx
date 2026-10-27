"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scrollToTarget } from "../commands/scroll-to-target";
import { useSite, useSiteDispatch } from "../site/site-context";
import { describeAccess } from "../versioning/access-presets";
import { useAuth } from "./auth-context";
import { workOf, type PageWork } from "./my-work";

/** Cuánto se espera a que el lienzo dibuje las páginas antes de llevar a la persona a su primera sección. */
const SETTLE_MS = 700;
const MAX_ATTEMPTS = 4;
/** Tiempo que el panel se queda abierto al entrar antes de plegarse en una pastilla para no tapar el lienzo. */
const AUTO_FOLD_MS = 12_000;

/** ¿Este acceso tiene algo que avisar? Sin alcance, vetos ni vencimiento, la persona tiene todo y no hace falta el panel. */
const isLimited = (access: { scope: unknown; denied: string[]; expiresAt?: string | null } | undefined): boolean =>
  !!access && (access.scope !== null || access.denied.length > 0 || !!access.expiresAt);

/**
 * Lo primero que ve una persona con acceso limitado: qué puede cambiar (páginas y secciones, para ir directo a
 * ellas), qué no puede hacer y hasta cuándo. Al entrar la lleva a su primera sección.
 */
export function MyWorkPanel() {
  const { currentUser } = useAuth();
  const { pages, components } = useSite();
  const dispatch = useSiteDispatch();
  const [open, setOpen] = useState(true);
  const access = currentUser?.access;

  const works = useMemo(
    () => workOf(access?.scope, pages, (id) => components.find((c) => c.id === id)?.name ?? "Sección"),
    [access?.scope, pages, components],
  );
  const first = works[0];

  // Ir a una página selecciona su primera sección propia (así no queda marcada una sección ajena de antes).
  const go = (work: PageWork, blockId = work.blocks[0]?.id) => {
    dispatch({ type: "page/select", id: work.pageId });
    if (blockId) dispatch({ type: "block/select", id: blockId });
    scrollToTarget(work.pageId, blockId);
  };

  // Al entrar: llevar a lo primero que le toca. El proyecto guardado restaura su propia selección un instante
  // después, así que se vigila hasta que la selección sea suya (unos pocos intentos, para no pelear con quien hace clic).
  const { selectedId } = useSite();
  const attempts = useRef(0);
  const isMine = works.some((work) => work.blocks.some((block) => block.id === selectedId));
  useEffect(() => {
    if (!first || isMine || attempts.current >= MAX_ATTEMPTS) return;
    attempts.current += 1;
    const timer = setTimeout(() => go(first), SETTLE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, isMine, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), AUTO_FOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!currentUser || !isLimited(access)) return null;
  const { limits, expiry, expired } = describeAccess(currentUser);
  const viewOnly = access?.scope !== null && works.length === 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-3 left-3 z-20 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-lg"
      >
        Mi trabajo{works.length > 0 ? ` · ${works.length}` : ""}
      </button>
    );
  }

  return (
    <aside aria-label="Tu espacio de trabajo" className="absolute top-3 left-3 z-20 flex max-h-[70%] w-72 flex-col gap-3 overflow-y-auto rounded-xl border border-accent/40 bg-panel p-4 text-xs shadow-2xl">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-semibold">Tu espacio de trabajo</h2>
          <p className="text-ink-dim">Hola, {currentUser.name.split(" ")[0]}. Esto es lo que puedes cambiar:</p>
        </div>
        <button type="button" aria-label="Ocultar" onClick={() => setOpen(false)} className="h-6 w-6 shrink-0 rounded-md text-ink-dim hover:bg-hover hover:text-ink">
          ×
        </button>
      </header>

      {access?.scope === null && <p className="rounded-md bg-hover p-2">Puedes editar todo el proyecto.</p>}
      {viewOnly && <p className="rounded-md bg-hover p-2">Por ahora solo puedes mirar el proyecto. Pide a quien te invitó que te asigne una parte.</p>}

      {works.length > 0 && (
        <ul className="flex flex-col gap-2">
          {works.map((work) => (
            <li key={work.pageId} className="flex flex-col gap-1">
              <button type="button" onClick={() => { go(work); setOpen(false); }} className="flex items-center gap-2 rounded-md bg-accent/10 px-2 py-1.5 text-left font-medium hover:bg-accent/20">
                <span aria-hidden>✏</span>
                <span className="min-w-0 flex-1 truncate">{work.pageName}</span>
                <span className="font-normal text-ink-dim">{work.whole ? "página entera" : `${work.blocks.length} ${work.blocks.length === 1 ? "sección" : "secciones"}`}</span>
              </button>
              {!work.whole &&
                work.blocks.map((block) => (
                  <button key={block.id} type="button" onClick={() => { go(work, block.id); setOpen(false); }} className="ml-5 truncate rounded-md px-2 py-1 text-left hover:bg-hover">
                    {block.label}
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}

      {limits.length > 0 && (
        <div>
          <p className="mb-1 font-semibold">No puedes</p>
          <ul className="flex flex-col gap-0.5 text-ink-dim">
            {limits.map((limit) => (
              <li key={limit}>· {limit.replace(/^Sin /, "").replace(/^./, (c) => c.toUpperCase())}</li>
            ))}
          </ul>
        </div>
      )}

      <p className={`border-t border-line pt-2 ${expired ? "text-red-400" : "text-ink-dim"}`}>⏱ {expiry}</p>
    </aside>
  );
}
