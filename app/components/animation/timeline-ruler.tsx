interface TimelineRulerProps {
  span: number;
  time: number;
  onSeek: (ms: number) => void;
}

/** Cada cuántos ms se marca una cifra en el eje. */
const TICK_MS = 500;

/** El eje de tiempo: se pulsa o se arrastra sobre él para ver la animación en ese instante. */
export function TimelineRuler({ span, time, onSeek }: TimelineRulerProps) {
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(span, ((e.clientX - box.left) / box.width) * span)));
  };
  const ticks = Array.from({ length: Math.floor(span / TICK_MS) + 1 }, (_, i) => i * TICK_MS);

  return (
    <div className="flex border-b border-line">
      <div className="w-40 shrink-0 border-r border-line" />
      <div
        role="slider"
        aria-label="Tiempo de la animación"
        aria-valuemin={0}
        aria-valuemax={span}
        aria-valuenow={Math.round(time)}
        className="relative h-6 min-w-0 flex-1 cursor-col-resize select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && seek(e)}
      >
        {ticks.map((tick) => (
          <span key={tick} className="absolute top-1 text-[10px] text-ink-dim" style={{ left: `${(tick / span) * 100}%` }}>
            {tick / 1000}s
          </span>
        ))}
        <span aria-hidden className="absolute inset-y-0 w-px bg-accent" style={{ left: `${(Math.min(time, span) / span) * 100}%` }} />
      </div>
    </div>
  );
}
