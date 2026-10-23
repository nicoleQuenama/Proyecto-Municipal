"use client";

import { useRef, useState } from "react";
import type { TriggerKind } from "../behaviors/types";
import { applyOverrides } from "../site/overrides";
import { useCurrentPage, useSite, useSiteDispatch } from "../site/site-context";
import { SECTION_KEY } from "../site/types";
import { useStyles } from "../styles/use-styles";
import { buildSteps } from "./build-steps";
import { ParamSliders } from "./param-sliders";
import { playAnimation, type Playback } from "./play";
import { PresetGrid } from "./preset-grid";
import { DEFAULT_PARAMS, PRESETS, type PresetId, type PresetParams } from "./presets";
import { useRecorder } from "./recorder-context";
import { TargetPicker } from "./target-picker";

interface Draft {
  preset: PresetId;
  params: PresetParams;
  easing: string;
  trigger: TriggerKind;
  keys: string[];
}

const buttonClass = "h-8 rounded-md px-3 text-xs hover:bg-hover";

/** Animar sin grabar: se elige un efecto, qué se anima y cuándo; se ve al momento sobre la página. */
export function AnimatePanel({ onClose }: { onClose: () => void }) {
  const site = useSite();
  const page = useCurrentPage();
  const dispatch = useSiteDispatch();
  const styles = useStyles();
  const { openPreview } = useRecorder();
  const preview = useRef<Playback | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    preset: "slide-up",
    params: DEFAULT_PARAMS,
    easing: "ease-in-out",
    trigger: "enter",
    keys: [site.selectedElementId ?? SECTION_KEY, ...(site.alsoSelectedIds ?? [])],
  }));

  const block = page.blocks.find((b) => b.id === site.selectedId);
  const def = site.components.find((c) => c.id === block?.componentId);
  if (!block || !def) return null;

  const view = applyOverrides(styles.component(def), block, styles.resolver(def.id));
  const stepsOf = (d: Draft) => buildSteps(d.preset, d.params, d.keys.map((key) => ({ blockId: block.id, key })), d.easing);

  // La prueba se ve sobre la propia página y, al terminar, todo vuelve a como estaba.
  const test = (d: Draft) => {
    preview.current?.cancel();
    const run = playAnimation(document, stepsOf(d));
    preview.current = run;
    void run.finished.then(() => setTimeout(run.cancel, 700));
  };
  const change = (patch: Partial<Draft>, replay = true) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (replay) test(next);
  };

  const apply = () => {
    preview.current?.cancel();
    const animation = { id: crypto.randomUUID(), name: `${PRESETS[draft.preset].label} · ${view.name}`, steps: stepsOf(draft) };
    // Una sola pieza se dispara desde ella misma (pasar el cursor por un botón anima ese botón); si no, desde la sección.
    const scope = draft.keys.length === 1 ? draft.keys[0] : SECTION_KEY;
    const behavior = { id: crypto.randomUUID(), scope, trigger: draft.trigger, action: { kind: "play" as const, animationId: animation.id } };
    dispatch({ type: "animation/add", pageId: page.id, animation, trigger: { blockId: block.id, behavior } });
    openPreview(animation.id);
    onClose();
  };

  return (
    <section
      aria-label="Animar"
      className="flex max-h-[70vh] w-[26rem] max-w-full flex-col gap-3 overflow-y-auto rounded-xl border border-line bg-panel p-3 text-ink shadow-2xl"
    >
      <h2 className="text-xs font-semibold">Animar · {view.name}</h2>
      <PresetGrid value={draft.preset} onPick={(preset) => change({ preset })} />
      <TargetPicker elements={view.elements.filter((e) => !e.hidden)} keys={draft.keys} onChange={(keys) => change({ keys })} />
      <ParamSliders
        preset={draft.preset}
        params={draft.params}
        easing={draft.easing}
        trigger={draft.trigger}
        grouped={draft.keys.length > 1}
        onParams={(params) => change({ params })}
        onEasing={(easing) => change({ easing })}
        onTrigger={(trigger) => change({ trigger }, false)}
      />
      <div className="sticky -bottom-3 -mx-3 -mb-3 flex justify-end gap-1 border-t border-line bg-panel p-2">
        <button type="button" onClick={() => test(draft)} className={buttonClass}>▶ Probar</button>
        <button type="button" onClick={onClose} className={`${buttonClass} text-ink-dim`}>Cancelar</button>
        <button type="button" onClick={apply} className={`${buttonClass} bg-accent text-white hover:bg-accent/80`}>Aplicar</button>
      </div>
    </section>
  );
}
