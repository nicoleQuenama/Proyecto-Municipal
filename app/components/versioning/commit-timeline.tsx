import { Badge } from "../ui/badge";
import { ChangeChip } from "./diff-row";
import { formatDateTime } from "./format-date";
import type { Commit } from "./types";
import { CommitIcon } from "./versioning-icons";

interface CommitTimelineProps {
  commits: Commit[];
  emptyMessage: string;
  /** Versión que está en la página oficial, si está en esta lista. */
  liveCommitId?: string;
}

/** Versiones de una rama, cada una con los cambios de diseño que introdujo. */
export function CommitTimeline({ commits, emptyMessage, liveCommitId }: CommitTimelineProps) {
  if (commits.length === 0) {
    return <p className="py-6 text-center text-[13px] text-ink-dim">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-col">
      {commits.map((commit, index) => (
        <li key={commit.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 text-accent"><CommitIcon /></span>
            {index < commits.length - 1 && <span aria-hidden className="w-px flex-1 bg-line" />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-4">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-medium">
                {commit.message}
                {commit.id === liveCommitId && <Badge tone="success">En la página oficial</Badge>}
              </p>
              <p className="text-xs text-ink-dim">
                <code>{commit.id}</code> · {commit.author} · {formatDateTime(commit.at)}
              </p>
            </div>

            {commit.changes.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {commit.changes.map((change) => (
                  <ChangeChip key={`${change.node}-${change.property}-${change.after}`} change={change} showNode />
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-dim">Sin cambios detallados en este prototipo.</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
