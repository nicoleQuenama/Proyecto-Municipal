import { HandIcon, MinusIcon, PlusIcon } from "../viewport/icons";
import { zoomLabel } from "./builder-zoom";

interface ZoomBarProps {
  zoom: number;
  fitted: boolean;
  hand: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onActualSize: () => void;
  onToggleHand: () => void;
}

const button = "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs hover:bg-hover";

/** Los controles del zoom del lienzo: alejar, porcentaje, acercar, Ajustar, 100 % y la mano. */
export function ZoomBar({ zoom, fitted, hand, onZoomIn, onZoomOut, onFit, onActualSize, onToggleHand }: ZoomBarProps) {
  return (
    <div role="group" aria-label="Zoom del lienzo" className="flex items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5">
      <button type="button" aria-label="Alejar" title="Alejar (Ctrl −)" onClick={onZoomOut} className={button}>
        <MinusIcon />
      </button>
      <span aria-live="polite" className="w-12 text-center text-xs tabular-nums">{zoomLabel(zoom)}</span>
      <button type="button" aria-label="Acercar" title="Acercar (Ctrl +)" onClick={onZoomIn} className={button}>
        <PlusIcon />
      </button>
      <button type="button" aria-pressed={fitted} title="Ajustar a la ventana (Ctrl 0)" onClick={onFit} className={`${button} ${fitted ? "text-accent" : ""}`}>
        Ajustar
      </button>
      <button type="button" title="Tamaño real" onClick={onActualSize} className={button}>
        100 %
      </button>
      <button type="button" aria-pressed={hand} title="Mano: arrastra para desplazarte (o mantén Espacio)" onClick={onToggleHand} className={`${button} ${hand ? "bg-hover text-accent" : ""}`}>
        <HandIcon />
      </button>
    </div>
  );
}
