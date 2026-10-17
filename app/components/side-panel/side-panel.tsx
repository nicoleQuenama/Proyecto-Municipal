"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AppearanceTab } from "../appearance/appearance-tab";
import { NavigationTab } from "../navigation/navigation-tab";
import { useNavigation } from "../navigation/navigation-context";
import { splitBlocks } from "../site/rules";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { TITLE_SELECTION } from "../site/types";
import { ComponentsTab } from "./components-tab";
import { CATEGORY_ICONS, TABS, type PanelTab } from "./data";
import { PagesTab } from "./pages-tab";
import { StructureList, type StructureItem } from "./structure-list";

const MIN_WIDTH = 288;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 360;
const KEYBOARD_STEP = 16;

const clampWidth = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-hover hover:text-ink";

export function SidePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [chosenTab, setTab] = useState<PanelTab>("components");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const { mode } = useNavigation();

  // Al conectar con flechas el mapa tiene que verse: es donde se sueltan.
  const connecting = mode === "connect";
  const tab: PanelTab = connecting ? "navigation" : chosenTab;
  const compact = collapsed && !connecting;

  const page = useCurrentPage();
  const { components, selectedId } = useSite();
  const dispatch = useSiteDispatch();

  // Igual que en el lienzo: barras de navegación, titular y el resto de bloques.
  const toItem = (block: { id: string; componentId: string }): StructureItem[] => {
    const def = components.find((c) => c.id === block.componentId);
    return def
      ? [{ id: block.id, name: def.name, meta: def.description, icon: CATEGORY_ICONS[def.category], removable: true }]
      : [];
  };
  const { top, body } = splitBlocks(page, components);
  const items: StructureItem[] = [
    ...top.flatMap(toItem),
    { id: TITLE_SELECTION, name: "Titular", meta: "", icon: "T", removable: false },
    ...body.flatMap(toItem),
  ];

  const openTab = (value: PanelTab) => {
    setTab(value);
    setCollapsed(false);
  };

  // El ancho se cambia arrastrando el borde derecho (o con las flechas, estando enfocado).
  const startResize = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setResizing(true);
  };
  const moveResize = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizing || !panelRef.current) return;
    setWidth(clampWidth(e.clientX - panelRef.current.getBoundingClientRect().left));
  };
  const resizeWithKeys = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setWidth((w) => clampWidth(w - KEYBOARD_STEP));
    else if (e.key === "ArrowRight") setWidth((w) => clampWidth(w + KEYBOARD_STEP));
    else return;
    e.preventDefault();
  };

  return (
    <aside
      ref={panelRef}
      aria-label="Panel de construcción"
      className={`relative my-3 ml-3 flex shrink-0 flex-col self-stretch overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl ${
        resizing ? "" : "transition-[width] duration-200"
      } ${compact ? "w-14" : ""}`}
      style={compact ? undefined : { width }}
    >
      {compact ? (
        <div className="flex flex-1 flex-col items-center gap-1 py-2">
          <button
            type="button"
            aria-label="Expandir panel"
            aria-expanded={false}
            title="Expandir panel"
            onClick={() => setCollapsed(false)}
            className={iconButton}
          >
            »
          </button>
          <span aria-hidden className="my-1 h-px w-6 bg-line" />
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-label={t.label}
              title={t.label}
              onClick={() => openTab(t.value)}
              className={`${iconButton} ${tab === t.value ? "bg-hover text-ink" : ""}`}
            >
              {t.icon}
            </button>
          ))}
          <span
            title={`${items.length} bloques en ${page.name}`}
            className="mt-auto rounded bg-hover px-1.5 py-0.5 text-[11px] text-ink-dim"
          >
            {items.length}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 border-b border-line p-2">
            <button
              type="button"
              aria-label="Colapsar panel"
              aria-expanded
              title="Colapsar panel"
              onClick={() => setCollapsed(true)}
              className={iconButton}
            >
              «
            </button>

            <div role="tablist" className="grid flex-1 grid-cols-4 gap-0.5">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] transition-colors ${
                    tab === t.value ? "bg-hover text-ink" : "text-ink-dim hover:text-ink"
                  }`}
                >
                  <span aria-hidden>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "components" && <ComponentsTab />}
            {tab === "pages" && <PagesTab />}
            {tab === "appearance" && <AppearanceTab />}
            {tab === "navigation" && <NavigationTab />}
          </div>

          {/* La estructura empieza cerrada para dejarle todo el alto al contenido de la pestaña. */}
          <div className="border-t border-line">
            <button
              type="button"
              aria-expanded={structureOpen}
              aria-controls="structure-list"
              onClick={() => setStructureOpen((open) => !open)}
              className="flex h-10 w-full items-center gap-2 px-4 text-left hover:bg-hover"
            >
              <span aria-hidden className={`text-ink-dim transition-transform ${structureOpen ? "" : "-rotate-90"}`}>
                ▾
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
                Estructura de {page.name}
              </span>
              <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-[10px] text-ink-dim">
                {items.length} {items.length === 1 ? "bloque" : "bloques"}
              </span>
            </button>

            <div id="structure-list" hidden={!structureOpen} className="max-h-60 overflow-y-auto px-3 pb-3">
              <StructureList
                items={items}
                activeId={selectedId}
                onSelect={(id) => dispatch({ type: "block/select", id })}
                onRemove={(id) => dispatch({ type: "block/remove", id })}
              />
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Cambiar el ancho del panel"
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            tabIndex={0}
            title="Arrastra para cambiar el ancho (doble clic: restablecer)"
            onPointerDown={startResize}
            onPointerMove={moveResize}
            onPointerUp={() => setResizing(false)}
            onPointerCancel={() => setResizing(false)}
            onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
            onKeyDown={resizeWithKeys}
            className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50"
          />
        </>
      )}
    </aside>
  );
}
