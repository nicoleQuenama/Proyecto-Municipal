"use client";

import { currentPlacement } from "../placement/current-placement";
import { flowSlotOf } from "../placement/use-flow-reorder";
import { addOption, removeOption } from "../site/option-rules";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACTIONS } from "../behaviors/actions";
import { hasPermission, useAuth } from "../auth/auth-context";
import { ExportButton } from "../export/export-button";
import { mineLabel, useSharedUsage } from "../site/use-shared-usage";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { elementLabel } from "../navigation/links";
import { useSite, useSiteDispatch } from "../site/site-context";
import { SECTION_KEY, TITLE_SELECTION, type BlockInstance, type ComponentDef, type CustomStyle, type ElementOverride } from "../site/types";
import { resolveOverride } from "../site/overrides";
import { uniqueElements } from "../site/unique-elements";
import { Collapsible } from "../ui/collapsible";
import { CodeIcon } from "../viewport/icons";
import { useWorkbench } from "../workbench/workbench-context";
import { BindingControls } from "../data-sources/binding-controls";
import { LinkParamsControls } from "../dynamic/link-params-controls";
import { RepeatControls } from "../data-sources/repeat-controls";
import { SectionBackground } from "../background/section-background";
import { IconPicker } from "../icons/icon-picker";
import { LockClosedIcon, LockOpenIcon } from "../icons/lock-icons";
import {
  addCardToComponent,
  addButtonToComponent,
  deleteCardFromComponent,
  duplicateCardInComponent,
  fillComponentWithThreeCards,
  fillComponentWithCards,
  findRootCardId,
  getContainerCards,
  organizeFooterIntoColumns,
  createDefaultMunicipalFooter,
  moveElementToFooterColumn,
  addLinkToFooterColumn,
  addLinkToHeader,
  addSearchButtonToHeader,
  moveElementOrderInComponent,
  getComponentOptions,
  getCardsForOption,
  addCardToOption,
  duplicateCardInOption,
  deleteCardFromOption,
  moveCardToOption,
  updateOptionLabel,
  getCardPrefix,
} from "../site/container-card-rules";
import { getBlockSlot } from "../site/rules";
import { useFlag } from "../responsive/flag-store";
import { useViewport } from "../viewport/viewport-context";
import { defaultMenu, toggleItem } from "../responsive/menu-model";
import { GroupControls } from "./group-controls";
import { DockablePanel } from "./dockable-panel";
import { SectionColorPalette } from "../section-colors/section-color-palette";
import { LayoutControls, type ContainerCardItem } from "./layout-controls";
import { ControlControls } from "../forms/control-controls";
import { MediaPerformanceControls } from "../media/media-performance-controls";
import { FluidControls } from "../responsive/fluid-controls";
import { AltControl } from "./alt-control";
import { LayerControls } from "./layer-controls";
import { InspectorMediaControls } from "./inspector-media-controls";
import {
  BRAND_BUTTON_PRESETS,
  BRAND_SURFACE_COLORS,
  BRAND_TEXT_COLORS,
} from "../auth/brand-manual";
import { BehaviorEditor } from "./behavior-editor";
import { RemoveButton } from "./remove-button";
import { HideOnControls } from "./hide-on-controls";
import { colorInputValue } from "../format/format-options";
import { LayersPanel } from "../layers/layers-panel";
import { BrandGovernanceControls } from "./brand-governance-controls";

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
  const effectiveElement = useMemo(() => {
    if (!element) return undefined;
    const blockOverride = block.elements?.[element.id];
    return blockOverride ? resolveOverride(element, blockOverride, () => undefined) : element;
  }, [element, block.elements]);
  const activeElement = effectiveElement ?? element;
  const currentSlot = getBlockSlot(block, def);
  const currentScope = block.scope ?? (pages.find((p) => p.id === pageId)?.isHome ? "global" : "page");

  const containerCards = getContainerCards(def);
  const rootCardId = element ? findRootCardId(def.elements, element.id) : null;

  const componentOptions = useMemo(() => getComponentOptions(def), [def]);
  const hasComponentOptions = componentOptions.length > 0;

  const [activeOptionKey, setActiveOptionKey] = useState<string>(() => {
    return componentOptions[0]?.key ?? "opt1";
  });

  useEffect(() => {
    if (hasComponentOptions && !componentOptions.some((o) => o.key === activeOptionKey)) {
      setActiveOptionKey(componentOptions[0]?.key ?? "opt1");
    }
  }, [hasComponentOptions, componentOptions, activeOptionKey]);

  useEffect(() => {
    if (element && hasComponentOptions) {
      const prefix = getCardPrefix(element.id);
      if (prefix) {
        const match = prefix.match(/opt\d+/);
        if (match && componentOptions.some((o) => o.key === match[0])) {
          setActiveOptionKey(match[0]);
        }
      }
    }
  }, [element?.id, hasComponentOptions, componentOptions]);

  const isSharedComponent = useMemo(() => {
    return pages.flatMap((p) => p.blocks).filter((b) => b.componentId === def.id).length > 1;
  }, [pages, def.id]);

  const saveComponentDef = useCallback(
    (updated: ComponentDef): ComponentDef => {
      if (isSharedComponent && currentScope !== "global") {
        const newComponentId = crypto.randomUUID();
        const pageName = pages.find((p) => p.id === pageId)?.name || "Página";
        const forked: ComponentDef = {
          ...updated,
          id: newComponentId,
          name: `${def.name} (${pageName})`,
          styles: updated.styles ? { ...updated.styles } : undefined,
        };
        dispatch({ type: "component/save", component: forked });
        dispatch({
          type: "block/replace-component",
          pageId,
          blockId: block.id,
          componentId: newComponentId,
        });
        return forked;
      } else {
        dispatch({ type: "component/save", component: updated });
        return updated;
      }
    },
    [isSharedComponent, currentScope, def, pageId, block.id, pages, dispatch],
  );

  const syncCanvasOption = useCallback(
    (optKey: string) => {
      const blockEl =
        document.querySelector(`[data-block-id="${block.id}"]`) ||
        document.querySelector(`[data-component="${def.id}"]`);
      if (blockEl) {
        blockEl.setAttribute("data-active-option", optKey);
        const canvasEl = blockEl.querySelector("[data-canvas]");
        if (canvasEl) canvasEl.setAttribute("data-active-option", optKey);

        const optNum = parseInt(optKey.replace("opt", ""), 10);
        const radios = blockEl.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        if (radios.length >= optNum && optNum >= 1) {
          radios[optNum - 1].checked = true;
        }
      }
      window.dispatchEvent(
        new CustomEvent("cms:option-selected", {
          detail: {
            blockId: block.id,
            componentId: def.id,
            optionKey: optKey,
          },
        }),
      );
    },
    [block.id, def.id],
  );

  useEffect(() => {
    const handleOptEvent = (e: Event) => {
      const detail = (e as CustomEvent<{
        elementId?: string;
        blockId?: string;
        componentId?: string;
        optionKey?: string;
      }>).detail;
      if (detail?.blockId && detail.blockId !== block.id) return;
      if (detail?.componentId && detail.componentId !== def.id) return;
      if (detail?.optionKey) {
        setActiveOptionKey(detail.optionKey);
      }
    };
    window.addEventListener("cms:option-selected", handleOptEvent);
    return () => window.removeEventListener("cms:option-selected", handleOptEvent);
  }, [block.id, def.id]);

  const handleSelectOptionKey = (optKey: string) => {
    setActiveOptionKey(optKey);
    syncCanvasOption(optKey);
  };

  const optionCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of componentOptions) {
      counts[opt.key] = getCardsForOption(def, opt.key).length;
    }
    return counts;
  }, [def, componentOptions]);

  const currentOptionCards: ContainerCardItem[] = useMemo(() => {
    if (!hasComponentOptions) return [];
    return getCardsForOption(def, activeOptionKey).map((c) => ({
      id: c.id,
      title: c.title,
      elementCount: c.elementCount,
      fill: c.fill,
    }));
  }, [def, hasComponentOptions, activeOptionKey]);

  const layersElements = useMemo(() => {
    const filtered = hasComponentOptions
      ? def.elements.filter((el) => {
          const match = el.id.match(/-opt(\d+)-/);
          if (!match) return true;
          return `opt${match[1]}` === activeOptionKey;
        })
      : def.elements;
    return uniqueElements(filtered);
  }, [def.elements, hasComponentOptions, activeOptionKey]);

  const handleAddCardToOption = (optKey: string) => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = addCardToOption(def, optKey);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newCardId });
    syncCanvasOption(optKey);
  };

  const handleDuplicateCardInOption = (cardId: string) => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = duplicateCardInOption(def, cardId);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newCardId });
  };

  const handleDeleteCardFromOption = (cardId: string) => {
    if (!canEditContent) return;
    const updated = deleteCardFromOption(def, cardId);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: null });
  };

  const handleMoveCardToOption = (cardId: string, targetOptionKey: string) => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = moveCardToOption(def, cardId, targetOptionKey);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newCardId });
    handleSelectOptionKey(targetOptionKey);
  };

  const handleUpdateOptionLabel = (optionIndex: number, newLabel: string) => {
    if (!canEditContent) return;
    const updated = updateOptionLabel(def, optionIndex, newLabel);
    saveComponentDef(updated);
  };

  const handleAddOption = () => {
    if (!canEditContent) return;
    const added = addOption(def);
    if (!added) return;
    saveComponentDef(added.component);
    handleSelectOptionKey(added.optionKey);
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (!canEditContent) return;
    saveComponentDef(removeOption(def, optionIndex));
    // La opción activa pudo ser la quitada (o renumerada): se vuelve a la primera.
    dispatch({ type: "element/select", id: null });
    handleSelectOptionKey("opt1");
  };

  const handleAddCard = () => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = addCardToComponent(def);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newCardId });
  };

  const handleDuplicateCard = (cardId: string) => {
    if (!canEditContent) return;
    const { component: updated, newCardId } = duplicateCardInComponent(def, cardId);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newCardId });
  };

  const handleDeleteCard = (cardId: string) => {
    if (!canEditContent) return;
    const updated = deleteCardFromComponent(def, cardId);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: null });
  };

  const handleFillThreeCards = () => {
    if (!canEditContent) return;
    const updated = fillComponentWithThreeCards(def);
    saveComponentDef(updated);
  };

  const handleFillCards = (count: number) => {
    if (!canEditContent) return;
    const updated = fillComponentWithCards(def, count);
    saveComponentDef(updated);
  };

  const handleAddButton = () => {
    if (!canEditContent) return;
    const { component: updated, newButtonId } = addButtonToComponent(def);
    saveComponentDef(updated);
    dispatch({ type: "element/select", id: newButtonId });
  };

  const handleCardColorChange = (cardId: string, color: string) => {
    if (!canEditContent) return;
    if (level === "block") {
      dispatch({
        type: "block/style",
        pageId,
        blockId: block.id,
        elementIds: [cardId],
        patch: { fill: color },
      });
    } else {
      dispatch({
        type: "component/element",
        componentId: def.id,
        pageId,
        blockId: block.id,
        elementId: cardId,
        patch: { fill: color },
      });
    }
    const cur = def.styles?.[cardId]?.classes || block.custom?.[cardId]?.classes;
    if (cur && /\bbg-\S+/.test(cur)) {
      const cleaned = cur.replace(/\bbg-\S+/g, "").trim();
      dispatch(
        level === "block"
          ? { type: "block/custom", pageId, blockId: block.id, key: cardId, patch: { classes: cleaned } }
          : { type: "component/styles", componentId: def.id, key: cardId, patch: { classes: cleaned } },
      );
    }
  };

  const handleApplyElementColor = (patch: ElementOverride) => {
    if (!canEditContent || !element) return;
    if (level === "block") {
      dispatch({
        type: "block/style",
        pageId,
        blockId: block.id,
        elementIds: [element.id],
        patch,
      });
    } else {
      dispatch({
        type: "component/element",
        componentId: def.id,
        pageId,
        blockId: block.id,
        elementId: element.id,
        patch,
      });
    }

    if (patch.fill && custom.classes && /\bbg-\S+/.test(custom.classes)) {
      saveStyle({ classes: custom.classes.replace(/\bbg-\S+/g, "").trim() }, canEditContent);
    }
    if (patch.color && custom.classes && /\btext-\S+/.test(custom.classes)) {
      saveStyle({ classes: custom.classes.replace(/\btext-\S+/g, "").trim() }, canEditContent);
    }

    const isBackdrop =
      element.kind === "rect" &&
      !element.parentId &&
      element.x === 0 &&
      element.y === 0 &&
      element.width >= def.width * 0.8;
    if (isBackdrop && patch.fill) {
      const secCss =
        (level === "block" ? block.custom?.[SECTION_KEY]?.css : def.styles?.[SECTION_KEY]?.css) || "";
      if (/background\s*:[^;]+;/i.test(secCss)) {
        saveSectionStyle(
          { css: secCss.replace(/background\s*:[^;]+;/gi, "").trim() },
          canEditContent,
        );
      }
    }
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
  const isMenuDisabled =
    block.adapt?.mobile === "scale" && block.adapt?.tablet === "scale" && block.adapt?.desktop !== "menu";
  const activeMenuMode: "drop" | "right" | "left" | "full" | "none" = isMenuDisabled
    ? "none"
    : (currentMenu.panel ?? "drop");

  const menuBreakpointChoice: "all" | "mobile-tablet" | "mobile-only" | "never" =
    isMenuDisabled
      ? "never"
      : block.adapt?.desktop === "menu"
        ? "all"
        : block.adapt?.tablet === "menu"
          ? "mobile-tablet"
          : "mobile-only";

  const handleSelectHeaderMenuMode = (mode: "drop" | "right" | "left" | "full" | "none") => {
    if (!canEditContent) return;
    if (mode === "none") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "scale" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "scale" });
    } else {
      if (menuBreakpointChoice === "all") {
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: "menu" });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      } else if (menuBreakpointChoice === "mobile-tablet" || block.adapt?.tablet === "menu") {
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      } else {
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: null });
        dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
      }
      dispatch({
        type: "responsive/menu",
        pageId,
        blockId: block.id,
        patch: { panel: mode, icon: "menu" },
      });
    }
  };

  const handleSetMenuBreakpoints = (choice: "all" | "mobile-tablet" | "mobile-only" | "never") => {
    if (!canEditContent) return;
    if (choice === "all") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: "menu" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
    } else if (choice === "mobile-tablet") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "menu" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
    } else if (choice === "mobile-only") {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: null });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "menu" });
    } else {
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "desktop", strategy: null });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "tablet", strategy: "scale" });
      dispatch({ type: "responsive/adapt", pageId, blockId: block.id, device: "mobile", strategy: "scale" });
    }
  };

  const handleToggleMenuPreview = () => {
    if (safeViewport && safeViewport.device === "desktop" && menuBreakpointChoice !== "all") {
      safeViewport.setDevice("mobile");
    }
    if (block.adapt?.mobile !== "menu" && menuBreakpointChoice !== "all") {
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
    .filter((e) => !e.hidden && (e.role === "link" || e.role === "button" || (e.kind === "text" && e.role !== "heading") || e.kind === "icon" || e.control?.name === "search-trigger"))
    .map((e) => ({
      id: e.id,
      label: e.control?.name === "search-trigger"
        ? (e.text?.trim() || "Buscador de trámites")
        : (e.text?.trim() || (e.kind === "icon" ? `Ícono (${e.icon ?? "estrella"})` : "Elemento")),
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

  const footerColumnsList = footerColumns.map((col, idx) => ({
    id: col.id,
    index: idx,
    title: def.elements.find((e) => e.parentId === col.id && (e.role === "heading" || e.kind === "text"))?.text || `Columna ${idx + 1}`,
    items: def.elements
      .filter((e) => e.parentId === col.id)
      .map((e) => ({
        id: e.id,
        text: e.text || (e.role === "image" ? "Logo / Escudo" : "Elemento"),
        role: e.role,
        kind: e.kind,
      })),
  }));

  const currentParentColId = element?.parentId;
  const currentColIndex = currentParentColId
    ? footerColumns.findIndex((c) => c.id === currentParentColId)
    : -1;

  const handleOrganizeFooter = (cols: 1 | 2 | 3 | 4) => {
    if (!canEditContent) return;
    const updated = organizeFooterIntoColumns(def, cols);
    saveComponentDef(updated);
  };

  const handleResetMunicipalFooter = () => {
    if (!canEditContent) return;
    const updated = createDefaultMunicipalFooter(def.id);
    saveComponentDef(updated);
  };

  const handleMoveElementToFooterCol = (colIdx: number) => {
    if (!canEditContent || !element) return;
    const updated = moveElementToFooterColumn(def, element.id, colIdx);
    saveComponentDef(updated);
  };

  const handleAddFooterLink = (colIdx: number) => {
    if (!canEditContent) return;
    const { component: updated, newLinkId } = addLinkToFooterColumn(def, colIdx);
    saveComponentDef(updated);
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
    saveComponentDef(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      <HideOnControls pageId={pageId} block={block} def={def} elementId={element?.id} />

      {/* Sistema Centralizado de Identidad Visual y Gobernanza de Estilos */}
      {canEditContent && (
        <>
          {rootCardId && rootCardId !== element?.id && containerCards.some((c) => c.id === rootCardId) && (
            <div className="flex items-center justify-between gap-2 rounded bg-canvas/80 px-2.5 py-1.5 text-[11px] text-ink-dim border border-line">
              <span className="truncate">Elemento dentro de tarjeta</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "element/select", id: rootCardId })}
                className="shrink-0 text-accent font-semibold hover:underline cursor-pointer"
                title="Seleccionar la tarjeta contenedora para cambiar sus bordes o fondo"
              >
                Editar tarjeta entera
              </button>
            </div>
          )}

          <BrandGovernanceControls
            pageId={pageId}
            block={block}
            def={def}
            element={effectiveElement}
            onApplyElementColor={handleApplyElementColor}
          />
        </>
      )}
      {canEditContent && element && (element.kind === "text" || typeof element.text === "string" || element.role === "button" || element.role === "link") && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-accent/40 bg-accent/5 p-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label htmlFor="inspector-element-text" className="text-xs font-semibold text-ink">
              Contenido de texto
            </label>
            <span className="text-[10px] text-ink-dim font-normal">Doble clic en lienzo para editar</span>
          </div>
          <textarea
            id="inspector-element-text"
            rows={activeElement?.text && activeElement.text.length > 50 ? 3 : 2}
            value={activeElement?.text ?? ""}
            onChange={(e) =>
              dispatch(
                level === "block"
                  ? {
                      type: "block/style",
                      pageId,
                      blockId: block.id,
                      elementIds: [element.id],
                      patch: { text: e.target.value },
                    }
                  : {
                      type: "component/text",
                      componentId: def.id,
                      pageId,
                      blockId: block.id,
                      elementId: element.id,
                      text: e.target.value,
                    }
              )
            }
            placeholder="Escribe el texto aquí..."
            className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-hidden resize-y transition-colors font-medium"
          />
        </div>
      )}
      {canEditContent &&
        activeElement &&
        (activeElement.kind === "image" ||
          activeElement.kind === "video" ||
          activeElement.role === "image" ||
          activeElement.kind === "rect" ||
          activeElement.kind === "ellipse" ||
          activeElement.frame ||
          Boolean(activeElement.src)) && (
          <InspectorMediaControls
            element={activeElement}
            componentId={def.id}
            pageId={pageId}
            blockId={block.id}
            level={level}
          />
        )}
      {(def.id.includes("search") || element?.control?.name?.includes("search") || Boolean(element?.text?.toLowerCase().includes("buscar"))) && (
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
      {element && <AltControl pageId={pageId} block={block} element={effectiveElement ?? element} />}
      {element ? <BindingControls pageId={pageId} block={block} element={element} /> : <RepeatControls pageId={pageId} block={block} />}
      {element && <LinkParamsControls pageId={pageId} block={block} element={element} />}
      {!element && <SectionBackground pageId={pageId} block={block} />}
      {!element && canEditContent && <LayerControls pageId={pageId} block={block} />}
      {canEditStyles && (
        <Collapsible title="Colores de la sección" defaultOpen={!element}>
          <SectionColorPalette pageId={pageId} block={block} def={def} />
        </Collapsible>
      )}
      {canEditContent && def.elements.length > 0 && (
        <Collapsible
          title={hasComponentOptions ? `Capas · ${activeOptionKey} (${layersElements.length})` : `Capas (${def.elements.length})`}
          defaultOpen={!element}
        >
          <LayersPanel
            elements={layersElements}
            selectedId={element?.id ?? null}
            onSelect={(id) => dispatch({ type: "element/select", id })}
            onPatch={(id, patch) =>
              dispatch({
                type: "component/element",
                componentId: def.id,
                pageId,
                blockId: block.id,
                elementId: id,
                patch,
              })
            }
            onReorder={(ids) => {
              if (hasComponentOptions) {
                const idMap = new Map(def.elements.map((e) => [e.id, e]));
                const otherElements = def.elements.filter((e) => !ids.includes(e.id));
                const reorderedActive = ids.map((id) => idMap.get(id)!).filter(Boolean);
                saveComponentDef({ ...def, elements: [...otherElements, ...reorderedActive] });
              } else {
                const idMap = new Map(def.elements.map((e) => [e.id, e]));
                const reordered = ids.map((id) => idMap.get(id)!).filter(Boolean);
                saveComponentDef({ ...def, elements: reordered });
              }
            }}
          />
        </Collapsible>
      )}
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
              } cursor-pointer`}
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
              } cursor-pointer`}
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
              } cursor-pointer`}
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
                  } cursor-pointer`}
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
                  } cursor-pointer`}
                  title="Solo visible en esta página"
                >
                  Solo esta página
                </button>
              </div>
            </div>
          )}

          {isHeader ? (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-line/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-dim font-medium">Ubicación en el portal:</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "block/lock", pageId, blockId: block.id, locked: !block.locked })}
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    block.locked
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                      : "text-ink-dim hover:text-ink hover:bg-hover"
                  } cursor-pointer`}
                  title={block.locked ? "Desbloquear encabezado" : "Bloquear encabezado"}
                >
                  {block.locked ? <LockClosedIcon className="h-3.5 w-3.5" /> : <LockOpenIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-accent font-medium leading-snug">
                El encabezado se ancla automáticamente en la parte superior a ancho completo.
              </p>
            </div>
          ) : isFooter ? (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-line/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-dim font-medium">Ubicación en el portal:</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "block/lock", pageId, blockId: block.id, locked: !block.locked })}
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    block.locked
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                      : "text-ink-dim hover:text-ink hover:bg-hover"
                  } cursor-pointer`}
                  title={block.locked ? "Desbloquear pie de página" : "Bloquear pie de página"}
                >
                  {block.locked ? <LockClosedIcon className="h-3.5 w-3.5" /> : <LockOpenIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-accent font-medium leading-snug">
                El pie de página se ancla siempre al final del portal sin sobreponerse al cuerpo.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
                <span className="text-[10px] text-ink-dim font-medium">Posicionamiento en la página:</span>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
                  <button
                    type="button"
                    disabled={block.locked}
                    aria-pressed={block.placementMode !== "overlay"}
                    onClick={() => {
                      // Una sección colocada libremente se queda en el flujo donde se ve, no donde está en la lista:
                      // se anota su sitio antes de que el cambio le quite la posición.
                      const slot = block.placement || block.placementMode === "overlay" ? flowSlotOf(block.id) : undefined;
                      // El propio cambio a «flow» ya quita `placement`: no hace falta volver a colocarlo con null.
                      dispatch({ type: "block/placement-mode", pageId, blockId: block.id, mode: "flow" });
                      if (slot) {
                        dispatch({ type: "block/reorder", pageId, blockId: block.id, beforeId: slot.beforeId });
                        // Sin esto caería justo bajo la sección de arriba, encima de lo que está sobrepuesto.
                        dispatch({ type: "block/box", pageId, blockId: block.id, patch: { marginTop: slot.gap } });
                      }
                    }}
                    className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim"
                        : block.placementMode !== "overlay"
                          ? "bg-accent text-white shadow-xs font-semibold"
                          : "text-ink-dim hover:text-ink hover:bg-hover"
                    } cursor-pointer`}
                    title={block.locked ? "Sección bloqueada" : "Se ajusta automáticamente según el contenido de la página sin sobreponerse"}
                  >
                    Ajustar a contenido
                  </button>
                  <button
                    type="button"
                    disabled={block.locked}
                    aria-pressed={block.placementMode === "overlay"}
                    onClick={() => {
                      dispatch({ type: "block/placement-mode", pageId, blockId: block.id, mode: "overlay" });
                      const at = block.placement ? null : currentPlacement(block.id);
                      if (at) dispatch({ type: "block/place", pageId, blockId: block.id, placement: at });
                    }}
                    className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim"
                        : block.placementMode === "overlay"
                          ? "bg-accent text-white shadow-xs font-semibold"
                          : "text-ink-dim hover:text-ink hover:bg-hover"
                    } cursor-pointer`}
                    title={block.locked ? "Sección bloqueada" : "Permite mover libremente y sobreponer sobre otros elementos"}
                  >
                    Sobreponer (libre)
                  </button>
                </div>
                <p className="text-[10px] text-ink-dim">
                  {block.locked
                    ? "Sección bloqueada: desbloquea la sección para cambiar su modo o moverla."
                    : block.placementMode === "overlay"
                      ? "Modo libre: arrastra la sección en el lienzo para moverla o sobreponerla a otras."
                      : "Modo recomendado: la sección respeta el flujo de la página y se ajusta automáticamente."}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-dim font-medium">Ancho en el lienzo:</span>
                  <span className="text-[10px] text-accent font-semibold">
                    {block.box?.span === "content" ? "Con márgenes (944px)" : "Ajustado al lienzo (1024px)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-[11px]">
                  <button
                    type="button"
                    disabled={block.locked}
                    aria-pressed={block.box?.span !== "content"}
                    onClick={() => dispatch({ type: "block/box", pageId, blockId: block.id, patch: { span: "width" } })}
                    className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim"
                        : block.box?.span !== "content"
                          ? "bg-accent text-white shadow-xs font-semibold"
                          : "text-ink-dim hover:text-ink hover:bg-hover"
                    } cursor-pointer`}
                    title="Ajusta la sección a todo el ancho del lienzo (1024px) para que no se desplace ni se corte a los costados"
                  >
                    Ajustar al lienzo (1024px)
                  </button>
                  <button
                    type="button"
                    disabled={block.locked}
                    aria-pressed={block.box?.span === "content"}
                    onClick={() => dispatch({ type: "block/box", pageId, blockId: block.id, patch: { span: "content" } })}
                    className={`h-7 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim"
                        : block.box?.span === "content"
                          ? "bg-accent text-white shadow-xs font-semibold"
                          : "text-ink-dim hover:text-ink hover:bg-hover"
                    } cursor-pointer`}
                    title="Contrae la sección dentro de los márgenes laterales estándar (40px a cada lado)"
                  >
                    Con márgenes (40px)
                  </button>
                </div>
                <p className="text-[10px] text-ink-dim">
                  {block.box?.span === "content"
                    ? "La sección queda limitada dentro de los márgenes de 40px."
                    : "La sección aprovecha los 1024px completos del lienzo para que las tarjetas y botones queden en su posición exacta sin salirse."}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-line/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-dim font-medium">Orden en la página:</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "block/lock", pageId, blockId: block.id, locked: !block.locked })}
                    className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                      block.locked
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                        : "text-ink-dim hover:text-ink hover:bg-hover"
                    } cursor-pointer`}
                    title={block.locked ? "Desbloquear sección" : "Bloquear sección"}
                  >
                    {block.locked ? <LockClosedIcon className="h-3.5 w-3.5" /> : <LockOpenIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={block.locked}
                    onClick={() => dispatch({ type: "block/move", pageId, blockId: block.id, direction: -1 })}
                    className={`flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium transition-colors ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim hover:bg-canvas"
                        : "text-ink hover:bg-hover active:scale-95"
                    } cursor-pointer`}
                    title={block.locked ? "Sección bloqueada · Desbloquea para mover" : "Mover esta sección más arriba"}
                  >
                    <span className="font-bold">↑</span> Subir sección
                  </button>
                  <button
                    type="button"
                    disabled={block.locked}
                    onClick={() => dispatch({ type: "block/move", pageId, blockId: block.id, direction: 1 })}
                    className={`flex items-center justify-center gap-1.5 h-7 rounded border border-line bg-canvas px-2 text-xs font-medium transition-colors ${
                      block.locked
                        ? "cursor-not-allowed opacity-40 text-ink-dim hover:bg-canvas"
                        : "text-ink hover:bg-hover active:scale-95"
                    } cursor-pointer`}
                    title={block.locked ? "Sección bloqueada · Desbloquea para mover" : "Mover esta sección más abajo"}
                  >
                    <span className="font-bold">↓</span> Bajar sección
                  </button>
                </div>
                <p className="text-[10px] text-ink-dim">
                  {block.locked
                    ? "Esta sección está bloqueada: su posición y contenido están fijos estilo Canva."
                    : "Cambia la posición de esta sección respecto a las demás en el orden vertical de la página."}
                </p>
              </div>
            </>
          )}

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
          <button type="button" onClick={add} className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover cursor-pointer">
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
                className={`h-7 rounded ${level === value ? "bg-accent/25 text-accent" : "text-ink-dim hover:text-ink"} cursor-pointer`}
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
          onCardColorChange={canEditContent ? handleCardColorChange : undefined}
          onFillThreeCards={canEditContent ? handleFillThreeCards : undefined}
          onFillCards={canEditContent ? handleFillCards : undefined}
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
          footerColumnsList={footerColumnsList}
          onSelectElement={(id) => dispatch({ type: "element/select", id })}
          scopeMode={block.scope === "page" || level === "block" ? "page" : "global"}
          onSetScopeMode={(mode) => {
            if (mode === "global") {
              setLevel("component");
              if (block.scope !== "global") {
                dispatch({ type: "block/scope", pageId, blockId: block.id, scope: "global" });
              }
            } else {
              setLevel("block");
              if (block.scope !== "page") {
                dispatch({ type: "block/scope", pageId, blockId: block.id, scope: "page" });
              }
            }
          }}
          componentOptions={componentOptions}
          activeOptionKey={activeOptionKey}
          optionCardCounts={optionCardCounts}
          currentOptionCards={currentOptionCards}
          onSelectOptionKey={handleSelectOptionKey}
          onAddCardToOption={canEditContent ? handleAddCardToOption : undefined}
          onDuplicateCardInOption={canEditContent ? handleDuplicateCardInOption : undefined}
          onDeleteCardFromOption={canEditContent ? handleDeleteCardFromOption : undefined}
          onMoveCardToOption={canEditContent ? handleMoveCardToOption : undefined}
          onUpdateOptionLabel={canEditContent ? handleUpdateOptionLabel : undefined}
          onAddOption={canEditContent ? handleAddOption : undefined}
          onRemoveOption={canEditContent ? handleRemoveOption : undefined}
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
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-line text-xs hover:bg-hover cursor-pointer"
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

function PaletteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!paletteOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaletteOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [paletteOpen]);

  const page = pages.find((p) => p.id === currentPageId);
  const block =
    page?.blocks.find((b) => b.id === selectedId) ??
    pages.flatMap((p) => p.blocks).find((b) => b.id === selectedId);
  const def = components.find((c) => c.id === block?.componentId);
  if (!page || !block || !def) return null;

  const ownerPage = pages.find((p) => p.blocks.some((b) => b.id === selectedId)) ?? page;

  const element = def.elements.find((e) => e.id === selectedElementId);
  const scope = element ? element.id : SECTION_KEY;

  const headerActions = (
    <button
      ref={paletteRef}
      type="button"
      aria-label="Paleta de colores de la sección"
      title="Mostrar / ocultar paleta de colores de la sección"
      onClick={() => setPaletteOpen(!paletteOpen)}
      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors ${
        paletteOpen
          ? "bg-accent/20 text-accent font-semibold"
          : "text-ink-dim hover:bg-hover hover:text-ink"
      } cursor-pointer`}
    >
      <PaletteIcon />
    </button>
  );

  const subHeader = paletteOpen ? (
    <div className="border-b border-line bg-canvas/60 p-3 text-xs shadow-inner animate-in fade-in slide-in-from-top-1 duration-150">
      <SectionColorPalette pageId={ownerPage.id} block={block} def={def} />
    </div>
  ) : null;

  return (
    <DockablePanel
      title={element ? elementLabel(element) : def.name}
      categoryLabel={element ? `Elemento · ${def.name}` : "Sección"}
      onSelectSection={element ? () => dispatch({ type: "element/select", id: null }) : undefined}
      headerActions={headerActions}
      subHeader={subHeader}
      onOpenCode={() => openFile()}
      canEditCode={canEditCode}
      onClose={() => dispatch({ type: "block/select", id: TITLE_SELECTION })}
      footer={<RemoveButton page={ownerPage} />}
    >
      {/* key: al cambiar de selección, el editor empieza de cero con lo guardado de esa selección. */}
      <ScopeEditor key={`${block.id}:${scope}`} pageId={ownerPage.id} block={block} def={def} scope={scope} />
    </DockablePanel>
  );
}
