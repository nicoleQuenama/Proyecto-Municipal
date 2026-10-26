"use client";

import { useCanvasSettings, type EditScope } from "../canvas-editing/settings-context";
import { applyOverrides } from "../site/overrides";
import { elementChange } from "../site/scope-actions";
import { useSite, useSiteDispatch } from "../site/site-context";
import { LayersPanel } from "./layers-panel";

const SCOPES: { value: EditScope; label: string }[] = [
  { value: "block", label: "Este bloque" },
  { value: "component", label: "Todo el componente" },
];

/** Las capas de la sección seleccionada en la página; los cambios valen para este bloque o para todo el componente. */
export function SectionLayers() {
  const { pages, currentPageId, selectedId, selectedElementId, components } = useSite();
  const dispatch = useSiteDispatch();
  const { settings, setSettings } = useCanvasSettings();

  const page = pages.find((p) => p.id === currentPageId);
  const block = page?.blocks.find((b) => b.id === selectedId);
  const def = components.find((c) => c.id === block?.componentId);
  if (!page || !block || !def) return null;

  const view = applyOverrides(def, block, () => undefined);
  const target = { pageId: page.id, blockId: block.id, componentId: def.id };
  const { scope } = settings;

  return (
    <section aria-label={`Capas de ${def.name}`} className="flex max-h-72 flex-col gap-2 overflow-y-auto border-t border-line px-3 py-3">
      <h3 className="truncate text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Capas de {def.name}</h3>
      <div role="group" aria-label="Dónde valen los cambios de capas" className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
        {SCOPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={scope === value}
            onClick={() => setSettings((current) => ({ ...current, scope: value }))}
            className={`h-7 rounded ${scope === value ? "bg-accent/25 text-accent" : "text-ink-dim hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <LayersPanel
        elements={view.elements}
        selectedId={selectedElementId}
        onSelect={(id) => dispatch({ type: "element/select", id })}
        onPatch={(id, patch) => dispatch(elementChange(scope, target, id, patch))}
        onReorder={(ids) => dispatch({ type: "layer/order", scope, ...target, ids })}
      />
    </section>
  );
}
