"use client";

import { CommitTimeline } from "./commit-timeline";
import { useVersioning } from "./versioning-context";

export function HistoryTab() {
  const { state } = useVersioning();
  const commits = state.commits.filter((c) => c.branch === state.current);

  return (
    <div className="p-4">
      <CommitTimeline
        commits={commits}
        liveCommitId={state.releases[0]?.commitId}
        emptyMessage="Esta rama todavía no tiene versiones. Haz la primera desde la pestaña Publicar."
      />
    </div>
  );
}
