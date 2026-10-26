"use client";

import { useState } from "react";
import { useSite } from "../site/site-context";
import { describeTransition, normalizeExternalUrl, TRANSITION_LABELS } from "./links";
import type { LinkTarget, TransitionKind } from "./types";
import { KINDS, TransitionFields } from "./transition-fields";
import { ModalLinkFields } from "../modal/modal-link-fields";

const selectClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

type PageLink = Extract<LinkTarget, { kind: "page" }>;
type ExternalLink = Extract<LinkTarget, { kind: "external" }>;

/** La URL se valida al terminar de escribir: «ejemplo.com» se guarda como https://ejemplo.com. */
function UrlField({ link, onChange, label }: { link: ExternalLink; onChange: (l: LinkTarget) => void; label: string }) {
  const [draft, setDraft] = useState(link.url);
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    if (draft.trim() === "") {
      setError(link.url === "" ? null : "Escribe una URL o cambia el tipo de enlace.");
      return;
    }
    const url = normalizeExternalUrl(draft);
    if (url === null) return setError("Usa una URL válida (https://…), mailto: o tel:.");

    setError(null);
    setDraft(url);
    onChange({ ...link, url });
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        aria-label={`${label}: URL`}
        aria-invalid={error !== null}
        placeholder="https://ejemplo.com"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={`${selectClass} ${error ? "border-red-500" : ""}`}
      />
      {error && <span role="alert" className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}

interface LinkEditorProps {
  link: LinkTarget | undefined;
  onChange: (link: LinkTarget | null) => void;
  /** Para los lectores de pantalla: de qué elemento se trata. */
  label: string;
}

/** Marca un elemento como texto, enlace a una página o enlace externo. */
export function LinkEditor({ link, onChange, label }: LinkEditorProps) {
  const { pages, navigation } = useSite();
  const kind = link?.kind ?? "none";

  const changeKind = (next: string) => {
    if (next === "none") onChange(null);
    else if (next === "page") onChange({ kind: "page", pageId: pages[0].id });
    else if (next === "modal") onChange({ kind: "modal", pageId: (pages.find((p) => !p.isHome) ?? pages[0]).id });
    else if (next === "close-modal") onChange({ kind: "close-modal" });
    else onChange({ kind: "external", url: "", newTab: true });
  };

  const setTransitionKind = (link: PageLink, value: string) => {
    if (value === "default") return onChange({ kind: "page", pageId: link.pageId });

    const base = link.transition ?? navigation.defaultTransition;
    onChange({ ...link, transition: { kind: value as TransitionKind, seconds: base.seconds || 0.4 } });
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        aria-label={`${label}: tipo de contenido`}
        value={kind}
        onChange={(e) => changeKind(e.target.value)}
        className={selectClass}
      >
        <option value="none">Sin enlace (solo contenido)</option>
        <option value="page">Enlace a una página</option>
        <option value="modal">Abrir en una ventana modal</option>
        <option value="close-modal">Cerrar la ventana modal</option>
        <option value="external">Enlace externo ↗</option>
      </select>

      {link?.kind === "page" && (
        <>
          <select
            aria-label={`${label}: página de destino`}
            value={link.pageId}
            onChange={(e) => onChange({ ...link, pageId: e.target.value })}
            className={selectClass}
          >
            {!pages.some((page) => page.id === link.pageId) && (
              <option value={link.pageId}>(página eliminada)</option>
            )}
            {pages.map((page) => (
              <option key={page.id} value={page.id}>{page.route ? `${page.name} · ${page.route}` : page.name}</option>
            ))}
          </select>

          {pages.find((page) => page.id === link.pageId)?.route && (
            <p className="text-[11px] text-sky-400">
              Página dinámica: selecciona el elemento en el lienzo y rellena sus parámetros en el panel de la derecha.
            </p>
          )}

          <select
            aria-label={`${label}: transición`}
            value={link.transition?.kind ?? "default"}
            onChange={(e) => setTransitionKind(link, e.target.value)}
            className={selectClass}
          >
            <option value="default">Transición por defecto ({describeTransition(navigation.defaultTransition)})</option>
            {KINDS.map((option) => (
              <option key={option} value={option}>{TRANSITION_LABELS[option]}</option>
            ))}
          </select>

          {link.transition && link.transition.kind !== "none" && (
            <TransitionFields
              label="Animación de este enlace"
              value={link.transition}
              onChange={(transition) => onChange({ ...link, transition })}
            />
          )}
        </>
      )}

      {link?.kind === "modal" && <ModalLinkFields link={link} onChange={onChange} label={label} />}
      {link?.kind === "close-modal" && (
        <p className="text-[11px] text-ink-dim">Al pulsar este elemento dentro de una ventana modal, esta se cierra.</p>
      )}

      {link?.kind === "external" && (
        <>
          <UrlField key={link.url} link={link} onChange={onChange} label={label} />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={link.newTab}
              onChange={(e) => onChange({ ...link, newTab: e.target.checked })}
              className="h-3.5 w-3.5 accent-accent"
            />
            Abrir en una pestaña nueva
          </label>
        </>
      )}
    </div>
  );
}
