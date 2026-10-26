import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { isBackdrop } from "../canvas-editing/backdrop";
import { EditingLayer } from "../canvas-editing/editing-layer";
import { ElementHandles } from "../canvas-editing/element-handles";
import type { Behavior } from "../behaviors/types";
import { BindingBadge } from "../data-sources/binding-badge";
import { boundBoxStyle } from "../data-sources/bound-fields";
import { useBoundElement } from "../data-sources/use-bound-element";
import { useDataDrop } from "../data-sources/use-data-drop";
import type { DataRef } from "../data-sources/types";
import { useBehaviors } from "../behaviors/use-behaviors";
import { LinkHandle } from "../navigation/link-handle";
import { elementLabel, isLinkable, linkLabel } from "../navigation/links";
import type { ElementRef, LinkTarget, NavMode, Point } from "../navigation/types";
import { IconGlyph } from "../icons/icon-glyph";
import { CodeButton } from "./code-button";
import { elementBaseCss } from "./element-style";
import { targetKey } from "./custom-code";
import { SECTION_KEY, type CanvasElement, type ComponentDef, type ElementKind, type Page } from "./types";
import type { BlockGestures } from "./use-block-gestures";
import type { HandleId } from "../canvas-editing/resize-handles";
import { LineShape, TriangleShape } from "./vector-shapes";
import { VideoContent } from "./video-content";
import { VisibilityEye } from "./visibility-eye";

/** El fondo de una tarjeta solo crece hacia la derecha y hacia abajo: su esquina de arriba es la de la tarjeta. */
const BACKDROP_HANDLES: HandleId[] = ["e", "s", "se"];

const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" } as const;

const decorationOf = (element: CanvasElement): string | undefined =>
  [element.underline && "underline", element.overline && "overline", element.strike && "line-through"]
    .filter(Boolean)
    .join(" ") || undefined;

/** El texto de un elemento: tal cual, o una línea por elemento de lista si es una lista. */
function ElementText({ element }: { element: CanvasElement }) {
  if (!element.list || element.list === "none") return <>{element.text}</>;

  const Tag = element.list === "ol" ? "ol" : "ul";
  return (
    <Tag className={`w-full pl-5 ${element.list === "ol" ? "list-decimal" : "list-disc"}`}>
      {element.text
        .split("\n")
        .filter(Boolean)
        .map((line, index) => (
          <li key={index}>{line}</li>
        ))}
    </Tag>
  );
}

/**
 * Con `inherit`, el contenido no pinta relleno, esquinas ni tipografía: los pone el contenedor del elemento
 * (ver `element-style.ts`), para que las clases y el CSS del usuario puedan cambiarlos.
 */
type Renderer = (element: CanvasElement, text: CSSProperties, inherit: boolean) => ReactNode;

/** Un rectángulo o una elipse: la forma con su texto centrado; solo cambia el radio de las esquinas. */
const shape =
  (corner: (element: CanvasElement) => number | string): Renderer =>
  function renderShape(element, text, inherit) {
    return (
      <div
        className="flex h-full w-full items-center overflow-hidden px-2"
        style={{
          ...text,
          ...(inherit ? { borderRadius: "inherit" } : { background: element.fill, borderRadius: corner(element) }),
          justifyContent: JUSTIFY[element.align],
        }}
      >
        <ElementText element={element} />
      </div>
    );
  };

