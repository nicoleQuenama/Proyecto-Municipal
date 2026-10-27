"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Side } from "../ui/place-beside";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";

export interface MenuItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
  dividerBefore?: boolean;
}

interface MenuButtonProps<T extends string> {
  label: string;
  items: MenuItem<T>[];
  selected?: T;
  onSelect: (value: T) => void;
  className: string;
  /** Dónde se abre el menú respecto al botón. */
  placement?: Extract<Side, "top" | "bottom-start" | "bottom-end">;
  /** Texto de ayuda al final del menú. */
  footer?: ReactNode;
  children: ReactNode;
}

export function MenuButton<T extends string>({
  label,
  items,
  selected,
  onSelect,
  className,
  placement = "top",
  footer,
  children,
}: MenuButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        {children}
      </button>

      {open && (
        <TopLayer
          anchorRef={button}
          side={placement}
          className="min-w-56 max-w-64 overflow-y-auto rounded-lg border border-line bg-panel p-1 text-ink shadow-2xl"
        >
          <ul role="menu" aria-label={label}>
          {items.map((item) => (
            <li key={item.value} role="none">
              {item.dividerBefore && <hr className="my-1 border-line" />}
              <button
                type="button"
                role={selected === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={selected === undefined ? undefined : item.value === selected}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs hover:bg-hover ${
                  item.value === selected ? "text-accent" : "text-ink"
                }`}
              >
                {item.icon && <span className="flex w-4 justify-center">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
                {item.hint && <span className="text-ink-dim">{item.hint}</span>}
              </button>
            </li>
          ))}
          {footer && (
            <li role="none" className="border-t border-line px-2 pt-2 pb-1 text-[11px] text-ink-dim">
              {footer}
            </li>
          )}
          </ul>
        </TopLayer>
      )}
    </div>
  );
}
