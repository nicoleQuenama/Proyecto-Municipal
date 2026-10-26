"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarStack } from "../ui/avatar";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";

interface AssigneePickerProps {
  members: string[];
  value: string[];
  onToggle: (member: string) => void;
  label: string;
}

/** Botón con los asignados actuales; al abrirlo se marcan o desmarcan miembros del equipo. */
export function AssigneePicker({ members, value, onToggle, label }: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-xs hover:bg-hover"
      >
        {value.length > 0 ? (
          <AvatarStack names={value} />
        ) : (
          <span className="text-ink-dim">Sin asignar</span>
        )}
      </button>

      {open && (
        <TopLayer anchorRef={button} side="bottom-end" className="w-52 rounded-lg border border-line bg-panel p-1 shadow-2xl">
        <fieldset>
          <legend className="sr-only">{label}</legend>
          {members.map((member) => (
            <label
              key={member}
              className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-xs hover:bg-hover"
            >
              <input
                type="checkbox"
                checked={value.includes(member)}
                onChange={() => onToggle(member)}
                className="h-3.5 w-3.5 accent-accent"
              />
              <Avatar name={member} />
              {member}
            </label>
          ))}
        </fieldset>
        </TopLayer>
      )}
    </div>
  );
}
