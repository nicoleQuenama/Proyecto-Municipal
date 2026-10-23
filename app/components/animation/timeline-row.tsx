import { StepBar } from "./step-bar";
import type { Track } from "./timeline";
import { TRACK_HEADER_PX } from "./timeline-scale";
import type { AnimationStep } from "./types";

interface TimelineRowProps {
  track: Track;
  label: string;
  span: number;
  /** Ancho (px) de la zona de tiempo de la pista. */
  width: number;
  selectedTrack: boolean;
  selectedStepId: string | null;
  msPerPixel: () => number;
  onSelectTrack: () => void;
  onSelectStep: (id: string) => void;
  onTiming: (id: string, timing: Pick<AnimationStep, "at" | "duration">) => void;
  onRemove: () => void;
}

/** Una pista: su nombre fijo a la izquierda y sus pasos como clips sobre el eje de tiempo. */
export function TimelineRow({
  track,
  label,
  span,
  width,
  selectedTrack,
  selectedStepId,
  msPerPixel,
  onSelectTrack,
  onSelectStep,
  onTiming,
  onRemove,
}: TimelineRowProps) {
  // Los clips de una misma propiedad comparten carril; cada propiedad distinta tiene el suyo.
  const props = [...new Set(track.steps.map((step) => step.prop))];

  return (
    <div className={`flex border-b border-line ${selectedTrack ? "bg-accent/10" : ""}`}>
      <div
        className={`sticky left-0 z-10 flex shrink-0 items-center justify-between gap-1 border-r border-line px-2 ${selectedTrack ? "bg-[#1d2a3a]" : "bg-panel"}`}
        style={{ width: TRACK_HEADER_PX }}
      >
        <button type="button" onClick={onSelectTrack} className="min-w-0 truncate text-left text-[11px] hover:text-accent" title={label}>
          {label}
        </button>
        <button type="button" aria-label={`Quitar ${label} de la animación`} onClick={onRemove} className="text-ink-dim hover:text-red-400">
          ×
        </button>
      </div>
      <div className="relative shrink-0" style={{ width }} data-track-area onPointerDown={onSelectTrack}>
        {props.map((prop) => (
          <div key={prop} className="relative h-8">
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
