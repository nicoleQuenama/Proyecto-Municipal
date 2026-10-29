"use client";

import { useState, type ReactNode } from "react";
import { ACTIONS } from "../behaviors/actions";
import { hasPermission, useAuth } from "../auth/auth-context";
import { ExportButton } from "../export/export-button";
import { mineLabel, useSharedUsage } from "../site/use-shared-usage";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { elementLabel } from "../navigation/links";
import { useSite, useSiteDispatch } from "../site/site-context";
import { SECTION_KEY, TITLE_SELECTION, type BlockInstance, type ComponentDef, type CustomStyle } from "../site/types";
import { Collapsible } from "../ui/collapsible";
import { CodeIcon } from "../viewport/icons";
import { useWorkbench } from "../workbench/workbench-context";
import { BindingControls } from "../data-sources/binding-controls";
import { LinkParamsControls } from "../dynamic/link-params-controls";
import { RepeatControls } from "../data-sources/repeat-controls";
import { SectionBackground } from "../background/section-background";
import { IconPicker } from "../icons/icon-picker";
import {
  addCardToComponent,
  addButtonToComponent,
  deleteCardFromComponent,
  duplicateCardInComponent,
  fillComponentWithThreeCards,
  findRootCardId,
  getContainerCards,
  organizeFooterIntoColumns,
  createDefaultMunicipalFooter,
  moveElementToFooterColumn,
  addLinkToFooterColumn,
  addLinkToHeader,
  addSearchButtonToHeader,
  moveElementOrderInComponent,
} from "../site/container-card-rules";
import { getBlockSlot } from "../site/rules";
import { useFlag } from "../responsive/flag-store";
import { useViewport } from "../viewport/viewport-context";
import { defaultMenu, toggleItem } from "../responsive/menu-model";
import { GroupControls } from "./group-controls";
import { LayoutControls } from "./layout-controls";
import { ControlControls } from "../forms/control-controls";
import { MediaPerformanceControls } from "../media/media-performance-controls";
import { FluidControls } from "../responsive/fluid-controls";
import { AltControl } from "./alt-control";
import { LayerControls } from "./layer-controls";
import { BehaviorEditor } from "./behavior-editor";
import { RemoveButton } from "./remove-button";
import { HideOnControls } from "./hide-on-controls";

const fieldClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent";

/** El número de cosas que hay dentro de un grupo cerrado; no se muestra si no hay ninguna. */
const count = (value: number): ReactNode =>
  value > 0 ? <span className="rounded bg-accent/25 px-1.5 py-0.5 text-[10px] text-accent">{value}</span> : null;

const Hint = ({ children }: { children: ReactNode }) => <p className="text-[11px] text-ink-dim">{children}</p>;

type StyleLevel = "block" | "component";

const STYLE_LEVELS: { value: StyleLevel; label: string }[] = [
  { value: "block", label: "Solo este bloque" },
  { value: "component", label: "Todo el componente" },
];

/** Las clases de Tailwind: varias líneas que se ajustan al ancho y se aplican a cada tecla, sin salir del campo. */
function ClassesField({ value, onChange }: { value: string; onChange: (classes: string) => void }) {
  const [text, setText] = useState(value);

  return (
    <textarea
      aria-label="Clases de Tailwind"
      placeholder="flex items-center gap-4 rounded-xl shadow-lg bg-primario"
      value={text}
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={() => onChange(text.trim().replace(/\s+/g, " "))}
      className={`${fieldClass} field-sizing-content h-auto min-h-16 resize-none py-1.5 font-mono leading-5`}
    />
  );
}

interface ScopeEditorProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  /** `SECTION_KEY` para la sección entera, o el id de uno de sus elementos. */
  scope: string;
}

