import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { formatDateTime } from "./format-date";
import type { Commit } from "./types";

interface CommitCardProps {
  label: string;
  commit: Commit;
  live?: boolean;
}

/** Quién guardó la versión, cuándo, y su mensaje (el commit). */
export function CommitCard({ label, commit, live }: CommitCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
      <Avatar name={commit.author} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{label}</p>
        <p className="truncate text-[13px] font-medium">{commit.message}</p>
        <p className="text-xs text-ink-dim">
          <code>{commit.id}</code> · {commit.author} · {formatDateTime(commit.at)}
        </p>
      </div>
      {live && <Badge tone="success">En la página oficial</Badge>}
    </div>
  );
}
