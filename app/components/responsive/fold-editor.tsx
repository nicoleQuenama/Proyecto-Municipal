"use client";

import type { ReactNode } from "react";
import { useSiteDispatch } from "../site/site-context";
import type { EditorProps } from "./adapt-options";
import { useFlag } from "./flag-store";
import { FOLD_FIELDS } from "./fold-fields";
import { FOLD_DEFAULTS } from "./fold-model";
import { OptionCards, PhoneArt, type CardOption } from "./option-cards";
import type { FoldConfig, FoldKind } from "./types";

type Choice = FoldKind | "none";

const LINE = { fill: "currentColor", fillOpacity: 0.35, stroke: "none" } as const;

/** El dibujo de cada presentación. */
const ART: Record<Choice, ReactNode> = {
  none: <><rect x="6" y="6" width="28" height="12" rx="2" {...LINE} /><rect x="6" y="21" width="28" height="12" rx="2" {...LINE} /><rect x="6" y="36" width="28" height="12" rx="2" {...LINE} /></>,
  carousel: <><rect x="4" y="16" width="22" height="22" rx="2" {...LINE} /><rect x="29" y="16" width="8" height="22" rx="2" {...LINE} /><path d="M15 46h10" /></>,
  more: <><rect x="6" y="6" width="28" height="26" rx="2" {...LINE} /><path d="M6 32h28" strokeDasharray="3 2" /><path d="M13 42h14" /></>,
  accordion: <><rect x="6" y="6" width="28" height="9" rx="2" {...LINE} /><path d="M26 9l3 3 3-3" /><rect x="6" y="19" width="28" height="9" rx="2" {...LINE} /><rect x="6" y="32" width="28" height="9" rx="2" {...LINE} /></>,
};

const CHOICES: Record<Choice, { label: string; help: string }> = {
  none: { label: "Normal", help: "La sección se ve entera, sin cambios." },
  carousel: { label: "Carrusel", help: "Las tarjetas de una lista se deslizan de lado, una tras otra. Solo para secciones repetidas." },
  more: { label: "Ver más", help: "La sección se corta a una altura con un botón para verla completa." },
  accordion: { label: "Acordeón", help: "Solo se ve el título; al tocarlo se despliega el resto." },
};

/** Elige cómo se presenta una sección larga en este dispositivo y ajusta sus detalles. */
export function FoldEditor({ pageId, block, view, device }: EditorProps) {
  const dispatch = useSiteDispatch();
  const [peek, setPeek] = useFlag(`fold:${block.id}`);
  const fold = block.fold?.[device];
  const set = (next: FoldConfig | null) => dispatch({ type: "responsive/fold", pageId, blockId: block.id, device, fold: next });

  const options: CardOption<Choice>[] = (Object.keys(CHOICES) as Choice[]).map((value) => ({
    value,
    ...CHOICES[value],
    art: <PhoneArt>{ART[value]}</PhoneArt>,
    disabled: value === "carousel" && !block.repeat,
  }));
  const Fields = fold ? (FOLD_FIELDS[fold.kind] as (props: { fold: FoldConfig; view: typeof view; change: (c: Partial<FoldConfig>) => void }) => ReactNode) : null;

  return (
    <div className="flex w-full flex-col gap-2 border-t border-line px-2 pt-2 pb-1 text-left">
      <p className="text-[11px] font-medium text-ink">¿La sección queda muy larga?</p>
      <OptionCards label="Presentación de la sección larga" value={fold?.kind ?? "none"} options={options} onPick={(kind) => set(kind === "none" ? null : FOLD_DEFAULTS[kind])} />
      {fold && Fields && <Fields fold={fold} view={view} change={(changes) => set({ ...fold, ...changes } as FoldConfig)} />}
      {fold && fold.kind !== "carousel" && (
        <label className="flex cursor-pointer items-center gap-1.5 text-ink-dim">
          <input type="checkbox" checked={peek} onChange={(e) => setPeek(e.target.checked)} />
          Ver el resultado al editar
        </label>
      )}
    </div>
  );
}
