"use client";

import { formatTime } from "./format-time";
import { PRESETS, type PresetId } from "./presets";

interface TransportBarProps {
  playing: boolean;
  time: number;
  total: number;
  zoom: number;
  /** Hay una pista elegida: se le puede añadir un efecto en el cabezal. */
  canAdd: boolean;
  /** Hay un clip elegido: se puede duplicar o quitar. */
  hasClip: boolean;
  onToggle: () => void;
  onRestart: () => void;
  onReplay: () => void;
  onZoom: (zoom: number) => void;
  onAdd: (preset: PresetId) => void;
  onDuplicate: () => void;
  onRemoveClip: () => void;
}

const icon = "flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-hover disabled:opacity-40";
const text = "h-8 rounded-md px-2.5 text-xs hover:bg-hover disabled:opacity-40";

/** Los controles de reproducción y edición, entre el escenario y la línea de tiempo (como en un editor de vídeo). */
export function TransportBar(props: TransportBarProps) {
  const { playing, time, total, zoom, canAdd, hasClip } = props;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-y border-line bg-panel px-3 py-1.5">
      <button type="button" aria-label="Ir al inicio" title="Ir al inicio" onClick={props.onRestart} className={icon}>⏮</button>
      <button
        type="button"
        aria-label={playing ? "Pausa" : "Reproducir"}
        title="Reproducir / pausa (Espacio)"
        onClick={props.onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-white"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button type="button" aria-label="Repetir" title="Repetir desde el inicio" onClick={props.onReplay} className={icon}>↻</button>
      <span className="mx-2 font-mono text-xs tabular-nums">
        {formatTime(time)} <span className="text-ink-dim">/ {formatTime(total)}</span>
      </span>

      <span className="mx-2 h-5 w-px bg-line" />

      <select
        aria-label="Añadir un efecto en el cabezal"
        disabled={!canAdd}
        value=""
        onChange={(e) => props.onAdd(e.target.value as PresetId)}
        title={canAdd ? "Añade un efecto a la pista elegida, donde está el cabezal" : "Elige una pista para añadirle un efecto"}
        className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none disabled:opacity-40 [&>option]:bg-panel"
      >
        <option value="">+ Efecto</option>
        {(Object.keys(PRESETS) as PresetId[]).map((id) => (
          <option key={id} value={id}>{PRESETS[id].label}</option>
        ))}
      </select>
      <button type="button" disabled={!hasClip} onClick={props.onDuplicate} title="Copiar el clip elegido a continuación" className={text}>Duplicar</button>
      <button type="button" disabled={!hasClip} onClick={props.onRemoveClip} title="Quitar el clip elegido (Supr)" className={`${text} text-red-400`}>Quitar</button>

      <label className="ml-auto flex items-center gap-2 text-xs text-ink-dim">
        <button type="button" aria-label="Alejar" onClick={() => props.onZoom(Math.max(1, zoom - 1))} className={icon}>−</button>
        <input
          type="range"
          aria-label="Zoom de la línea de tiempo"
          min={1}
          max={8}
          step={0.25}
          value={zoom}
          onChange={(e) => props.onZoom(Number(e.target.value))}
          className="w-28 accent-accent"
        />
        <button type="button" aria-label="Acercar" onClick={() => props.onZoom(Math.min(8, zoom + 1))} className={icon}>+</button>
      </label>
    </div>
  );
}
