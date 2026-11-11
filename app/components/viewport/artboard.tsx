"use client";

import { PeerCursors } from "../realtime/peer-cursors";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
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
import { routeOf, splitBlocks } from "../site/rules";
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
import { useUnitNames } from "../units/use-unit-names";
import { useActiveUnit } from "../units/use-active-unit";
import { getUnitColor } from "../units/unit-colors";
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
  const { tool, zoom, setZoom } = useViewport();
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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const anchorRef = useRef<{
    pointerX: number;
    pointerY: number;
    contentX: number;
    contentY: number;
    oldZoom: number;
    newZoom: number;
  } | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const currentZoom = zoomRef.current;
        const normalizedDelta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
        const factor = Math.exp(-normalizedDelta * 0.002);
        let nextZoom = Math.round(currentZoom * factor);
        if (nextZoom === currentZoom) {
          nextZoom = currentZoom + (normalizedDelta < 0 ? 1 : -1);
        }
        nextZoom = Math.min(300, Math.max(10, nextZoom));

        if (nextZoom !== currentZoom) {
          const rect = surface.getBoundingClientRect();
          const pointerX = e.clientX - rect.left;
          const pointerY = e.clientY - rect.top;
          const contentX = pointerX + surface.scrollLeft;
          const contentY = pointerY + surface.scrollTop;

          anchorRef.current = {
            pointerX,
            pointerY,
            contentX,
            contentY,
            oldZoom: currentZoom,
            newZoom: nextZoom,
          };

          setZoom(nextZoom);
        }
      }
    };

    surface.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => surface.removeEventListener("wheel", onWheel, { capture: true });
  }, [setZoom]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const anchor = anchorRef.current;
    if (!surface || !anchor) return;

    const scaleRatio = anchor.newZoom / anchor.oldZoom;
    surface.scrollLeft = anchor.contentX * scaleRatio - anchor.pointerX;
    surface.scrollTop = anchor.contentY * scaleRatio - anchor.pointerY;
    anchorRef.current = null;
  }, [zoom]);

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
      ref={surfaceRef}
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
  const unitNames = useUnitNames();
  const unitName = page.unitId ? unitNames.find((u) => u.id === page.unitId)?.name : null;
  const unitColor = getUnitColor(page.unitId);
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

  const { pages, components } = useSite();
  const pageBlocksSlot = splitBlocks(page, components, pages);
  const hasTopHeader = !page.hideHeader && (shellPage ? true : pageBlocksSlot.top.length > 0);
  const hasBottomFooter = !page.hideFooter && pageBlocksSlot.bottom.length > 0;
  const pagePt = hasTopHeader ? "0rem" : "3rem";
  const pagePb = hasBottomFooter ? "0rem" : "3rem";

  const setHidden = (hidden: boolean) =>
    dispatch({ type: "hidden/set", target: { kind: "page", pageId: page.id }, hidden });

  // Oculta: el marco se reduce a una tarjeta con el ojo para volver a mostrarla. La página de inicio nunca se oculta.
  if (tiled && page.hidden && !page.isHome) {
    return (
      <section aria-label={`Página ${page.name} (oculta)`} data-page-id={page.id} className="w-44 shrink-0">
        <p className="mb-2 flex min-w-0 items-center gap-1.5 px-1 text-sm text-ink-dim">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: unitColor.border }}
          />
          <span className="min-w-0 truncate font-medium text-ink">{page.name} · {routeOf(page)}</span>
        </p>
        <div
          className="flex h-24 items-center justify-center gap-2 rounded-md border-2 border-dashed text-xs text-ink-dim transition-colors"
          style={{ borderColor: unitColor.borderLight, backgroundColor: unitColor.bg }}
        >
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
          : production
            ? `mx-auto w-full transition-[max-width] duration-200 min-h-full bg-white`
            : `shrink-0 mx-auto`
      }
      // En fila o enfoque, el marco ocupa su ancho ya escalado y la página interna se escala con zoom.
      // En producción, en tablet y móvil, la página tiene el ancho del dispositivo.
      style={production ? (fits ? undefined : { maxWidth: current.width }) : { width: current.width * scale }}
    >
      {!production && (
        <div className={`relative mb-2 ${tiled ? "group flex h-6 w-full items-center justify-between gap-1 text-xs" : "text-xs"}`}>
          {tiled ? (
            <>
              {/* Lado izquierdo: indicador de unidad y título de página */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: unitColor.border }}
                  title={unitName ? `Unidad: ${unitName}` : "Página Global"}
                />
                <button
                  type="button"
                  onClick={select}
                  onDoubleClick={() => {
                    select();
                    setFocusMode(true);
                  }}
                  title={`${page.name} (${routeOf(page)})${unitName ? ` · ${unitName}` : " · Global"} - Doble clic para enfocar`}
                  className={`min-w-0 truncate text-left text-xs font-semibold transition-colors cursor-pointer ${
                    active ? "text-accent font-bold" : "text-ink hover:text-accent"
                  }`}
                >
                  {page.name}
                  {scale >= 0.45 && (
                    <span className="ml-1 text-[11px] font-normal text-ink-dim">
                      · {routeOf(page)}
                    </span>
                  )}
                </button>
              </div>

              {/* Lado derecho: botón de visibilidad siempre visible y acciones */}
              <div className="flex shrink-0 items-center gap-1">
                {limited && hasMine && (
                  <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Puedes editar
                  </span>
                )}
                {limited && !hasMine && <span className="shrink-0 text-[10px] text-ink-dim">solo lectura</span>}

                {/* Botón de visibilidad / ocultar página (siempre visible con 1 clic) */}
                {!page.isHome ? (
                  <button
                    type="button"
                    aria-label={page.hidden ? `Mostrar ${page.name}` : `Ocultar ${page.name}`}
                    title={
                      page.hidden
                        ? "Mostrar página en el sitio y lienzo"
                        : "Ocultar página (útil para promociones temporales como Navidad)"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setHidden(!page.hidden);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors cursor-pointer ${
                      page.hidden
                        ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                        : "text-ink-dim hover:text-ink hover:bg-hover"
                    }`}
                  >
                    {page.hidden ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <span
                    title="La página de inicio no se puede ocultar (es la portada principal del sitio)"
                    className="flex h-6 w-6 items-center justify-center rounded text-ink-dim/30 cursor-not-allowed"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                )}

                {/* Acciones de página (inicio y eliminar con confirmación segura) */}
                <PageLabelActions page={page} />

                {/* Botón Enfocar */}
                <button
                  type="button"
                  title="Enfocar esta página para editar cómodamente"
                  onClick={() => {
                    select();
                    setFocusMode(true);
                  }}
                  className={`items-center gap-1 rounded bg-panel border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors cursor-pointer ${
                    scale < 0.22 ? "hidden group-hover:flex" : "flex"
                  }`}
                >
                  Enfocar
                </button>

                {scale >= 0.35 && (
                  <span title="Zoom de la vista: el tamaño real es 100 %" className="shrink-0 text-xs text-ink-dim tabular-nums">
                    {zoom}%
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: unitColor.border }}
                />
                <span className="font-semibold text-ink">
                  {page.name} · {routeOf(page)} · {current.label} · {current.width}px
                </span>
                <span
                  className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    borderColor: unitColor.borderLight,
                    backgroundColor: unitColor.bg,
                    color: unitColor.text,
                  }}
                >
                  {unitName ?? "Global"}
                </span>
              </span>
              {focusMode && (
                <button
                  type="button"
                  onClick={() => setFocusMode(false)}
                  className="flex items-center gap-1.5 rounded-md bg-panel border border-line px-2.5 py-1 text-xs font-medium text-ink-dim hover:text-ink hover:bg-hover transition-colors cursor-pointer"
                  title="Volver a la vista con todas las páginas en mosaico"
                >
                  Ver todas las páginas
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div
        ref={frame}
        className="relative"
        style={
          production
            ? fitScale > 1
              ? { width: current.width, zoom: fitScale }
              : undefined
            : { width: current.width, zoom: scale }
        }
      >
        <div
          ref={pageRef}
          data-site-page
          className={`relative isolate flex flex-col bg-white text-neutral-900 ${mode === "edit" ? "" : "overflow-x-clip"} ${
            production ? "px-10" : "px-10 shadow-2xl"
          } ${hasTopHeader ? "pt-0" : "pt-12"} ${hasBottomFooter ? "pb-0" : "pb-12"} ${isHot ? "ring-4 ring-green-400" : ""}`}
          style={{
            ...boxStyle(styles.page),
            ...(page.color ? { background: page.color } : {}),
            ...sideStyle,
            border: !production ? `${Math.max(2, Math.round(2.5 / scale))}px solid ${unitColor.border}` : undefined,
            borderRadius: !production ? `${Math.max(4, Math.round(8 / scale))}px` : undefined,
            boxShadow: !production
              ? tiled && active
                ? `0 0 0 ${Math.max(2, Math.round(2 / scale))}px var(--color-accent), 0 0 24px ${unitColor.border}50, 0 10px 25px -5px rgba(0,0,0,0.25)`
                : `0 0 0 1px ${unitColor.borderLight}, 0 6px 18px -3px rgba(0,0,0,0.12)`
              : undefined,
            paddingTop: hasTopHeader ? 0 : undefined,
            paddingBottom: hasBottomFooter ? 0 : undefined,
            ...({
              "--page-px": pagePx,
              "--page-pt": pagePt,
              "--page-pb": pagePb,
              "--page-py": pagePt,
              "--cms-w": `${layoutWidth}px`,
            } as CSSProperties),
            ...(fullWidth ? ({ "--cms-side": centered, "--cms-offset": `${centeredOnly}px` } as CSSProperties) : {}),
            minHeight: `max(${baseHeight}, ${placedExtent}px)`,
          }}
        >
          {hasBackground(page.backdrop) && <BackgroundLayers bg={page.backdrop} />}
          {mode === "edit" && !production && <CommentLayer page={page} />}
          {mode === "edit" && !production && <PeerCursors pageId={page.id} />}
          {fullWidth && <style>{"[data-site-page] [data-placed]:not([data-bleed]){margin-left:var(--cms-offset)!important}"}</style>}
          <FullBleedContext value={fullWidth}>
          <PageGuidesProvider>
          {/* La cabecera del sitio no lleva `key`: al navegar sigue siendo el mismo elemento del DOM. */}
          {shellPage && !page.hideHeader && <PageBlocks page={shellPage} slot="top" interactive={false} />}

          {/* Lo que cambia de una página a otra: la clave lo vuelve a montar y reproduce la transición. */}
          <div
            key={`${page.id}:${transitionKey}`}
            className={`flex flex-col flex-1 w-full ${animation ? `nav-anim-${animation.kind}` : ""}`}
            style={{
              minHeight: "inherit",
              ...(animation ? { animationDuration: `${animation.seconds}s` } : {}),
            }}
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
  const { focusMode, unitFilter, setUnitFilter } = useViewport();
  const { scoped, unitId } = useActiveUnit();

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
  const accessible = mine.length > 0 ? mine : pages;
  // Quien está sujeto a unidades solo dibuja las páginas de su unidad activa (lo global y lo ajeno, no: no tiene nada que editar ahí).
  // El resto filtra con el desplegable de la barra; si deja el lienzo vacío, se ofrece volver a «Todas las unidades».
  const shown = scoped
    ? accessible.filter((page) => page.unitId === unitId)
    : unitFilter === ""
      ? accessible
      : accessible.filter((page) => (unitFilter === "global" ? !page.unitId : page.unitId === unitFilter));

  return (
    <>
      {shown.length === 0 ? (
        <p role="status" className="flex flex-col items-center gap-2 px-8 py-16 text-center text-sm text-ink-dim">
          {scoped ? "Tu unidad todavía no tiene páginas: créalas en el panel «Páginas»." : `No hay páginas en ${unitFilter === "global" ? "Global" : "esta unidad"}.`}
          {!scoped && (
            <button
              type="button"
              onClick={() => setUnitFilter("")}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-hover cursor-pointer"
            >
              Ver todas las unidades
            </button>
          )}
        </p>
      ) : (
        <div className="flex w-max items-start gap-8">
          {shown.map((page) => (
            <PageArtboard key={page.id} page={page} active={page.id === currentPageId} tiled />
          ))}
        </div>
      )}
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
