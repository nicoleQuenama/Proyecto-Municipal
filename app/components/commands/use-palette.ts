"use client";

import { useMemo, useState } from "react";
import { useCommands } from "./commands-context";
import { searchContent } from "./slash/content-search";
import { filterByQuery, matchesQuery, normalize } from "./slash/text-match";
import type { Step, Verb } from "./slash/types";
import { createVerbs } from "./slash/verbs";

/** Una línea de la paleta: un comando, un contenido encontrado, un comando «/» o una opción de un paso. */
export interface PaletteRow {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  shortcut?: string | null;
  /** Lo que hace; si devuelve un paso, la paleta sigue con él en lugar de cerrarse. */
  run: () => Step | void;
}

interface TrailItem {
  label: string;
  step: Step;
}

/** «/crear » (comando + espacio) ya elige el comando; lo que sigue filtra sus opciones. */
const TYPED_VERB = /^\/(\S+)\s([\s\S]*)$/;

/**
 * El estado de la paleta: lo escrito, el camino de pasos recorrido (/crear › Página › …)
 * y las líneas que se ofrecen en cada momento.
 */
export function usePalette() {
  const { commands, closeDialog, slash } = useCommands();
  const verbs = useMemo<Verb[]>(() => createVerbs(slash), [slash]);

  const [query, setQueryState] = useState("");
  const [index, setIndex] = useState(0);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const step = trail.at(-1)?.step ?? null;

  const enter = (next: Step, label: string) => {
    setTrail((current) => [...current, { label, step: next }]);
    setQueryState(next.kind === "prompt" ? (next.initial ?? "") : "");
    setIndex(0);
    setError(null);
  };

  const setQuery = (value: string) => {
    setError(null);
    setIndex(0);

    const typed = step ? null : TYPED_VERB.exec(value);
    const verb = typed && verbs.find((v) => v.name === normalize(typed[1]));
    if (verb && typed) {
      enter(verb.start(), `/${verb.name}`);
      setQueryState(typed[2]);
      return;
    }
    setQueryState(value);
  };

  const rows = useMemo<PaletteRow[]>(() => {
    if (step?.kind === "prompt") return [];
    if (step) return filterByQuery(step.suggestions, query);

    if (query.startsWith("/")) {
      const partial = normalize(query.slice(1).trim());
      return verbs
        .filter((verb) => verb.name.startsWith(partial))
        .map((verb) => ({ id: verb.name, label: `/${verb.name}`, hint: verb.description, run: verb.start }));
    }

    const needle = query.trim();
    const commandRows = commands
      .filter((command) => matchesQuery(`${command.label} ${command.group}`, needle))
      .map<PaletteRow>((command) => ({
        id: command.id,
        label: command.label,
        group: command.group,
        shortcut: command.shortcut,
        run: () => {
          closeDialog();
          command.run();
        },
      }));
    const contentRows = searchContent(slash.site, needle).map<PaletteRow>((hit) => ({
      id: hit.id,
      label: hit.label,
      hint: hit.detail,
      group: "Contenido",
      run: () => slash.goTo(hit.pageId, hit.blockId),
    }));

    return [...commandRows, ...contentRows];
  }, [step, query, verbs, commands, closeDialog, slash]);

  const activeIndex = Math.min(index, rows.length - 1);

  const choose = (position: number) => {
    const row = rows[position];
    if (!row) return;

    const next = row.run();
    if (next) enter(next, row.label);
    else closeDialog();
  };

  const submit = () => {
    if (step?.kind !== "prompt") return;

    const result = step.submit(query);
    if (typeof result === "string") setError(result);
    else if (result) enter(result, query.trim());
    else closeDialog();
  };

  const back = () => {
    setTrail((current) => current.slice(0, -1));
    setQueryState("");
    setIndex(0);
    setError(null);
  };

  return { query, setQuery, trail, step, rows, activeIndex, setIndex, error, choose, submit, back };
}
