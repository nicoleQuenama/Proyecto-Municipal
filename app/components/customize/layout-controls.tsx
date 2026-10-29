"use client";

import { useState } from "react";
import { useViewport } from "../viewport/viewport-context";
import { DesktopIcon, TabletIcon, MobileIcon } from "../viewport/icons";
import { NumberField } from "../ui/number-field";
import { Collapsible } from "../ui/collapsible";
import {
  applyCell,
  applyGap,
  applyPadding,
  applyQuickPreset,
  applyResponsiveGrid,
  cellOf,
  gapOf,
  isGridLayout,
  paddingOf,
  parseResponsiveGridConfig,
  quickPresetOf,
  applyBreakpointOverride,
  parseBreakpointOverrides,
  applyWrapperConfig,
  parseWrapperConfig,
  type DeviceBreakpoint,
  GAP_PRESETS,
  PADDING_PRESETS,
  QUICK_PRESETS,
  type QuickPresetKey,
} from "./layout-presets";

const MAX_CHILD_COLS = 4;
const MAX_CHILD_ROWS = 6;

function useSafeViewport() {
  try {
    return useViewport();
  } catch {
    return null;
  }
}

export interface ContainerCardItem {
  id: string;
  title: string;
  elementCount: number;
}

interface LayoutControlsProps {
  /** Una sección entera, o uno de sus elementos (que solo puede elegir su celda en una cuadrícula). */
  isSection: boolean;
  /** Las clases de lo que se está editando (la sección o el elemento). */
  classes: string;
  /** Las clases de la sección: de ellas depende si sus elementos están en una cuadrícula. */
  sectionClasses: string;
  onChange: (classes: string) => void;
  /** Permite ajustar el contenedor padre (como su Gap) aun teniendo un elemento hijo seleccionado. */
  onSectionChange?: (classes: string) => void;
  /** Permite seleccionar el contenedor padre. */
  onSelectSection?: () => void;
  /** Tarjetas o elementos dentro del contenedor */
  containerCards?: ContainerCardItem[];
  /** Id de la tarjeta seleccionada (si la hay) */
  selectedCardId?: string | null;
  /** Agregar nueva tarjeta al contenedor */
  onAddCard?: () => void;
  /** Agregar nuevo botón al contenedor de botones */
  onAddButton?: () => void;
  /** Duplicar tarjeta del contenedor */
  onDuplicateCard?: (cardId: string) => void;
  /** Eliminar tarjeta del contenedor */
  onDeleteCard?: (cardId: string) => void;
  /** Rellenar con 3 tarjetas automáticas */
  onFillThreeCards?: () => void;
  /** Seleccionar una tarjeta de la lista */
  onSelectCard?: (cardId: string) => void;
  /** Categoría del componente padre (buttons, cards, sections, etc.) */
  category?: string;
  /** ID del componente padre */
  componentId?: string;
  /** Indica si la sección o el elemento padre es un pie de página (footer) */
  isFooter?: boolean;
  /** Reorganiza los elementos del footer en columnas limpias */
  onOrganizeFooter?: (cols: 1 | 2 | 3 | 4) => void;
  /** Restablece el footer a la plantilla municipal de 3 columnas */
  onResetMunicipalFooter?: () => void;
  /** Mueve el elemento seleccionado a otra columna del footer */
  onMoveElementToFooterCol?: (targetColIndex: number) => void;
  /** Añade un enlace limpio a una columna del footer */
  onAddFooterLink?: (colIndex: number) => void;
  /** Cambia la alineación del elemento seleccionado */
  onAlignElement?: (align: "left" | "center" | "right") => void;
  /** Alineación actual del elemento si lo tiene */
  currentAlign?: "left" | "center" | "right";
  /** Índice de columna del elemento seleccionado (0-indexed) */
  currentColIndex?: number;
  /** Total de columnas en el footer */
  totalFooterCols?: number;
  /** Reordena el elemento seleccionado hacia arriba/antes o abajo/después */
  onMoveElementOrder?: (direction: -1 | 1) => void;
}

