/** 1500 → «0:01.5» (minutos, segundos y décimas), como el contador de un editor de vídeo. */
export function formatTime(ms: number): string {
  const tenths = Math.max(0, Math.round(ms / 100));
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
}
