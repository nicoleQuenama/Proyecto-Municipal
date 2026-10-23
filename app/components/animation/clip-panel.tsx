import { StepInspector } from "./step-inspector";
import type { AnimationStep } from "./types";

interface ClipPanelProps {
  step: AnimationStep | undefined;
  onChange: (patch: Partial<AnimationStep>) => void;
  onRemove: () => void;
}

/** Las propiedades del clip elegido, al lado del escenario: así se afina sin bajar ni subir. */
export function ClipPanel({ step, onChange, onRemove }: ClipPanelProps) {
  return (
    <aside aria-label="Propiedades del clip" className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <h3 className="border-b border-line px-3 py-2 text-[11px] font-semibold tracking-wider text-ink-dim uppercase">Propiedades</h3>
      {step ? (
        <StepInspector step={step} onChange={onChange} onRemove={onRemove} />
      ) : (
        <p className="p-4 text-xs leading-relaxed text-ink-dim">
          Haz clic en un clip de la línea de tiempo para cambiar de dónde a dónde va, cuándo empieza y cuánto dura.
          Arrástralo para moverlo y estira sus bordes para alargarlo.
        </p>
      )}
    </aside>
  );
}
