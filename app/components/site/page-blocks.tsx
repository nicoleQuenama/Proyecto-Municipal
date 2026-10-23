"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useBehaviors } from "../behaviors/use-behaviors";
import { BindingBadge } from "../data-sources/binding-badge";
import { RepeatedBlock } from "../data-sources/repeated-block";
import { useDataDrop } from "../data-sources/use-data-drop";
import { useDropData } from "../data-sources/use-drop-data";
import { CodeBlockView } from "../code/code-block-view";
import { useSharedAssets } from "../code/use-shared-assets";
import { useWorkbench } from "../workbench/workbench-context";
import { useFormatMenu } from "../format/format-menu-context";
import { useNavigation } from "../navigation/navigation-context";
import { boxStyle, pixelsOf } from "../styles/apply";
import { adaptToDevice } from "../responsive/adapt";
import { isAdaptive } from "../responsive/devices";
import { seedLayout } from "../responsive/manual-layout";
import { ResponsiveChip } from "../responsive/responsive-chip";
import { useStyles } from "../styles/use-styles";
import { useViewport } from "../viewport/viewport-context";
import { CodeButton } from "./code-button";
import { ComponentView, type ElementInteraction } from "./component-view";
import { customClasses, customCss, isFlowLayout, targetKey } from "./custom-code";
import { HiddenPlaceholder } from "./hidden-placeholder";
import { applyOverrides, type Resolver } from "./overrides";
import { splitBlocks } from "./rules";
import { useSite, useSiteDispatch } from "./site-context";
import { useBlockGestures } from "./use-block-gestures";
import { placementAttributes, placementStyle } from "../placement/placement-style";
import { PlacementGrip } from "../placement/placement-grip";
import { usePlacementDrag } from "../placement/use-placement-drag";
import { PLACE_KEY, SECTION_KEY, type BlockBox, type BlockInstance, type HideTarget, type Page } from "./types";
import { VisibilityEye } from "./visibility-eye";

/** Las esquinas de la caja de un bloque: píxeles, o el valor de una variable de tamaño. */
function boxRadius(radius: BlockBox["radius"], resolve: Resolver): number | undefined {
  if (radius === undefined) return undefined;
  return typeof radius === "number" ? radius : pixelsOf(resolve(radius), 0);
}

interface PageBlockProps {
  page: Page;
  block: BlockInstance;
  /** Solo los bloques de la página actual se seleccionan y se quitan. */
  interactive: boolean;
}

