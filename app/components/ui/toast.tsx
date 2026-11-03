"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "info" | "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const VISIBLE_MS = 5000;
const NOOP: ToastApi = { show() {}, success() {}, error() {} };
const ToastContext = createContext<ToastApi>(NOOP);

const TONES: Record<ToastTone, string> = {
  info: "border-line bg-panel text-ink",
  success: "border-green-500/40 bg-green-500/10 text-green-300",
  error: "border-red-500/40 bg-red-500/10 text-red-300",
};

/** Avisos breves y globales: sin diálogos del navegador y con el mismo aspecto en toda la app. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback(
    (id: number) => setItems((list) => list.filter((item) => item.id !== id)),
    [],
  );

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    nextId.current += 1;
    setItems((list) => [...list.slice(-2), { id: nextId.current, message, tone }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ show, success: (message) => show(message, "success"), error: (message) => show(message, "error") }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-2 text-sm shadow-2xl ${TONES[item.tone]}`}
    >
      <span>{item.message}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={() => onDismiss(item.id)} className="text-ink-dim hover:text-ink">
        ×
      </button>
    </div>
  );
}

/** Disponible en toda la app; sin proveedor devuelve un aviso inerte para no romper nada. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}