/** Clases, interacciones y acceso al código (en el editor) de una sección o de uno de sus elementos. */
function ScopeEditor({ pageId, block, def, scope }: ScopeEditorProps) {
  const { pages } = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  // Los estilos valen para este bloque o, si se elige, para todos los lugares donde se use el componente.
  // El alcance es el mismo que usan los gestos y la barra de formato: lo que se elige aquí vale en todas partes.
  const { settings, setSettings } = useCanvasSettings();
  const level: StyleLevel = settings.scope;
  const mine = mineLabel(useSharedUsage());
  const setLevel = (value: StyleLevel) => setSettings((current) => ({ ...current, scope: value }));
  const custom = (level === "block" ? (block.custom?.[scope] ?? def.styles?.[scope]) : def.styles?.[scope]) ?? { classes: "", css: "" };
  const canEditContent = hasPermission(currentUser, "editContent");
  const canEditStyles = hasPermission(currentUser, "editStyles");
  const canEditCode = hasPermission(currentUser, "editCode");

  const saveStyle = (patch: Partial<CustomStyle>, allowed = canEditStyles) => {
    if (!allowed) return;
    dispatch(
      level === "block"
        ? { type: "block/custom", pageId, blockId: block.id, key: scope, patch }
        : { type: "component/styles", componentId: def.id, key: scope, patch },
    );
  };
  const saveSectionStyle = (patch: Partial<CustomStyle>, allowed = canEditStyles) => {
    if (!allowed) return;
    dispatch(
      level === "block"
        ? { type: "block/custom", pageId, blockId: block.id, key: SECTION_KEY, patch }
        : { type: "component/styles", componentId: def.id, key: SECTION_KEY, patch },
    );
  };
  const openCss = () => {
    if (!canEditCode) return;
    openFile(
      level === "block"
        ? { kind: "custom-css", pageId, blockId: block.id, key: scope }
        : { kind: "component-css", componentId: def.id, key: scope },
    );
  };

  const behaviors = (block.behaviors ?? []).filter((b) => b.scope === scope);
  const add = () => {
    if (!canEditContent) return;
    dispatch({
      type: "behavior/save",
      pageId,
      blockId: block.id,
      behavior: { id: crypto.randomUUID(), scope, trigger: "click", action: ACTIONS.animate.create(pages) },
    });
  };

  const element = def.elements.find((e) => e.id === scope);
  const currentSlot = getBlockSlot(block, def);
  const currentScope = block.scope ?? (pages.find((p) => p.id === pageId)?.isHome ? "global" : "page");

  const containerCards = getContainerCards(def);
  const rootCardId = element ? findRootCardId(def.elements, element.id) : null;

  const handleAddCard = () => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = addCardToComponent(def);
    dispatch({ type: "component/save", component: updated });
    dispatch({ type: "element/select", id: newCardId });
  };

  const handleDuplicateCard = (cardId: string) => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = duplicateCardInComponent(def, cardId);
    dispatch({ type: "component/save", component: updated });
    dispatch({ type: "element/select", id: newCardId });
  };

  const handleDeleteCard = (cardId: string) => {
    if (!canEditContent) return;
    const updated = deleteCardFromComponent(def, cardId);
    dispatch({ type: "component/save", component: updated });
    dispatch({ type: "element/select", id: null });
  };

  const handleFillThreeCards = () => {
    if (!canEditContent) return;
    const updated = fillComponentWithThreeCards(def);
    dispatch({ type: "component/save", component: updated });
  };

  const handleAddButton = () => {
    if (!canEditContent) return;
    const { component: updated, newButtonId } = addButtonToComponent(def);
    dispatch({ type: "component/save", component: updated });
    dispatch({ type: "element/select", id: newButtonId });
  };

  const isHeader =
    currentSlot === "header" ||
    (currentSlot !== "footer" &&
      (def.id.toLowerCase().includes("navbar") ||
       def.id.toLowerCase().includes("header") ||
       def.name.toLowerCase().includes("cabecera") ||
       def.name.toLowerCase().includes("navega") ||
       def.name.toLowerCase().includes("barra") ||
       (def.category === "navigation" &&
        !def.id.toLowerCase().includes("footer") &&
        !def.name.toLowerCase().includes("pie"))));

  const isFooter =
    !isHeader &&
    (currentSlot === "footer" ||
     def.id.toLowerCase().includes("footer") ||
     def.name.toLowerCase().includes("footer") ||
     def.name.toLowerCase().includes("pie") ||
     (def.category === "navigation" &&
      (def.id.toLowerCase().includes("footer") || def.name.toLowerCase().includes("pie"))));

  const [isMenuOpenPreview, setIsMenuOpenPreview] = useFlag(`menu:${block.id}`);
  let safeViewport: any = null;
  try {
    safeViewport = useViewport();
  } catch {
    safeViewport = null;
  }

  const currentMenu = block.menu ?? defaultMenu(def);
  const isMenuDisabled = block.adapt?.mobile === "scale" || block.adapt?.mobile === "stack";
  const activeMenuMode: "drop" | "right" | "left" | "full" | "none" = isMenuDisabled
    ? "none"
    : (currentMenu.panel ?? "drop");

  const menuBreakpointChoice: "mobile-tablet" | "mobile-only" | "never" =
    isMenuDisabled
      ? "never"
      : block.adapt?.tablet === "menu"
        ? "mobile-tablet"
        : "mobile-only";

  const handleSelectHeaderMenuMode = (mode: "drop" | "right" | "left" | "full" | "none") => {
    if (!canEditContent) return;
    if (mode === "none") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "scale" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "scale" });
    } else {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      if (menuBreakpointChoice === "mobile-tablet" || block.adapt?.tablet === "menu") {
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
      }
      dispatch({
        type: "responsive/menu",
        pageId,
        blockId: block.id,
        patch: { panel: mode, icon: "menu" },
      });
    }
  };

  const handleSetMenuBreakpoints = (choice: "mobile-tablet" | "mobile-only" | "never") => {
    if (!canEditContent) return;
    if (choice === "mobile-tablet") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
    } else if (choice === "mobile-only") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: null });
    } else {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "scale" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "scale" });
    }
  };

  const handleToggleMenuPreview = () => {
    if (safeViewport && safeViewport.device === "desktop") {
      safeViewport.setDevice("mobile");
    }
    if (block.adapt?.mobile !== "menu") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
    }
    setIsMenuOpenPreview(!isMenuOpenPreview);
  };

  const handleAddHeaderLink = () => {
    if (!canEditContent) return;
    const { component: updated, newLinkId } = addLinkToHeader(def);
    dispatch({ type: "component/save", component: updated });
    const menu = block.menu ?? defaultMenu(updated);
    if (!menu.itemIds.includes(newLinkId)) {
      dispatch({
        type: "responsive/menu",
        pageId,
        blockId: block.id,
        patch: { itemIds: [...menu.itemIds, newLinkId] },
      });
    }
    dispatch({ type: "element/select", id: newLinkId });
  };

  const hasSearchInHeader = def.elements.some(
    (e) => e.control?.name === "search-trigger" || e.text.toLowerCase().includes("buscar"),
  );

  const handleToggleSearchInHeader = () => {
    if (!canEditContent) return;
    if (hasSearchInHeader) {
      window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query: "" } }));
    } else {
      const { component: updated, searchId } = addSearchButtonToHeader(def);
      dispatch({ type: "component/save", component: updated });
      dispatch({ type: "element/select", id: searchId });
    }
  };

  const headerLinks = def.elements
    .filter((e) => !e.hidden && (e.role === "link" || (e.kind === "text" && e.role !== "heading") || e.kind === "icon"))
    .map((e) => ({
      id: e.id,
      label: e.text?.trim() || (e.kind === "icon" ? `Ícono (${e.icon ?? "estrella"})` : "Enlace"),
      inMenu: currentMenu.itemIds.includes(e.id),
    }));

  const handleToggleHeaderItemInMenu = (elementId: string, inMenu: boolean) => {
    if (!canEditContent) return;
    const updatedItemIds = toggleItem(currentMenu, elementId, inMenu);
    dispatch({
      type: "responsive/menu",
      pageId,
      blockId: block.id,
      patch: { itemIds: updatedItemIds },
    });
  };

  const isElementInHeaderMenu = element ? currentMenu.itemIds.includes(element.id) : false;

  const footerColumns = def.elements.filter((e) => !e.parentId && e.role === "container");
  const totalFooterCols = footerColumns.length > 0 ? footerColumns.length : 3;

  const currentParentColId = element?.parentId;
  const currentColIndex = currentParentColId
    ? footerColumns.findIndex((c) => c.id === currentParentColId)
    : -1;

  const handleOrganizeFooter = (cols: 1 | 2 | 3 | 4) => {
    if (!canEditContent) return;
    const updated = organizeFooterIntoColumns(def, cols);
    dispatch({ type: "component/save", component: updated });
  };

  const handleResetMunicipalFooter = () => {
    if (!canEditContent) return;
    const updated = createDefaultMunicipalFooter(def.id);
    dispatch({ type: "component/save", component: updated });
  };

  const handleMoveElementToFooterCol = (colIdx: number) => {
    if (!canEditContent || !element) return;
    const updated = moveElementToFooterColumn(def, element.id, colIdx);
    dispatch({ type: "component/save", component: updated });
  };

  const handleAddFooterLink = (colIdx: number) => {
    if (!canEditContent) return;
    const { component: updated, newLinkId } = addLinkToFooterColumn(def, colIdx);
    dispatch({ type: "component/save", component: updated });
    dispatch({ type: "element/select", id: newLinkId });
  };

  const handleAlignElement = (align: "left" | "center" | "right") => {
    if (!canEditContent || !element) return;
    dispatch({
      type: "component/element",
      componentId: def.id,
      pageId,
      blockId: block.id,
      elementId: element.id,
      patch: { align },
    });
  };

  const handleMoveElementOrder = (direction: -1 | 1) => {
    if (!canEditContent || !element) return;
    const updated = moveElementOrderInComponent(def, element.id, direction);
    dispatch({ type: "component/save", component: updated });
  };

  return (
    <div className="flex flex-col gap-4">
      <HideOnControls pageId={pageId} block={block} def={def} elementId={element?.id} />
      {(def.id.includes("search") || element?.control?.name?.includes("search") || element?.text.toLowerCase().includes("buscar")) && (
        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Buscador Ciudadano</span>
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">Activo</span>
          </div>
          <p className="text-[11px] text-ink-dim leading-snug">
            Al hacer clic o presionar Enter, se despliegan automáticamente todos los trámites, páginas y servicios municipales encontrados.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("cms:open-search", { detail: { query: "" } }))}
            className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-accent px-3 text-xs font-semibold text-white shadow-xs hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
          >
            Probar buscador ahora
          </button>
        </div>
      )}
      {element?.kind === "icon" && canEditContent && (
        <Collapsible title="Ícono">
          <IconPicker
            value={element.icon ?? "star"}
            onPick={(icon) => dispatch({ type: "component/icon", componentId: def.id, pageId, blockId: block.id, elementId: element.id, icon })}
          />
        </Collapsible>
      )}
      {element?.kind === "text" && canEditContent && <FluidControls componentId={def.id} pageId={pageId} blockId={block.id} element={element} />}
      {(element?.kind === "image" || element?.kind === "video") && canEditContent && <MediaPerformanceControls componentId={def.id} pageId={pageId} blockId={block.id} element={element} />}
      {element && canEditContent && <ControlControls componentId={def.id} element={element} />}
      {element && <AltControl pageId={pageId} block={block} element={element} />}
      {element ? <BindingControls pageId={pageId} block={block} element={element} /> : <RepeatControls pageId={pageId} block={block} />}
      {element && <LinkParamsControls pageId={pageId} block={block} element={element} />}
      {!element && <SectionBackground pageId={pageId} block={block} />}
      {!element && canEditContent && <LayerControls pageId={pageId} block={block} />}
      {!element && canEditContent && (
        <div role="group" aria-label="Rol y ubicación de la sección" className="flex flex-col gap-2 rounded-lg border border-line bg-canvas/40 p-2.5">
          <p className="text-[11px] font-semibold text-ink">Rol y ubicación de sección</p>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-canvas p-1 text-[11px]">
            <button
              type="button"
              aria-pressed={currentSlot === "header"}
              onClick={() => dispatch({ type: "block/slot", pageId, blockId: block.id, slot: "header" })}
              className={`h-7 rounded flex items-center justify-center gap-1 font-medium transition-colors ${
                currentSlot === "header" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink hover:bg-hover"
              }`}
              title="Se ubica siempre arriba de la página ocupando el ancho completo"
            >
              Encabezado
            </button>
            <button
              type="button"
              aria-pressed={currentSlot === "body"}
              onClick={() => dispatch({ type: "block/slot", pageId, blockId: block.id, slot: "body" })}
              className={`h-7 rounded flex items-center justify-center gap-1 font-medium transition-colors ${
                currentSlot === "body" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink hover:bg-hover"
              }`}
              title="Contenido en el cuerpo de la página"
            >
              Cuerpo
            </button>
            <button
              type="button"
              aria-pressed={currentSlot === "footer"}
              onClick={() => dispatch({ type: "block/slot", pageId, blockId: block.id, slot: "footer" })}
              className={`h-7 rounded flex items-center justify-center gap-1 font-medium transition-colors ${
                currentSlot === "footer" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink hover:bg-hover"
              }`}
              title="Se ubica siempre al final de la página ocupando el ancho completo"
            >
              Pie de página
            </button>
          </div>

          {(currentSlot === "header" || currentSlot === "footer") && (
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
              <span className="text-[10px] text-ink-dim font-medium">Ámbito de uso:</span>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
                <button
                  type="button"
                  aria-pressed={currentScope === "global"}
                  onClick={() => dispatch({ type: "block/scope", pageId, blockId: block.id, scope: "global" })}
                  className={`h-7 rounded font-medium transition-colors ${
                    currentScope === "global" ? "bg-accent/20 text-accent font-semibold" : "text-ink-dim hover:text-ink"
                  }`}
                  title="Aparece automáticamente en todas las páginas del sitio"
                >
                  En todo el sitio
                </button>
                <button
                  type="button"
                  aria-pressed={currentScope === "page"}
                  onClick={() => dispatch({ type: "block/scope", pageId, blockId: block.id, scope: "page" })}
                  className={`h-7 rounded font-medium transition-colors ${
                    currentScope === "page" ? "bg-accent/20 text-accent font-semibold" : "text-ink-dim hover:text-ink"
                  }`}
                  title="Solo visible en esta página"
                >
                  Solo esta página
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
            <span className="text-[10px] text-ink-dim font-medium">Posicionamiento en la página:</span>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
              <button
                type="button"
                aria-pressed={block.placementMode !== "overlay"}
                onClick={() => dispatch({ type: "block/placement-mode", pageId, blockId: block.id, mode: "flow" })}
                className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                  block.placementMode !== "overlay" ? "bg-accent text-white shadow-xs font-semibold" : "text-ink-dim hover:text-ink hover:bg-hover"
                }`}
                title="Se ajusta automáticamente según el contenido de la página sin sobreponerse"
              >
                Ajustar a contenido
              </button>
              <button
                type="button"
                aria-pressed={block.placementMode === "overlay"}
                onClick={() => dispatch({ type: "block/placement-mode", pageId, blockId: block.id, mode: "overlay" })}
                className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                  block.placementMode === "overlay" ? "bg-accent text-white shadow-xs font-semibold" : "text-ink-dim hover:text-ink hover:bg-hover"
                }`}
                title="Permite mover libremente y sobreponer sobre otros elementos"
              >
                Sobreponer (libre)
              </button>
            </div>
            <p className="text-[10px] text-ink-dim">
              {block.placementMode === "overlay"
                ? "Modo libre: arrastra la sección en el lienzo para moverla o sobreponerla a otras."
                : currentSlot === "footer"
                  ? "Modo recomendado: el footer permanece siempre al final de la página y se adapta automáticamente al contenido."
                  : "Modo recomendado: la sección respeta el flujo de la página y se ajusta automáticamente según el contenido."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
            <span className="text-[10px] text-ink-dim font-medium">Orden en la página:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => dispatch({ type: "block/move", pageId, blockId: block.id, direction: -1 })}
                className="flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium text-ink hover:bg-hover active:scale-95 transition-colors"
                title="Mover esta sección más arriba"
              >
                <span className="font-bold">↑</span> Subir sección
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "block/move", pageId, blockId: block.id, direction: 1 })}
                className="flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium text-ink hover:bg-hover active:scale-95 transition-colors"
                title="Mover esta sección más abajo"
              >
                <span className="font-bold">↓</span> Bajar sección
              </button>
            </div>
            <p className="text-[10px] text-ink-dim">
              Cambia la posición de esta sección respecto a las demás en el orden vertical de la página.
            </p>
          </div>

          <Hint>
            {currentSlot === "footer"
              ? "El pie de página se ancla siempre al final de la página a ancho completo."
              : currentSlot === "header"
                ? "El encabezado se ubica siempre arriba de la página a ancho completo."
                : "Sección dentro del flujo de la página."}
          </Hint>
        </div>
      )}

      {canEditContent && (
        <Collapsible title="Interacciones" defaultOpen={false}>
          <Hint>Qué pasa al hacer clic, pasar el cursor… Se ven al pulsar «Probar» (▶).</Hint>
          {behaviors.length > 0 && (
            <ul className="flex flex-col gap-2">
              {behaviors.map((behavior) => (
                <BehaviorEditor
                  key={behavior.id}
                  behavior={behavior}
                  blockId={block.id}
                  pages={pages}
                  elements={def.elements}
                  onChange={(next) => {
                    if (!canEditContent) return;
                    dispatch({ type: "behavior/save", pageId, blockId: block.id, behavior: next });
                  }}
                  onRemove={() => {
                    if (!canEditContent) return;
                    dispatch({ type: "behavior/remove", pageId, blockId: block.id, behaviorId: behavior.id });
                  }}
                  onOpenCode={() => canEditCode && openFile({ kind: "behavior-js", pageId, blockId: block.id, behaviorId: behavior.id })}
                />
              ))}
            </ul>
          )}
          <button type="button" onClick={add} className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover">
            + Añadir interacción
          </button>
        </Collapsible>
      )}

      {canEditStyles && (
        <div role="group" aria-label="Dónde valen los estilos" className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
            {STYLE_LEVELS.map(({ value, label: base }) => {
              const label = value === "component" && mine ? mine.label : base;
              return (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
                className={`h-7 rounded ${level === value ? "bg-accent/25 text-accent" : "text-ink-dim hover:text-ink"}`}
              >
                {label}
              </button>
              );
            })}
          </div>
          <Hint>
            {level === "block"
              ? "Solo cambia esta sección, en esta página."
              : (mine?.hint ?? `Cambia todos los «${def.name}» del sitio, en todas las páginas.`)}
          </Hint>
        </div>
      )}

      {/* La disposición es maquetar: también es del diseñador, aunque no pueda escribir clases a mano. */}
      {canEditContent && scope !== SECTION_KEY && element && <GroupControls componentId={def.id} element={element} />}
      {canEditContent && (
        <LayoutControls
          isSection={scope === SECTION_KEY}
          classes={custom.classes}
          sectionClasses={((level === "block" ? (block.custom?.[SECTION_KEY] ?? def.styles?.[SECTION_KEY]) : def.styles?.[SECTION_KEY]) ?? { classes: "" }).classes}
          onChange={(classes) => saveStyle({ classes }, canEditContent)}
          onSectionChange={(classes) => saveSectionStyle({ classes }, canEditContent)}
          onSelectSection={() => dispatch({ type: "element/select", id: null })}
          containerCards={containerCards}
          selectedCardId={rootCardId}
          onAddCard={canEditContent ? handleAddCard : undefined}
          onDuplicateCard={canEditContent ? handleDuplicateCard : undefined}
          onDeleteCard={canEditContent ? handleDeleteCard : undefined}
          onFillThreeCards={canEditContent ? handleFillThreeCards : undefined}
          onSelectCard={(id) => dispatch({ type: "element/select", id })}
          category={def.category}
          componentId={def.id}
          onAddButton={canEditContent ? handleAddButton : undefined}
          isFooter={isFooter}
          isHeader={isHeader}
          activeMenuMode={activeMenuMode}
          menuBreakpointChoice={menuBreakpointChoice}
          onSelectHeaderMenuMode={canEditContent ? handleSelectHeaderMenuMode : undefined}
          onSetMenuBreakpoints={canEditContent ? handleSetMenuBreakpoints : undefined}
          isMenuOpenPreview={isMenuOpenPreview}
          onToggleMenuPreview={handleToggleMenuPreview}
          onAddHeaderLink={canEditContent ? handleAddHeaderLink : undefined}
          hasSearchInHeader={hasSearchInHeader}
          onToggleSearchInHeader={canEditContent ? handleToggleSearchInHeader : undefined}
          headerLinks={headerLinks}
          onToggleHeaderItemInMenu={canEditContent ? handleToggleHeaderItemInMenu : undefined}
          isElementInHeaderMenu={isElementInHeaderMenu}
          selectedElementId={element?.id}
          onOrganizeFooter={canEditContent ? handleOrganizeFooter : undefined}
          onResetMunicipalFooter={canEditContent ? handleResetMunicipalFooter : undefined}
          onMoveElementToFooterCol={canEditContent ? handleMoveElementToFooterCol : undefined}
          onAddFooterLink={canEditContent ? handleAddFooterLink : undefined}
          onAlignElement={canEditContent ? handleAlignElement : undefined}
          onMoveElementOrder={canEditContent ? handleMoveElementOrder : undefined}
          currentAlign={element?.align as any}
          currentColIndex={currentColIndex}
          totalFooterCols={totalFooterCols}
        />
      )}

      {canEditStyles && (
        <Collapsible title="Clases de Tailwind" defaultOpen={false}>
          {/* key: al cambiar de alcance el campo empieza con lo guardado de ese alcance. */}
          <ClassesField key={level} value={custom.classes} onChange={(classes) => saveStyle({ classes })} />
          <Hint>Se aplican al escribir. Cualquier clase de Tailwind; las variables del proyecto también: «color-primario» da «bg-primario» y «text-primario».</Hint>
        </Collapsible>
      )}

      {canEditCode && (
        <Collapsible title="CSS propio" defaultOpen={false}>
          <button
            type="button"
            onClick={openCss}
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-line text-xs hover:bg-hover"
          >
            <CodeIcon />
            Abrir el CSS en el editor
          </button>
          <Hint>{level === "block" ? "Solo afecta a este elemento." : "Afecta a este elemento en todos los bloques del componente."} Puedes usar las variables del proyecto: «var(--color-primario)».</Hint>
        </Collapsible>
      )}
    </div>
  );
}

