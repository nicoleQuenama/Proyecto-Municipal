"use client";

import {
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  DOCKED_RAIL_WIDTH,
  MAX_INSPECTOR_WIDTH,
  MIN_INSPECTOR_HEIGHT,
  MIN_INSPECTOR_WIDTH,
  useInspectorDock,
} from "./dockable-inspector-context";
import { CodeIcon, SlidersIcon } from "../viewport/icons";

interface DockablePanelProps {
  title: string;
  categoryLabel: string;
  onSelectSection?: () => void;
  headerActions?: ReactNode;
  onOpenCode?: () => void;
  canEditCode?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function DockablePanel({
  title,
  categoryLabel,
  onSelectSection,
  headerActions,
  onOpenCode,
  canEditCode,
  onClose,
  children,
  footer,
}: DockablePanelProps) {
  const {
    dock,
    setDock,
    x,
    y,
    setPosition,
    width,
    setWidth,
    height,
    setHeight,
    collapsed,
    setCollapsed,
    toggleCollapsed,
    isDragging,
    setIsDragging,
  } = useInspectorDock();

  const panelRef = useRef<HTMLDivElement>(null);

  // Arrastre libre cuando es ventana flotante
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPanelX: number;
    initialPanelY: number;
    active: boolean;
  } | null>(null);

