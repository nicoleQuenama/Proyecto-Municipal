"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { BackgroundLayers } from "../background/background-layers";
import { hasBackground } from "../background/background-css";
import { useShapeDrawing } from "../drawing/use-shape-drawing";
import { ModalLayer } from "../modal/modal-layer";
import { PageGuidesProvider } from "../placement/page-guides";
import { usePlacedExtent } from "../placement/use-placed-extent";
import { DROP_ATTRIBUTE, pageDrop, useNavigation } from "../navigation/navigation-context";
import { usePageCode } from "../behaviors/use-page-code";
import { MediaList } from "../media/media-list";
import { VisibilityEye } from "../site/visibility-eye";
import { PageBlocks } from "../site/page-blocks";
import { routeOf } from "../site/rules";
import { useSite, useSiteDispatch } from "../site/site-context";
import { useClipboardKeys } from "../site/use-clipboard-keys";
import { useHistoryKeys } from "../site/use-history-keys";
import { useGroupKeys } from "../site/use-group-keys";
import { useOrderKeys } from "../site/use-order-keys";
import { useMarquee } from "../site/use-marquee";
import { useGradientTool } from "../gradient/use-gradient-tool";
import { useDeleteKey } from "../site/use-delete-key";
import { useDeselect } from "../site/use-deselect";
import type { Page } from "../site/types";
import { boxStyle } from "../styles/apply";
import { useStyles } from "../styles/use-styles";
import { TitleCanvas } from "../title-editor/title-editor";
import { CANVAS_SURFACE_ID } from "./fit-zoom";
import { LoadingLayer } from "./loading-layer";
import { PageLabelActions } from "./page-label-actions";
import { clickThrough } from "./click-through";
import { SITE_VIEW_ATTRIBUTE } from "./page-readiness";
import { SkeletonLayer } from "./skeleton-layer";
import { CommentLayer } from "../comments/comment-layer";
import { FullBleedContext, useWidth } from "./page-width";
import { useAuth } from "../auth/auth-context";
import { canEditBlock } from "../auth/access";
import { useAutoFit } from "./use-auto-fit";
import { isAdaptive } from "../responsive/devices";
import { sideMargin } from "../responsive/page-margin";
import { DEVICES, useViewport, type Tool } from "./viewport-context";

const CURSORS: Partial<Record<Tool, string>> = {
  hand: "cursor-grab active:cursor-grabbing select-none [&>*]:pointer-events-none",
  text: "cursor-text",
  select: "",
};

export function CanvasSurface({ children }: { children: ReactNode }) {
  const { tool } = useViewport();
  useAutoFit();
  const deselect = useDeselect();
  const drawing = useShapeDrawing();
  useDeleteKey();
  useClipboardKeys();
  useHistoryKeys();
  useOrderKeys();
  useGroupKeys();
  const marquee = useMarquee();
  const gradient = useGradientTool();
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (tool !== "hand") {
      marquee.onPointerDown(e);
      return deselect.onPointerDown(e);
    }
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
      onPointerDownCapture={(e) => {
        drawing.onPointerDownCapture(e);
        gradient.onPointerDownCapture(e);
        marquee.onPointerDownCapture(e);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopPan}
      onPointerCancel={stopPan}
      className={`min-w-0 flex-1 overflow-auto p-8 pb-24 ${CURSORS[tool] ?? "cursor-crosshair"}`}
    >
      {children}
      {drawing.preview}
      {gradient.layer}
      {marquee.box && <div aria-hidden className="pointer-events-none fixed z-30 border border-accent bg-accent/15" style={marquee.box} />}
    </div>
  );
}

interface PageArtboardProps {
  page: Page;
  /** Es la página que se está editando. */
  active: boolean;
  /** Se ve junto a otras páginas, a un ancho fijo. */
  tiled: boolean;
  /** Se ve como en producción: sin marco ni etiqueta, a todo el ancho (o al del dispositivo elegido). */
  production?: boolean;
  /**
   * Con `production`: la página cuyas barras de navegación forman la cabecera fija del sitio. Esa cabecera se
   * dibuja una sola vez y no se vuelve a crear al navegar: conserva su estado, sus estilos y su código.
   */
  shellPage?: Page;
}

