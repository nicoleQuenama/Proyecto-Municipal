"use client";

import { useState, type ReactNode } from "react";

interface FloatingFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  autoComplete: string;
  type?: "text" | "password";
  onChange: (value: string) => void;
  trailing?: ReactNode;
}

/** Campo con etiqueta dentro del cuadro, que sube al enfocar o cuando ya hay texto. */
export function FloatingField({
  label,
  icon,
  value,
  autoComplete,
  type = "text",
  onChange,
  trailing,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <label className="group relative flex h-14 items-center gap-2.5 rounded-xl border border-line bg-canvas/70 px-3 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-accent/70 focus-within:bg-canvas focus-within:ring-2 focus-within:ring-accent/20">
      <span className={`shrink-0 transition-colors duration-200 ${focused ? "text-accent" : "text-ink-dim"}`}>
        {icon}
      </span>

      <span className="pointer-events-none absolute top-1/2 left-10 -translate-y-1/2">
        <span
          className={`block origin-left text-sm transition-all duration-200 ease-out motion-reduce:transition-none ${
            floating
              ? `-translate-y-3.5 scale-[0.82] font-medium ${focused ? "text-accent" : "text-ink-dim"}`
              : "text-ink-dim"
          }`}
        >
          {label}
        </span>
      </span>

      <input
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent pt-5 text-sm text-ink outline-none"
      />

      {trailing}
    </label>
  );
}
