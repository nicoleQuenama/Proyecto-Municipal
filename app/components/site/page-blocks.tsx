"use client";

import { useContext, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { FullBleedContext } from "../viewport/page-width";
import { MIN_BLEED_WIDTH, visiblePaint } from "./full-bleed";
import { canEditBlock } from "../auth/access";
import { useAuth } from "../auth/auth-context";
import { useBehaviors } from "../behaviors/use-behaviors";
import { BindingBadge } from "../data-sources/binding-badge";
import { RepeatedBlock } from "../data-sources/repeated-block";
import { useDataDrop } from "../data-sources/use-data-drop";
import { useDropData } from "../data-sources/use-drop-data";
import { CodeBlockView } from "../code/code-block-view";
import { useSharedAssets } from "../code/use-shared-assets";
import { useWorkbench } from "../workbench/workbench-context";
import { useFormatMenu } from "../format/format-menu-context";
import { useLinkResolver } from "../dynamic/use-link-resolver";
import { useNavigation } from "../navigation/navigation-context";
import { boxStyle, pixelsOf } from "../styles/apply";
import { adaptToDevice, strategyFor } from "../responsive/adapt";
import { CellWidth } from "../responsive/available-context";
import { availableWidth, DEVICE_NAME, isAdaptive } from "../responsive/devices";
import { isHiddenOn } from "../responsive/hidden-on";
import { sideMargin } from "../responsive/page-margin";
import { pickAction } from "../responsive/pick-mode";
import { smartStrategy } from "../responsive/strategies";
import { seedLayout } from "../responsive/manual-layout";
import { AdaptOptions } from "../responsive/adapt-options";
import { foldOf } from "../responsive/fold-model";
import { FoldedView } from "../responsive/folded-view";
import { MenuLayer } from "../responsive/menu-layer";
import { menuSetup } from "../responsive/menu-model";
import { ResponsiveChip } from "../responsive/responsive-chip";
import { useStyles } from "../styles/use-styles";
import { BackgroundLayers } from "../background/background-layers";
import { hasBackground, spanStyle, stretches } from "../background/background-css";
import { useViewport } from "../viewport/viewport-context";
import { CodeButton } from "./code-button";
import { ComponentView, type ElementInteraction } from "./component-view";
import { customClasses, customCss, isFlowLayout, targetKey } from "./custom-code";
import { HiddenPlaceholder } from "./hidden-placeholder";
import { applyOverrides, type Resolver } from "./overrides";
import { selectionOf } from "./multi-select";
import type { Placement } from "../placement/types";
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
  const { components, pages, selectedId, selectedElementId, alsoSelectedIds, selectedBlockIds, libraries } = useSite();
  const dispatch = useSiteDispatch();
  const styles = useStyles(page.id);
  const { mode, followLink } = useNavigation();
  const { openFormatMenu } = useFormatMenu();
  const withParams = useLinkResolver(block);
  const fullPage = useContext(FullBleedContext);
  // El fondo liso con que se dibuja la sección (también el que viene de clases o CSS propios), para extenderlo a los bordes.
  const [painted, setPainted] = useState<string | null>(null);

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
  const cell = useContext(CellWidth);
  const available = cell ?? availableWidth(device, sideMargin(device, page.sideMargin));
  const view = formatted && adaptToDevice(formatted, block, device, flow, available);
  const wideEnough = (view?.width ?? 0) >= MIN_BLEED_WIDTH;
  useLayoutEffect(() => {
    const canvas = fullPage && wideEnough ? ref.current?.querySelector<HTMLElement>("[data-canvas]") : null;
    setPainted(canvas ? visiblePaint(canvas) : null);
  }, [ref, fullPage, wideEnough, block.custom, def?.styles, view]);
  const manual = adaptive && block.responsive?.[device] !== undefined;
  const menu = formatted ? menuSetup(formatted, block, device) : null;
  // Fuera del escritorio las secciones se apilan en el flujo: la posición libre es del escritorio.
  const placement = adaptive ? undefined : block.placement;

  // Una cuenta con acceso limitado solo edita las secciones que se le asignaron; el resto se ve pero no se toca.
  const { currentUser } = useAuth();
  const locked = !canEditBlock(currentUser, page.id, block.id);
  const editing = interactive && mode === "edit" && !locked;
  // Con acceso limitado se remarca lo que sí puede cambiar y se atenúa el resto.
  const limited = interactive && mode === "edit" && !!currentUser?.access?.scope;
  const selected = editing && block.id === selectedId;
  const gestures = useBlockGestures({
    pageId: page.id,
    blockId: block.id,
    view,
    selected,
    selectedElementIds: selected && selectedElementId ? [selectedElementId, ...(alsoSelectedIds ?? [])] : [],
    device,
  });
  // Con varias secciones marcadas, arrastrar una mueve todas: se anota dónde estaba cada una al agarrar.
  const groupOrigins = useRef<Record<string, Placement> | null>(null);
  const move = usePlacementDrag({
    enabled: editing && !adaptive,
    onBegin: () => {
      const ids = selectionOf({ selectedId, selectedBlockIds });
      const group = ids.length > 1 && ids.includes(block.id) ? page.blocks.filter((b) => ids.includes(b.id) && b.placement) : [];
      groupOrigins.current = group.length > 1 ? Object.fromEntries(group.map((b) => [b.id, b.placement!])) : null;
    },
    onPlace: (placement) => {
      const origins = groupOrigins.current;
      if (origins) dispatch({ type: "block/place-group", pageId: page.id, anchorId: block.id, placement, origins });
      else dispatch({ type: "block/place", pageId: page.id, blockId: block.id, placement });
    },
    onTransfer: (toPageId, placement) =>
      dispatch({ type: "block/transfer", fromPageId: page.id, toPageId, blockId: block.id, placement }),
  });
  const dropData = useDropData(page.id, block, view?.elements ?? []);
  const sectionDrop = useDataDrop((ref) => dropData(ref, null), editing && !block.code);
  if (!def || !view || !resolve) return null;

  // Vista previa a todo el ancho: lo marcado «Todo el ancho» y lo diseñado de borde a borde llegan a los bordes de la página.
  const autoFill = fullPage && !placement && !stretches(block.box?.span) && !block.code ? painted : null;
  const bleeds = fullPage && !placement && (stretches(block.box?.span) || autoFill !== null);

  const setHidden = (target: HideTarget, hidden: boolean) => dispatch({ type: "hidden/set", target, hidden });
  const blockTarget: HideTarget = { kind: "block", pageId: page.id, blockId: block.id };

  // Oculto: no se ve. Al editar queda un ojo en su lugar para volver a mostrarlo.
  const hiddenHere = isHiddenOn(block.hiddenOn, device);
  if (block.hidden || hiddenHere) {
    if (mode !== "edit") return null;
    return (
      <HiddenPlaceholder
        dataBlockId={block.id}
        onDelete={interactive ? () => dispatch({ type: "block/remove", id: block.id }) : undefined}
        label={hiddenHere ? `Sección oculta en ${DEVICE_NAME[device].plain} · ${def.name}` : `Sección oculta · ${def.name}`}
        onShow={() =>
          hiddenHere
            ? dispatch({ type: "responsive/hide", pageId: page.id, blockId: block.id, device, hidden: false })
            : setHidden(blockTarget, false)
        }
      />
    );
  }

  const select = () => dispatch({ type: "block/select", id: block.id });
  // Una figura dibujada mide exactamente lo dibujado: sin relleno ni fondo de caja.
  const box = def.drawn ? { padding: 0 } : boxStyle(styles.block(def));
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
    onFollow: (link, elementId) => followLink(withParams(link, elementId)),
    onEditText: (elementId, text) =>
      dispatch({ type: "component/text", componentId: def.id, pageId: page.id, blockId: block.id, elementId, text }),
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

  const backdrop = block.box?.backdrop;
  const background = (block.box?.background && resolve(block.box.background)) || box.background;
  const chipMode = manual ? "manual" : strategyFor(formatted ?? view, block, device, available);

  // El botón del menú va sobre la sección, junto con su panel.
  const menuLayer = menu && (
    <MenuLayer
      setup={menu}
      view={view}
      blockId={block.id}
      live={mode === "preview"}
      links={def.links}
      behaviors={behaviors}
      background={typeof background === "string" ? background : undefined}
      onFollow={interaction.onFollow}
    />
  );

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
      {...(placement && !placement.fixed && stretches(block.box?.span) ? { "data-bleed": "" } : {})}
      // El destino de la sección es su lienzo (ver ComponentView); en un bloque de código, la caja entera.
      {...(block.code ? { "data-target": targetKey(block.id, SECTION_KEY) } : {})}
      {...(placement && !block.code ? { "data-target": targetKey(block.id, PLACE_KEY) } : {})}
      {...behaviorProps}
      {...(behaviorProps.onClick ? { "data-interactive": "" } : {})}
      {...sectionDrop.handlers}
      className={`group ${placement ? "absolute" : "relative"} ${move.dragging ? "z-50" : ""} ${limited && locked ? "opacity-40 saturate-50" : ""} ${limited && !locked ? "outline-2 outline-dashed outline-accent/70 outline-offset-2" : ""} ${block.code || stretches(block.box?.span) || autoFill ? "w-full" : "w-fit"} max-w-full ${stretches(block.box?.span) ? "" : "rounded-md"} ${
        (selected && selectedElementId === null) || (editing && selectedBlockIds?.includes(block.id))
          ? "ring-2 ring-accent"
          : editing
            ? "hover:ring-1 hover:ring-accent/50"
            : ""
      } ${block.code ? customClasses(block, SECTION_KEY) : ""}`}
      style={{
        margin: box.margin,
        ...(block.box?.blend ? { mixBlendMode: block.box.blend } : {}),
        ...placementStyle(placement),
        // Una sección colocada de ancho completo (o pantalla completa) llega a los bordes de la página, no al ancho del diseño.
        ...(fullPage && placement && !placement.fixed && stretches(block.box?.span) ? { left: 0, width: "100%", maxWidth: "none" } : {}),
        // Una sección fija que ocupa todo el ancho o la pantalla cubre la ventana entera (pantalla de carga, barra fija).
        ...(placement?.fixed && stretches(block.box?.span) ? { left: 0, top: 0, width: "100vw", maxWidth: "none" } : {}),
        ...(bleeds ? { marginLeft: "calc(var(--cms-side) * -1)", marginRight: "calc(var(--cms-side) * -1)", width: "calc(100% + 2 * var(--cms-side))", maxWidth: "none" } : {}),
      }}
    >
      {css && <style>{css}</style>}
      {limited && !locked && (
        <span className="pointer-events-none absolute top-1 left-1 z-10 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white shadow">
          ✏ Puedes editar
        </span>
      )}
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
        // Fuera de la edición lo que sobresale por los lados se recorta (no se desplaza): así un efecto que mueve o agranda
        // la sección no hace aparecer barras de desplazamiento.
        className={`max-w-full p-1 ${editing ? "" : "overflow-x-clip"}`}
        style={{
          padding: box.padding,
          background: background ?? autoFill ?? undefined,
          borderRadius: stretches(block.box?.span) ? 0 : (boxRadius(block.box?.radius, resolve) ?? box.borderRadius),
          ...spanStyle(autoFill ? "width" : block.box?.span, placement !== undefined && !placement.fixed, fullPage),
          ...(hasBackground(backdrop) ? { position: "relative", isolation: "isolate" } : {}),
        }}
      >
        {hasBackground(backdrop) && <BackgroundLayers bg={backdrop} />}
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
          <FoldedView
            fold={foldOf(block, device)}
            view={view}
            blockId={block.id}
            editing={editing}
            background={typeof background === "string" ? background : undefined}
            render={(shown, extra) => (
              <ComponentView def={shown} interaction={{ ...interaction, overlay: <>{menuLayer}{extra}</> }} />
            )}
          />
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
              mode={chipMode}
              onPick={(picked) =>
                dispatch(
                  pickAction(picked, {
                    pageId: page.id,
                    blockId: block.id,
                    device,
                    smart: smartStrategy(formatted ?? view, available),
                    seed: () => seedLayout(view),
                  }),
                )
              }
            >
              <AdaptOptions mode={chipMode} pageId={page.id} block={block} view={formatted ?? view} device={device} />
            </ResponsiveChip>
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

  const { device } = useViewport();
  const blocks = splitBlocks(page, components)[slot];
  if (blocks.length === 0) return null;
  const margin = sideMargin(device, page.sideMargin);

  return (
    <div
      className={`flex flex-col gap-6 ${slot === "top" ? "mb-6" : "mt-8"}`}
      style={{ gap: styles.page.gap }}
    >
      {blocks.map((block) => (
        <RepeatedBlock key={block.id} block={block} margin={margin}>
          {(copy) => <PageBlock key={copy} page={page} block={block} interactive={interactive && copy === 0} />}
        </RepeatedBlock>
      ))}
    </div>
  );
}
