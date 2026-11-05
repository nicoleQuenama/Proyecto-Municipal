/**
 * Límite simple en memoria: 3 solicitudes cada 15 minutos por IP + usuario + correo.
 * Se reinicia al reiniciar el servidor y no se comparte entre instancias: con varias, debe vivir en Redis.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const attempts = new Map<string, number[]>();

export function allowResetAttempt(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return false;
  attempts.set(key, [...recent, now]);
  return true;
}
