import type { Actor } from "./auth-accounts";
import { currentProject } from "./auth-members";
import { withOrg, type Tx } from "./db";
import type { Scope } from "./site/site-sql";

/** Corre `work` con los permisos de quien hace la petición, situado en su organización y en el proyecto en que trabaja. */
export function inProject<T>(actor: Actor, work: (tx: Tx, scope: Scope) => Promise<T>): Promise<T> {
  return withOrg(actor.orgId, actor.user.id, async (tx) => work(tx, { org: actor.orgId, project: await currentProject(tx) }));
}
