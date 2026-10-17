"use client";

import { useState, type ReactNode } from "react";
import { useCommands } from "../commands/commands-context";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { BranchesTab } from "./branches-tab";
import { HistoryTab } from "./history-tab";
import { IssuesTab } from "./issues-tab";
import { PublishTab } from "./publish-tab";
import { PullRequestsTab } from "./pull-requests-tab";
import { useVersioning } from "./versioning-context";
import { UploadIcon } from "../viewport/icons";
import {
  BranchIcon,
  CommitIcon,
  IssueIcon,
  PullRequestIcon,
} from "./versioning-icons";

type TabId = "publish" | "history" | "branches" | "pulls" | "issues";

const TABS: { id: TabId; label: string; icon: ReactNode; content: ReactNode }[] = [
  { id: "publish", label: "Publicar", icon: <UploadIcon />, content: <PublishTab /> },
  { id: "history", label: "Historial", icon: <CommitIcon />, content: <HistoryTab /> },
  { id: "branches", label: "Ramas", icon: <BranchIcon />, content: <BranchesTab /> },
  { id: "pulls", label: "Pull requests", icon: <PullRequestIcon />, content: <PullRequestsTab /> },
  { id: "issues", label: "Issues", icon: <IssueIcon />, content: <IssuesTab /> },
];

export function VersionsDialog() {
  const { dialog, closeDialog } = useCommands();
  if (dialog !== "versions") return null;

  return (
    <Modal label="Control de versiones" size="lg" onClose={closeDialog}>
      <VersionsPanel />
    </Modal>
  );
}

function VersionsPanel() {
  const { state } = useVersioning();
  const { closeDialog } = useCommands();
  const [tab, setTab] = useState<TabId>("publish");

  return (
    <div>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Control de versiones</h2>
          <Badge tone="accent">{state.current}</Badge>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={closeDialog}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </header>

      <div role="tablist" className="flex gap-1 border-b border-line px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs transition-colors ${
              tab === t.id ? "bg-hover text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="h-[min(30rem,60vh)] overflow-y-auto">
        {TABS.find((t) => t.id === tab)?.content}
      </div>
    </div>
  );
}
