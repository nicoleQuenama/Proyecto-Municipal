"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeSource, Library } from "../site/types";
import { buildSrcDoc, SIZE_MESSAGE, type SharedAssets } from "./build-srcdoc";
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
}

/**
 * El código del usuario, aislado en un iframe con `sandbox`: sin `allow-same-origin` no puede
 * leer ni cambiar el editor, ni su estado, ni sus cookies. Se ajusta solo a la altura del contenido.
 */
export function CodeFrame({ code, libraries, shared, title, minHeight = MIN_HEIGHT }: CodeFrameProps) {
  const origin = useOrigin();
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const srcDoc = useMemo(() => buildSrcDoc(code, libraries, origin, shared), [code, libraries, origin, shared]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || event.data?.type !== SIZE_MESSAGE) return;
      if (typeof event.data.height === "number") setHeight(Math.max(minHeight, Math.ceil(event.data.height)));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight]);

  // Sin origen aún (servidor) no hay a dónde apuntar las librerías: se dibuja al llegar al navegador.
  if (!origin) return <div style={{ height: minHeight }} />;

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-forms allow-popups"
      className="block w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
}
