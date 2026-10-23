"use client";

import { useState } from "react";

const TAGS = [
  ["p", "Párrafo"],
  ["h2", "Subtítulo"],
  ["h3", "Título pequeño"],
];

/** Agrega un texto nuevo justo debajo del elemento elegido. */
export function InsertBelow({ onInsert }: { onInsert: (tag: string, text: string) => void }) {
  const [tag, setTag] = useState("p");
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onInsert(tag, text.trim());
    setText("");
  };

  return (
    <fieldset className="flex flex-col gap-1.5 border-t border-line pt-3">
      <legend className="sr-only">Agregar elemento debajo</legend>
      <span className="text-xs text-ink-dim">Agregar un texto debajo</span>
      <div className="flex gap-2">
        <select
          aria-label="Tipo de texto"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="h-8 rounded-md border border-line bg-canvas px-2 text-xs"
        >
          {TAGS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          aria-label="Texto nuevo"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Escribe y pulsa Enter"
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-[13px] outline-none focus:border-accent"
        />
      </div>
    </fieldset>
  );
}