/**
 * El inspector de propiedades: aparece a la derecha solo cuando hay una sección o un elemento seleccionado,
 * con su código propio e interacciones. Así el panel izquierdo queda para agregar y organizar.
 */
export function Inspector() {
  const { pages, currentPageId, selectedId, selectedElementId, components } = useSite();
  const dispatch = useSiteDispatch();
  const { openFile } = useWorkbench();
  const { currentUser } = useAuth();
  const canEditCode = hasPermission(currentUser, "editCode");

  const page = pages.find((p) => p.id === currentPageId);
  const block =
    page?.blocks.find((b) => b.id === selectedId) ??
    pages.flatMap((p) => p.blocks).find((b) => b.id === selectedId);
  const def = components.find((c) => c.id === block?.componentId);
  if (!page || !block || !def) return null;

  const ownerPage = pages.find((p) => p.blocks.some((b) => b.id === selectedId)) ?? page;

  const element = def.elements.find((e) => e.id === selectedElementId);
  const scope = element ? element.id : SECTION_KEY;

  return (
    <aside
      aria-label="Propiedades"
      className="absolute top-3 right-3 bottom-3 z-30 flex w-80 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-150"
    >
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] tracking-wider text-ink-dim uppercase">{element ? `Elemento · ${def.name}` : "Sección"}</p>
            {element && (
              <button
                type="button"
                onClick={() => dispatch({ type: "element/select", id: null })}
                className="text-[10px] font-medium text-accent hover:underline"
                title="Volver a seleccionar la sección para editar su disposición, columnas o gap"
              >
                (Ver sección)
              </button>
            )}
          </div>
          <p className="truncate text-sm font-medium">{element ? elementLabel(element) : def.name}</p>
        </div>
        {canEditCode && <ExportButton pageId={ownerPage.id} block={block} def={def} />}
        {canEditCode && (
          <button
            type="button"
            aria-label="Abrir el código en el editor"
            title="Abrir el código en el editor (Ctrl+E)"
            onClick={() => openFile()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-accent px-2.5 text-xs font-medium text-white hover:opacity-90"
          >
            <CodeIcon />
            Código
          </button>
        )}
        <button
          type="button"
          aria-label="Cerrar propiedades"
          title="Cerrar propiedades"
          onClick={() => dispatch({ type: "block/select", id: TITLE_SELECTION })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* key: al cambiar de selección, el editor empieza de cero con lo guardado de esa selección. */}
        <ScopeEditor key={`${block.id}:${scope}`} pageId={ownerPage.id} block={block} def={def} scope={scope} />
      </div>
      <RemoveButton page={ownerPage} />
    </aside>
  );
}
