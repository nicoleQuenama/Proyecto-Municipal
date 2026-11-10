"use client";

import { useState } from "react";

/** Un campo para escribir el nombre nuevo: Enter lo acepta, Esc o salir lo descarta. */
export function RenameField({
  initial,
  problem,
  onSubmit,
  onCancel,
}: {
  initial: string;
  problem: (name: string) => string | null;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const error = problem(value);

  return (
    <div className="min-w-0 flex-1 px-1">
      <input
        autoFocus
        value={value}
        aria-label="Nombre nuevo"
        aria-invalid={error !== null}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          } else if (e.key === "Enter" && !error) onSubmit(value);
        }}
        className={`h-6 w-full rounded border bg-canvas px-1.5 text-xs text-ink outline-none ${error ? "border-red-400" : "border-accent"}`}
      />
      {error ? <p className="mt-0.5 text-[10px] text-red-400">{error}</p> : null}
    </div>
  );
}
