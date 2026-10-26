export type ModalSize = "small" | "medium" | "large" | "full";
export type ModalPosition = "center" | "right" | "left" | "bottom";
export type ModalAnimation = "fade" | "rise" | "zoom";

/** Cómo se ve y se comporta una ventana modal. */
export interface ModalOptions {
  size: ModalSize;
  position: ModalPosition;
  /** Un clic en el velo (lo oscuro de alrededor) la cierra. */
  closeOnBackdrop: boolean;
  /** Muestra el botón × para cerrarla. */
  showClose: boolean;
  animation: ModalAnimation;
  /** Color del velo (admite transparencia). */
  backdrop: string;
}

/** Una ventana modal abierta: qué página muestra, con qué parámetros y cómo. */
export interface OpenModal {
  pageId: string;
  values: Record<string, string>;
  options: ModalOptions;
}
