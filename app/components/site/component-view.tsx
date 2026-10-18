import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import type { Behavior } from "../behaviors/types";
import { useBehaviors } from "../behaviors/use-behaviors";
import { LinkHandle } from "../navigation/link-handle";
import { elementLabel, isLinkable, linkLabel } from "../navigation/links";
import type { ElementRef, LinkTarget, NavMode, Point } from "../navigation/types";
import { CodeButton } from "./code-button";
import { elementBaseCss } from "./element-style";
import { targetKey } from "./custom-code";
import { SECTION_KEY, type CanvasElement, type ComponentDef, type ElementKind, type Page } from "./types";
import { VisibilityEye } from "./visibility-eye";

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

  image: (element, _text, inherit) =>
    element.src ? (
      // <img> en lugar de next/image: las URLs vienen de dominios arbitrarios.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={element.src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
        style={{ borderRadius: inherit ? "inherit" : element.radius }}
      />
    ) : (
      <div
        className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500"
        style={{ borderRadius: inherit ? "inherit" : element.radius }}
      >
        Imagen
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
  /** La sección usa `display: flex` o `grid`: sus elementos se acomodan solos. */
  flow: boolean;
  selectedElementId: string | null;
  onFollow: (link: LinkTarget) => void;
  /** Al editar: ocultar o volver a mostrar un elemento. */
  onToggleHidden: (elementId: string, hidden: boolean) => void;
  /** Al editar: abrir el menú de formato de un elemento. */
  onContextMenu: (elementId: string, point: Point) => void;
  /** Al editar: seleccionar un elemento para personalizarlo. */
  onSelect: (elementId: string) => void;
  /** Al editar: abrir el código de un elemento en el editor. */
  onOpenCode: (elementId: string) => void;
}

function PositionedElement({
  element,
  interaction,
}: {
  element: CanvasElement;
  interaction: ElementInteraction | undefined;
}) {
  const mine = (interaction?.behaviors ?? []).filter((b) => b.scope === element.id);
  const { ref, props: behaviorProps } = useBehaviors(interaction?.blockId ?? "", mine, interaction?.mode === "preview");

  const box: CSSProperties = { left: element.x, top: element.y, width: element.width, height: element.height };
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
      if (link) interaction.onFollow(link);
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
        className={`${interactive ? "cursor-pointer" : ""} ${
          link ? "transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-sky-500" : ""
        } ${custom}`}
      >
        <ElementContent element={element} inherit={interaction !== undefined} />
      </div>
    );
  }

  // Editar: ojo, ícono de enlace, selección con clic y formato con clic derecho.
  if (interaction?.mode === "edit") {
    const ref: ElementRef = { componentId: interaction.componentId, elementId: element.id };
    const selected = interaction.selectedElementId === element.id;

    return (
      <div
        data-target={target}
        data-el={element.id}
        className={`group/element ${custom}`}
        onClick={(e) => {
          e.stopPropagation(); // el bloque no se vuelve a seleccionar encima del elemento
          interaction.onSelect(element.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation(); // el menú del bloque no se abre encima
          interaction.onContextMenu(element.id, { x: e.clientX, y: e.clientY });
        }}
      >
        <ElementContent element={element} inherit={interaction !== undefined} />
        {/* La selección va en una capa aparte para no chocar con el contorno o la sombra que ponga el usuario. */}
        {selected && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded border-2 border-sky-500" />}
        <VisibilityEye
          hidden={false}
          label={elementLabel(element)}
          onToggle={() => interaction.onToggleHidden(element.id, true)}
          className="absolute top-1 left-1 hidden group-hover/element:flex focus:flex"
        />
        {isLinkable(element) && <LinkHandle element={ref} link={link} label={elementLabel(element)} />}
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
      <ElementContent element={element} inherit={interaction !== undefined} />
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
      {...(interaction ? { "data-canvas": "", "data-target": targetKey(interaction.blockId, SECTION_KEY) } : {})}
      className={`${interaction ? "" : "relative shrink-0"} ${interaction?.classes[SECTION_KEY] ?? ""}`}
      style={interaction ? undefined : { width: def.width, height: def.height }}
    >
      {/* En la página, la posición, el tamaño y los estilos base van en CSS (capa de menor prioridad); en miniaturas, en línea. */}
      {interaction && <style>{elementBaseCss(interaction.blockId, def, interaction.flow)}</style>}
      {def.elements.map((element) => (
        <PositionedElement key={element.id} element={element} interaction={interaction} />
      ))}
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
