import { peek } from "../data-sources/source-store";
import { repeatCount } from "../data-sources/resolve";
import type { DataSource } from "../data-sources/types";
import type { BlockInstance } from "../site/types";

/** Cuántas copias saca una sección repetida según los datos que ya llegaron (0 si aún no hay). */
export const copiesFrom =
  (sources: DataSource[]) =>
  (block: BlockInstance): number => {
    const source = sources.find((s) => s.id === block.repeat?.sourceId);
    const data = source && peek(source).data;
    return block.repeat && data !== undefined ? repeatCount(data, block.repeat) : 0;
  };
