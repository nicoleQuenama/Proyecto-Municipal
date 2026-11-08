"use client";

import { useEffect, useRef } from "react";
import type { MenuItem } from "./node-menu";

/** Un menú de clic derecho en la posición del puntero; se cierra al pulsar fuera, con Esc o al elegir. */
export function ContextMenu({
  x,
  y,
  items,
  onPick,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onPick: (item: MenuItem) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const away = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // El Esc cierra solo el menú, no el editor entero.
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, [onClose]);

  return (
    <ul
      ref={ref}
      role="menu"
      style={{ left: x, top: y }}
      className="fixed z-50 min-w-48 rounded-md border border-line bg-panel p-1 text-xs text-ink shadow-xl"
    >
      {items.map((item) => (
        <li key={item.label} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => onPick(item)}
            className={`w-full rounded px-2 py-1.5 text-left hover:bg-hover ${item.danger ? "text-red-400" : ""} cursor-pointer`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
