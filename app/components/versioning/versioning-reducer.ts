import type { LocalVersioningState, PullRequest, VersioningAction } from "./types";

function updatePullRequest(state: LocalVersioningState, number: number, update: (pr: PullRequest) => PullRequest): LocalVersioningState {
  return { ...state, pullRequests: state.pullRequests.map((pr) => (pr.number === number ? update(pr) : pr)) };
}

/** Un manejador por tipo de acción: añadir una acción nueva es añadir una entrada aquí. */
type Handlers = {
  [K in VersioningAction["type"]]: (state: LocalVersioningState, action: Extract<VersioningAction, { type: K }>) => LocalVersioningState;
};

const HANDLERS: Handlers = {
  // Lo del servidor manda. Los conflictos que ya se mostraron (y lo que se eligió en ellos) se conservan mientras la pull request siga abierta.
  "server/load": (state, action) => ({
    ...state,
    branches: action.branches,
    commits: action.commits,
    issues: action.issues,
    labels: action.labels,
    people: action.people,
    releases: action.releases,
    pullRequests: action.pullRequests.map((pr) => {
      const known = state.pullRequests.find((item) => item.number === pr.number);
      return known && pr.status === "open" ? { ...pr, conflicts: known.conflicts } : pr;
    }),
  }),

  "review/conflicts": (state, action) => updatePullRequest(state, action.number, (pr) => ({ ...pr, conflicts: action.conflicts })),

  "pr/resolve": (state, action) =>
    updatePullRequest(state, action.number, (pr) => ({
      ...pr,
      conflicts: pr.conflicts.map((conflict, index) => (index === action.index ? { ...conflict, resolution: action.resolution } : conflict)),
    })),
};

export function versioningReducer(state: LocalVersioningState, action: VersioningAction): LocalVersioningState {
  // TypeScript no puede relacionar el tipo de la acción con su manejador, pero `Handlers` lo garantiza.
  const handle = HANDLERS[action.type] as (state: LocalVersioningState, action: VersioningAction) => LocalVersioningState;
  return handle(state, action);
}
