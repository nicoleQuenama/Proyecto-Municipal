"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconGlyph } from "../icons/icon-glyph";
import { PANEL_STYLES } from "./menu-panels";
import type { MenuPanel } from "./types";

interface MenuPanelProps {
  kind: MenuPanel;
  background: string;
  color?: string;
  /** El botón que lo abrió: el foco vuelve a él al cerrar. */
  opener: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}

/** La página donde está la sección: ahí van el velo y los paneles que la cubren. */
const pageOf = (element: Element | null): Element | null => element?.closest("[data-site-page]") ?? null;

/** El panel del menú abierto, con velo, animación de entrada, Esc para cerrar y el foco dentro. */
export function MenuPanelView({ kind, background, color, opener, onClose, children }: MenuPanelProps) {
  const style = PANEL_STYLES[kind];
  const panel = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const page = pageOf(opener.current);

  useEffect(() => {
    const element = panel.current;
    const button = opener.current;
    veilRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    element?.animate(style.enter, { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    element?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [style, opener, onClose]);

  const veil = (
    <div ref={veilRef} aria-hidden onClick={onClose} className="absolute inset-0 z-[55] bg-black/45" />
  );
  const body = (
    <div
      ref={panel}
      id="menu-panel"
      role="dialog"
      aria-modal={style.coversPage}
      aria-label="Menú"
      className="z-[60] overflow-y-auto p-4 shadow-2xl"
      style={{ ...style.frame, background, color }}
    >
      {style.coversPage && (
        <button
          type="button"
          aria-label="Cerrar el menú"
          onClick={onClose}
          className="mb-2 ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/10"
        >
          <IconGlyph name="close" size={24} />
        </button>
      )}
      <nav aria-label="Menú">
        <ul>{children}</ul>
      </nav>
    </div>
  );

  return (
    <>
      {page ? createPortal(veil, page) : null}
      {style.coversPage && page ? createPortal(body, page) : body}
    </>
  );
}
