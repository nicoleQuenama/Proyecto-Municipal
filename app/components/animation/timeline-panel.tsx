"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "../site/site-context";
import type { Page } from "../site/types";
import { Playhead } from "./playhead";
import { groupTracks, patchStep, removeTrack } from "./timeline";
import { pxPerMsFor, TRACK_HEADER_PX } from "./timeline-scale";
import { TimelineRow } from "./timeline-row";
import { TimelineRuler } from "./timeline-ruler";
import { trackLabel } from "./track-label";
import type { AnimationStep } from "./types";

interface TimelinePanelProps {
  page: Page;
  steps: AnimationStep[];
  time: number;
  /** Lo que abarca el eje (ms) y cuánto se amplió (1 = todo cabe sin desplazarse). */
  span: number;
  zoom: number;
  trackId: string | null;
  stepId: string | null;
  onSeek: (ms: number) => void;
  onSelect: (trackId: string, stepId: string | null) => void;
  onSteps: (steps: AnimationStep[]) => void;
}

/** La línea de tiempo: eje arriba, una pista por pieza y el cabezal encima. Ocupa su sitio fijo, sin desplazar la página. */
export function TimelinePanel({ page, steps, time, span, zoom, trackId, stepId, onSeek, onSelect, onSteps }: TimelinePanelProps) {
  const { components } = useSite();
  const scroller = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(600);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setAvailable(Math.max(200, el.clientWidth - TRACK_HEADER_PX - 32));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pxPerMs = pxPerMsFor(available, span, zoom);
  const width = span * pxPerMs;
  const tracks = groupTracks(steps);

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-canvas" aria-label="Línea de tiempo">
      <div className="relative min-h-full" style={{ width: TRACK_HEADER_PX + width + 8 }}>
        <TimelineRuler span={span} pxPerMs={pxPerMs} time={time} onSeek={onSeek} />
        {tracks.map((track) => (
          <TimelineRow
            key={track.id}
            track={track}
            label={trackLabel(page, components, track.blockId, track.key)}
            span={span}
            width={width}
            selectedTrack={track.id === trackId}
            selectedStepId={stepId}
            msPerPixel={() => 1 / pxPerMs}
            onSelectTrack={() => onSelect(track.id, null)}
            onSelectStep={(id) => onSelect(track.id, id)}
            onTiming={(id, timing) => onSteps(patchStep(steps, id, timing))}
            onRemove={() => onSteps(removeTrack(steps, track))}
          />
        ))}
        <Playhead left={TRACK_HEADER_PX + Math.min(time, span) * pxPerMs} />
      </div>
    </div>
  );
}
