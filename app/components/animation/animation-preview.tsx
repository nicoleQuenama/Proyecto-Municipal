"use client";

import { useState } from "react";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { Modal } from "../ui/modal";
import { buildSteps } from "./build-steps";
import { ClipPanel } from "./clip-panel";
import { DEFAULT_PARAMS, type PresetId } from "./presets";
import { PreviewStage } from "./preview-stage";
import { StudioHeader } from "./studio-header";
import { duplicateStep, groupTracks, patchStep, removeStep, spanOf } from "./timeline";
import { TimelinePanel } from "./timeline-panel";
import { TransportBar } from "./transport-bar";
import { useStudioKeys } from "./use-studio-keys";
import { usePreviewPlayback } from "./use-preview-playback";
import { useRecorder } from "./recorder-context";
import type { AnimationStep } from "./types";

const NO_STEPS: AnimationStep[] = [];

/** El estudio de una animación: escenario y propiedades arriba, controles en medio y línea de tiempo abajo. */
function Studio({ page, initialId, close }: { page: Page; initialId: string; close: () => void }) {
  const dispatch = useSiteDispatch();
  const [selectedId, setSelectedId] = useState(initialId);
  const [selection, setSelection] = useState<{ trackId: string | null; stepId: string | null }>({ trackId: null, stepId: null });
  const [zoom, setZoom] = useState(1);

  const animations = page.animations ?? [];
  const animation = animations.find((a) => a.id === selectedId) ?? animations[0];
  const steps = animation?.steps ?? NO_STEPS;
  const playback = usePreviewPlayback(steps);

  // Editar un paso pausa la animación: se ve el cambio justo en el instante que se está mirando.
  const editSteps = (next: AnimationStep[]) => {
    playback.pause();
    dispatch({ type: "animation/steps", pageId: page.id, id: animation.id, steps: next });
  };

  const selectedStep = steps.find((s) => s.id === selection.stepId);
  const selectedTrack = groupTracks(steps).find((t) => t.id === selection.trackId);

  const removeClip = () => {
    if (!selectedStep) return;
    editSteps(removeStep(steps, selectedStep.id));
    setSelection((s) => ({ ...s, stepId: null }));
  };

  useStudioKeys({
    onToggle: playback.toggle,
    onRemoveClip: removeClip,
    onNudge: (by) => playback.seek(Math.max(0, playback.time + by)),
  });

  if (!animation) return <p className="p-6 text-sm text-ink-dim">No quedan animaciones en esta página.</p>;

  const addEffect = (preset: PresetId) => {
    if (!selectedTrack) return;
    const target = [{ blockId: selectedTrack.blockId, key: selectedTrack.key }];
    editSteps([...steps, ...buildSteps(preset, DEFAULT_PARAMS, target, "ease-in-out", Math.round(playback.time))]);
  };

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <StudioHeader
        animations={animations}
        animation={animation}
        onSelect={setSelectedId}
        onRename={(name) => dispatch({ type: "animation/rename", pageId: page.id, id: animation.id, name })}
        onDelete={() => dispatch({ type: "animation/delete", pageId: page.id, id: animation.id })}
        onClose={close}
      />

      <div className="flex min-h-0 flex-1">
        <PreviewStage page={page} steps={steps} stageRef={playback.stageRef} />
        <ClipPanel
          step={selectedStep}
          onChange={(patch) => selectedStep && editSteps(patchStep(steps, selectedStep.id, patch))}
          onRemove={removeClip}
        />
      </div>

      <TransportBar
        playing={playback.playing}
        time={playback.time}
        total={playback.total}
        zoom={zoom}
        canAdd={selectedTrack !== undefined}
        hasClip={selectedStep !== undefined}
        onToggle={playback.toggle}
        onRestart={() => playback.seek(0)}
        onReplay={playback.replay}
        onZoom={setZoom}
        onAdd={addEffect}
        onDuplicate={() => selectedStep && editSteps(duplicateStep(steps, selectedStep.id, crypto.randomUUID()))}
        onRemoveClip={removeClip}
      />

      <div className="flex h-72 shrink-0 flex-col">
        <TimelinePanel
          page={page}
          steps={steps}
          time={playback.time}
          span={spanOf(steps)}
          zoom={zoom}
          trackId={selection.trackId}
          stepId={selection.stepId}
          onSeek={playback.seek}
          onSelect={(trackId, stepId) => setSelection({ trackId, stepId })}
          onSteps={editSteps}
        />
      </div>
    </div>
  );
}

/** La vista previa de una animación grabada, a pantalla casi completa, con su línea de tiempo para editarla. */
export function AnimationPreview() {
  const { previewId, openPreview } = useRecorder();
  const page = useCurrentPage();
  if (!previewId) return null;

  const close = () => openPreview(null);
  return (
    <Modal label="Vista previa de la animación" size="full" onClose={close}>
      <Studio page={page} initialId={previewId} close={close} />
    </Modal>
  );
}
