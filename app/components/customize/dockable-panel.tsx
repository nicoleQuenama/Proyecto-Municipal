"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  MAX_INSPECTOR_WIDTH,
  MIN_INSPECTOR_HEIGHT,
  MIN_INSPECTOR_WIDTH,
  useInspectorDock,
} from "./dockable-inspector-context";

interface DockablePanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function DockablePanel({
  title,
  subtitle,
  headerActions,
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
    minimized,
    toggleMinimized,
    isDragging,
    setIsDragging,
  } = useInspectorDock();

  const panelRef = useRef<HTMLDivElement>(null);

  // Arrastre libre de la ventana flotante (sin acoplamiento automático)
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPanelX: number;
    initialPanelY: number;
    active: boolean;
  } | null>(null);

  const onHeaderPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Si está acoplado, el usuario no arrastra; usa el botón explícito para desacoplar
    if (dock !== "float") return;

    // Ignorar clics en botones, inputs, enlaces
    if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) {
      return;
    }
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

    // Movimiento libre acotado al contenedor (sin auto-acoplamiento)
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

  // Redimensionamiento de ancho y alto
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

  // Estilos según el modo de acople
  const containerStyle: CSSProperties = (() => {
    if (dock === "right") {
      // Acoplado a la derecha en el flujo flex: no se sobrepone al lienzo
      return {
        width: `${width}px`,
        maxWidth: "calc(100% - 1.5rem)",
      };
    }

    // dock === "float": ventana flotante libre
    if (minimized) {
      return {
        position: "absolute",
        top: `${y}px`,
        left: `${x}px`,
        width: `${Math.min(width, 360)}px`,
        zIndex: 40,
      };
    }

    return {
      position: "absolute",
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: height ? `${height}px` : "calc(100% - 24px)",
      maxHeight: "calc(100% - 24px)",
      maxWidth: "calc(100% - 1.5rem)",
      zIndex: 40,
    };
  })();

  const isDocked = dock === "right";

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
      {/* Encabezado */}
      <header
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onDoubleClick={toggleMinimized}
        title={
          isDocked
            ? "Panel acoplado a la derecha (haz clic en 'Flotante' para moverlo libremente)"
            : "Arrastrar para mover libremente por la pantalla (doble clic para minimizar/expandir)"
        }
        className={`flex h-12 shrink-0 select-none items-center gap-1.5 border-b border-line px-3 ${
          !isDocked ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        } bg-canvas/40 hover:bg-canvas/60 transition-colors`}
      >
        {/* Manija de agarre visual */}
        <div
          title={isDocked ? "Panel acoplado lateral" : "Arrastrar ventana libremente"}
          className="flex h-7 w-5 items-center justify-center text-ink-dim"
        >
          <span className="text-base leading-none tracking-tighter opacity-70">⠿</span>
        </div>

        {/* Título y subtítulo */}
        <div className="min-w-0 flex-1">
          {subtitle && <div className="text-[10px] uppercase tracking-wider text-ink-dim">{subtitle}</div>}
          <div className="truncate text-sm font-semibold">{title}</div>
        </div>

        {/* Acciones de cabecera (paleta de colores, código, exportar, etc.) */}
        {!minimized && headerActions}

        {/* Botón explícito para alternar entre acoplado a la derecha y ventana flotante */}
        <button
          type="button"
          aria-label={isDocked ? "Desacoplar a ventana flotante" : "Acoplar a la derecha"}
          title={
            isDocked
              ? "Desacoplar panel y convertir en ventana flotante (mover libremente)"
              : "Acoplar al lateral derecho del lienzo (sin sobreponerse)"
          }
          onClick={() => setDock(isDocked ? "float" : "right")}
          className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs text-ink-dim hover:bg-hover hover:text-ink transition-colors border border-transparent hover:border-line"
        >
          <span className="text-xs font-mono font-bold">{isDocked ? "❐" : "⇥"}</span>
          <span className="hidden sm:inline text-[11px] font-medium">
            {isDocked ? "Flotante" : "Acoplar"}
          </span>
        </button>

        {/* Botón Minimizar / Expandir */}
        <button
          type="button"
          aria-label={minimized ? "Expandir panel" : "Minimizar panel"}
          title={minimized ? "Expandir panel" : "Minimizar panel"}
          onClick={toggleMinimized}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-xs font-bold leading-none">{minimized ? "□" : "—"}</span>
        </button>

        {/* Botón Cerrar */}
        <button
          type="button"
          aria-label="Cerrar panel"
          title="Cerrar panel"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
        >
          <span className="text-sm font-semibold leading-none">×</span>
        </button>
      </header>

      {/* Contenido expandido */}
      {!minimized && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {footer}
        </>
      )}

      {/* Manija de redimensionamiento izquierda (disponible tanto acoplado a la derecha como flotante) */}
      {!minimized && (
        <div
          title="Arrastrar para cambiar ancho"
          onPointerDown={(e) => startResize("left", e)}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          className="absolute -left-1 top-0 bottom-0 z-40 w-2.5 cursor-ew-resize hover:bg-accent/40 active:bg-accent transition-colors"
        />
      )}

      {/* Manijas adicionales exclusivas para modo flotante libre */}
      {!minimized && !isDocked && (
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