/** Cómo se dibuja cada tipo de elemento. Un tipo nuevo es una entrada nueva. */
const RENDERERS: Record<ElementKind, Renderer> = {
  rect: shape((element) => element.radius),
  ellipse: shape(() => "50%"),
  triangle: (element, _text, inherit) => <TriangleShape element={element} inherit={inherit} />,
  line: (element, _text, inherit) => <LineShape element={element} inherit={inherit} />,

  text: (element, text, inherit) => (
    <div
      className="h-full w-full overflow-hidden leading-tight whitespace-pre-wrap"
      style={{
        ...text,
        textAlign: element.align,
        ...(inherit ? { borderRadius: "inherit" } : { background: element.fill, borderRadius: element.radius }),
      }}
    >
      <ElementText element={element} />
    </div>
  ),

  icon: (element, text) => (
    <div className="flex h-full w-full items-center justify-center" style={text}>
      <IconGlyph name={element.icon ?? "star"} size={element.fontSize} strokeWidth={element.strokeWidth} />
    </div>
  ),

  video: (element, _text, inherit) => <VideoContent element={element} radius={inherit ? "inherit" : element.radius} />,

  image: (element, _text, inherit) =>
    element.src ? (
      // <img> en lugar de next/image: las URLs vienen de dominios arbitrarios.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={element.src}
        alt={element.alt ?? ""}
        draggable={false}
        className="h-full w-full"
        style={{ borderRadius: inherit ? "inherit" : element.radius, objectFit: element.fit ?? "cover" }}
      />
    ) : (
      <div
        className="flex h-full w-full items-center justify-center border border-dashed border-slate-400 bg-slate-200 p-2 text-center text-xs text-slate-500"
        style={{ borderRadius: inherit ? "inherit" : element.radius }}
      >
        Haz clic o suelta una imagen
      </div>
    ),
};

/** Dibuja un elemento llenando el espacio de su contenedor (el contenedor lo posiciona). */
export function ElementContent({ element, inherit = false }: { element: CanvasElement; inherit?: boolean }) {
  const text: CSSProperties = inherit
    ? {}
    : {
        fontFamily: element.fontFamily || undefined,
        color: element.color,
        fontSize: element.fontSize,
        fontWeight: element.bold ? 700 : 400,
        fontStyle: element.italic ? "italic" : undefined,
        textDecoration: decorationOf(element),
      };

  return RENDERERS[element.kind](element, text, inherit);
}

/** Cómo se comportan los elementos con enlace según el modo de trabajo. */
export interface ElementInteraction {
  mode: NavMode;
  componentId: string;
  blockId: string;
  links: Record<string, LinkTarget>;
  pages: Page[];
  /** Interacciones de todo el bloque; cada elemento usa las suyas (`scope` = su id). */
  behaviors: Behavior[];
  /** Clases de Tailwind propias por elemento (y por la sección, con `SECTION_KEY`). */
  classes: Record<string, string>;
  /** Al editar: empieza a mover el bloque entero por la página (ver `placement/use-placement-drag`). */
  onMoveBlock?: (e: PointerEvent<HTMLElement>) => void;
  /** Al editar: mover, redimensionar y acoplar los elementos con el ratón. Sin él (sección en flujo), no se pueden. */
  gestures?: BlockGestures;
  /** La sección usa `display: flex` o `grid`: sus elementos se acomodan solos. */
  flow: boolean;
  selectedElementId: string | null;
  /** Elementos sumados a la selección con Ctrl/⌘-clic. */
  alsoSelectedIds?: string[];
  onFollow: (link: LinkTarget, elementId: string) => void;
  /** Al editar: ocultar o volver a mostrar un elemento. */
  onToggleHidden: (elementId: string, hidden: boolean) => void;
  /** Al editar: abrir el menú de formato de un elemento. */
  onContextMenu: (elementId: string, point: Point) => void;
  /** Al editar: seleccionar un elemento para personalizarlo. */
  onSelect: (elementId: string, add?: boolean) => void;
  /** Datos de una API por id de elemento, y la lista que repite la sección (si la repite). */
  bindings?: Record<string, DataRef>;
  repeat?: DataRef;
  /** Al editar: soltar el enlace de un elemento con una API. */
  onBind: (elementId: string, ref: DataRef | null) => void;
  /** Al editar: se soltó una clave de una API sobre un elemento (o sobre la sección, con `elementId` null). */
  onDropData: (ref: DataRef, elementId: string | null) => void;
  /** Al editar: abrir el código de un elemento en el editor. */
  onOpenCode: (elementId: string) => void;
  /** Algo que se dibuja encima de la sección (el botón de un menú, el título de un acordeón). */
  overlay?: ReactNode;
}

