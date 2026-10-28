"use client";

import { useState, type MouseEvent } from "react";
import { useAuth } from "../auth/auth-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { useViewport } from "../viewport/viewport-context";
import { canRemoveComment, visibleComments, type CommentAudience, type DesignComment } from "./comment-rules";

const formatDate = (iso: string) => new Date(iso).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const CARD = "absolute z-[45] w-64 rounded-lg border border-line bg-panel p-3 text-xs text-ink shadow-xl";

/**
 * Los comentarios de una página, dibujados sobre ella (solo al editar). Con la herramienta «Comentar», un clic
 * deja una nota nueva en ese punto; cada nota es un círculo que se abre al pulsarlo.
 */
export function CommentLayer({ page }: { page: Page }) {
  const { comments } = useSite();
  const dispatch = useSiteDispatch();
  const { tool, setTool, zoom } = useViewport();
  // La página se ve con zoom: los pines y las tarjetas lo compensan para leerse siempre a su tamaño.
  const steady = { transform: `scale(${100 / zoom})`, transformOrigin: "0 0" } as const;
  const { currentUser } = useAuth();
  const viewer = currentUser?.name ?? "Tú";
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<CommentAudience>("team");
  const [open, setOpen] = useState<string | null>(null);
  const notes = visibleComments(comments, page.id, viewer);

  // La posición se mide sobre la página (el contenedor de esta capa) y se devuelve a píxeles de diseño.
  const place = (e: MouseEvent<HTMLDivElement>) => {
    const surface = e.currentTarget.parentElement as HTMLElement;
    const box = surface.getBoundingClientRect();
    const scale = box.width / surface.offsetWidth || 1;
    setDraft({ x: Math.round((e.clientX - box.left) / scale), y: Math.round((e.clientY - box.top) / scale) });
    setText("");
    setOpen(null);
  };

  const save = () => {
    if (!draft || !text.trim()) return;
    const comment: DesignComment = {
      id: `cm-${Date.now().toString(36)}`,
      pageId: page.id,
      x: draft.x,
      y: draft.y,
      text: text.trim(),
      author: viewer,
      at: new Date().toISOString(),
      audience,
    };
    dispatch({ type: "comment/add", comment });
    setDraft(null);
    setTool("select");
  };

  return (
    <>
      {tool === "comment" && <div aria-label="Dejar un comentario" onClick={place} className="absolute inset-0 z-[44] cursor-crosshair" />}

      {notes.map((note, index) => (
        <div key={note.id} className="absolute z-[45]" style={{ left: note.x, top: note.y }} data-gradient-ui>
          <div style={steady}>
          <button
            type="button"
            aria-label={`Comentario de ${note.author}`}
            onClick={() => setOpen(open === note.id ? null : note.id)}
            className={`flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none border-2 border-white text-[11px] font-semibold text-white shadow-lg ${note.resolved ? "bg-slate-500" : note.audience === "private" ? "bg-amber-500" : "bg-accent"}`}
          >
            {index + 1}
          </button>
          {open === note.id && (
            <div className={`${CARD} top-1 left-3`}>
              <p className="font-semibold">
                {note.author} <span className="font-normal text-ink-dim">· {formatDate(note.at)}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
              <p className="mt-1 text-[11px] text-ink-dim">{note.audience === "team" ? "Visible para todo el equipo" : "Solo tú lo ves"}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "comment/resolve", id: note.id, resolved: !note.resolved })}
                  className="h-7 rounded-md border border-line px-2 hover:bg-hover"
                >
                  {note.resolved ? "Reabrir" : "Resolver"}
                </button>
                {canRemoveComment(note, viewer) && (
                  <button type="button" onClick={() => dispatch({ type: "comment/remove", id: note.id })} className="h-7 rounded-md px-2 text-red-400 hover:bg-hover">
                    Borrar
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      ))}

      {draft && (
        <div className="absolute z-[45]" style={{ left: draft.x, top: draft.y }} data-gradient-ui>
        <div className={`${CARD} flex flex-col gap-2`} style={steady}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu comentario…"
            className="h-20 w-full resize-none rounded-md border border-line bg-canvas p-2 outline-none focus:border-accent"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as CommentAudience)}
            className="h-8 rounded-md border border-line bg-canvas px-2 [&>option]:bg-panel"
          >
            <option value="team">Visible para todo el equipo</option>
            <option value="private">Solo para mí</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={!text.trim()} className="h-8 rounded-md bg-accent px-3 text-white disabled:opacity-40">
              Comentar
            </button>
            <button type="button" onClick={() => setDraft(null)} className="h-8 rounded-md border border-line px-3 hover:bg-hover">
              Cancelar
            </button>
          </div>
        </div>
        </div>
      )}
    </>
  );
}
