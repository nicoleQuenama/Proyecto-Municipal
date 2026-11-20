"use client";

import { useCallback, useRef } from "react";
import type { Behavior } from "../behaviors/types";
import { IconGlyph } from "../icons/icon-glyph";
import type { LinkTarget } from "../navigation/types";
import type { ComponentDef } from "../site/types";
import { useFlag } from "./flag-store";
import { MenuItem } from "./menu-item";
import { menuButtonFrame, type MenuSetup } from "./menu-model";
import { panelBackground, panelText } from "./menu-colors";
import { MenuPanelView } from "./menu-panel";

interface MenuLayerProps {
  setup: MenuSetup;
  /** La sección ya adaptada: de ella sale dónde va el botón. */
  view: ComponentDef;
  blockId: string;
  /** Solo al probar el sitio funcionan los enlaces. */
  live: boolean;
  links: Record<string, LinkTarget>;
  behaviors: Behavior[];
  /** El fondo de la sección: el del panel si no se eligió otro. */
  background?: string;
  onFollow: (link: LinkTarget, elementId: string) => void;
}

/** El botón del menú (en lugar de los elementos que se fueron al menú) y su panel cuando está abierto. */
export function MenuLayer({ setup, view, blockId, live, links, behaviors, background, onFollow }: MenuLayerProps) {
  const { config, items } = setup;
  const [open, setOpen] = useFlag(`menu:${blockId}`);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const frame = menuButtonFrame(view, config);
  const panelBg = panelBackground(view, config, background);
  const isDark =
    background?.includes("#0") ||
    background?.includes("#1") ||
    background?.includes("#2") ||
    (view.styles?.$section?.classes && /bg-(slate|neutral|zinc|gray)-(700|800|900|950)|bg-black/.test(view.styles.$section.classes));
  const iconColor = config.iconColor ?? (isDark ? "#f8fafc" : items.find((i) => i.color)?.color ?? "#0f172a");

  return (
    <>
      <button
        ref={button}
        type="button"
        data-menu-button=""
        aria-expanded={open}
        aria-controls="menu-panel"
        aria-label={open ? "Cerrar el menú" : "Abrir el menú"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`absolute z-20 flex cursor-pointer items-center justify-center rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"} focus-visible:outline-2 focus-visible:outline-sky-500`}
        style={{ top: frame.top, right: frame.right, width: frame.size, height: frame.size, color: iconColor }}
      >
        <IconGlyph name={open && config.panel === "drop" ? "close" : config.icon} size={config.iconSize} />
      </button>
      {open && (
        <MenuPanelView
          kind={config.panel}
          background={panelBg}
          color={panelText(panelBg, "#0f172a", config.panelColor)}
          opener={button}
          onClose={close}
        >
          {items.map((element) => (
            <MenuItem
              key={element.id}
              element={element}
              blockId={blockId}
              link={links[element.id]}
              behaviors={behaviors}
              live={live}
              background={panelBg}
              color={config.panelColor}
              onFollow={onFollow}
              onDone={close}
            />
          ))}
        </MenuPanelView>
      )}
    </>
  );
}
