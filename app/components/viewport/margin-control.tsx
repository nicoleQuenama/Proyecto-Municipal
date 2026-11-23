"use client";

import { useEffect, useRef, useState } from "react";
import { DEVICE_NAME } from "../responsive/devices";
import { MARGIN_LIMITS, sideMargin } from "../responsive/page-margin";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { useViewport } from "./viewport-context";

const STEP = 4;
const PRESETS_HORIZONTAL = [0, 16, 24, 40, 64];
const PRESETS_VERTICAL = [0, 16, 32, 48, 64, 96];

/**
 * Control desplegable de ajuste de espaciado:
 * - Margen lateral (ancho de página) para el dispositivo activo.
 * - Margen vertical (a lo alto) para la sección actualmente seleccionada.
 */
export function MarginControl() {
  const { device } = useViewport();
  const page = useCurrentPage();
  const site = useSite();
  const dispatch = useSiteDispatch();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del panel
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!page) return null;

  const deviceName = DEVICE_NAME[device].plain;
  const horizontalMargin = sideMargin(device, page.sideMargin);

  const setHorizontalMargin = (margin: number) => {
    const clamped = Math.max(MARGIN_LIMITS.min, Math.min(MARGIN_LIMITS.max, margin));
    dispatch({ type: "responsive/margin", pageId: page.id, device, margin: clamped });
  };

  // Sección actualmente seleccionada
  const selectedBlock = page.blocks.find((b) => b.id === site.selectedId);
  const selectedDef = selectedBlock ? site.components.find((c) => c.id === selectedBlock.componentId) : null;
  const currentVerticalMargin = selectedBlock?.box?.marginY ?? 0;

  const setVerticalMargin = (marginY: number) => {
    if (!selectedBlock) return;
    const clamped = Math.max(0, Math.min(200, marginY));
    dispatch({
      type: "block/box",
      pageId: page.id,
      blockId: selectedBlock.id,
      patch: { marginY: clamped },
    });
  };

  return (
    <div ref={panelRef} className="relative inline-flex items-center">
      {/* Botón trigger estilo píldora como Animar */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Ajustar márgenes y espaciados de la página y sección"
        aria-label="Ajustar márgenes y espaciados"
        aria-expanded={open}
        className={`flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium shadow-lg transition-all cursor-pointer ${
          open
            ? "border-accent bg-accent text-white"
            : "border-line bg-panel text-ink hover:bg-hover hover:scale-105"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
        </svg>
        <span>Ajustar</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
            open ? "bg-white/20 text-white" : "bg-accent/15 text-accent"
          }`}
        >
          {horizontalMargin}px
        </span>
      </button>

      {/* Menú emergente / desplegable estilo AnimatePanel */}
      {open && (
        <section
          role="dialog"
          aria-label="Panel de ajuste de espaciados y márgenes"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-2xl border border-line bg-panel p-4 text-ink shadow-2xl animate-in zoom-in-95 duration-150"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-accent">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
                </svg>
              </span>
              <div>
                <h3 className="text-xs font-bold leading-tight text-ink">Ajustar Espaciado</h3>
                <p className="text-[10px] text-ink-dim">Configuración de márgenes en {deviceName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink cursor-pointer"
              title="Cerrar panel"
            >
              ×
            </button>
          </div>

          {/* Bloque 1: Margen lateral de página (ancho) */}
          <div className="flex flex-col gap-2 rounded-xl bg-canvas/70 p-3 border border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
                  <path d="M18 8L22 12L18 16" />
                  <path d="M6 8L2 12L6 16" />
                  <path d="M2 12H22" />
                </svg>
                Margen lateral (Ancho)
              </span>
              <span className="text-xs font-bold text-accent tabular-nums bg-accent/10 px-2 py-0.5 rounded-md">
                {horizontalMargin} px
              </span>
            </div>

            {/* Steppers y Slider horizontal */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHorizontalMargin(horizontalMargin - STEP)}
                disabled={horizontalMargin <= MARGIN_LIMITS.min}
                aria-label="Reducir margen lateral"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-sm font-bold text-ink hover:bg-hover disabled:opacity-30 cursor-pointer"
              >
                −
              </button>
              <input
                type="range"
                min={MARGIN_LIMITS.min}
                max={MARGIN_LIMITS.max}
                step={STEP}
                value={horizontalMargin}
                onChange={(e) => setHorizontalMargin(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setHorizontalMargin(horizontalMargin + STEP)}
                disabled={horizontalMargin >= MARGIN_LIMITS.max}
                aria-label="Aumentar margen lateral"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-sm font-bold text-ink hover:bg-hover disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Presets rápidos de margen horizontal */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-ink-dim mr-1">Rápido:</span>
              {PRESETS_HORIZONTAL.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setHorizontalMargin(p)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                    horizontalMargin === p
                      ? "bg-accent text-white"
                      : "bg-panel border border-line text-ink-dim hover:text-ink hover:bg-hover"
                  }`}
                >
                  {p}px
                </button>
              ))}
            </div>
          </div>

          {/* Bloque 2: Margen a lo alto (Vertical de sección seleccionada) */}
          <div className="flex flex-col gap-2 rounded-xl bg-canvas/70 p-3 border border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true">
                  <path d="M8 18L12 22L16 18" />
                  <path d="M8 6L12 2L16 6" />
                  <path d="M12 2V22" />
                </svg>
                Margen a lo alto (Sección)
              </span>
              {selectedBlock && (
                <span className="text-xs font-bold text-emerald-600 tabular-nums bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {currentVerticalMargin} px
                </span>
              )}
            </div>

            {selectedBlock ? (
              <>
                <p className="text-[10px] text-ink-dim truncate" title={selectedDef?.name}>
                  Aplicando a: <strong className="text-ink font-semibold">{selectedDef?.name || "Sección activa"}</strong>
                </p>

                {/* Steppers y Slider vertical */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setVerticalMargin(currentVerticalMargin - STEP)}
                    disabled={currentVerticalMargin <= 0}
                    aria-label="Reducir margen a lo alto"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-sm font-bold text-ink hover:bg-hover disabled:opacity-30 cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={160}
                    step={STEP}
                    value={currentVerticalMargin}
                    onChange={(e) => setVerticalMargin(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setVerticalMargin(currentVerticalMargin + STEP)}
                    disabled={currentVerticalMargin >= 160}
                    aria-label="Aumentar margen a lo alto"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-sm font-bold text-ink hover:bg-hover disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Presets rápidos de margen vertical */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-ink-dim mr-1">Rápido:</span>
                  {PRESETS_VERTICAL.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setVerticalMargin(p)}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                        currentVerticalMargin === p
                          ? "bg-emerald-600 text-white"
                          : "bg-panel border border-line text-ink-dim hover:text-ink hover:bg-hover"
                      }`}
                    >
                      {p}px
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-panel/60 p-2.5 text-center">
                <p className="text-[10px] leading-relaxed text-ink-dim">
                  Haz clic en cualquier sección del lienzo para activar el ajuste de margen a lo alto (superior e inferior).
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
