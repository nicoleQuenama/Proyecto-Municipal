/** El cabezal: una línea roja que cruza todas las pistas en el instante que se está viendo. */
export function Playhead({ left }: { left: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-red-500" style={{ left }}>
      <span className="absolute top-0 -left-[5px] h-3 w-[11px] bg-red-500 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
    </div>
  );
}
