import { STEP_META } from "./step-meta";
import { startBarDrag } from "./use-bar-drag";
import type { AnimationStep } from "./types";

interface StepBarProps {
  step: AnimationStep;
  /** Cuánto tiempo (ms) abarca el eje entero. */
  span: number;
  selected: boolean;
  msPerPixel: () => number;
  onSelect: () => void;
  onTiming: (timing: Pick<AnimationStep, "at" | "duration">) => void;
}

const handleClass = "absolute inset-y-0 w-1.5 cursor-ew-resize hover:bg-white/50";

/** Un paso en la línea de tiempo: se arrastra para moverlo y por sus bordes para cambiar cuánto dura. */
export function StepBar({ step, span, selected, msPerPixel, onSelect, onTiming }: StepBarProps) {
  const meta = STEP_META[step.prop];
  const drag = (mode: "move" | "start" | "end") => (e: React.PointerEvent) => {
    onSelect();
    startBarDrag(e, mode, step, msPerPixel, onTiming);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${meta.label}: de ${step.at} a ${step.at + step.duration} ms`}
      aria-pressed={selected}
      title={`${meta.label} · ${step.at}–${step.at + step.duration} ms`}
      onPointerDown={drag("move")}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`absolute top-1 flex h-5 cursor-grab items-center overflow-hidden rounded px-1.5 text-[10px] text-white select-none active:cursor-grabbing ${meta.bar} ${
        selected ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
      }`}
      style={{ left: `${(step.at / span) * 100}%`, width: `max(6px, ${(step.duration / span) * 100}%)` }}
    >
      <span className="truncate">{meta.label}</span>
      <span aria-hidden className={`${handleClass} left-0`} onPointerDown={drag("start")} />
      <span aria-hidden className={`${handleClass} right-0`} onPointerDown={drag("end")} />
    </div>
  );
}
