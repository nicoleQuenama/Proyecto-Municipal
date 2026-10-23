"use client";

import { useSite } from "../site/site-context";
import type { Page } from "../site/types";
import { EffectRow } from "./effect-row";
import { groupEffects, removeEffect, retimeEffect } from "./simple-effects";
import { trackLabel } from "./track-label";
import type { AnimationStep } from "./types";

interface SimpleEditorProps {
  page: Page;
  steps: AnimationStep[];
  onPlayFrom: (ms: number) => void;
  onSteps: (steps: AnimationStep[]) => void;
  onAdvanced: () => void;
}

/** Los efectos de una animación como una lista: cada uno dice qué le pasa a qué, cuándo empieza y cuánto dura. */
export function SimpleEditor({ page, steps, onPlayFrom, onSteps, onAdvanced }: SimpleEditorProps) {
  const { components } = useSite();
  const effects = groupEffects(steps);

  return (
    <section className="flex flex-col gap-3 border-t border-line p-3">
      <p className="text-xs text-ink-dim">
        Cada tarjeta es algo que pasa en la página. Mueve «Empieza a los» para decidir cuándo y «Dura» para decidir cuánto tarda.
      </p>
      <ul className="flex flex-col gap-2">
        {effects.map((effect) => (
          <EffectRow
            key={effect.id}
            label={trackLabel(page, components, effect.blockId, effect.key)}
            effect={effect}
            onChange={(change) => onSteps(retimeEffect(steps, effect, change))}
            onPlay={() => onPlayFrom(effect.at)}
            onRemove={() => onSteps(removeEffect(steps, effect))}
          />
        ))}
      </ul>
      <button type="button" onClick={onAdvanced} className="self-start text-xs text-ink-dim underline hover:text-ink">
        Ver la línea de tiempo avanzada
      </button>
    </section>
  );
}
