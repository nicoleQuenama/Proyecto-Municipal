import type { Commit } from "./types";

export interface DayGroup {
  label: string;
  commits: Commit[];
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const longDay = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });

/** «Hoy», «Ayer» o la fecha completa. */
function dayLabel(date: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) return "Hoy";
  if (dayKey(date) === dayKey(yesterday)) return "Ayer";
  return longDay.format(date);
}

/** Agrupa las versiones por día (vienen de más reciente a más antigua). */
export function groupByDay(commits: Commit[], now = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const commit of commits) {
    const label = dayLabel(new Date(commit.at), now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.commits.push(commit);
    else groups.push({ label, commits: [commit] });
  }
  return groups;
}

/** Busca en el mensaje, el autor, el código de la versión y sus cambios. */
export function matchesCommit(commit: Commit, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = [commit.message, commit.author, commit.id, ...commit.changes.map((c) => `${c.node} ${c.property}`)]
    .join(" ")
    .toLowerCase();
  return words.every((word) => text.includes(word));
}
