"use client";

import { useCanvasSettings } from "../canvas-editing/settings-context";
import { colorInputValue } from "../format/format-options";
import { useNavigation } from "../navigation/navigation-context";
import { applyOverrides } from "../site/overrides";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { TITLE_SELECTION } from "../site/types";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { useInspectorDock } from "../customize/dockable-inspector-context";
import { collectColors, type ColorGroup } from "./collect-colors";
import { HexField } from "./hex-field";

function Swatch({ group, onChange }: { group: ColorGroup; onChange: (color: string) => void }) {
  return (
    <li className="flex w-14 flex-col items-center gap-1">
      <label
        title={`Cambiar ${group.value}`}
        className="relative block size-8 cursor-pointer rounded-full border border-line shadow-sm focus-within:ring-2 focus-within:ring-accent"
        style={{ background: group.value }}
      >
        <input
          type="color"
          aria-label={`Color ${group.value}`}
          value={colorInputValue(group.value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <HexField value={group.value} onChange={onChange} />
    </li>
  );
}

/** Los colores de la sección seleccionada, arriba a la derecha del lienzo; al cambiar uno cambia donde se usa. */
export function SectionColors() {
  const { mode } = useNavigation();
  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const styles = useStyles();
  const { settings } = useCanvasSettings();
  const { dock, minimized, width } = useInspectorDock();

  const block = site.selectedId === TITLE_SELECTION ? undefined : page.blocks.find((b) => b.id === site.selectedId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (mode !== "edit" || !block || !def || block.hidden) return null;

  const resolve = styles.resolver(def.id);
  const view = applyOverrides(styles.component(def), block, resolve);
  const boxBackground = (block.box?.background && resolve(block.box.background)) || boxStyle(styles.block(def)).background;
  const groups = collectColors(view, typeof boxBackground === "string" ? boxBackground : undefined);
  if (groups.length === 0) return null;

  // «Todo el componente» recolorea en cada sección que lo usa; si no, solo en esta.
  const recolor = (group: ColorGroup, color: string) => {
    const change = { pageId: page.id, blockId: block.id, color, fill: group.elements.fill, text: group.elements.color, box: group.box };
    dispatch(settings.scope === "component" ? { type: "component/recolor", componentId: def.id, ...change } : { type: "block/recolor", ...change });
  };

  const isRightDocked = dock === "right" && !minimized;
  const rightOffset = isRightDocked ? `${width + 24}px` : "1.5rem";

  return (
    <div
      role="group"
      aria-label={`Colores de ${view.name}`}
      style={{ right: rightOffset }}
      className="absolute top-4 z-30 max-w-[calc(100%-23rem)] rounded-xl border border-line bg-panel p-2 text-ink shadow-2xl transition-[right] duration-150"
    >
      <ul className="flex flex-wrap justify-end gap-x-1 gap-y-2">
        {groups.map((group, index) => (
          <Swatch key={index} group={group} onChange={(color) => recolor(group, color)} />
        ))}
      </ul>
    </div>
  );
}
