import type { CSSProperties } from "react";
import { elementLabel, isLinkable, linkLabel } from "../navigation/links";
import type { LinkTarget, NavMode, Point } from "../navigation/types";
import type { CanvasElement, ComponentDef, Page } from "./types";

const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" } as const;

/** Dibuja un elemento llenando el espacio de su contenedor (el contenedor lo posiciona). */
export function ElementContent({ element }: { element: CanvasElement }) {
  const text: CSSProperties = {
    fontFamily: element.fontFamily || undefined,
    color: element.color,
    fontSize: element.fontSize,
    fontWeight: element.bold ? 700 : 400,
  };

  switch (element.kind) {
    case "rect":
    case "ellipse":
      return (
        <div
          className="flex h-full w-full items-center overflow-hidden px-2"
          style={{
            ...text,
            background: element.fill,
            borderRadius: element.kind === "ellipse" ? "50%" : element.radius,
            justifyContent: JUSTIFY[element.align],
          }}
        >
          {element.text}
        </div>
      );

    case "text":
      return (
        <div
          className="h-full w-full overflow-hidden leading-tight whitespace-pre-wrap"
          style={{ ...text, textAlign: element.align }}
        >
          {element.text}
        </div>
      );

    case "image":
      return element.src ? (
        // <img> en lugar de next/image: las URLs vienen de dominios arbitrarios.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ borderRadius: element.radius }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500"
          style={{ borderRadius: element.radius }}
        >
          Imagen
        </div>
      );
  }
}

/** Cómo se comportan los elementos con enlace según el modo de trabajo. */
export interface ElementInteraction {
  mode: NavMode;
  links: Record<string, LinkTarget>;
  pages: Page[];
  onFollow: (link: LinkTarget) => void;
  onConnect: (elementId: string, origin: Point) => void;
}

function LinkBadge({ link }: { link: LinkTarget }) {
  return (
    <span
      aria-hidden
      className="absolute -top-2 -right-2 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] leading-none font-bold text-white"
    >
      {link.kind === "external" ? "↗" : "→"}
    </span>
  );
}

function PositionedElement({
  element,
  interaction,
}: {
  element: CanvasElement;
  interaction: ElementInteraction | undefined;
}) {
  const box: CSSProperties = { left: element.x, top: element.y, width: element.width, height: element.height };
  const link = interaction?.links[element.id];

  // Probar: los elementos con enlace se pueden seguir, con ratón o teclado.
  if (interaction?.mode === "preview" && link) {
    const destination = linkLabel(link, interaction.pages);
    return (
      <div
        role="link"
        tabIndex={0}
        title={destination}
        aria-label={`${elementLabel(element)}, ${destination}`}
        onClick={() => interaction.onFollow(link)}
        onKeyDown={(e) => e.key === "Enter" && interaction.onFollow(link)}
        className="absolute cursor-pointer transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-sky-500"
        style={box}
      >
        <ElementContent element={element} />
      </div>
    );
  }

  // Conectar: mantener pulsado un elemento empieza una flecha desde él.
  if (interaction?.mode === "connect" && isLinkable(element)) {
    return (
      <div
        title={link ? `${elementLabel(element)} · ${linkLabel(link, interaction.pages)}` : elementLabel(element)}
        onPointerDown={(e) => {
          e.preventDefault(); // evita seleccionar texto mientras se arrastra
          const rect = e.currentTarget.getBoundingClientRect();
          interaction.onConnect(element.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }}
        className="absolute cursor-crosshair touch-none select-none hover:outline-2 hover:outline-sky-500"
        style={box}
      >
        <ElementContent element={element} />
        {link && <LinkBadge link={link} />}
      </div>
    );
  }

  return (
    <div className="absolute" style={box}>
      <ElementContent element={element} />
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
    <div className="relative shrink-0" style={{ width: def.width, height: def.height }}>
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
