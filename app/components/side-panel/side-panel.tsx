"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { UserManagement } from "../auth/user-management";
import { AppearanceTab } from "../appearance/appearance-tab";
import { DataTab } from "../data-sources/data-tab";
import { LibrariesTab } from "../libraries/libraries-tab";
import { NavigationTab } from "../navigation/navigation-tab";
import { splitBlocks } from "../site/rules";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { TITLE_SELECTION } from "../site/types";
import { PanelCollapseIcon } from "../viewport/icons";
import { ComponentsTab } from "./components-tab";
import { HiddenList } from "./hidden-list";
import { categoryIcon } from "../site/categories";
import { TABS, type PanelTab } from "./data";
import { PagesTab } from "./pages-tab";
import { StructureList, type StructureItem } from "./structure-list";
import { TAB_ICONS } from "./tab-icons";

/** Ancho de la barra de iconos; el del contenido se puede cambiar arrastrando. */
const RAIL_WIDTH = 56;
const MIN_WIDTH = 248;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 304;
const KEYBOARD_STEP = 16;

const clampWidth = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

/** Qué se dibuja en cada sección del panel. Una sección nueva es una entrada nueva. */
const TAB_CONTENT: Record<PanelTab, ReactNode> = {
  pages: <PagesTab />,
  components: <ComponentsTab />,
  navigation: <NavigationTab />,
  appearance: <AppearanceTab />,
  libraries: <LibrariesTab />,
  users: <UserManagement />,
  data: <DataTab />,
};

export function SidePanel() {
  const [tab, setTab] = useState<PanelTab>("components");
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  const page = useCurrentPage();
  const { components, selectedId } = useSite();
  const dispatch = useSiteDispatch();
  const { currentUser } = useAuth();

  // Igual que en el lienzo: barras de navegación, titular y el resto de bloques.
  const toItem = (block: { id: string; componentId: string }): StructureItem[] => {
    const def = components.find((c) => c.id === block.componentId);
    return def
      ? [{ id: block.id, name: def.name, meta: def.description, icon: categoryIcon(def.category), removable: true }]
      : [];
  };
  const { top, body } = splitBlocks(page, components);
  const items: StructureItem[] = [
    ...top.flatMap(toItem),
    ...(page.titleRemoved ? [] : [{ id: TITLE_SELECTION, name: "Titular", meta: "", icon: "T", removable: true }]),
    ...body.flatMap(toItem),
  ];

  // Pulsar la sección abierta pliega el panel (como en VS Code); pulsar otra la abre.
  const pickTab = (value: PanelTab) => {
    if (value === tab && !collapsed) return setCollapsed(true);
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
    setWidth(clampWidth(e.clientX - panelRef.current.getBoundingClientRect().left - RAIL_WIDTH));
  };
  const resizeWithKeys = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setWidth((w) => clampWidth(w - KEYBOARD_STEP));
    else if (e.key === "ArrowRight") setWidth((w) => clampWidth(w + KEYBOARD_STEP));
    else return;
    e.preventDefault();
  };

  // Cada sección declara el permiso que necesita; el rol del usuario decide qué ve.
  const visibleTabs = TABS.filter((t) => hasPermission(currentUser, t.permission));
  const activeTab = visibleTabs.some((t) => t.value === tab) ? tab : visibleTabs[0].value;
  const current = visibleTabs.find((t) => t.value === activeTab) ?? visibleTabs[0];

  return (
    <aside
      ref={panelRef}
      aria-label="Panel de construcción"
      className={`relative my-3 ml-3 flex shrink-0 self-stretch overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl ${
        resizing ? "" : "transition-[width] duration-200"
      }`}
      style={{ width: collapsed ? RAIL_WIDTH : RAIL_WIDTH + width }}
    >
      <nav
        aria-label="Secciones del panel"
        className="flex shrink-0 flex-col items-center gap-1 border-r border-line py-2"
        style={{ width: RAIL_WIDTH }}
      >
        <button
          type="button"
          aria-label={collapsed ? "Expandir panel" : "Plegar panel"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir panel" : "Plegar panel"}
          onClick={() => setCollapsed((value) => !value)}
          className="mb-1 flex h-8 w-8 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-hover hover:text-ink"
        >
          <PanelCollapseIcon collapsed={collapsed} />
        </button>

        {visibleTabs.map((t) => {
          const active = t.value === activeTab && !collapsed;
          return (
            <button
              key={t.value}
              type="button"
              aria-label={t.title}
              aria-pressed={active}
              title={t.title}
              onClick={() => pickTab(t.value)}
              className={`relative flex w-12 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors ${
                active ? "bg-hover text-ink" : "text-ink-dim hover:bg-hover/60 hover:text-ink"
              }`}
            >
              {active && <span aria-hidden className="absolute top-2 -left-[7px] h-5 w-0.5 rounded-full bg-accent" />}
              {TAB_ICONS[t.value]}
              {t.label}
            </button>
          );
        })}

        <span
          title={`${items.length} bloques en ${page.name}`}
          className="mt-auto rounded bg-hover px-1.5 py-0.5 text-[11px] text-ink-dim"
        >
          {items.length}
        </span>
      </nav>

      {!collapsed && (
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-11 shrink-0 items-center border-b border-line px-4 text-sm font-semibold">
            {current.title}
          </header>

          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4">
            {TAB_CONTENT[activeTab]}
          </div>

          {/* La estructura empieza cerrada para dejarle todo el alto al contenido de la sección. */}
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
                onRemove={(id) =>
                  dispatch(
                    id === TITLE_SELECTION
                      ? { type: "title/removed", pageId: page.id, removed: true }
                      : { type: "block/remove", id },
                  )
                }
              />
              <HiddenList page={page} />
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
        </div>
      )}
    </aside>
  );
}
