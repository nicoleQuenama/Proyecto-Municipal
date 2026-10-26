"use client";

import { ColorInput } from "../ui/color-input";
import { NumberField } from "../ui/number-field";
import { OptionCards } from "../ui/option-cards";
import { AnchorGrid } from "./anchor-grid";
import type { BackgroundFit, BlockBackground } from "./types";

const FITS: { value: BackgroundFit; label: string }[] = [
  { value: "cover", label: "Cubrir" },
  { value: "contain", label: "Contener" },
  { value: "repeat", label: "Repetir" },
];

const DEFAULT_VEIL = { color: "#000000", opacity: 40 };

interface BackgroundAdjustProps {
  value: BlockBackground;
  onChange: (patch: Partial<BlockBackground>) => void;
}

/** Cómo se ve el fondo: ajuste, posición, fijo al desplazar, velo de color y desenfoque. */
export function BackgroundAdjust({ value, onChange }: BackgroundAdjustProps) {
  const veil = value.veil ?? DEFAULT_VEIL;

  return (
    <div className="flex flex-col gap-3">
      <OptionCards label="Ajuste" value={value.fit} options={FITS} onChange={(fit) => onChange({ fit })} />
      <AnchorGrid value={value.anchor} onChange={(anchor) => onChange({ anchor })} />

      {value.kind === "image" && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={value.fixed} onChange={(e) => onChange({ fixed: e.target.checked })} className="h-3.5 w-3.5 accent-accent" />
          Fijo al desplazar (la página se mueve sobre la imagen)
        </label>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-line p-2">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={value.veil !== undefined}
            onChange={(e) => onChange({ veil: e.target.checked ? veil : undefined })}
            className="h-3.5 w-3.5 accent-accent"
          />
          Velo de color encima (para que el texto se lea)
        </label>
        {value.veil && (
          <>
            <ColorInput label="Color del velo" value={veil.color} onChange={(color) => onChange({ veil: { ...veil, color } })} />
            <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
              Intensidad del velo: {veil.opacity}%
              <input
                type="range"
                min={0}
                max={100}
                value={veil.opacity}
                aria-label="Intensidad del velo"
                onChange={(e) => onChange({ veil: { ...veil, opacity: Number(e.target.value) } })}
                className="accent-accent"
              />
            </label>
          </>
        )}
      </div>

      <NumberField label="Desenfoque (px)" value={value.blur} min={0} max={40} onChange={(blur) => onChange({ blur })} />
    </div>
  );
}
