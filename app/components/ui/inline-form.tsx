"use client";

import { useState, type FormEvent, type ReactNode } from "react";

interface InlineFormProps {
  label: string;
  placeholder: string;
  submitLabel: string;
  /** Devuelve un mensaje de error para mostrarlo, o nada si todo salió bien. */
  onSubmit: (value: string) => string | void;
  /** Controles extra entre el campo y el botón (p. ej. un select). */
  children?: ReactNode;
}

export function InlineForm({
  label,
  placeholder,
  submitLabel,
  onSubmit,
  children,
}: InlineFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;

    const problem = onSubmit(text);
    if (problem) return setError(problem);

    setValue("");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          aria-label={label}
          aria-invalid={error !== null}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-[13px] outline-none placeholder:text-ink-dim focus:border-accent"
        />
        {children}
        <button
          type="submit"
          disabled={!value.trim()}
          className="h-9 shrink-0 rounded-md bg-accent px-3 text-xs font-medium text-white disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
