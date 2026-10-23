"use client";

import { useRef, useState } from "react";
import { useSite } from "../site/site-context";
import type { Page } from "../site/types";
import { buildSteps } from "./build-steps";
import { DEFAULT_PARAMS, PRESETS, type PresetId } from "./presets";
import { StepInspector } from "./step-inspector";
import { TimelineRow } from "./timeline-row";
import { TimelineRuler } from "./timeline-ruler";
import { groupTracks, patchStep, removeStep, removeTrack, spanOf } from "./timeline";
import { trackLabel } from "./track-label";
import type { AnimationStep } from "./types";

interface TimelineEditorProps {
  page: Page;
  steps: AnimationStep[];
  time: number;
  onSeek: (ms: number) => void;
  onSteps: (steps: AnimationStep[]) => void;
}

const selectClass = "h-8 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent disabled:opacity-40 [&>option]:bg-panel";

/** La línea de tiempo de una animación: una fila por pieza, barras que se mueven y se estiran, y el paso elegido para afinarlo. */
export function TimelineEditor({ page, steps, time, onSeek, onSteps }: TimelineEditorProps) {
  const { components } = useSite();
  const root = useRef<HTMLDivElement>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [stepId, setStepId] = useState<string | null>(null);

  const span = spanOf(steps);
  const tracks = groupTracks(steps);
  const selectedTrack = tracks.find((t) => t.id === trackId);
  const selectedStep = steps.find((s) => s.id === stepId);

  const msPerPixel = () => span / (root.current?.querySelector("[data-track-area]")?.getBoundingClientRect().width || 1);

  const addEffect = (preset: PresetId) => {
    if (!selectedTrack) return;
    const target = [{ blockId: selectedTrack.blockId, key: selectedTrack.key }];
    onSteps([...steps, ...buildSteps(preset, DEFAULT_PARAMS, target, "ease-in-out", Math.round(time))]);
  };

  return (
    <div ref={root} className="flex flex-col border-t border-line text-ink">
      <div className="flex items-center gap-2 p-2">
        <span className="text-xs font-medium">Línea de tiempo</span>
        <select
          aria-label="Añadir un efecto a la fila elegida"
          disabled={!selectedTrack}
          value=""
          onChange={(e) => addEffect(e.target.value as PresetId)}
          className={selectClass}
        >
          <option value="">{selectedTrack ? "+ Añadir efecto aquí" : "Elige una fila para añadir un efecto"}</option>
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <option key={id} value={id}>{PRESETS[id].label}</option>
          ))}
        </select>
      </div>

      <TimelineRuler span={span} time={time} onSeek={onSeek} />
      <div className="max-h-48 overflow-y-auto">
        {tracks.map((track) => (
          <TimelineRow
            key={track.id}
            track={track}
            label={trackLabel(page, components, track.blockId, track.key)}
            span={span}
            selectedTrack={track.id === trackId}
            selectedStepId={stepId}
            msPerPixel={msPerPixel}
            onSelectTrack={() => setTrackId(track.id)}
            onSelectStep={(id) => {
              setStepId(id);
              setTrackId(track.id);
            }}
            onTiming={(id, timing) => onSteps(patchStep(steps, id, timing))}
            onRemove={() => onSteps(removeTrack(steps, track))}
          />
        ))}
      </div>

      {selectedStep && (
        <StepInspector
          step={selectedStep}
          onChange={(patch) => onSteps(patchStep(steps, selectedStep.id, patch))}
          onRemove={() => {
            onSteps(removeStep(steps, selectedStep.id));
            setStepId(null);
          }}
        />
      )}
    </div>
  );
}
