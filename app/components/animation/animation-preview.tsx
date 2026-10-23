"use client";

import { useState } from "react";
import { useCurrentPage, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { Modal } from "../ui/modal";
import { PreviewHeader } from "./preview-header";
import { PreviewStage } from "./preview-stage";
import { SimpleEditor } from "./simple-editor";
import { TimelineEditor } from "./timeline-editor";
import { usePreviewPlayback } from "./use-preview-playback";
import { useRecorder } from "./recorder-context";
import type { AnimationStep } from "./types";

const NO_STEPS: AnimationStep[] = [];

function PreviewBody({ page, initialId, close }: { page: Page; initialId: string; close: () => void }) {
  const dispatch = useSiteDispatch();
  const [selectedId, setSelectedId] = useState(initialId);
  const [advanced, setAdvanced] = useState(false);

  const animations = page.animations ?? [];
  const animation = animations.find((a) => a.id === selectedId) ?? animations[0];
  const steps = animation?.steps ?? NO_STEPS;
  const playback = usePreviewPlayback(steps);

  if (!animation) return <p className="p-6 text-sm text-ink-dim">No quedan animaciones en esta página.</p>;

  // Editar un paso pausa la animación: se ve el cambio justo en el instante que se está mirando.
  const editSteps = (next: AnimationStep[]) => {
    playback.pause();
    dispatch({ type: "animation/steps", pageId: page.id, id: animation.id, steps: next });
  };

  return (
    <div className="flex max-h-[88vh] flex-col overflow-y-auto">
      <PreviewHeader
        animations={animations}
        animation={animation}
        playing={playback.playing}
        total={playback.total}
        onSelect={setSelectedId}
        onRename={(name) => dispatch({ type: "animation/rename", pageId: page.id, id: animation.id, name })}
        onToggle={playback.toggle}
        onReplay={playback.replay}
        onDelete={() => dispatch({ type: "animation/delete", pageId: page.id, id: animation.id })}
        onClose={close}
      />
      <PreviewStage page={page} steps={steps} stageRef={playback.stageRef} />
      {advanced ? (
        <>
          <TimelineEditor page={page} steps={steps} time={playback.time} onSeek={playback.seek} onSteps={editSteps} />
          <button type="button" onClick={() => setAdvanced(false)} className="self-start p-3 text-xs text-ink-dim underline hover:text-ink">
            Volver a la vista sencilla
          </button>
        </>
      ) : (
        <SimpleEditor page={page} steps={steps} onPlayFrom={playback.playFrom} onSteps={editSteps} onAdvanced={() => setAdvanced(true)} />
      )}
    </div>
  );
}

/** La vista previa de una animación grabada, en un modal, con su línea de tiempo para editarla. */
export function AnimationPreview() {
  const { previewId, openPreview } = useRecorder();
  const page = useCurrentPage();
  if (!previewId) return null;

  const close = () => openPreview(null);
  return (
    <Modal label="Vista previa de la animación" size="xl" onClose={close}>
      <PreviewBody page={page} initialId={previewId} close={close} />
    </Modal>
  );
}
