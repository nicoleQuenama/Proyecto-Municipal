import { formatTime } from "./format-time";
import { ticksFor, TRACK_HEADER_PX } from "./timeline-scale";

interface TimelineRulerProps {
  span: number;
  pxPerMs: number;
  time: number;
  onSeek: (ms: number) => void;
}

/** El eje de tiempo, fijo arriba: se pulsa o se arrastra sobre él para llevar el cabezal a ese instante. */
export function TimelineRuler({ span, pxPerMs, time, onSeek }: TimelineRulerProps) {
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const left = e.currentTarget.getBoundingClientRect().left;
    onSeek(Math.max(0, Math.min(span, (e.clientX - left) / pxPerMs)));
  };

  return (
    <div className="sticky top-0 z-20 flex border-b border-line bg-panel">
      <div className="sticky left-0 z-20 shrink-0 border-r border-line bg-panel" style={{ width: TRACK_HEADER_PX }} />
      <div
        role="slider"
        aria-label="Tiempo de la animación"
        aria-valuemin={0}
        aria-valuemax={span}
        aria-valuenow={Math.round(time)}
        className="relative h-7 shrink-0 cursor-col-resize select-none"
        style={{ width: span * pxPerMs }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && seek(e)}
      >
        {ticksFor(span, pxPerMs).map((tick) => (
          <span key={tick} className="absolute inset-y-0 border-l border-line pl-1 text-[10px] leading-7 text-ink-dim" style={{ left: tick * pxPerMs }}>
            {formatTime(tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
