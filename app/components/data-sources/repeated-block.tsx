"use client";

import type { ReactNode } from "react";
import { Carousel } from "../responsive/carousel";
import { foldOf } from "../responsive/fold-model";
import { CellWidth } from "../responsive/available-context";
import { availableWidth, isAdaptive } from "../responsive/devices";
import { useSite } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import { useViewport } from "../viewport/viewport-context";
import { cellWidth, columnsFor } from "./grid-columns";
import { Pager } from "./pager";
import { PagingScope } from "./paging-scope";
import { RepeatIndex } from "./repeat-context";
import { repeatCount } from "./resolve";
import { useSourceData } from "./use-source-data";
import { usePagedList } from "./use-paged-list";

interface RepeatedBlockProps {
  block: BlockInstance;
  /** Dibuja el bloque; se llama una vez por copia (`copy` = 0, 1, 2…). */
  children: (copy: number) => ReactNode;
  /** Margen lateral de la página en este dispositivo (para saber cuánto cabe). */
  margin?: number;
}

/**
 * Una sección enlazada a una lista de una API sale una vez por elemento de la lista. Mientras llegan los datos
 * (o si la lista está vacía) se ve una sola copia, para poder seguir editándola. Con una rejilla definida, las
 * copias se acomodan en columnas; sin ella, una bajo otra.
 */
export function RepeatedBlock(props: RepeatedBlockProps) {
  const { block } = props;
  // Con paginación, la página en pantalla viaja a las URLs de las fuentes (`{page}`, `{offset}`, `{limit}`).
  if (!block.repeat || !block.repeatPaging) return <RepeatedList {...props} />;
  return (
    <PagingScope block={block}>
      <RepeatedList {...props} />
    </PagingScope>
  );
}

function RepeatedList({ block, children, margin }: RepeatedBlockProps) {
  const { sources, components } = useSite();
  const { device } = useViewport();
  const { state } = useSourceData(sources.find((s) => s.id === block.repeat?.sourceId));

  const paged = usePagedList(block, state.data);

  if (!block.repeat) return <>{children(0)}</>;
  const count = paged ? paged.count : state.data === undefined ? 0 : repeatCount(state.data, block.repeat);

  const copies = Array.from({ length: Math.max(1, count) }, (_, index) => (
    <RepeatIndex.Provider key={index} value={(paged?.start ?? 0) + index}>
      {children(index)}
    </RepeatIndex.Provider>
  ));

  const pager = paged && (
    <Pager model={paged.model} onPage={paged.goTo} accent={block.repeatPaging?.accent} radius={block.repeatPaging?.radius} />
  );
  const layout = block.repeatLayout;
  // Carrusel (tablet y móvil): las copias van en una fila deslizable en lugar de una rejilla.
  const fold = foldOf(block, device);
  if (fold?.kind === "carousel") {
    return (
      <>
        <Carousel fold={fold} available={availableWidth(device, margin)} gap={layout?.gap}>{copies}</Carousel>
        {pager}
      </>
    );
  }
  if (!layout) return <>{copies}{pager}</>;

  // En tablet y móvil las columnas se ajustan al ancho, y cada copia se adapta al ancho de su casilla.
  const copyWidth = block.size?.width ?? components.find((c) => c.id === block.componentId)?.width ?? 0;
  const columns = columnsFor(layout, device, copyWidth, margin);
  const cell = isAdaptive(device) ? cellWidth(availableWidth(device, margin), columns, layout.gap) : null;

  return (
    <>
      <div
        data-repeat-grid=""
        className="grid max-w-full justify-center"
        style={{ gridTemplateColumns: `repeat(${columns}, max-content)`, gap: layout.gap }}
      >
        <CellWidth.Provider value={cell}>{copies}</CellWidth.Provider>
      </div>
      {pager}
    </>
  );
}
