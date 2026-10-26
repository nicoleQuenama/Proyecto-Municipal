"use client";

import { useState } from "react";
import { categoryChoices, categoryLabel, normalizeCategory } from "../site/categories";
import { useSite } from "../site/site-context";
import type { ComponentCategory } from "../site/types";

const NEW_CATEGORY = "\u0000nueva";

interface CategorySelectProps {
  value: ComponentCategory;
  onChange: (category: ComponentCategory) => void;
  className: string;
}

/** Elige la categoría del componente: las conocidas, las propias ya creadas y «Nueva categoría…». */
export function CategorySelect({ value, onChange, className }: CategorySelectProps) {
  const { components } = useSite();
  const [creating, setCreating] = useState(false);

  const commit = (input: string) => {
    const name = normalizeCategory(input);
    if (name) onChange(name);
    setCreating(false);
  };

  if (creating) {
    return (
      <input
        autoFocus
        aria-label="Nombre de la nueva categoría"
        placeholder="Nueva categoría (Enter)"
        maxLength={24}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
          if (e.key === "Escape") {
            e.stopPropagation(); // no cierra el constructor
            setCreating(false);
          }
        }}
        className={className}
      />
    );
  }

  return (
    <select
      aria-label="Categoría"
      value={value}
      onChange={(e) => (e.target.value === NEW_CATEGORY ? setCreating(true) : onChange(e.target.value))}
      className={className}
    >
      {categoryChoices(components, value).map((category) => (
        <option key={category} value={category}>{categoryLabel(category)}</option>
      ))}
      <option value={NEW_CATEGORY}>Nueva categoría…</option>
    </select>
  );
}
