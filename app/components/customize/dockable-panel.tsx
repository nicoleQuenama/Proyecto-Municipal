"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  DEFAULT_INSPECTOR_WIDTH,
  MAX_INSPECTOR_WIDTH,
  MIN_INSPECTOR_HEIGHT,
  MIN_INSPECTOR_WIDTH,
  useInspectorDock,
  type DockPosition,
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
    snapCandidate,
    setSnapCandidate,
  } = useInspectorDock();

  const panelRef = useRef<HTMLDivElement>(null);
  const [dockMenuOpen, setDockMenuOpen] = useState(false);
  const dockMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de acople al hacer clic fuera o presionar escape
  useEffect(() => {
    if (!dockMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dockMenuRef.current && !dockMenuRef.current.contains(e.target as Node)) {
        setDockMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDockMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dockMenuOpen]);

  // Arrastre del encabezado
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPanelX: number;
    initialPanelY: number;
    initialDock: DockPosition;
    active: boolean;
  } | null>(null);

  const onHeaderPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Ignorar clics en botones, inputs, enlaces
    if ((e.target as HTMLElement).closest("button, input, select, a, textarea")) {
      return;
    }
    if (e.button !== 0) return;

    const parent = panelRef.current?.parentElement;
    const parentRect = parent?.getBoundingClientRect();

    let curX = x;
    let curY = y;

    if (dock === "right" && parentRect) {
      curX = parentRect.width - width - 12;
      curY = 12;
    } else if (dock === "left") {
      curX = 12;
      curY = 12;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanelX: curX,
      initialPanelY: curY,
      initialDock: dock,
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
      if (Math.hypot(deltaX, deltaY) > 5) {
        drag.active = true;
        setIsDragging(true);
        if (dock !== "float") {
          setDock("float");
          setPosition({ x: drag.initialPanelX, y: drag.initialPanelY });
        }
      }
      return;
    }

    const parent = panelRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const rawX = drag.initialPanelX + deltaX;
    const rawY = drag.initialPanelY + deltaY;

    // Detectar zonas de acoplamiento al lateral (estilo Photoshop / Illustrator)
    const cursorXInside = e.clientX - parentRect.left;
    if (cursorXInside >= parentRect.width - 90 || rawX + width >= parentRect.width - 45) {
      setSnapCandidate("right");
    } else if (cursorXInside <= 90 || rawX <= 45) {
      setSnapCandidate("left");
    } else {
      setSnapCandidate(null);
    }

    // Limitar dentro del lienzo de trabajo
    const clampedX = Math.max(8, Math.min(rawX, parentRect.width - width - 8));
    const clampedY = Math.max(8, Math.min(rawY, parentRect.height - 48));

    setPosition({ x: clampedX, y: clampedY });
  };

  const onHeaderPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (drag.active) {
      if (snapCandidate === "right") {
        setDock("right");
      } else if (snapCandidate === "left") {
        setDock("left");
      } else {
        setDock("float");
      }
      setIsDragging(false);
      setSnapCandidate(null);
    }

    dragRef.current = null;
  };

  // Redimensionar ancho
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
      // Al arrastrar hacia la izquierda, el ancho crece
      let nextW = r.startWidth - deltaX;
      nextW = Math.max(MIN_INSPECTOR_WIDTH, Math.min(MAX_INSPECTOR_WIDTH, nextW));
      setWidth(nextW);

      if (dock === "float") {
        const nextX = r.startPanelX + (r.startWidth - nextW);
        if (nextX >= 8) setPosition({ x: nextX, y });
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

  // Calcular estilos de posición del panel según el modo de acople
  const containerStyle: CSSProperties = (() => {
    if (minimized) {
      if (dock === "right") {
        return {
          position: "absolute",
          top: "12px",
          right: "12px",
          width: `${Math.min(width, 360)}px`,
          zIndex: 35,
        };
      }
      if (dock === "left") {
        return {
          position: "absolute",
          top: "12px",
          left: "12px",
          width: `${Math.min(width, 360)}px`,
          zIndex: 35,
        };
      }
      return {
        position: "absolute",
        top: `${y}px`,
        left: `${x}px`,
        width: `${Math.min(width, 360)}px`,
        zIndex: 35,
      };
    }

    if (dock === "right") {
      return {
        position: "absolute",
        top: "12px",
        right: "12px",
        bottom: "12px",
        width: `${width}px`,
        maxWidth: "calc(100% - 1.5rem)",
        zIndex: 35,
      };
    }

    if (dock === "left") {
      return {
        position: "absolute",
        top: "12px",
        left: "12px",
        bottom: "12px",
        width: `${width}px`,
        maxWidth: "calc(100% - 1.5rem)",
        zIndex: 35,
      };
    }

    // dock === "float"
    return {
      position: "absolute",
      top: `${y}px`,
      left: `${x}px`,
      width: `${width}px`,
      height: height ? `${height}px` : "calc(100% - 24px)",
      maxHeight: "calc(100% - 24px)",
      maxWidth: "calc(100% - 1.5rem)",
      zIndex: 35,
    };
  })();

  return (
    <>
      {/* Vista previa visual de zona de acoplamiento al arrastrar (estilo Photoshop / Illustrator) */}
      {isDragging && snapCandidate === "right" && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-3 right-3 bottom-3 z-30 flex w-80 items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/15 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-panel px-3 py-1.5 shadow-xl">
            <span className="text-sm font-bold text-accent">⇥</span>
            <span className="text-xs font-semibold text-accent">Acoplar a la derecha</span>
          </div>
        </div>
      )}

      {isDragging && snapCandidate === "left" && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-3 left-3 bottom-3 z-30 flex w-80 items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/15 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-panel px-3 py-1.5 shadow-xl">
            <span className="text-sm font-bold text-accent">⇤</span>
            <span className="text-xs font-semibold text-accent">Acoplar a la izquierda</span>
          </div>
        </div>
      )}

      {/* Contenedor principal de la ventana/panel */}
      <aside
        ref={panelRef}
        aria-label="Panel de propiedades"
        style={containerStyle}
        className={`flex flex-col overflow-hidden rounded-xl border border-line bg-panel text-ink shadow-2xl backdrop-blur-md transition-shadow ${
          isDragging ? "ring-2 ring-accent opacity-95 shadow-accent/20 cursor-grabbing" : ""
        }`}
      >
        {/* Barra superior / Encabezado arrastrable */}
        <header
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onDoubleClick={toggleMinimized}
          title="Arrastrar para mover o acoplar al lateral (doble clic para minimizar/expandir)"
          className={`flex h-12 shrink-0 select-none items-center gap-1.5 border-b border-line px-3 ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } bg-canvas/40 hover:bg-canvas/60 transition-colors`}
        >
          {/* Manija de agarre */}
          <div
            title="Arrastrar para mover o acoplar"
            className="flex h-7 w-5 items-center justify-center text-ink-dim hover:text-ink"
          >
            <span className="text-base leading-none tracking-tighter opacity-70">⠿</span>
          </div>

          {/* Información y título */}
          <div className="min-w-0 flex-1">
            {subtitle && <div className="text-[10px] uppercase tracking-wider text-ink-dim">{subtitle}</div>}
            <div className="truncate text-sm font-semibold">{title}</div>
          </div>

          {/* Acciones de cabecera personalizadas (código, exportar, etc.) */}
          {!minimized && headerActions}

          {/* Menú de opciones de acople */}
          <div ref={dockMenuRef} className="relative">
            <button
              type="button"
              aria-label="Opciones de posición del panel"
              title={
                dock === "right"
                  ? "Panel acoplado a la derecha"
                  : dock === "left"
                    ? "Panel acoplado a la izquierda"
                    : "Ventana flotante libre"
              }
              onClick={() => setDockMenuOpen(!dockMenuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink transition-colors"
            >
              <span className="text-xs font-mono font-bold">
                {dock === "right" ? "⇥" : dock === "left" ? "⇤" : "❐"}
              </span>
            </button>

            {dockMenuOpen && (
              <div className="absolute right-0 top-8 z-50 flex w-48 flex-col rounded-xl border border-line bg-panel p-1 text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setDock("right");
                    setDockMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    dock === "right" ? "bg-accent/15 text-accent font-semibold" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span className="text-xs">⇥</span>
                  <span>Acoplar a la derecha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDock("left");
                    setDockMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    dock === "left" ? "bg-accent/15 text-accent font-semibold" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span className="text-xs">⇤</span>
                  <span>Acoplar a la izquierda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDock("float");
                    setDockMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    dock === "float" ? "bg-accent/15 text-accent font-semibold" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span className="text-xs">❐</span>
                  <span>Ventana flotante libre</span>
                </button>
              </div>
            )}
          </div>

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

        {/* Manijas de redimensionamiento */}
        {!minimized && (dock === "right" || dock === "float") && (
          <div
            title="Arrastrar para cambiar ancho"
            onPointerDown={(e) => startResize("left", e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute -left-1 top-0 bottom-0 z-40 w-2.5 cursor-ew-resize hover:bg-accent/40 active:bg-accent transition-colors"
          />
        )}

        {!minimized && (dock === "left" || dock === "float") && (
          <div
            title="Arrastrar para cambiar ancho"
            onPointerDown={(e) => startResize("right", e)}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            className="absolute -right-1 top-0 bottom-0 z-40 w-2.5 cursor-ew-resize hover:bg-accent/40 active:bg-accent transition-colors"
          />
        )}

        {!minimized && dock === "float" && (
          <>
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
    </>
  );
}
