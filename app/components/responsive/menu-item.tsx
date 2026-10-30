"use client";

import type { ReactNode } from "react";
import { useBehaviors } from "../behaviors/use-behaviors";
import type { Behavior } from "../behaviors/types";
import { IconGlyph } from "../icons/icon-glyph";
import { panelText } from "./menu-colors";
import type { LinkTarget } from "../navigation/types";
import type { CanvasElement, ElementKind } from "../site/types";

/** Qué se muestra de cada tipo de elemento dentro del menú. Un tipo nuevo es una entrada nueva. */
const CONTENT: Record<ElementKind, (element: CanvasElement) => ReactNode> = {
  text: (element) => element.text,
  rect: (element) => element.text,
  ellipse: (element) => element.text,
  triangle: () => null,
  line: () => null,
  icon: (element) => <IconGlyph name={element.icon ?? "star"} size={Math.min(element.fontSize, 28)} strokeWidth={element.strokeWidth} />,
  image: () => null,
  video: () => null,
};

interface MenuItemProps {
  element: CanvasElement;
  blockId: string;
  link: LinkTarget | undefined;
  behaviors: Behavior[];
  /** Solo al probar el sitio los enlaces e interacciones funcionan. */
  live: boolean;
  /** Fondo del panel y color elegido para el texto (si lo hay): el texto siempre debe leerse. */
  background: string;
  color?: string;
  onFollow: (link: LinkTarget, elementId: string) => void;
  onDone: () => void;
}

/** Una fila del menú: el elemento como un enlace de lista, con su enlace y sus interacciones. */
export function MenuItem({ element, blockId, link, behaviors, live, background, color, onFollow, onDone }: MenuItemProps) {
  const mine = behaviors.filter((b) => b.scope === element.id);
  const { ref, props } = useBehaviors(blockId, mine, live);
  const isSearch = element.control?.name === "search-trigger" || element.text?.toLowerCase().includes("buscar");
  const isButton = element.role === "button" && !isSearch;
  const interactive = (live && (link !== undefined || props.onClick !== undefined)) || isSearch;

  const activate = () => {
    if (isSearch) {
      window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query: "" } }));
    }
    if (link) onFollow(link, element.id);
    props.onClick?.();
    onDone();
  };

  if (isSearch) {
    return (
      <li className="py-2 border-b border-current/15" ref={ref as never}>
        <button
          type="button"
          data-menu-item=""
          onClick={activate}
          className="flex w-full items-center gap-2.5 rounded-lg border border-current/25 bg-current/10 px-3.5 py-2.5 text-sm text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
          style={{ color: panelText(background, element.color, color) }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 opacity-90">{element.text?.trim() || "Buscar trámites..."}</span>
        </button>
      </li>
    );
  }

  if (isButton) {
    return (
      <li className="py-2 border-b border-current/15" ref={ref as never}>
        <button
          type="button"
          data-menu-item=""
          onClick={activate}
          className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 font-semibold text-sm shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
          style={{
            backgroundColor: element.fill && element.fill !== "transparent" ? element.fill : "var(--color-accent, #0d99ff)",
            color: element.color || "#ffffff",
            borderRadius: `${element.radius ?? 8}px`,
          }}
        >
          {CONTENT[element.kind](element)}
        </button>
      </li>
    );
  }

  return (
    <li className="border-b border-current/15 last:border-b-0" ref={ref as never}>
      <button
        type="button"
        data-menu-item=""
        disabled={!interactive}
        onClick={activate}
        {...(live ? { onPointerEnter: props.onPointerEnter } : {})}
        className="flex w-full items-center px-1 py-3 text-left text-base transition-opacity enabled:cursor-pointer enabled:hover:opacity-70 focus-visible:outline-2 focus-visible:outline-accent"
        style={{ color: panelText(background, element.color, color), fontFamily: element.fontFamily || undefined, fontWeight: element.bold ? 700 : 400 }}
      >
        {CONTENT[element.kind](element)}
      </button>
    </li>
  );
}
