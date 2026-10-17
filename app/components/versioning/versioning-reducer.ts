import {
  CURRENT_USER,
  type Change,
  type PullRequest,
  type VersioningAction,
  type VersioningState,
} from "./types";
import {
  canDeleteBranch,
  findLabel,
  headOf,
  mergeBlockers,
  summarizeChanges,
} from "./versioning-rules";

export const nextNumber = (items: { number: number }[]) =>
  items.reduce((max, item) => Math.max(max, item.number), 0) + 1;

function updatePullRequest(
  state: VersioningState,
  number: number,
  update: (pr: PullRequest) => PullRequest,
): VersioningState {
  return {
    ...state,
    pullRequests: state.pullRequests.map((pr) => (pr.number === number ? update(pr) : pr)),
  };
}

function withCommit(
  state: VersioningState,
  branch: string,
  message: string,
  at: string,
  changes: Change[] = [],
): VersioningState {
  const lastId = Math.max(0, ...state.commits.map((c) => Number(c.id.slice(1))));
  const commit = {
    id: `c${lastId + 1}`,
    branch,
    message,
    author: CURRENT_USER,
    at,
    changes,
  };
  return { ...state, commits: [commit, ...state.commits] };
}

export function versioningReducer(
  state: VersioningState,
  action: VersioningAction,
): VersioningState {
  switch (action.type) {
    case "branch/create":
      return {
        ...state,
        branches: [...state.branches, { name: action.name, author: CURRENT_USER, base: state.current }],
        current: action.name,
      };

    case "branch/switch":
      return { ...state, current: action.name };

    case "branch/delete": {
      const branch = state.branches.find((b) => b.name === action.name);
      const main = state.branches.find((b) => b.base === null);
      if (!branch || !main || !canDeleteBranch(branch)) return state;

      return {
        ...state,
        branches: state.branches.filter((b) => b.name !== action.name),
        current: state.current === action.name ? main.name : state.current,
        commits: state.commits.filter((c) => c.branch !== action.name),
        // Los PR abiertos de una rama eliminada ya no se pueden revisar: se cierran.
        pullRequests: state.pullRequests.map((pr) =>
          pr.status === "open" && (pr.from === action.name || pr.into === action.name)
            ? { ...pr, status: "closed" }
            : pr,
        ),
      };
    }

    case "stage/toggle":
      return {
        ...state,
        staged: state.staged.includes(action.key)
          ? state.staged.filter((key) => key !== action.key)
          : [...state.staged, action.key],
      };

    case "stage/set":
      return { ...state, staged: action.keys };

    case "commit": {
      if (action.changes.length === 0) return state;

      // Lo guardado pasa a ser la nueva referencia para detectar cambios.
      const baseline = { ...state.baseline };
      for (const { key, current } of action.changes) {
        if (current) baseline[key] = current;
        else delete baseline[key];
      }

      const saved = new Set(action.changes.map((change) => change.key));
      const changes = action.changes.map(({ node, property, before, after }) => ({
        node,
        property,
        before,
        after,
      }));

      return {
        ...withCommit(state, state.current, action.message, action.at, changes),
        baseline,
        staged: state.staged.filter((key) => !saved.has(key)),
      };
    }

    case "publish": {
      const head = headOf(state.commits, state.current);
      if (!head || state.releases[0]?.commitId === head.id) return state;

      const release = {
        id: `r${state.releases.length + 1}`,
        commitId: head.id,
        branch: state.current,
        message: head.message,
        author: CURRENT_USER,
        at: action.at,
      };
      return { ...state, releases: [release, ...state.releases] };
    }

    case "pr/open": {
      const changes = summarizeChanges(state.commits.filter((c) => c.branch === action.from));

      const pr: PullRequest = {
        number: nextNumber(state.pullRequests),
        title: action.title,
        from: action.from,
        into: action.into,
        author: CURRENT_USER,
        status: "open",
        approvals: [],
        requiredApprovals: 1,
        changes,
        conflicts: [],
      };
      return { ...state, pullRequests: [pr, ...state.pullRequests] };
    }

    case "pr/approve":
      return updatePullRequest(state, action.number, (pr) => ({
        ...pr,
        approvals: [...pr.approvals, CURRENT_USER],
      }));

    case "pr/resolve":
      return updatePullRequest(state, action.number, (pr) => ({
        ...pr,
        conflicts: pr.conflicts.map((c, i) =>
          i === action.index ? { ...c, resolution: action.resolution } : c,
        ),
      }));

    case "pr/close":
      return updatePullRequest(state, action.number, (pr) => ({ ...pr, status: "closed" }));

    case "pr/merge": {
      const pr = state.pullRequests.find((p) => p.number === action.number);
      if (!pr || pr.status !== "open" || mergeBlockers(pr).length > 0) return state;

      const merged = updatePullRequest(state, pr.number, (p) => ({ ...p, status: "merged" }));
      return withCommit(merged, pr.into, `Merge del PR #${pr.number}: ${pr.title}`, action.at);
    }

    case "issue/create": {
      const existing = findLabel(state.labels, action.label.name);
      const label = existing ?? { ...action.label, name: action.label.name.trim() };

      return {
        ...state,
        labels: existing ? state.labels : [...state.labels, label],
        issues: [
          {
            number: nextNumber(state.issues),
            title: action.title,
            label: label.name,
            author: CURRENT_USER,
            assignees: action.assignees,
            open: true,
          },
          ...state.issues,
        ],
      };
    }

    case "issue/toggle-assignee":
      return {
        ...state,
        issues: state.issues.map((issue) =>
          issue.number === action.number
            ? {
                ...issue,
                assignees: issue.assignees.includes(action.member)
                  ? issue.assignees.filter((name) => name !== action.member)
                  : [...issue.assignees, action.member],
              }
            : issue,
        ),
      };

    case "issue/toggle":
      return {
        ...state,
        issues: state.issues.map((i) => (i.number === action.number ? { ...i, open: !i.open } : i)),
      };
  }
}
