"use client";

import { useState } from "react";
import { normalizeValue } from "../styles/resolve";
import type { PropKind } from "../styles/types";
import { FONT_OPTIONS } from "../title-editor/constants";

const controlClass =
  "h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent [&>option]:bg-panel";

const WEIGHT_OPTIONS = [
  { value: "400", label: "Normal" },
  { value: "700", label: "Negrita" },
];

const ALIGN_CHOICES = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
];

/** El selector de color nativo solo entiende #rrggbb. */
function sixDigitHex(hex: string | undefined): string {
  if (!hex) return "#cccccc";
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : "#cccccc";
}

interface SizeInputProps {
  label: string;
  value: string | undefined;
  placeholder?: string;
  unsettable: boolean;
  onCommit: (value: string | null) => void;
}

/** Texto libre validado: "10" se guarda como "10px"; un valor inválido no se aplica. */
function SizeInput({ label, value, placeholder, unsettable, onCommit }: SizeInputProps) {
  const [draft, setDraft] = useState(value ?? "");
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    const text = draft.trim();
    if (!text) {
      setInvalid(false);
      if (unsettable) onCommit(null);
      else setDraft(value ?? "");
      return;
    }

    const normalized = normalizeValue("size", text);
    if (normalized === null) return setInvalid(true);

    setInvalid(false);
    setDraft(normalized);
    onCommit(normalized);
  };

  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
      title={invalid ? "Escribe un tamaño, p. ej. 10 o 10px" : undefined}
      placeholder={placeholder ?? "p. ej. 10px"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className={`${controlClass} ${invalid ? "border-red-500" : ""}`}
    />
  );
}

interface LiteralInputProps {
  kind: PropKind;
  label: string;
  value: string | undefined;
  /** Lo que se vería si no hubiera valor propio (se muestra como pista). */
  placeholder?: string;
  /** Si se indica, los selectores ofrecen una opción vacía con este texto = «sin valor propio». */
  unsetLabel?: string;
  onCommit: (value: string | null) => void;
}

/** Control para un valor directo, según su tipo: color, tamaño, tipografía, peso o alineación. */
export function LiteralInput({ kind, label, value, placeholder, unsetLabel, onCommit }: LiteralInputProps) {
  if (kind === "color") {
    return (
      <input
        type="color"
        aria-label={label}
        value={sixDigitHex(value ?? placeholder)}
        onChange={(e) => onCommit(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-md border border-line bg-canvas p-1"
      />
    );
  }

  if (kind === "size") {
    // key: al cambiar el valor desde fuera (otra variable, otro ámbito) el borrador se reinicia.
    return (
      <SizeInput
        key={value ?? ""}
        label={label}
        value={value}
        placeholder={placeholder}
        unsettable={unsetLabel !== undefined}
        onCommit={onCommit}
      />
    );
  }

  const options =
    kind === "font"
      ? FONT_OPTIONS
      : kind === "weight"
        ? WEIGHT_OPTIONS
        : ALIGN_CHOICES;
  const known = value === undefined || options.some((option) => option.value === value);

  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onCommit(e.target.value === "" ? null : e.target.value)}
      className={controlClass}
    >
      {unsetLabel !== undefined && <option value="">{unsetLabel}</option>}
      {!known && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
