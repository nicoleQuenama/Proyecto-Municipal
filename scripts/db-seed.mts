/**
 * Carga inicial de la base de datos: crea la organización, su proyecto y, en desarrollo, tres cuentas de prueba.
 *   pnpm db:seed
 * Se puede repetir: lo que ya existe no se duplica. En producción no crea cuentas de prueba: la organización y su primer
 * superadministrador se dan de alta con `app.provision_organization` (ver db/README.md).
 * Usa DATABASE_ADMIN_URL (el dueño de las tablas): es una tarea de operación, no de la API.
 */
import postgres from "postgres";
import { hashPassword } from "../app/server/password-hash.ts";

const DEMO = [
  { name: "Super Admin", username: "superadmin", email: "superadmin@portal.dev", role: "superadmin" as const, password: "SuperAdmin2026!" },
  { name: "Desarrollador", username: "dev", email: "dev@portal.dev", role: "dev" as const, password: "Dev2026!" },
  { name: "Diseñador", username: "designer", email: "designer@portal.dev", role: "designer" as const, password: "Designer2026!" },
];

if (process.env.NODE_ENV === "production") throw new Error("En producción no se crean cuentas de prueba: da de alta la organización con app.provision_organization.");

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("Falta DATABASE_ADMIN_URL (ver .env.example).");
const sql = postgres(adminUrl, { prepare: false, onnotice: () => undefined });

const accounts = await Promise.all(DEMO.map(async (demo) => ({ ...demo, passwordHash: await hashPassword(demo.password) })));
const first = accounts[0];

const slug = process.env.PORTAL_ORG_SLUG ?? "portal";
const [existing] = await sql<{ id: string }[]>`select id from app.organizations where slug = ${slug}`;
const orgId =
  existing?.id ??
  (await sql<{ id: string }[]>`
    select app.provision_organization(${slug}, ${process.env.PORTAL_ORG_NAME ?? "Portal"}, ${first.email}, ${first.name}, ${first.username}, ${first.passwordHash}) as id`)[0].id;

const [project] = await sql<{ id: string }[]>`select id from app.projects where organization_id = ${orgId} and deleted_at is null limit 1`;
const projectId = project?.id ?? (await sql<{ id: string }[]>`
  insert into app.projects (organization_id, slug, name) values (${orgId}, 'proyecto-municipal', 'Proyecto Municipal') returning id`)[0].id;

let created = 0;
for (const account of accounts) {
  const [row] = await sql<{ id: string }[]>`select id from app.users where organization_id = ${orgId} and email = ${account.email} and deleted_at is null`;
  if (row) continue;
  const [made] = await sql<{ id: string }[]>`
    insert into app.users (organization_id, email, username, name, role, password_hash)
    values (${orgId}, ${account.email}, ${account.username}, ${account.name}, ${account.role}, ${account.passwordHash}) returning id`;
  created += 1;
  if (account.role !== "superadmin") {
    await sql`
      insert into app.project_members (organization_id, project_id, user_id, member_role)
      values (${orgId}, ${projectId}, ${made.id}, 'editor') on conflict (organization_id, project_id, user_id) do nothing`;
  }
}

console.log(`Organización «${slug}» lista. Cuentas de prueba: ${accounts.length} (${created} nuevas).`);
await sql.end();