/** Un marco de página: su etiqueta y la página con su titular, bloques y medios. */
export function PageArtboard({ page, active, tiled, production = false, shellPage }: PageArtboardProps) {
  const { device, zoom, focusMode, setFocusMode } = useViewport();
  const styles = useStyles(page.id);
  const dispatch = useSiteDispatch();
  const { mode, hotDrop, transition, transitionKey } = useNavigation();
  const { currentUser } = useAuth();
  // Con acceso limitado: ¿hay algo en esta página que le toque? Si no, el marco se atenúa.
  const limited = !!currentUser?.access?.scope && mode === "edit";
  const hasMine = page.blocks.some((block) => canEditBlock(currentUser, page.id, block.id));
  const current = DEVICES.find((d) => d.value === device)!;
  const select = () => dispatch({ type: "page/select", id: page.id });
  const scale = zoom / 100;
  const pageRef = usePageCode(page, mode === "preview" && active);
  // La página es al menos tan alta como lo más bajo que se colocó libremente en ella.
  const placedExtent = usePlacedExtent(pageRef);
  const margin = sideMargin(device, page.sideMargin);
  // Fuera del escritorio el margen lateral se ajusta al dispositivo (el del escritorio lo fijan las reglas de la página).
  // La vista previa de escritorio escala el diseño al ancho de la ventana: lo diseñado se ve con las mismas proporciones.
  const section = useRef<HTMLElement>(null);
  const available = useWidth(section);
  const fits = production && !isAdaptive(device);
  const fitScale = fits ? Math.max(1, available / current.width) : 1;
  const fullWidth = fits && fitScale === 1;
  // Con la página a todo el ancho, el contenido (diseñado a 1024 px) queda centrado y el fondo llega a los bordes.
  // El relleno lateral propio de la página (o el de por defecto) se suma al centrado.
  const sides = styles.page.padding?.split(/\s+/);
  const ownSide = sides ? (sides[3] ?? sides[1] ?? sides[0]) : "2.5rem";
  const frame = useRef<HTMLDivElement>(null);
  const frameWidth = useWidth(frame);
  const centeredOnly = Math.max(0, (frameWidth - current.width) / 2);
  const centered = `calc(${centeredOnly}px + ${ownSide})`;
  const sideStyle = isAdaptive(device)
    ? { paddingLeft: margin, paddingRight: margin }
    : fullWidth
      ? { paddingLeft: centered, paddingRight: centered }
      : undefined;
  const pagePx = isAdaptive(device) ? `${margin}px` : fullWidth ? centered : ownSide;
  // El ancho (sin zoom) en que se maqueta la página: de él depende el tamaño de los textos adaptables.
  const layoutWidth = production && fitScale === 1 ? frameWidth || current.width : current.width;
  const baseHeight = production ? `${100 / fitScale}vh` : "600px";
  // En escritorio la vista previa ocupa todo el ancho de la ventana, como lo vería un visitante; tablet y móvil conservan su ancho.

  // Solo se anima al navegar en la vista previa; la clave vuelve a montar la página para reproducirla.
  const animation =
    active && mode === "preview" && transition && transition.kind !== "none" ? transition : null;

  // Cada marco es un destino donde soltar la flecha de un enlace.
  const dropProps = tiled ? { [DROP_ATTRIBUTE]: pageDrop(page.id) } : {};
  const isHot = hotDrop === pageDrop(page.id);

  const setHidden = (hidden: boolean) =>
    dispatch({ type: "hidden/set", target: { kind: "page", pageId: page.id }, hidden });

  // Oculta: el marco se reduce a una tarjeta con el ojo para volver a mostrarla.
  if (tiled && page.hidden) {
    return (
      <section aria-label={`Página ${page.name} (oculta)`} data-page-id={page.id} className="w-44 shrink-0">
        <p className="mb-2 px-1 text-sm text-ink-dim">{page.name} · {routeOf(page)}</p>
        <div className="flex h-24 items-center justify-center gap-2 rounded-md border border-dashed border-ink-dim text-xs text-ink-dim">
          <VisibilityEye hidden zoomed={false} label={page.name} onToggle={() => setHidden(false)} className="flex" />
          Página oculta
        </div>
      </section>
    );
  }

  return (
    <section
      ref={section}
      aria-label={`Página ${page.name}`}
      data-page-id={page.id}
      {...dropProps}
      className={
        tiled
          ? `shrink-0 ${limited && !hasMine ? "opacity-35 saturate-50" : ""}`
          : `mx-auto w-full transition-[max-width] duration-200 ${production ? "min-h-full bg-white" : ""}`
      }
      // En fila, el marco ocupa su ancho ya escalado y solo la página se escala; a solas, todo junto.
      // En producción, en tablet y móvil, la página tiene el ancho del dispositivo.
      style={tiled ? { width: current.width * scale } : fits ? undefined : { maxWidth: current.width }}
    >
      {!production && (
        <div className={`mb-2 text-ink-dim ${tiled ? "flex items-center gap-1.5 text-sm" : "text-xs"}`}>
          {tiled ? (
            <>
              <button
                type="button"
                onClick={select}
                className={`min-w-0 truncate rounded px-1 hover:text-ink ${active ? "font-semibold text-accent" : ""}`}
              >
                {page.name} · {routeOf(page)}
              </button>
              {limited && hasMine && <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">Puedes editar</span>}
              {limited && !hasMine && <span className="shrink-0 text-[10px]">sin cambios para ti</span>}
              <span title="Zoom de la vista: el tamaño real es 100 %" className="shrink-0 text-xs tabular-nums">
                {zoom}%
              </span>
              <button
                type="button"
                title="Enfocar esta página para editar cómodamente"
                onClick={() => {
                  select();
                  setFocusMode(true);
                }}
                className="flex shrink-0 items-center gap-1 rounded bg-panel border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors"
              >
                Enfocar
              </button>
              <VisibilityEye hidden={false} zoomed={false} label={page.name} onToggle={() => setHidden(true)} className="flex shrink-0" />
              <PageLabelActions page={page} />
            </>
          ) : (
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-semibold text-ink">{page.name} · {routeOf(page)} · {current.label} · {current.width}px</span>
              {focusMode && (
                <button
                  type="button"
                  onClick={() => setFocusMode(false)}
                  className="flex items-center gap-1.5 rounded-md bg-panel border border-line px-2.5 py-1 text-xs font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors"
                  title="Volver a la vista con todas las páginas en mosaico"
                >
                  Ver todas las páginas
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div ref={frame} className="relative" style={tiled ? { width: current.width, zoom: scale } : fitScale > 1 ? { width: current.width, zoom: fitScale } : undefined}>
        <div
          ref={pageRef}
          data-site-page
          className={`relative isolate flex flex-col bg-white text-neutral-900 ${mode === "edit" ? "" : "overflow-x-clip"} ${
            production ? "px-10 py-12" : "rounded-sm px-10 py-12 shadow-2xl"
          } ${isHot ? "ring-4 ring-green-400" : tiled && active ? "ring-2 ring-accent" : ""}`}
          style={{ ...boxStyle(styles.page), ...(page.color ? { background: page.color } : {}), ...sideStyle, ...({ "--page-px": pagePx, "--page-py": "3rem", "--cms-w": `${layoutWidth}px` } as CSSProperties), ...(fullWidth ? ({ "--cms-side": centered, "--cms-offset": `${centeredOnly}px` } as CSSProperties) : {}), minHeight: `max(${baseHeight}, ${placedExtent}px)` }}
        >
          {hasBackground(page.backdrop) && <BackgroundLayers bg={page.backdrop} />}
          {mode === "edit" && !production && <CommentLayer page={page} />}
          {fullWidth && <style>{"[data-site-page] [data-placed]:not([data-bleed]){margin-left:var(--cms-offset)!important}"}</style>}
          <FullBleedContext value={fullWidth}>
          <PageGuidesProvider>
          {/* La cabecera del sitio no lleva `key`: al navegar sigue siendo el mismo elemento del DOM. */}
          {shellPage && !page.hideHeader && <PageBlocks page={shellPage} slot="top" interactive={false} />}

          {/* Lo que cambia de una página a otra: la clave lo vuelve a montar y reproduce la transición. */}
          <div
            key={`${page.id}:${transitionKey}`}
            className={`flex flex-col flex-1 min-h-full ${animation ? `nav-anim-${animation.kind}` : ""}`}
            style={animation ? { animationDuration: `${animation.seconds}s` } : undefined}
          >
            {!shellPage && <PageBlocks page={page} slot="top" interactive={active} />}
            <TitleCanvas page={page} interactive={active} />
            <div className="flex-1 flex flex-col relative" style={placedExtent > 0 ? { minHeight: `${placedExtent}px` } : undefined}>
              <PageBlocks page={page} slot="body" interactive={active} />
              <MediaList page={page} interactive={active} />
            </div>
            <PageBlocks page={page} slot="bottom" interactive={active} />
          </div>
          </PageGuidesProvider>
          </FullBleedContext>
        </div>

        {tiled && !active && mode === "edit" && (
          <button
            type="button"
            aria-label={`Editar la página ${page.name}`}
            onClick={select}
            onContextMenu={(e) => {
              e.preventDefault(); // el clic derecho también activa la página; el formato se abre en la siguiente
              select();
            }}
            className="absolute inset-0 z-10 cursor-pointer rounded-sm hover:ring-2 hover:ring-accent/60"
          />
        )}
      </div>
    </section>
  );
}

/** El lienzo: todas las páginas en fila para compararlas y enlazarlas; en la vista previa, solo la visitada. */
export function CanvasPages() {
  const { mode } = useNavigation();
  const { pages, currentPageId } = useSite();
  const { currentUser } = useAuth();
  const { focusMode } = useViewport();

  if (mode === "preview") return <><ProductionView /><ModalLayer /></>;

  if (focusMode) {
    const activePage = pages.find((p) => p.id === currentPageId) ?? pages[0];
    if (activePage) {
      return (
        <>
          <div className="flex w-full min-w-full justify-center items-start py-4">
            <PageArtboard key={activePage.id} page={activePage} active={true} tiled={false} />
          </div>
          <ModalLayer />
        </>
      );
    }
  }

  // Con acceso limitado solo se muestran las páginas donde hay algo que cambiar: lo demás sería ruido.
  const mine = currentUser?.access?.scope
    ? pages.filter((page) => page.blocks.some((block) => canEditBlock(currentUser, page.id, block.id)))
    : pages;
  const shown = mine.length > 0 ? mine : pages;

  return (
    <>
      <div className="flex w-max items-start gap-8">
        {shown.map((page) => (
          <PageArtboard key={page.id} page={page} active={page.id === currentPageId} tiled />
        ))}
      </div>
      <ModalLayer />
    </>
  );
}

/** Como en producción: una capa a pantalla completa sobre el editor (la barra flotante de ModeBar queda encima). */
function ProductionView() {
  const { pages, currentPageId } = useSite();
  const page = pages.find((p) => p.id === currentPageId) ?? pages[0];
  // La cabecera es la de la página donde se empezó a probar y no cambia mientras dure la prueba.
  const [shellPage] = useState(page);

  return (
    // Las páginas con función (carga, 404) son pantallas completas: lo que sobra de su diseño se recorta, no se desplaza.
    <div {...{ [SITE_VIEW_ATTRIBUTE]: "" }} onClickCapture={clickThrough} className={`fixed inset-0 z-40 bg-neutral-300 ${page.role ? "overflow-hidden" : "overflow-auto"}`}>
      <PageArtboard page={page} active tiled={false} production shellPage={shellPage} />
      <SkeletonLayer />
      <LoadingLayer />
    </div>
  );
}
