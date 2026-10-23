"use client";

import { SearchIcon } from "../viewport/icons";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Campo de búsqueda con botón para borrar lo escrito. */
export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <div className="relative flex-1">
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-dim">
        <SearchIcon />
      </span>
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-line bg-canvas pr-3 pl-9 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
      />
    </div>
  );
}
