import type { MediaType } from "../sniff";

export type ImageType = Exclude<MediaType, `video/${string}`>;
export type VideoType = Extract<MediaType, `video/${string}`>;

/** Lo que devuelve un compresor cuando logró un archivo que pasa la prueba de calidad. */
export interface Outcome {
  data: Buffer;
  /** Qué ajuste se usó (p. ej. «JPEG mozjpeg q84»). */
  step: string;
  /** PSNR contra el original, en dB (100 = idéntico). */
  psnr: number;
}

/** El resultado que se informa de cada archivo: cuánto pesaba, cuánto pesa y por qué. */
export interface CompressionReport {
  type: MediaType;
  originalBytes: number;
  finalBytes: number;
  /** Porcentaje que se ahorró (0 si se dejó el original). */
  savedPercent: number;
  applied: boolean;
  step: string | null;
  psnr: number | null;
  /** Si no se aplicó, la razón. */
  reason: string | null;
  ms: number;
}
