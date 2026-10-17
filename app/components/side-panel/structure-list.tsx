export interface StructureItem {
  id: string;
  name: string;
  meta: string;
  icon: string;
  removable: boolean;
}

interface StructureListProps {
  items: StructureItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

/** Los elementos de la página actual: barras de navegación, titular y bloques, en el orden en que aparecen. */
export function StructureList({ items, activeId, onSelect, onRemove }: StructureListProps) {
  return (
    <ul aria-label="Estructura de la página" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id} className="group flex items-center">
            <button
              type="button"
              aria-current={active}
              onClick={() => onSelect(item.id)}
              className={`flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-[13px] ${
                active ? "bg-accent/25" : "hover:bg-hover"
              }`}
            >
              <span aria-hidden className={`w-4 text-center ${active ? "text-accent" : "text-ink-dim"}`}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              {active ? (
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Editando
                </span>
              ) : (
                <span className="truncate text-[11px] text-ink-dim">{item.meta}</span>
              )}
            </button>
            {item.removable && (
              <button
                type="button"
                aria-label={`Quitar ${item.name}`}
                onClick={() => onRemove(item.id)}
                className="ml-0.5 hidden h-6 w-6 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink group-hover:flex focus:flex"
              >
                ×
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
