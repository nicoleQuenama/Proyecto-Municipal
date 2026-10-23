import { StepBar } from "./step-bar";
import type { Track } from "./timeline";
import type { AnimationStep } from "./types";

interface TimelineRowProps {
  track: Track;
  label: string;
  span: number;
  selectedTrack: boolean;
  selectedStepId: string | null;
  msPerPixel: () => number;
  onSelectTrack: () => void;
  onSelectStep: (id: string) => void;
  onTiming: (id: string, timing: Pick<AnimationStep, "at" | "duration">) => void;
  onRemove: () => void;
}

/** Una pieza de la animación: su nombre a la izquierda y sus pasos como barras sobre el eje de tiempo. */
export function TimelineRow({
  track,
  label,
  span,
  selectedTrack,
  selectedStepId,
  msPerPixel,
  onSelectTrack,
  onSelectStep,
  onTiming,
  onRemove,
}: TimelineRowProps) {
  // Las barras de una misma propiedad comparten renglón; cada propiedad distinta tiene el suyo.
  const props = [...new Set(track.steps.map((step) => step.prop))];

  return (
    <div className={`flex border-b border-line ${selectedTrack ? "bg-accent/10" : ""}`}>
      <div className="flex w-40 shrink-0 items-start justify-between gap-1 border-r border-line p-1.5">
        <button type="button" onClick={onSelectTrack} className="min-w-0 truncate text-left text-[11px] hover:text-accent" title={label}>
          {label}
        </button>
        <button type="button" aria-label={`Quitar ${label} de la animación`} onClick={onRemove} className="text-ink-dim hover:text-red-400">
          ×
        </button>
      </div>
      <div className="relative min-w-0 flex-1" data-track-area>
        {props.map((prop) => (
          <div key={prop} className="relative h-7">
            {track.steps
              .filter((step) => step.prop === prop)
              .map((step) => (
                <StepBar
                  key={step.id}
                  step={step}
                  span={span}
                  selected={step.id === selectedStepId}
                  msPerPixel={msPerPixel}
                  onSelect={() => onSelectStep(step.id)}
                  onTiming={(timing) => onTiming(step.id, timing)}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
