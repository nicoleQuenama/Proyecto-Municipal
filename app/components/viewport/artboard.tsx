"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { DROP_ATTRIBUTE, pageDrop, useNavigation } from "../navigation/navigation-context";
import { MediaList } from "../media/media-list";
import { PageBlocks } from "../site/page-blocks";
import { routeOf } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { TitleCanvas } from "../title-editor/title-editor";
import { CANVAS_SURFACE_ID } from "./fit-zoom";
import { DEVICES, useViewport, type Tool } from "./viewport-context";

const CURSORS: Partial<Record<Tool, string>> = {
  hand: "cursor-grab active:cursor-grabbing select-none [&>*]:pointer-events-none",
  text: "cursor-text",
  select: "",
};

export function CanvasSurface({ children }: { children: ReactNode }) {
  const { tool } = useViewport();
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (tool !== "hand") return;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const last = lastPoint.current;
    if (!last) return;
    e.currentTarget.scrollBy(last.x - e.clientX, last.y - e.clientY);
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const stopPan = () => {
    lastPoint.current = null;
  };

  return (
    <div
      id={CANVAS_SURFACE_ID}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopPan}
      onPointerCancel={stopPan}
      className={`min-w-0 flex-1 overflow-auto p-8 pb-24 ${CURSORS[tool] ?? "cursor-crosshair"}`}
    >
      {children}
    </div>
  );
}

interface PageArtboardProps {
  page: Page;
  /** Es la página que se está editando. */
  active: boolean;
  /** Se ve junto a otras páginas, a un ancho fijo. */
  tiled: boolean;
}

/** Un marco de página: su etiqueta y la página con su titular, bloques y medios. */
function PageArtboard({ page, active, tiled }: PageArtboardProps) {
  const { device, zoom } = useViewport();
  const styles = useStyles(page.id);
  const dispatch = useSiteDispatch();
  const { mode, hotDrop, transition, transitionKey } = useNavigation();
  const current = DEVICES.find((d) => d.value === device)!;
  const select = () => dispatch({ type: "page/select", id: page.id });
  const scale = zoom / 100;

  // Solo se anima al navegar en la vista previa; la clave vuelve a montar la página para reproducirla.
  const animation =
    active && mode === "preview" && transition && transition.kind !== "none" ? transition : null;

  // Al conectar con flechas, cada marco es un destino donde soltarlas.
  const dropProps = tiled && mode === "connect" ? { [DROP_ATTRIBUTE]: pageDrop(page.id) } : {};
  const isHot = hotDrop === pageDrop(page.id);

  return (
    <section
      aria-label={`Página ${page.name}`}
      {...dropProps}
      className={tiled ? "shrink-0" : "mx-auto w-full transition-[max-width] duration-200"}
      // En fila, el marco ocupa su ancho ya escalado y solo la página se escala; a solas, todo junto.
      style={tiled ? { width: current.width * scale } : { maxWidth: current.width, zoom: scale }}
    >
      <p className={`mb-2 text-ink-dim ${tiled ? "text-sm" : "text-xs"}`}>
        {tiled ? (
          <button
            type="button"
            onClick={select}
            className={`rounded px-1 hover:text-ink ${active ? "font-semibold text-accent" : ""}`}
          >
            {page.name} · {routeOf(page)}
          </button>
        ) : (
          <>
            {page.name} · {current.label} · {current.width}px
          </>
        )}
      </p>

      <div className="relative" style={tiled ? { width: current.width, zoom: scale } : undefined}>
        <div
          key={`${page.id}:${transitionKey}`}
          className={`min-h-[600px] rounded-sm bg-white px-10 py-12 text-neutral-900 shadow-2xl ${
            animation ? `nav-anim-${animation.kind}` : ""
          } ${isHot ? "ring-4 ring-green-400" : tiled && active ? "ring-2 ring-accent" : ""}`}
          style={{
            ...boxStyle(styles.page),
            ...(animation ? { animationDuration: `${animation.seconds}s` } : {}),
          }}
        >
          <PageBlocks page={page} slot="top" interactive={active} />
          <TitleCanvas page={page} interactive={active} />
          <PageBlocks page={page} slot="body" interactive={active} />
          <MediaList page={page} interactive={active} />
        </div>

        {tiled && !active && mode === "edit" && (
          <button
            type="button"
            aria-label={`Editar la página ${page.name}`}
            onClick={select}
            className="absolute inset-0 z-10 cursor-pointer rounded-sm hover:ring-2 hover:ring-accent/60"
          />
        )}
      </div>
    </section>
  );
}

/** El lienzo: la página actual, o todas en fila para compararlas y conectarlas. */
export function CanvasPages() {
  const { layout } = useViewport();
  const { mode } = useNavigation();
  const { pages, currentPageId } = useSite();

  // En la vista previa solo se ve la página que se visita.
  const tiled = layout === "all" && mode !== "preview";
  if (!tiled) {
    const page = pages.find((p) => p.id === currentPageId) ?? pages[0];
    return <PageArtboard page={page} active tiled={false} />;
  }

  return (
    <div className="flex w-max items-start gap-8">
      {pages.map((page) => (
        <PageArtboard key={page.id} page={page} active={page.id === currentPageId} tiled />
      ))}
    </div>
  );
}
