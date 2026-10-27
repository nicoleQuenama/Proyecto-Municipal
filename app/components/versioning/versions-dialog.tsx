"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "../auth/auth-context";
import { useCommands } from "../commands/commands-context";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { BranchesTab } from "./branches-tab";
import { ChangesTab } from "./changes-tab";
import { DialogNav } from "./dialog-nav";
import { HistoryTab } from "./history-tab";
import { IssuesTab } from "./issues-tab";
import { NAV_ITEMS, type NavCounts, type TabId } from "./nav-items";
import { OverviewTab } from "./overview-tab";
import { ShareButton } from "./share-button";
import { PullRequestsTab } from "./pull-requests-tab";
import { pendingFor } from "./group-rules";
import { useAdvancedMode } from "./use-advanced-mode";
import { useWorkingChanges } from "./use-working-changes";
import { useVersioning } from "./versioning-context";

/** Qué se dibuja en cada sección; `goTo` deja que una sección lleve a otra. */
const CONTENT: Record<TabId, (goTo: (tab: TabId) => void) => ReactNode> = {
  overview: (goTo) => <OverviewTab onGoTo={goTo} />,
  changes: () => <ChangesTab />,
  history: () => <HistoryTab />,
  branches: () => <BranchesTab />,
  pulls: () => <PullRequestsTab />,
  issues: () => <IssuesTab />,
};

export function VersionsDialog() {
  const { dialog, closeDialog } = useCommands();
  if (dialog !== "versions") return null;

  return (
    <Modal label="Versiones y publicación" size="xl" onClose={closeDialog}>
      <VersionsPanel />
    </Modal>
  );
}

function VersionsPanel() {
  const { state, mustBranch } = useVersioning();
  const { currentUser } = useAuth();
  const { changes } = useWorkingChanges();
  const { closeDialog } = useCommands();
  const [advanced, setAdvanced] = useAdvancedMode();

  // En un equipo de trabajo las revisiones se ven siempre, sin activar el modo avanzado; y si hay alguna esperando
  // tu respuesta, el panel se abre directamente ahí.
  const inTeam = mustBranch || state.pullRequests.some((pr) => pr.authorId !== undefined);
  const alsoShow: TabId[] = inTeam ? ["pulls"] : [];
  const [tab, setTab] = useState<TabId>(() => (pendingFor(currentUser, state.pullRequests).length > 0 ? "pulls" : "overview"));

  const counts: NavCounts = {
    changes: changes.length,
    branches: state.branches.length,
    pulls: state.pullRequests.filter((pr) => pr.status === "open").length,
    issues: state.issues.filter((issue) => issue.open).length,
  };

  // Al apagar el modo avanzado, una sección avanzada abierta vuelve al resumen.
  const toggleAdvanced = (on: boolean) => {
    setAdvanced(on);
    if (!on && NAV_ITEMS.find((item) => item.id === tab)?.advanced && !alsoShow.includes(tab)) setTab("overview");
  };

  return (
    <div>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Versiones y publicación</h2>
          <Badge tone="accent">{state.current}</Badge>
        </div>
        <div className="flex items-center gap-2">
        <ShareButton className="h-7 rounded-md border border-line px-3 text-xs hover:bg-hover" />
        <button
          type="button"
          aria-label="Cerrar"
          onClick={closeDialog}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
        </div>
      </header>

      <div className="flex h-[min(34rem,72vh)]">
        <DialogNav tab={tab} onSelect={setTab} counts={counts} advanced={advanced} onAdvanced={toggleAdvanced} alsoShow={alsoShow} />
        <div role="tabpanel" className="min-w-0 flex-1 overflow-y-auto">
          {CONTENT[tab](setTab)}
        </div>
      </div>
    </div>
  );
}