  const onHeaderPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (dock !== "float") return;
    if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) return;
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanelX: x,
      initialPanelY: y,
      active: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHeaderPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;

    if (!drag.active) {
      if (Math.hypot(deltaX, deltaY) > 4) {
        drag.active = true;
        setIsDragging(true);
      }
      return;
    }

    const parent = panelRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const rawX = drag.initialPanelX + deltaX;
    const rawY = drag.initialPanelY + deltaY;

    const clampedX = Math.max(12, Math.min(rawX, parentRect.width - width - 12));
    const clampedY = Math.max(12, Math.min(rawY, parentRect.height - 48));

    setPosition({ x: clampedX, y: clampedY });
  };

  const onHeaderPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragRef.current = null;
  };

  // Redimensionamiento
  const resizeRef = useRef<{
    edge: "left" | "right" | "bottom" | "corner";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight?: number;
    startPanelX: number;
  } | null>(null);

  const startResize = (edge: "left" | "right" | "bottom" | "corner", e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const curHeight = panelRef.current?.offsetHeight ?? height ?? 500;
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: curHeight,
      startPanelX: x,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = resizeRef.current;
    if (!r) return;

    const deltaX = e.clientX - r.startX;
    const deltaY = e.clientY - r.startY;

    const parent = panelRef.current?.parentElement;
    const parentRect = parent?.getBoundingClientRect();

    if (r.edge === "left") {
      let nextW = r.startWidth - deltaX;
      nextW = Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, nextW));
      setWidth(nextW);

      if (dock === "float") {
        const nextX = r.startPanelX + (r.startWidth - nextW);
        if (nextX >= 12) setPosition({ x: nextX, y });
      }
    } else if (r.edge === "right") {
      let nextW = r.startWidth + deltaX;
      nextW = Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, nextW));
      setWidth(nextW);
    } else if (r.edge === "bottom") {
      const maxH = parentRect ? parentRect.height - y - 16 : 900;
      const nextH = Math.max(MIN_INSPECTOR_HEIGHT, Math.min(maxH, (r.startHeight ?? 500) + deltaY));
      setHeight(nextH);
    } else if (r.edge === "corner") {
      let nextW = r.startWidth + deltaX;
      nextW = Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, nextW));
      setWidth(nextW);

      const maxH = parentRect ? parentRect.height - y - 16 : 900;
      const nextH = Math.max(MIN_INSPECTOR_HEIGHT, Math.min(maxH, (r.startHeight ?? 500) + deltaY));
      setHeight(nextH);
    }
  };

  const onResizeUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeRef.current = null;
  };

  const isDocked = dock === "right";

  // CASO 1: Acoplado a la derecha pero PLEGADO A BARRA DE ICONOS (como en Illustrator y el panel izquierdo)
  if (isDocked && collapsed) {
    return (
      <aside
        ref={panelRef}
        aria-label="Barra de propiedades plegada"
        className="relative my-3 mr-3 flex w-12 shrink-0 flex-col items-center self-stretch overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl py-2 transition-[width] duration-150"
      >
        {/* Botón superior para expandir (« como en Illustrator) */}
        <button
          type="button"
          aria-label="Expandir panel de propiedades"
          title="Expandir panel de propiedades (como en Illustrator)"
          onClick={() => setCollapsed(false)}
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold leading-none">«</span>
        </button>

        {/* Icono de Propiedades: al hacer clic expande */}
        <button
          type="button"
          aria-label="Propiedades"
          title={`Propiedades: ${title}`}
          onClick={() => setCollapsed(false)}
          className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent shadow-xs"
        >
          <SlidersIcon />
        </button>

        {/* Icono de Código */}
        {canEditCode && onOpenCode && (
          <button
            type="button"
            aria-label="Abrir código"
            title="Abrir código en el editor (Ctrl+E)"
            onClick={() => onOpenCode()}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim hover:bg-hover hover:text-ink transition-colors"
          >
            <CodeIcon />
          </button>
        )}

        <div className="my-1.5 h-px w-6 bg-line" />

        {/* Botón para desacoplar a ventana flotante */}
        <button
          type="button"
          aria-label="Desacoplar a ventana flotante"
          title="Desacoplar en ventana flotante libre"
          onClick={() => {
            setDock("float");
            setCollapsed(false);
          }}
          className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-xs font-mono font-bold">❐</span>
        </button>

        {/* Botón Cerrar selección */}
        <button
          type="button"
          aria-label="Cerrar propiedades"
          title="Cerrar propiedades"
          onClick={onClose}
          className="mt-auto flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold">×</span>
        </button>
      </aside>
    );
  }

  // CASO 2: Ventana flotante pero MINIMIZADA en píldora compacta
  if (!isDocked && collapsed) {
    return (
      <aside
        ref={panelRef}
        aria-label="Ventana de propiedades minimizada"
        style={{
          position: "absolute",
          top: `${y}px`,
          left: `${x}px`,
          width: "280px",
          zIndex: 40,
        }}
        className="flex h-10 select-none items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-ink shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      >
        <div
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          title="Arrastrar píldora flotante"
          className="flex h-6 w-4 items-center justify-center text-ink-dim cursor-grab active:cursor-grabbing"
        >
          <span className="text-xs font-bold leading-none opacity-60">⠿</span>
        </div>

        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink" title={title}>
          {title}
        </span>

        {/* Expandir */}
        <button
          type="button"
          aria-label="Expandir ventana"
          title="Expandir ventana de propiedades"
          onClick={() => setCollapsed(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-xs font-bold leading-none">□</span>
        </button>

        {/* Acoplar a la derecha */}
        <button
          type="button"
          aria-label="Acoplar al lateral derecho"
          title="Acoplar al lateral derecho"
          onClick={() => {
            setDock("right");
            setCollapsed(false);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-xs font-mono font-bold">⇥</span>
        </button>

        {/* Cerrar */}
        <button
          type="button"
          aria-label="Cerrar"
          title="Cerrar propiedades"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold leading-none">×</span>
        </button>
      </aside>
    );
  }

  // CASO 3: Panel EXPANDIDO (Acoplado a la derecha o Flotante)
  const containerStyle: CSSProperties = isDocked
    ? {
        width: `${width}px`,
        maxWidth: "calc(100% - 1.5rem)",
      }
    : {
        position: "absolute",
        top: `${y}px`,
        left: `${x}px`,
        width: `${width}px`,
        height: height ? `${height}px` : "calc(100% - 24px)",
        maxHeight: "calc(100% - 24px)",
        maxWidth: "calc(100% - 1.5rem)",
        zIndex: 40,
      };

  return (
    <aside
      ref={panelRef}
      aria-label="Panel de propiedades"
      style={containerStyle}
      className={`flex flex-col overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl transition-[width] duration-75 ${
        isDocked
          ? "relative my-3 mr-3 shrink-0 self-stretch"
          : "backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      } ${isDragging ? "ring-2 ring-accent opacity-95 cursor-grabbing" : ""}`}
    >
      {/* Encabezado limpio de 2 filas sin superposición */}
      <header
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onDoubleClick={toggleCollapsed}
        title={
          isDocked
            ? "Panel acoplado a la derecha (doble clic para plegar a iconos)"
            : "Arrastrar para mover libremente (doble clic para minimizar)"
        }
        className={`flex shrink-0 flex-col border-b border-line bg-canvas/40 px-3 py-2 select-none ${
          !isDocked ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        {/* Fila 1: Categoría / Miga de pan a la izquierda + Botones de acción compactos a la derecha */}
        <div className="flex h-7 items-center justify-between gap-1.5 min-w-0">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[10px] uppercase tracking-wider text-ink-dim">
            <span className="truncate">{categoryLabel}</span>
            {onSelectSection && (
              <button
                type="button"
                onClick={onSelectSection}
                className="shrink-0 text-[10px] font-medium text-accent hover:underline lowercase"
                title="Volver a seleccionar la sección para editar disposición, columnas o espacio"
              >
                (ver sección)
              </button>
            )}
          </div>

          {/* Iconos de acción a la derecha */}
          <div className="flex shrink-0 items-center gap-0.5">
            {headerActions}

            {/* Botón Código */}
            {canEditCode && onOpenCode && (
              <button
                type="button"
                aria-label="Abrir código en el editor"
                title="Abrir código en el editor (Ctrl+E)"
                onClick={onOpenCode}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
              >
                <CodeIcon />
              </button>
            )}

            {/* Alternar Acoplado / Flotante */}
            <button
              type="button"
              aria-label={isDocked ? "Desacoplar a ventana flotante" : "Acoplar a la derecha"}
              title={
                isDocked
                  ? "Desacoplar panel en ventana flotante libre (mover a cualquier lado)"
                  : "Acoplar panel al lateral derecho del lienzo (sin sobreponerse)"
              }
              onClick={() => setDock(isDocked ? "float" : "right")}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
            >
              <span className="text-xs font-mono font-bold leading-none">{isDocked ? "❐" : "⇥"}</span>
            </button>

            {/* Botón Plegar / Minimizar (» como en Illustrator) */}
            <button
              type="button"
              aria-label={isDocked ? "Plegar a barra de iconos" : "Minimizar ventana"}
              title={
                isDocked
                  ? "Plegar a barra de iconos lateral (como en Illustrator)"
                  : "Minimizar ventana flotante"
              }
              onClick={toggleCollapsed}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
            >
              <span className="text-xs font-bold leading-none">{isDocked ? "»" : "—"}</span>
            </button>

            {/* Botón Cerrar */}
            <button
              type="button"
              aria-label="Cerrar panel"
              title="Cerrar propiedades"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
            >
              <span className="text-sm font-semibold leading-none">×</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Título principal amplio, limpio y legible */}
        <div className="flex h-7 items-center justify-between min-w-0 pt-0.5">
          <h2 className="truncate text-sm font-bold text-ink" title={title}>
            {title}
          </h2>
        </div>
      </header>

      {/* Contenido del inspector */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      {footer}

      {/* Manija de redimensionamiento izquierda */}
      <div
        title="Arrastrar para cambiar ancho"
        onPointerDown={(e) => startResize("left", e)}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute -left-1 top-0 bottom-0 z-40 w-2.5 cursor-ew-resize hover:bg-accent/40 active:bg-accent transition-colors"
      />

      {/* Manijas adicionales exclusivas para modo flotante libre */}
      {!isDocked && (
        <>
          <div
            title="Arrastrar para cambiar ancho"
            onPointerDown={(e) => startResize("right", e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute -right-1 top-0 bottom-0 z-40 w-2.5 cursor-ew-resize hover:bg-accent/40 active:bg-accent transition-colors"
          />
          <div
            title="Arrastrar para cambiar alto"
            onPointerDown={(e) => startResize("bottom", e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute -bottom-1 left-0 right-0 z-40 h-2.5 cursor-ns-resize hover:bg-accent/40 active:bg-accent transition-colors"
          />
          <div
            title="Arrastrar esquina para cambiar tamaño"
            onPointerDown={(e) => startResize("corner", e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute -bottom-1 -right-1 z-50 size-3.5 cursor-nwse-resize rounded-br-md hover:bg-accent active:bg-accent transition-colors"
          />
        </>
      )}
    </aside>
  );
}
