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
  const interactive = live && (link !== undefined || props.onClick !== undefined);

  const activate = () => {
    if (link) onFollow(link, element.id);
    props.onClick?.();
    onDone();
  };

  return (
    <li className="border-b border-current/15 last:border-b-0" ref={ref as never}>
      <button
        type="button"
        data-menu-item=""
        disabled={!interactive}
        onClick={activate}
        {...(live ? { onPointerEnter: props.onPointerEnter } : {})}
        className="flex w-full items-center px-1 py-3 text-left text-lg transition-opacity enabled:cursor-pointer enabled:hover:opacity-70 focus-visible:outline-2 focus-visible:outline-sky-500"
        style={{ color: panelText(background, element.color, color), fontFamily: element.fontFamily || undefined, fontWeight: element.bold ? 700 : 400 }}
      >
        {CONTENT[element.kind](element)}
      </button>
    </li>
  );
}