/** Un componente colocado en una página, con las reglas de apariencia y su formato propio aplicados. */
function PageBlock({ page, block, interactive }: PageBlockProps) {
  const { components, pages, selectedId, selectedElementId, alsoSelectedIds, libraries } = useSite();
  const dispatch = useSiteDispatch();
  const styles = useStyles(page.id);
  const { mode, followLink } = useNavigation();
  const { openFormatMenu } = useFormatMenu();

  const behaviors = block.behaviors ?? [];
  const sectionBehaviors = behaviors.filter((b) => b.scope === SECTION_KEY);
  const { ref, props: behaviorProps } = useBehaviors(block.id, sectionBehaviors, mode === "preview");

  const shared = useSharedAssets(block.id);
  const { openFile } = useWorkbench();

  const def = components.find((c) => c.id === block.componentId);
  const resolve = def && styles.resolver(def.id);
  const flow = isFlowLayout(def?.styles?.[SECTION_KEY], block.custom?.[SECTION_KEY]);

  // En tablet y móvil la sección se adapta sola o usa el diseño que la persona definió para ese dispositivo.
  const { device } = useViewport();
  const adaptive = isAdaptive(device);
  const formatted = def && resolve && applyOverrides(styles.component(def), block, resolve);
  const view = formatted && adaptToDevice(formatted, block, device, flow);
  const manual = adaptive && block.responsive?.[device] !== undefined;
  // Fuera del escritorio las secciones se apilan en el flujo: la posición libre es del escritorio.
  const placement = adaptive ? undefined : block.placement;

  const editing = interactive && mode === "edit";
  const selected = editing && block.id === selectedId;
  const gestures = useBlockGestures({ pageId: page.id, blockId: block.id, view, selected, device });
  const move = usePlacementDrag({
    enabled: editing && !adaptive,
    onPlace: (placement) => dispatch({ type: "block/place", pageId: page.id, blockId: block.id, placement }),
    onTransfer: (toPageId, placement) =>
      dispatch({ type: "block/transfer", fromPageId: page.id, toPageId, blockId: block.id, placement }),
  });
  const dropData = useDropData(page.id, block, view?.elements ?? []);
  const sectionDrop = useDataDrop((ref) => dropData(ref, null), editing && !block.code);
  if (!def || !view || !resolve) return null;

  const setHidden = (target: HideTarget, hidden: boolean) => dispatch({ type: "hidden/set", target, hidden });
  const blockTarget: HideTarget = { kind: "block", pageId: page.id, blockId: block.id };

  // Oculto: no se ve. Al editar queda un ojo en su lugar para volver a mostrarlo.
  if (block.hidden) {
    if (mode !== "edit") return null;
    return (
      <HiddenPlaceholder
        dataBlockId={block.id}
        label={`Sección oculta · ${def.name}`}
        onShow={() => setHidden(blockTarget, false)}
      />
    );
  }

  const select = () => dispatch({ type: "block/select", id: block.id });
  const box = boxStyle(styles.block(def));
  const css = customCss(block);

  // Los enlaces y el formato de los elementos se editan en todas las páginas; el resto, solo en la actual.
  const interaction: ElementInteraction = {
    mode,
    componentId: def.id,
    blockId: block.id,
    links: def.links,
    pages,
    behaviors,
    classes: Object.fromEntries(
      [...new Set([...Object.keys(def.styles ?? {}), ...Object.keys(block.custom ?? {})])].map((key) => [key, customClasses(block, key, def)]),
    ),
    flow,
    onMoveBlock: editing && !adaptive ? move.startDrag : undefined,
    // En una sección en flujo (flex o grid) la posición la decide el layout, no el ratón.
    // En tablet o móvil solo se arrastra si la persona definió ese diseño; en automático lo calcula el CMS.
    gestures: editing && !flow && (!adaptive || manual) ? gestures : undefined,
    selectedElementId: selected ? selectedElementId : null,
    alsoSelectedIds: selected ? alsoSelectedIds : undefined,
    onFollow: followLink,
    onToggleHidden: (elementId, hidden) =>
      setHidden({ kind: "element", pageId: page.id, blockId: block.id, elementId }, hidden),
    onContextMenu: (elementId, point) =>
      openFormatMenu({ kind: "element", pageId: page.id, blockId: block.id, elementId }, point),
    onOpenCode: (elementId) => openFile({ kind: "custom-css", pageId: page.id, blockId: block.id, key: elementId }),
    bindings: block.bindings,
    repeat: block.repeat,
    onDropData: dropData,
    onBind: (elementId, ref) => dispatch({ type: "binding/set", pageId: page.id, blockId: block.id, elementId, ref }),
    onSelect: (elementId, add) => {
      if (!interactive) return;
      if (!add || !selected) select();
      dispatch({ type: "element/select", id: elementId, add: add && selected });
    },
  };

  const editProps = {
    role: "button",
    tabIndex: 0,
    "aria-pressed": selected,
    "aria-label": `Seleccionar ${def.name}`,
    onClick: select,
    onKeyDown: (e: KeyboardEvent) => e.key === "Enter" && select(),
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      select();
      openFormatMenu({ kind: "block", pageId: page.id, blockId: block.id }, { x: e.clientX, y: e.clientY });
    },
  };

  return (
    <div
      ref={ref}
      data-block-id={block.id}
      data-component={def.id}
      {...placementAttributes(placement)}
      // El destino de la sección es su lienzo (ver ComponentView); en un bloque de código, la caja entera.
      {...(block.code ? { "data-target": targetKey(block.id, SECTION_KEY) } : {})}
      {...(placement && !block.code ? { "data-target": targetKey(block.id, PLACE_KEY) } : {})}
      {...behaviorProps}
      {...sectionDrop.handlers}
      className={`group ${placement ? "absolute" : "relative"} ${move.dragging ? "z-50" : ""} ${block.code ? "w-full" : "w-fit"} max-w-full rounded-md ${
        selected && selectedElementId === null
          ? "ring-2 ring-accent"
          : editing
            ? "hover:ring-1 hover:ring-accent/50"
            : ""
      } ${block.code ? customClasses(block, SECTION_KEY) : ""}`}
      style={{ margin: box.margin, ...placementStyle(placement) }}
    >
      {css && <style>{css}</style>}
      {sectionDrop.over && <span aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-md border-2 border-emerald-500 bg-emerald-500/10" />}
      {editing && block.repeat && (
        <BindingBadge
          label="Se repite por cada elemento de"
          reference={block.repeat}
          onClear={() => dispatch({ type: "repeat/set", pageId: page.id, blockId: block.id, ref: null })}
          className="absolute top-1 left-1 z-10"
        />
      )}

      <div
        {...(editing ? editProps : {})}
        className={`max-w-full p-1 ${editing ? "" : "overflow-x-auto"}`}
        style={{
          padding: box.padding,
          background: (block.box?.background && resolve(block.box.background)) || box.background,
          borderRadius: boxRadius(block.box?.radius, resolve) ?? box.borderRadius,
        }}
      >
        {block.code ? (
          <CodeBlockView
            code={block.code}
            libraries={libraries}
            shared={shared}
            name={def.name}
            editing={editing}
            onEdit={() => openFile({ kind: "block-html", pageId: page.id, blockId: block.id })}
          />
        ) : (
          <ComponentView def={view} interaction={interaction} />
        )}
      </div>

      {editing && (
        <>
          <VisibilityEye
            hidden={false}
            label={def.name}
            onToggle={() => setHidden(blockTarget, true)}
            className={`absolute -top-2 -left-2 focus:flex ${selected ? "flex" : "hidden group-hover:flex"}`}
          />
          <PlacementGrip
            label={def.name}
            onStart={move.startDrag}
            className={`absolute -top-3 left-1/2 -translate-x-1/2 focus:flex ${selected ? "flex" : "hidden group-hover:flex"}`}
          />
          {selected && adaptive && !block.code && !flow && (
            <ResponsiveChip
              device={device}
              manual={manual}
              onChange={(layout) =>
                dispatch({ type: "responsive/set", pageId: page.id, blockId: block.id, device, layout })
              }
              seed={() => seedLayout(view)}
            />
          )}
          {selected && selectedElementId === null && !block.code && (
            <CodeButton
              label="Abrir el código de la sección en el editor"
              onOpen={() => openFile({ kind: "custom-css", pageId: page.id, blockId: block.id, key: SECTION_KEY })}
              className="absolute -top-2 right-5"
            />
          )}
          <button
            type="button"
            aria-label={`Quitar ${def.name} de la página`}
            onClick={() => dispatch({ type: "block/remove", id: block.id })}
            className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white group-hover:flex focus:flex"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

interface PageBlocksProps {
  page: Page;
  /** Solo los bloques de la página actual se seleccionan y se quitan. */
  interactive: boolean;
  /** Las barras de navegación van arriba, antes del titular; el resto, debajo. */
  slot: "top" | "body";
}

/** Los componentes colocados en una página. */
export function PageBlocks({ page, interactive, slot }: PageBlocksProps) {
  const { components } = useSite();
  const styles = useStyles(page.id);

  const blocks = splitBlocks(page, components)[slot];
  if (blocks.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-6 ${slot === "top" ? "mb-6" : "mt-8"}`}
      style={{ gap: styles.page.gap }}
    >
      {blocks.map((block) => (
        <RepeatedBlock key={block.id} block={block}>
          {(copy) => <PageBlock key={copy} page={page} block={block} interactive={interactive && copy === 0} />}
        </RepeatedBlock>
      ))}
    </div>
  );
}
