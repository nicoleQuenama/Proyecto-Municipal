"use client";

import { useState } from "react";
import { Badge } from "../ui/badge";
import { InlineForm } from "../ui/inline-form";
import { AssigneePicker } from "./assignee-picker";
import type { Label, LabelTone } from "./types";
import { useVersioning } from "./versioning-context";
import { IssueIcon } from "./versioning-icons";
import { findLabel, matchesAssignee, memberNames, type AssigneeFilter } from "./versioning-rules";

const CUSTOM = "__custom__";

const TONES: { value: LabelTone; text: string; swatch: string }[] = [
  { value: "accent", text: "Azul", swatch: "bg-accent" },
  { value: "success", text: "Verde", swatch: "bg-green-400" },
  { value: "danger", text: "Rojo", swatch: "bg-red-400" },
  { value: "warning", text: "Ámbar", swatch: "bg-amber-400" },
  { value: "neutral", text: "Gris", swatch: "bg-ink-dim" },
];

const selectClass =
  "h-9 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent [&>option]:bg-panel";

const toggleIn = (list: string[], item: string) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export function IssuesTab() {
  const { state, dispatch } = useVersioning();
  const [selected, setSelected] = useState(state.labels[0].name);
  const [customName, setCustomName] = useState("");
  const [customTone, setCustomTone] = useState<LabelTone>("accent");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [filter, setFilter] = useState<AssigneeFilter>("all");

  const names = memberNames(state.members);
  const isCustom = selected === CUSTOM;
  const toneOf = (name: string): LabelTone => findLabel(state.labels, name)?.tone ?? "neutral";
  const visibleIssues = state.issues.filter((issue) => matchesAssignee(issue, filter));

  const createIssue = (title: string) => {
    const label: Label | undefined = isCustom
      ? { name: customName.trim(), tone: customTone }
      : findLabel(state.labels, selected);

    if (!label?.name) return "Escribe un nombre para la etiqueta personalizada.";

    dispatch({ type: "issue/create", title, label, assignees });
    setAssignees([]);

    if (isCustom) {
      setSelected(findLabel(state.labels, label.name)?.name ?? label.name);
      setCustomName("");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <InlineForm
          label="Título del issue"
          placeholder="Reporta un problema o una idea…"
          submitLabel="Reportar"
          onSubmit={createIssue}
        >
          <select
            aria-label="Etiqueta del issue"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className={selectClass}
          >
            {state.labels.map((label) => (
              <option key={label.name} value={label.name}>{label.name}</option>
            ))}
            <option value={CUSTOM}>Personalizado…</option>
          </select>

          <AssigneePicker
            label="Asignar a"
            members={names}
            value={assignees}
            onToggle={(member) => setAssignees((current) => toggleIn(current, member))}
          />
        </InlineForm>

        {isCustom && (
          <div className="flex items-center gap-3">
            <input
              autoFocus
              aria-label="Nombre de la etiqueta personalizada"
              placeholder="Nombre de la etiqueta (p. ej. Accesibilidad)"
              value={customName}
              maxLength={24}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-xs outline-none placeholder:text-ink-dim focus:border-accent"
            />
            <div role="radiogroup" aria-label="Color de la etiqueta" className="flex items-center gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  role="radio"
                  aria-checked={customTone === tone.value}
                  aria-label={tone.text}
                  title={tone.text}
                  onClick={() => setCustomTone(tone.value)}
                  className={`h-5 w-5 rounded-full ${tone.swatch} ${
                    customTone === tone.value ? "ring-2 ring-white ring-offset-2 ring-offset-panel" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
            {customName.trim() && <Badge tone={customTone}>{customName.trim()}</Badge>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-dim">
          {visibleIssues.length} de {state.issues.length} issues
        </p>
        <select
          aria-label="Filtrar por asignado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`${selectClass} h-8`}
        >
          <option value="all">Todos</option>
          <option value="unassigned">Sin asignar</option>
          {names.map((member) => (
            <option key={member} value={member}>Asignados a {member}</option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col gap-1">
        {visibleIssues.map((issue) => (
          <li
            key={issue.number}
            className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
          >
            <span className={issue.open ? "text-green-400" : "text-ink-dim"}><IssueIcon /></span>

            <div className="min-w-0 flex-1">
              <p className={`truncate text-[13px] font-medium ${issue.open ? "" : "text-ink-dim line-through"}`}>
                {issue.title}
              </p>
              <p className="text-xs text-ink-dim">#{issue.number} · abierto por {issue.author}</p>
            </div>

            <Badge tone={toneOf(issue.label)}>{issue.label}</Badge>

            <AssigneePicker
              label={`Asignar el issue #${issue.number}`}
              members={names}
              value={issue.assignees}
              onToggle={(member) =>
                dispatch({ type: "issue/toggle-assignee", number: issue.number, member })
              }
            />

            <button
              type="button"
              onClick={() => dispatch({ type: "issue/toggle", number: issue.number })}
              className="h-7 rounded-md border border-line px-3 text-xs hover:bg-hover"
            >
              {issue.open ? "Cerrar" : "Reabrir"}
            </button>
          </li>
        ))}
        {visibleIssues.length === 0 && (
          <li className="py-6 text-center text-[13px] text-ink-dim">
            {state.issues.length === 0
              ? "Aún no hay tareas. Una tarea es un pendiente o una idea (p. ej. «Cambiar la foto de portada»): escríbela arriba, elige una etiqueta y, si quieres, a quién se la asignas."
              : "No hay tareas con ese filtro."}
          </li>
        )}
      </ul>
    </div>
  );
}