function PositionedElement({
  element,
  interaction,
}: {
  element: CanvasElement;
  interaction: ElementInteraction | undefined;
}) {
  const mine = (interaction?.behaviors ?? []).filter((b) => b.scope === element.id);
  const binding = interaction?.bindings?.[element.id];
  const shown = useBoundElement(element, binding, interaction?.repeat);
  const drop = useDataDrop((data) => interaction?.onDropData(data, element.id), interaction?.mode === "edit");
  const { ref, props: behaviorProps } = useBehaviors(interaction?.blockId ?? "", mine, interaction?.mode === "preview");

  const box: CSSProperties = { left: element.x, top: element.y, width: shown.width, height: shown.height };
  // Un dato que cambia el ancho, el alto o el color se pinta en el contenedor (ahí está el CSS base).
  const boundStyle = boundBoxStyle(element, shown);
  const link = interaction?.links[element.id];
  const custom = interaction?.classes[element.id] ?? "";
  const target = interaction ? targetKey(interaction.blockId, element.id) : undefined;

  // Oculto: no se ve. Al editar queda un ojo en su lugar para volver a mostrarlo.
  if (element.hidden) {
    if (interaction?.mode !== "edit") return null;
    return (
      <VisibilityEye
        hidden
        label={elementLabel(element)}
        onToggle={() => interaction.onToggleHidden(element.id, false)}
        className="absolute flex"
        style={{ left: element.x, top: element.y }}
      />
    );
  }

  // Probar: enlaces e interacciones (clic, cursor encima, al cargar…) como las vería un visitante.
  if (interaction?.mode === "preview") {
    const destination = link ? linkLabel(link, interaction.pages) : undefined;
    const follow = () => {
      if (link) interaction.onFollow(link, element.id);
      behaviorProps.onClick?.();
    };
    const interactive = link !== undefined || behaviorProps.onClick !== undefined;

    return (
      <div
        ref={ref}
        data-target={target}
        data-el={element.id}
        {...behaviorProps}
        {...(link
          ? {
              role: "link",
              tabIndex: 0,
              title: destination,
              "aria-label": `${elementLabel(element)}, ${destination}`,
              onKeyDown: (e: KeyboardEvent) => e.key === "Enter" && follow(),
            }
          : {})}
        onClick={interactive ? follow : undefined}
        style={boundStyle}
        className={`${interactive ? "cursor-pointer" : ""} ${
          link ? "transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-sky-500" : ""
        } ${custom}`}
      >
        <ElementContent element={shown} inherit={interaction !== undefined} />
      </div>
    );
  }

  // Editar: ojo, ícono de enlace, selección con clic y formato con clic derecho.
  if (interaction?.mode === "edit") {
    const ref: ElementRef = { componentId: interaction.componentId, elementId: element.id };
    const selected = interaction.selectedElementId === element.id;
    const alsoSelected = interaction.alsoSelectedIds?.includes(element.id);
    const { gestures } = interaction;

    return (
      <div
        data-target={target}
        data-el={element.id}
        {...drop.handlers}
        style={boundStyle}
        className={`group/element [&_iframe]:pointer-events-none [&_video]:pointer-events-none ${custom} ${gestures ? "cursor-move touch-none select-none" : ""}`}
        onPointerDown={(e) => {
          // Los botones del elemento (ojo, enlace, código) siguen siendo botones.
          if ((e.target as Element).closest("button")) return;
          // El fondo de una tarjeta (una pieza que ocupa toda la sección) o Mayús arrastran el bloque entero.
          if (e.shiftKey || (gestures && isBackdrop(element, gestures.size))) return interaction.onMoveBlock?.(e);
          gestures?.startDrag(e, element);
        }}
        onClick={(e) => {
          e.stopPropagation(); // el bloque no se vuelve a seleccionar encima del elemento
          interaction.onSelect(element.id, e.ctrlKey || e.metaKey);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation(); // el menú del bloque no se abre encima
          interaction.onContextMenu(element.id, { x: e.clientX, y: e.clientY });
        }}
      >
        <ElementContent element={shown} inherit={interaction !== undefined} />
        {/* La selección va en una capa aparte para no chocar con el contorno o la sombra que ponga el usuario. */}
        {selected && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded border-2 border-sky-500" />}
        {binding && (
          <BindingBadge
            label={elementLabel(element)}
            reference={binding}
            onClear={() => interaction.onBind(element.id, null)}
            className="absolute -top-2 left-1 z-10"
          />
        )}
        {drop.over && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded border-2 border-emerald-500 bg-emerald-500/10" />}
        {alsoSelected && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded border-2 border-dashed border-sky-500" />}
        <VisibilityEye
          hidden={false}
          label={elementLabel(element)}
          onToggle={() => interaction.onToggleHidden(element.id, true)}
          className="absolute top-1 left-1 hidden group-hover/element:flex focus:flex"
        />
        {isLinkable(element) && <LinkHandle element={ref} link={link} label={elementLabel(element)} />}
        {selected && gestures && (
          <ElementHandles
            onStart={(e, handle) => gestures.startDrag(e, element, handle)}
            only={gestures.backdropId === element.id ? BACKDROP_HANDLES : undefined}
          />
        )}
        {selected && (
          <CodeButton
            label="Abrir el código del elemento en el editor"
            onOpen={() => interaction.onOpenCode(element.id)}
            className="absolute -top-3 -right-3"
          />
        )}
      </div>
    );
  }

  return (
    <div className="absolute" style={box}>
      <ElementContent element={shown} inherit={interaction !== undefined} />
    </div>
  );
}

/** Un componente completo, a su tamaño natural. */
export function ComponentView({
  def,
  interaction,
}: {
  def: ComponentDef;
  interaction?: ElementInteraction;
}) {
  return (
    <div
      ref={interaction?.gestures?.canvasRef}
      onPointerMove={interaction?.gestures?.onPointerMove}
      onPointerUp={interaction?.gestures?.endDrag}
      onPointerCancel={interaction?.gestures?.endDrag}
      {...(interaction ? { "data-canvas": "", "data-target": targetKey(interaction.blockId, SECTION_KEY) } : {})}
      className={`${interaction ? "" : "relative shrink-0"} ${interaction?.classes[SECTION_KEY] ?? ""}`}
      style={interaction ? undefined : { width: def.width, height: def.height }}
    >
      {/* En la página, la posición, el tamaño y los estilos base van en CSS (capa de menor prioridad); en miniaturas, en línea. */}
      {interaction && <style>{elementBaseCss(interaction.blockId, def, interaction.flow)}</style>}
      {def.elements.map((element) => (
        <PositionedElement key={element.id} element={element} interaction={interaction} />
      ))}
      {interaction?.overlay}
      {interaction?.gestures && (
        <EditingLayer
          gestures={interaction.gestures}
          size={interaction.gestures.size}
          active={interaction.gestures.sectionActive}
          onResize={interaction.gestures.onResizeSection}
        />
      )}
    </div>
  );
}

/** Miniatura cuadrada de un componente, reducida para que quepa entera. */
export function ComponentThumb({ def, size = 44 }: { def: ComponentDef; size?: number }) {
  const scale = Math.min(1, size / Math.max(def.width, def.height, 1));

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white"
      style={{ width: size, height: size }}
    >
      <span className="block" style={{ zoom: scale }}>
        <ComponentView def={def} />
      </span>
    </span>
  );
}
