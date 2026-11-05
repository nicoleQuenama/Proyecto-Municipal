"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeSource, Library } from "../site/types";
import { buildSrcDoc, type SharedAssets } from "./build-srcdoc";
import {
  CLEAR_MESSAGE,
  ELEMENT_MESSAGE,
  HIGHLIGHT_MESSAGE,
  LOG_MESSAGE,
  SIZE_MESSAGE,
  type ConsoleEntry,
  type ElementHighlight,
  type ElementPick,
} from "./messages";
import { useOrigin } from "./use-origin";

const MIN_HEIGHT = 48;

interface CodeFrameProps {
  code: CodeSource;
  libraries: Library[];
  /** Variables, CSS global y funciones del proyecto que el código también puede usar. */
  shared: SharedAssets;
  title: string;
  /** Alto inicial y mínimo mientras el contenido avisa de su tamaño real. */
  minHeight?: number;
  /** Lo que el código escribe en su consola. */
  onConsole?: (entry: ConsoleEntry) => void;
  /** Un elemento de la vista previa se señala o se selecciona. */
  onElement?: (pick: ElementPick) => void;
  /** Elemento que el editor quiere resaltar. */
  highlight?: ElementHighlight | null;
}

/**
 * El código del usuario, aislado en un iframe con `sandbox`: sin `allow-same-origin` no puede
 * leer ni cambiar el editor, ni su estado, ni sus cookies. Se ajusta solo a la altura del contenido.
 */
export function CodeFrame({
  code,
  libraries,
  shared,
  title,
  minHeight = MIN_HEIGHT,
  onConsole,
  onElement,
  highlight,
}: CodeFrameProps) {
  const origin = useOrigin();
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const srcDoc = useMemo(() => buildSrcDoc(code, libraries, origin, shared), [code, libraries, origin, shared]);

  // Los avisos llegan del iframe y se reparten a quien los pida, sin volver a suscribirse en cada edición.
  const listeners = useRef({ onConsole, onElement });
  useEffect(() => {
    listeners.current = { onConsole, onElement };
  }, [onConsole, onElement]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = ref.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === SIZE_MESSAGE) {
        if (typeof data.height === "number") setHeight(Math.max(minHeight, Math.ceil(data.height)));
        return;
      }
      if (data.type === LOG_MESSAGE) {
        if (typeof data.text === "string") {
          listeners.current.onConsole?.({
            level: data.level ?? "log",
            text: data.text,
            at: typeof data.at === "number" ? data.at : Date.now(),
          });
        }
        return;
      }
      if (data.type === ELEMENT_MESSAGE) {
        listeners.current.onElement?.({ action: data.action, path: data.path, tag: data.tag, html: data.html });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight]);

  /** Manda al iframe el resaltado que toca. */
  const sendHighlight = useCallback(() => {
    const frame = ref.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      highlight
        ? { type: HIGHLIGHT_MESSAGE, ...highlight }
        : { type: CLEAR_MESSAGE },
      "*",
    );
  }, [highlight]);

  // Al cambiar lo que hay que resaltar, o al recargarse el iframe, se vuelve a aplicar.
  useEffect(() => {
    sendHighlight();
  }, [sendHighlight, srcDoc]);

  // Sin origen aún (servidor) no hay a dónde apuntar las librerías: se dibuja al llegar al navegador.
  if (!origin) return <div style={{ height: minHeight }} />;

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-forms allow-popups"
      onLoad={sendHighlight}
      className="block w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
}