/** Controles intuitivos y compactos de distribución automática, cuadrícula responsiva, separación y relleno. */
export function LayoutControls({
  isSection,
  classes,
  sectionClasses,
  onChange,
  onSectionChange,
  onSelectSection,
  containerCards,
  selectedCardId,
  onAddCard,
  onAddButton,
  onDuplicateCard,
  onDeleteCard,
  onFillThreeCards,
  onSelectCard,
  category,
  componentId,
  isFooter,
  onOrganizeFooter,
  onResetMunicipalFooter,
  onMoveElementToFooterCol,
  onAddFooterLink,
  onAlignElement,
  currentAlign,
  currentColIndex,
  totalFooterCols,
  onMoveElementOrder,
}: LayoutControlsProps) {
  const viewport = useSafeViewport();
  const [showColumns, setShowColumns] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<DeviceBreakpoint>(
    viewport?.device === "mobile" ? "mobile" : viewport?.device === "tablet" ? "tablet" : "desktop",
  );

  if (isSection) {
    const currentPreset = quickPresetOf(classes);
    const inGrid = isGridLayout(currentPreset);
    const gridConfig = parseResponsiveGridConfig(classes) ?? {
      desktopCols: 4,
      tabletCols: 2,
      mobileCols: 2,
      gap: 16,
      padding: 0,
    };
    const currentGap = gapOf(classes);
    const currentPadding = paddingOf(classes);
    const overrides = parseBreakpointOverrides(classes);
    const currentOverride = overrides[activeBreakpoint];
    const wrapperConfig = parseWrapperConfig(classes);
    const isButtons = category === "buttons" || componentId === "cta-buttons" || componentId === "buttons";

    return (
      <Collapsible title="Disposición & Auto-Layout">
        {/* Estructura del Pie de Página (Footer) */}
        {isFooter && (
          <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2.5 shadow-xs mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Estructura del Pie de Página</span>
              <span className="text-[10px] font-medium text-accent">Auto-Layout</span>
            </div>
            <p className="text-[11px] text-ink-dim leading-snug">
              Organiza el pie de página en columnas proporcionales. En dispositivos móviles se adaptan automáticamente sin sobreponerse.
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-medium text-ink-dim">Distribución en columnas:</span>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {[
                  { cols: 3, label: "3 Cols" },
                  { cols: 4, label: "4 Cols" },
                  { cols: 2, label: "2 Cols" },
                  { cols: 1, label: "1 Col" },
                ].map((c) => (
                  <button
                    key={c.cols}
                    type="button"
                    onClick={() => onOrganizeFooter?.(c.cols as any)}
                    className={`h-7 rounded border font-medium transition-colors ${
                      (totalFooterCols === c.cols || (c.cols === 3 && !totalFooterCols))
                        ? "border-accent bg-accent text-white shadow-xs font-semibold"
                        : "border-line bg-canvas text-ink hover:bg-hover"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              {onOrganizeFooter && (
                <button
                  type="button"
                  onClick={() => onOrganizeFooter(3)}
                  className="flex items-center justify-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95"
                >
                  Reorganizar y ordenar automáticamente
                </button>
              )}
              {onResetMunicipalFooter && (
                <button
                  type="button"
                  onClick={onResetMunicipalFooter}
                  className="flex items-center justify-center gap-1 rounded-md border border-accent/30 bg-canvas px-3 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 active:scale-95"
                >
                  Restablecer a plantilla municipal completa
                </button>
              )}
            </div>
          </div>
        )}

        {/* Presets Rápidos */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-ink">Presets rápidos</span>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(QUICK_PRESETS) as QuickPresetKey[]).map((key) => {
              const active = key === currentPreset;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  title={QUICK_PRESETS[key].help}
                  onClick={() => onChange(applyQuickPreset(classes, key))}
                  className={`h-7 rounded-md border px-2 text-[11px] font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent/20 text-accent shadow-xs"
                      : "border-line text-ink hover:bg-hover hover:border-ink/20"
                  }`}
                >
                  {QUICK_PRESETS[key].label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-dim">
            {QUICK_PRESETS[currentPreset]?.help ?? "Organiza los elementos automáticamente."}
          </p>
        </div>

        {/* Gestión del Contenedor (Horizontal / Cuadrícula / Columna / Botones) */}
        {currentPreset !== "free" && (
          <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">
                {isButtons
                  ? "Contenedor de Botones CTA"
                  : `Contenedor ${currentPreset === "row" ? "Horizontal (Fila)" : inGrid ? "en Cuadrícula" : "Vertical"}`}
              </span>
              <span className="text-[10px] font-medium text-ink-dim">
                {containerCards?.length ?? 0} {isButtons ? (containerCards?.length === 1 ? "botón" : "botones") : (containerCards?.length === 1 ? "tarjeta" : "tarjetas")}
              </span>
            </div>

            <p className="text-[11px] text-ink-dim leading-snug">
              {isButtons
                ? "Contenedor auto-layout para botones CTA: agrupa y alinea botones con espaciado y márgenes configurables."
                : currentPreset === "row"
                  ? "Contenedor auto-layout horizontal: las tarjetas se acomodan automáticamente en fila una al lado de la otra."
                  : "Contenedor auto-layout: las tarjetas se acomodan y distribuyen solas en las columnas."}
            </p>

            <div className="flex items-center gap-1.5 pt-1">
              {(onAddButton || onAddCard) && (
                <button
                  type="button"
                  onClick={isButtons && onAddButton ? onAddButton : onAddCard}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-transform hover:bg-accent/90 active:scale-95"
                >
                  <span>+</span> {isButtons ? "Agregar botón" : "Agregar tarjeta"}
                </button>
              )}
              {!isButtons && onFillThreeCards && (
                <button
                  type="button"
                  onClick={onFillThreeCards}
                  title="Crea o restablece 3 tarjetas de ejemplo en este contenedor"
                  className="flex items-center gap-1 rounded-md border border-accent/40 bg-canvas px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 active:scale-95"
                >
                  3 Tarjetas
                </button>
              )}
            </div>

            {/* Lista de tarjetas / botones dentro del contenedor */}
            {containerCards && containerCards.length > 0 && (
              <div className="flex flex-col gap-1 pt-1.5 border-t border-accent/20">
                <span className="text-[10px] font-semibold text-ink-dim uppercase">
                  {isButtons ? "Botones en este set:" : "Tarjetas en este contenedor:"}
                </span>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                  {containerCards.map((card, idx) => {
                    const isSelected = selectedCardId === card.id;
                    return (
                      <div
                        key={card.id}
                        className={`flex items-center justify-between gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                          isSelected ? "bg-accent/20 font-medium text-ink ring-1 ring-accent/30" : "bg-canvas hover:bg-hover text-ink-dim hover:text-ink"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectCard?.(card.id)}
                          className="min-w-0 flex-1 truncate text-left"
                          title="Hacer clic para seleccionar en el lienzo"
                        >
                          {idx + 1}. {card.title}
                        </button>
                        <div className="flex items-center gap-0.5">
                          {onDuplicateCard && (
                            <button
                              type="button"
                              title="Duplicar en el contenedor"
                              onClick={() => onDuplicateCard(card.id)}
                              className="flex h-5 w-5 items-center justify-center rounded text-accent hover:bg-accent/20"
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                                <path d="M11 2H3.5A1.5 1.5 0 002 3.5V11" />
                              </svg>
                            </button>
                          )}
                          {onDeleteCard && (
                            <button
                              type="button"
                              title="Eliminar del contenedor"
                              onClick={() => onDeleteCard(card.id)}
                              className="flex h-5 w-5 items-center justify-center rounded text-red-500 hover:bg-red-500/20"
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 3l10 10M13 3L3 13" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Separación entre elementos (Gap) - Visible y prominente */}
        {currentPreset !== "free" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-ink">Separación general (Gap)</span>
            <div className="flex flex-wrap gap-1">
              {GAP_PRESETS.map((p) => {
                const active = currentGap === p.px;
                return (
                  <button
                    key={p.px}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(applyGap(classes, p.px))}
                    className={`h-6 rounded border px-2.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent text-white shadow-xs"
                        : "border-line text-ink hover:bg-hover"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Relleno del contenedor (Padding) */}
        {currentPreset !== "free" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-ink">Relleno del contenedor (Padding)</span>
            <div className="flex flex-wrap gap-1">
              {PADDING_PRESETS.map((p) => {
                const active = currentPadding === p.px;
                return (
                  <button
                    key={p.px}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(applyPadding(classes, p.px))}
                    className={`h-6 rounded border px-2.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent text-white shadow-xs"
                        : "border-line text-ink hover:bg-hover"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Adaptación Responsive por pantalla (Clara, intuitiva y amigable) */}
        <Collapsible title="Adaptación a Celular y Tablet" defaultOpen={inGrid}>
          <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-canvas/60 p-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-[11px] font-semibold text-ink">Vista previa por dispositivo</span>
            </div>

            {/* Selector rápido de pantalla con preview interactivo */}
            <div className="grid grid-cols-3 gap-1 rounded-md bg-canvas p-1 text-[11px]">
              {(["desktop", "tablet", "mobile"] as DeviceBreakpoint[]).map((bp) => {
                const isCurrent = activeBreakpoint === bp;
                return (
                  <button
                    key={bp}
                    type="button"
                    aria-pressed={isCurrent}
                    onClick={() => {
                      setActiveBreakpoint(bp);
                      viewport?.setDevice(bp === "desktop" ? "desktop" : bp === "tablet" ? "tablet" : "mobile");
                    }}
                    className={`flex items-center justify-center gap-1 h-7 rounded font-medium transition-colors ${
                      isCurrent ? "bg-accent text-white shadow-xs" : "text-ink-dim hover:text-ink hover:bg-hover"
                    }`}
                  >
                    {bp === "desktop" && <DesktopIcon />}
                    {bp === "tablet" && <TabletIcon />}
                    {bp === "mobile" && <MobileIcon />}
                    <span>{bp === "desktop" ? "PC" : bp === "tablet" ? "Tablet" : "Móvil"}</span>
                  </button>
                );
              })}
            </div>

            {/* Si está en Cuadrícula (Grid): Columnas personalizadas por pantalla */}
            {inGrid ? (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-semibold text-ink">Columnas personalizadas por pantalla:</span>

                {/* PC / Desktop */}
                <div
                  className={`flex items-center justify-between gap-2 rounded-md p-1.5 transition-colors ${
                    activeBreakpoint === "desktop" ? "bg-accent/10 ring-1 ring-accent/30" : "bg-canvas"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBreakpoint("desktop");
                      viewport?.setDevice("desktop");
                    }}
                    title="Previsualizar en escritorio (PC)"
                    className="flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent"
                  >
                    <DesktopIcon />
                    <span>PC</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const selected = gridConfig.desktopCols === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          aria-label={`${num} columnas en PC`}
                          onClick={() => onChange(applyResponsiveGrid(classes, { ...gridConfig, desktopCols: num }))}
                          className={`h-6 w-6 rounded text-[11px] font-semibold transition-colors ${
                            selected
                              ? "bg-accent text-white shadow-xs"
                              : "border border-line bg-canvas text-ink hover:bg-hover"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tablet */}
                <div
                  className={`flex items-center justify-between gap-2 rounded-md p-1.5 transition-colors ${
                    activeBreakpoint === "tablet" ? "bg-accent/10 ring-1 ring-accent/30" : "bg-canvas"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBreakpoint("tablet");
                      viewport?.setDevice("tablet");
                    }}
                    title="Previsualizar en tablet"
                    className="flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent"
                  >
                    <TabletIcon />
                    <span>Tablet</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((num) => {
                      const selected = gridConfig.tabletCols === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          aria-label={`${num} columnas en tablet`}
                          onClick={() => onChange(applyResponsiveGrid(classes, { ...gridConfig, tabletCols: num }))}
                          className={`h-6 w-6 rounded text-[11px] font-semibold transition-colors ${
                            selected
                              ? "bg-accent text-white shadow-xs"
                              : "border border-line bg-canvas text-ink hover:bg-hover"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Móvil */}
                <div
                  className={`flex items-center justify-between gap-2 rounded-md p-1.5 transition-colors ${
                    activeBreakpoint === "mobile" ? "bg-accent/10 ring-1 ring-accent/30" : "bg-canvas"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBreakpoint("mobile");
                      viewport?.setDevice("mobile");
                    }}
                    title="Previsualizar en celular (móvil)"
                    className="flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent"
                  >
                    <MobileIcon />
                    <span>Móvil</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((num) => {
                      const selected = gridConfig.mobileCols === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          aria-label={`${num} columnas en móvil`}
                          onClick={() => onChange(applyResponsiveGrid(classes, { ...gridConfig, mobileCols: num }))}
                          className={`h-6 w-6 rounded text-[11px] font-semibold transition-colors ${
                            selected
                              ? "bg-accent text-white shadow-xs"
                              : "border border-line bg-canvas text-ink hover:bg-hover"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Si es Flex / Fila / Botones / Footer: Apilado vs Fila simple */
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-ink">
                    En Celular (Móvil):
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      aria-pressed={overrides.mobile.direction === "col"}
                      onClick={() => onChange(applyBreakpointOverride(classes, "mobile", { direction: "col" }))}
                      className={`h-7 rounded border px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
                        overrides.mobile.direction === "col"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      Apilar vertical
                    </button>
                    <button
                      type="button"
                      aria-pressed={overrides.mobile.direction === "row"}
                      onClick={() => onChange(applyBreakpointOverride(classes, "mobile", { direction: "row" }))}
                      className={`h-7 rounded border px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
                        overrides.mobile.direction === "row"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      Mantener fila
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-dim">
                    {overrides.mobile.direction === "col"
                      ? "Recomendado: coloca los elementos uno debajo de otro para que se lean bien en teléfonos."
                      : "Mantiene los elementos en fila horizontal."}
                  </p>
                </div>

                <div className="flex flex-col gap-1 pt-1 border-t border-line/60">
                  <span className="text-[10px] font-semibold text-ink">
                    En Tablet:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      aria-pressed={overrides.tablet.direction === "col"}
                      onClick={() => onChange(applyBreakpointOverride(classes, "tablet", { direction: "col" }))}
                      className={`h-7 rounded border px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
                        overrides.tablet.direction === "col"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      Apilar vertical
                    </button>
                    <button
                      type="button"
                      aria-pressed={overrides.tablet.direction === "row"}
                      onClick={() => onChange(applyBreakpointOverride(classes, "tablet", { direction: "row" }))}
                      className={`h-7 rounded border px-2 font-medium transition-colors flex items-center justify-center gap-1 ${
                        overrides.tablet.direction === "row"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      Mantener fila
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Opciones avanzadas de alineación y espaciado (plegado para no saturar) */}
            <Collapsible title="Alineación y espaciado avanzado" defaultOpen={false}>
              <div className="flex flex-col gap-2 pt-1 border-t border-line/60">
                {/* Dirección de flujo en el breakpoint activo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-ink-dim">
                    Dirección en {activeBreakpoint === "desktop" ? "PC" : activeBreakpoint === "tablet" ? "Tablet" : "Móvil"}:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      aria-pressed={currentOverride.direction === "row"}
                      onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { direction: "row" }))}
                      className={`h-6 rounded border px-2 font-medium transition-colors ${
                        currentOverride.direction === "row"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      En fila
                    </button>
                    <button
                      type="button"
                      aria-pressed={currentOverride.direction === "col"}
                      onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { direction: "col" }))}
                      className={`h-6 rounded border px-2 font-medium transition-colors ${
                        currentOverride.direction === "col"
                          ? "border-accent bg-accent/20 text-accent font-semibold"
                          : "border-line text-ink hover:bg-hover"
                      }`}
                    >
                      Apilado
                    </button>
                  </div>
                </div>

                {/* Alineación transversal */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-ink-dim">Alineación:</span>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[
                      { val: "start", label: "Inicio" },
                      { val: "center", label: "Centro" },
                      { val: "end", label: "Final" },
                      { val: "stretch", label: "Estirar" },
                    ].map((al) => (
                      <button
                        key={al.val}
                        type="button"
                        aria-pressed={currentOverride.align === al.val}
                        onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { align: al.val as any }))}
                        className={`h-6 rounded border font-medium transition-colors ${
                          currentOverride.align === al.val
                            ? "border-accent bg-accent text-white"
                            : "border-line text-ink hover:bg-hover"
                        }`}
                      >
                        {al.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distribución horizontal */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-ink-dim">Distribución:</span>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[
                      { val: "start", label: "Inicio" },
                      { val: "center", label: "Centro" },
                      { val: "between", label: "Espaciado" },
                      { val: "end", label: "Final" },
                    ].map((ju) => (
                      <button
                        key={ju.val}
                        type="button"
                        aria-pressed={currentOverride.justify === ju.val}
                        onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { justify: ju.val as any }))}
                        className={`h-6 rounded border font-medium transition-colors ${
                          currentOverride.justify === ju.val
                            ? "border-accent bg-accent text-white"
                            : "border-line text-ink hover:bg-hover"
                        }`}
                      >
                        {ju.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Separación (Gap) por breakpoint */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-ink-dim">Separación ({activeBreakpoint}):</span>
                  <div className="flex flex-wrap gap-1">
                    {[0, 8, 12, 16, 24, 32].map((g) => {
                      const active = currentOverride.gap === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { gap: g }))}
                          className={`h-5 rounded border px-2 text-[10px] font-medium transition-colors ${
                            active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-hover"
                          }`}
                        >
                          {g}px
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Escala de texto por breakpoint */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-ink-dim">Tamaño de texto:</span>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[
                      { val: "xs", label: "XS (12px)" },
                      { val: "sm", label: "SM (14px)" },
                      { val: "base", label: "MD (16px)" },
                      { val: "lg", label: "LG (18px)" },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        aria-pressed={currentOverride.textSize === t.val}
                        onClick={() => onChange(applyBreakpointOverride(classes, activeBreakpoint, { textSize: t.val as any }))}
                        className={`h-5 rounded border font-medium transition-colors ${
                          currentOverride.textSize === t.val
                            ? "border-accent bg-accent text-white"
                            : "border-line text-ink hover:bg-hover"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Collapsible>
          </div>
        </Collapsible>

        {/* Dimensionamiento y Alineación del Contenedor (Plegado por defecto) */}
        <Collapsible title="Dimensiones & Ancho del contenedor" defaultOpen={false}>
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-canvas/40 p-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-[11px] font-semibold text-ink">Ancho & Márgenes exteriores</span>
              <span className="text-[10px] text-ink-dim">{wrapperConfig.widthMode === "fit" ? "Ajustado (fit)" : "Ancho completo"}</span>
            </div>

            {/* Ancho del Wrapper */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-ink-dim">Modo de ancho:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  aria-pressed={wrapperConfig.widthMode === "fit"}
                  onClick={() => onChange(applyWrapperConfig(classes, { widthMode: "fit" }))}
                  className={`h-6 rounded border font-medium transition-colors ${
                    wrapperConfig.widthMode === "fit"
                      ? "border-accent bg-accent/20 text-accent font-semibold"
                      : "border-line text-ink hover:bg-hover"
                  }`}
                >
                  Ajustar contenido (w-fit)
                </button>
                <button
                  type="button"
                  aria-pressed={wrapperConfig.widthMode === "full"}
                  onClick={() => onChange(applyWrapperConfig(classes, { widthMode: "full" }))}
                  className={`h-6 rounded border font-medium transition-colors ${
                    wrapperConfig.widthMode === "full"
                      ? "border-accent bg-accent/20 text-accent font-semibold"
                      : "border-line text-ink hover:bg-hover"
                  }`}
                >
                  Ancho completo (w-full)
                </button>
              </div>
            </div>

            {/* Alineación Interna */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-ink-dim">Alineación interna:</span>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[
                  { val: "start", label: "Izquierda" },
                  { val: "center", label: "Centro" },
                  { val: "end", label: "Derecha" },
                  { val: "between", label: "Justificado" },
                ].map((al) => (
                  <button
                    key={al.val}
                    type="button"
                    aria-pressed={wrapperConfig.align === al.val}
                    onClick={() => onChange(applyWrapperConfig(classes, { align: al.val as any }))}
                    className={`h-6 rounded border font-medium transition-colors ${
                      wrapperConfig.align === al.val
                        ? "border-accent bg-accent text-white"
                        : "border-line text-ink hover:bg-hover"
                    }`}
                  >
                    {al.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Márgenes del Bloque */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-ink-dim">Margen exterior del bloque:</span>
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {[
                  { val: "none", label: "0" },
                  { val: "center", label: "Centrado" },
                  { val: "sm", label: "Pequeño" },
                  { val: "md", label: "Medio" },
                  { val: "lg", label: "Grande" },
                ].map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    aria-pressed={wrapperConfig.margin === m.val}
                    onClick={() => onChange(applyWrapperConfig(classes, { margin: m.val as any }))}
                    className={`h-5 rounded border font-medium transition-colors ${
                      wrapperConfig.margin === m.val
                        ? "border-accent bg-accent text-white"
                        : "border-line text-ink hover:bg-hover"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Collapsible>
      </Collapsible>
    );
  }

  // Elemento hijo seleccionado (tarjeta, botón, texto, etc.)
  const inGridSection = isGridLayout(quickPresetOf(sectionClasses));
  const sectionPreset = quickPresetOf(sectionClasses);
  const currentGap = gapOf(sectionClasses);
  const cell = cellOf(classes);

  return (
    <Collapsible title="Disposición & Celda">
      {/* Controles de elemento dentro del Pie de Página (Footer) */}
      {isFooter && (
        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2.5 shadow-xs mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Pie de Página: Columna & Alineación</span>
            {onSelectSection && (
              <button
                type="button"
                onClick={onSelectSection}
                className="text-[10px] text-accent hover:underline font-medium"
              >
                Ver todo el footer ↗
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-dim leading-snug">
            {currentColIndex !== undefined && currentColIndex >= 0
              ? `Este elemento se encuentra en la Columna ${currentColIndex + 1} de ${totalFooterCols ?? 3}.`
              : "Reubica este elemento o cámbialo de columna para que el footer quede ordenado."}
          </p>

          {/* Mover a otra columna */}
          {onMoveElementToFooterCol && (totalFooterCols ?? 3) > 1 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-ink-dim">Mover a columna:</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {Array.from({ length: totalFooterCols ?? 3 }, (_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-pressed={currentColIndex === idx}
                    onClick={() => onMoveElementToFooterCol(idx)}
                    className={`h-6 rounded border px-2.5 font-medium transition-colors ${
                      currentColIndex === idx
                        ? "border-accent bg-accent text-white shadow-xs font-semibold"
                        : "border-line bg-canvas text-ink hover:bg-hover"
                    }`}
                  >
                    Columna {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alineación del texto / elemento */}
          {onAlignElement && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-ink-dim">Alineación:</span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {[
                  { val: "left", label: "Izquierda" },
                  { val: "center", label: "Centro" },
                  { val: "right", label: "Derecha" },
                ].map((al) => (
                  <button
                    key={al.val}
                    type="button"
                    aria-pressed={currentAlign === al.val}
                    onClick={() => onAlignElement(al.val as any)}
                    className={`h-6 rounded border font-medium transition-colors ${
                      currentAlign === al.val
                        ? "border-accent bg-accent text-white font-semibold"
                        : "border-line bg-canvas text-ink hover:bg-hover"
                    }`}
                  >
                    {al.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones rápidas del footer */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
            {onAddFooterLink && (
              <button
                type="button"
                onClick={() => onAddFooterLink(currentColIndex !== undefined && currentColIndex >= 0 ? currentColIndex : 0)}
                className="flex items-center justify-center gap-1 rounded bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent/90 active:scale-95"
              >
                + Añadir enlace en esta columna
              </button>
            )}
            {onOrganizeFooter && (
              <button
                type="button"
                onClick={() => onOrganizeFooter(3)}
                className="flex items-center justify-center gap-1 rounded border border-accent/30 bg-canvas px-2.5 py-1 text-[10px] font-medium text-accent hover:bg-accent/10 active:scale-95"
              >
                Reorganizar todo el footer en 3 columnas
              </button>
            )}
          </div>
        </div>
      )}
      {inGridSection && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-ink-dim">
            Cuánto ocupa esta tarjeta o elemento en la cuadrícula.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Columnas"
              value={cell.cols}
              min={1}
              max={MAX_CHILD_COLS}
              onChange={(cols) => onChange(applyCell(classes, { ...cell, cols }))}
            />
            <NumberField
              label="Filas"
              value={cell.rows}
              min={1}
              max={MAX_CHILD_ROWS}
              onChange={(rows) => onChange(applyCell(classes, { ...cell, rows }))}
            />
          </div>
        </div>
      )}

      {/* Control directo del Gap del contenedor padre */}
      {sectionPreset !== "free" && onSectionChange && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-line">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink">Separación del contenedor (Gap)</span>
            {onSelectSection && (
              <button
                type="button"
                onClick={onSelectSection}
                className="text-[10px] text-accent hover:underline font-medium"
              >
                Ver contenedor ↗
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {GAP_PRESETS.map((p) => {
              const active = currentGap === p.px;
              return (
                <button
                  key={p.px}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSectionChange(applyGap(sectionClasses, p.px))}
                  className={`h-6 rounded border px-2.5 text-[10px] font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-white shadow-xs"
                      : "border-line text-ink hover:bg-hover"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Posición & Orden del elemento en el contenedor */}
      {sectionPreset !== "free" && onMoveElementOrder && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-line">
          <span className="text-[11px] font-medium text-ink">Posición & Orden en el contenedor</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onMoveElementOrder(-1)}
              className="flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium text-ink hover:bg-hover active:scale-95 transition-colors"
              title="Mover elemento hacia arriba o hacia la izquierda"
            >
              <span className="font-bold">↑</span> Subir elemento
            </button>
            <button
              type="button"
              onClick={() => onMoveElementOrder(1)}
              className="flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium text-ink hover:bg-hover active:scale-95 transition-colors"
              title="Mover elemento hacia abajo o hacia la derecha"
            >
              <span className="font-bold">↓</span> Bajar elemento
            </button>
          </div>
          <p className="text-[10px] text-ink-dim">
            Reordena este elemento respecto a sus hermanos dentro del contenedor.
          </p>
        </div>
      )}

      {/* Acciones de la tarjeta en el contenedor */}
      {sectionPreset !== "free" && (onDuplicateCard || onAddCard || onDeleteCard) && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-line">
          <span className="text-[11px] font-medium text-ink">Acciones de tarjeta</span>
          <div className="flex flex-wrap gap-1">
            {onDuplicateCard && selectedCardId && (
              <button
                type="button"
                onClick={() => onDuplicateCard(selectedCardId)}
                className="flex items-center gap-1 rounded border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-hover active:scale-95"
              >
                Duplicar
              </button>
            )}
            {onAddCard && (
              <button
                type="button"
                onClick={onAddCard}
                className="flex items-center gap-1 rounded border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-emerald-600 hover:bg-hover active:scale-95"
              >
                + Nueva
              </button>
            )}
            {onDeleteCard && selectedCardId && (
              <button
                type="button"
                onClick={() => onDeleteCard(selectedCardId)}
                className="flex items-center gap-1 rounded border border-red-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-100/50 active:scale-95"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </Collapsible>
  );
}
