"use client";

import { IconPicker } from "../icons/icon-picker";
import type { IconName } from "../icons/icon-set";
import { elementLabel } from "../navigation/links";
import { useSiteDispatch } from "../site/site-context";
import { ColorInput } from "../ui/color-input";
import { useFlag } from "./flag-store";
import { menuSetup, readingOrder, toggleItem } from "./menu-model";
import { panelBackground, panelText } from "./menu-colors";
import { MenuPanelCards } from "./menu-cards";
import type { EditorProps } from "./adapt-options";
import type { MenuConfig } from "./types";

/** Los íconos que suelen abrir un menú. */
const BUTTON_ICONS: IconName[] = ["menu", "menu-alt", "more-horizontal", "more-vertical", "grid", "list"];
const heading = "text-[11px] font-medium text-ink";

/** Editor del menú: qué va dentro, cómo es el botón y cómo se abre el panel. */
export function MenuEditor({ pageId, block, view, device }: EditorProps) {
  const dispatch = useSiteDispatch();
  const [open, setOpen] = useFlag(`menu:${block.id}`);
  const setup = menuSetup(view, { ...block, adapt: { [device]: "menu" } }, device);
  if (!setup) return null;
  const { config } = setup;
  const patch = (changes: Partial<MenuConfig>) => dispatch({ type: "responsive/menu", pageId, blockId: block.id, patch: changes });
  const candidates = view.elements.filter((e) => !e.hidden && (e.kind === "icon" || e.text.trim() !== "")).sort(readingOrder);

  return (
    <div className="flex w-full flex-col gap-2 border-t border-line px-2 pt-2 pb-1 text-left">
      <p className={heading}>¿Qué va dentro del menú?</p>
      <ul className="flex flex-col gap-0.5">
        {candidates.map((element) => (
          <li key={element.id}>
            <label className="flex cursor-pointer items-center gap-1.5 text-ink-dim">
              <input type="checkbox" checked={config.itemIds.includes(element.id)} onChange={(e) => patch({ itemIds: toggleItem(config, element.id, e.target.checked) })} />
              {elementLabel(element)}
            </label>
          </li>
        ))}
      </ul>

      <p className={heading}>Botón del menú</p>
      <IconPicker label="Ícono del botón" only={BUTTON_ICONS} value={config.icon} onPick={(icon) => patch({ icon })} />
      <label className="flex items-center gap-1 text-ink-dim">
        Tamaño
        <input type="number" min={16} max={56} value={config.iconSize} onChange={(e) => patch({ iconSize: Number(e.target.value) || 28 })} className="h-7 w-14 rounded-md border border-line bg-canvas px-2 text-ink" />
        px
      </label>
      <div className="flex flex-col gap-1 text-ink-dim">
        Color del ícono
        <ColorInput label="Color del ícono" value={config.iconColor ?? setup.items[0]?.color ?? "#0f172a"} onChange={(iconColor) => patch({ iconColor })} />
      </div>

      <p className={heading}>Cómo se abre</p>
      <MenuPanelCards value={config.panel} onPick={(panel) => patch({ panel })} />
      <div className="flex flex-col gap-2 text-ink-dim">
        <div className="flex flex-col gap-1">
          Fondo del panel
          <ColorInput label="Fondo del panel" value={panelBackground(view, config)} onChange={(panelBackground) => patch({ panelBackground })} />
        </div>
        <div className="flex flex-col gap-1">
          Texto del panel
          <ColorInput label="Texto del panel" value={panelText(panelBackground(view, config), "#0f172a", config.panelColor)} onChange={(panelColor) => patch({ panelColor })} />
        </div>
      </div>
      {(config.panelBackground || config.panelColor) && (
        <button type="button" onClick={() => patch({ panelBackground: undefined, panelColor: undefined })} className="self-start text-ink-dim underline hover:text-ink">
          Usar los colores de la sección
        </button>
      )}

      <button
        type="button"
        aria-pressed={open}
        onClick={() => setOpen(!open)}
        className={`h-7 rounded-full px-3 font-medium ${open ? "bg-accent text-white" : "border border-line text-ink hover:bg-hover"}`}
      >
        {open ? "Cerrar el menú de prueba" : "Ver menú abierto"}
      </button>
    </div>
  );
}
