"use client";

import type { ReactNode } from "react";
import { useSite } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import { RepeatIndex } from "./repeat-context";
import { repeatCount } from "./resolve";
import { useSourceData } from "./use-source-data";

interface RepeatedBlockProps {
  block: BlockInstance;
  /** Dibuja el bloque; se llama una vez por copia (`copy` = 0, 1, 2…). */
  children: (copy: number) => ReactNode;
}

/**
 * Una sección enlazada a una lista de una API sale una vez por elemento de la lista. Mientras llegan los datos
 * (o si la lista está vacía) se ve una sola copia, para poder seguir editándola.
 */
export function RepeatedBlock({ block, children }: RepeatedBlockProps) {
  const { sources } = useSite();
  const { state } = useSourceData(sources.find((s) => s.id === block.repeat?.sourceId));

  if (!block.repeat) return <>{children(0)}</>;
  const count = state.data === undefined ? 0 : repeatCount(state.data, block.repeat);

  return (
    <>
      {Array.from({ length: Math.max(1, count) }, (_, index) => (
        <RepeatIndex.Provider key={index} value={index}>
          {children(index)}
        </RepeatIndex.Provider>
      ))}
    </>
  );
}
