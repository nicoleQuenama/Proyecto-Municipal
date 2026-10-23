import { TRIGGERS } from "../behaviors/triggers";
import type { TriggerKind } from "../behaviors/types";
import { EASINGS, PRESETS, type PresetId, type PresetParams } from "./presets";

/** Los deslizadores de un efecto. `group` solo cuenta cuando se anima más de una pieza. */
const SLIDERS: { key: keyof PresetParams; label: string; min: number; max: number; step: number; group?: boolean }[] = [
  { key: "duration", label: "Duración", min: 100, max: 3000, step: 50 },
  { key: "delay", label: "Espera antes de empezar", min: 0, max: 3000, step: 50 },
  { key: "distance", label: "Intensidad", min: 5, max: 200, step: 5 },
  { key: "stagger", label: "Cascada: una pieza tras otra", min: 0, max: 600, step: 20, group: true },
];

const selectClass = "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

interface ParamSlidersProps {
  preset: PresetId;
  params: PresetParams;
  easing: string;
  trigger: TriggerKind;
  grouped: boolean;
  onParams: (params: PresetParams) => void;
  onEasing: (easing: string) => void;
  onTrigger: (trigger: TriggerKind) => void;
}

export function ParamSliders({ preset, params, easing, trigger, grouped, onParams, onEasing, onTrigger }: ParamSlidersProps) {
  const instant = "instant" in PRESETS[preset];

  return (
    <div className="flex flex-col gap-2">
      {SLIDERS.filter((s) => (!s.group || grouped) && !(instant && s.key === "duration")).map((slider) => (
        <label key={slider.key} className="flex flex-col gap-0.5 text-[11px] text-ink-dim">
          <span className="flex justify-between">
            {slider.label}
            <span className="tabular-nums">{params[slider.key]}{slider.key === "distance" ? "" : " ms"}</span>
          </span>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={params[slider.key]}
            onChange={(e) => onParams({ ...params, [slider.key]: Number(e.target.value) })}
            className="w-full accent-accent"
          />
        </label>
      ))}

      {!instant && (
        <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
          Movimiento
          <select value={easing} onChange={(e) => onEasing(e.target.value)} className={selectClass}>
            {EASINGS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-[11px] text-ink-dim">
        ¿Cuándo ocurre?
        <select value={trigger} onChange={(e) => onTrigger(e.target.value as TriggerKind)} className={selectClass}>
          {(Object.keys(TRIGGERS) as TriggerKind[]).map((kind) => (
            <option key={kind} value={kind}>{TRIGGERS[kind].label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
