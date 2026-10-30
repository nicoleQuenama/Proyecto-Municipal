"use client";

import { useCanvasSettings } from "../canvas-editing/settings-context";
import { colorInputValue } from "../format/format-options";
import { applyOverrides } from "../site/overrides";
import { useSiteDispatch } from "../site/site-context";
import type { BlockInstance, ComponentDef } from "../site/types";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { collectColors, type ColorGroup } from "./collect-colors";
import { HexField } from "./hex-field";

interface SectionColorPaletteProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  compact?: boolean;
}

export function SectionColorPalette({ pageId, block, def, compact = false }: SectionColorPaletteProps) {
  const dispatch = useSiteDispatch();
  const styles = useStyles();
  const { settings, setSettings } = useCanvasSettings();

  const resolve = styles.resolver(def.id);
  const view = applyOverrides(styles.component(def), block, resolve);
  const boxBackground = (block.box?.background && resolve(block.box.background)) || boxStyle(styles.block(def)).background;
  const groups = collectColors(view, typeof boxBackground === "string" ? boxBackground : undefined);

  if (groups.length === 0) {
    return <p className="text-xs text-ink-dim">Esta sección no tiene colores directos detectados.</p>;
  }

  const recolor = (group: ColorGroup, color: string) => {
    const change = { pageId, blockId: block.id, color, fill: group.elements.fill, text: group.elements.color, box: group.box };
    dispatch(settings.scope === "component" ? { type: "component/recolor", componentId: def.id, ...change } : { type: "block/recolor", ...change });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <span className="font-semibold text-ink">
          Colores ({groups.length})
        </span>
        <button
          type="button"
          onClick={() => setSettings((prev) => ({ ...prev, scope: prev.scope === "component" ? "block" : "component" }))}
          className="text-[10px] text-accent hover:underline font-medium"
          title="Alternar si el cambio de color afecta a todo el componente o solo a esta sección"
        >
          {settings.scope === "component" ? "En todo el sitio" : "Solo en esta sección"}
        </button>
      </div>

      <ul className={`grid ${compact ? "grid-cols-4 gap-1.5" : "grid-cols-3 sm:grid-cols-4 gap-2"} rounded-lg border border-line bg-canvas/40 p-2`}>
        {groups.map((group, index) => (
          <li key={index} className="flex flex-col items-center gap-1 rounded-md border border-line/60 bg-panel p-1.5 shadow-xs">
            <label
              title={`Cambiar color ${group.value}`}
              className="relative block size-7 cursor-pointer rounded-full border border-line shadow-sm hover:scale-105 transition-transform"
              style={{ background: group.value }}
            >
              <input
                type="color"
                aria-label={`Color ${group.value}`}
                value={colorInputValue(group.value)}
                onChange={(e) => recolor(group, e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <HexField value={group.value} onChange={(color) => recolor(group, color)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
