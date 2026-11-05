/**
 * Crea la base de datos del portal en TU Postgres (el de Docker o uno instalado) en un solo paso:
 *   pnpm db:setup
 * 1) aplica las migraciones de db/migrations que falten, 2) crea el usuario con el que se conecta la app (el de DATABASE_URL)
 * y 3) carga la organización y las cuentas de prueba (`db-seed`). Se puede repetir: no vuelve a aplicar lo ya aplicado.
 * Necesita que exista la base de datos vacía (p. ej. `createdb portal`) y DATABASE_ADMIN_URL / DATABASE_URL en .env.local.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const adminUrl = process.env.DATABASE_ADMIN_URL;
const appUrl = process.env.DATABASE_URL;
if (!adminUrl || !appUrl) throw new Error("Faltan DATABASE_ADMIN_URL y DATABASE_URL: copia .env.example a .env.local y ajústalos.");

const sql = postgres(adminUrl, { prepare: false, onnotice: () => undefined, max: 1 });

try {
  await sql`select 1`;
} catch (error) {
  throw new Error(`No se pudo conectar a DATABASE_ADMIN_URL: ${error instanceof Error ? error.message : error}. ¿Existe la base de datos y está encendido Postgres?`);
}

await sql`create table if not exists public.portal_migrations (name text primary key, applied_at timestamptz not null default now())`;
const folder = join(import.meta.dirname, "..", "db", "migrations");
const files = readdirSync(folder).filter((name) => name.endsWith(".sql")).sort();
const done = new Set((await sql`select name from public.portal_migrations`).map((row) => row.name as string));

// Una base creada antes de existir este comando (p. ej. con `pnpm db:up`) ya tiene todo: solo se anota.
const [{ exists }] = await sql<{ exists: boolean }[]>`select to_regclass('app.organizations') is not null as exists`;
if (done.size === 0 && exists) {
  for (const name of files) await sql`insert into public.portal_migrations (name) values (${name})`;
  console.log(`La base ya tenía el esquema: ${files.length} migraciones anotadas, nada que aplicar.`);
} else {
  for (const name of files.filter((file) => !done.has(file))) {
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(folder, name), "utf8"));
      await tx`insert into public.portal_migrations (name) values (${name})`;
    });
    console.log(`Migración aplicada: ${name}`);
  }
}

// El usuario de la app: rol sin privilegios propios (sujeto a RLS), con el nombre y la contraseña de DATABASE_URL.
const { username, password } = new URL(appUrl);
const user = decodeURIComponent(username);
if (!/^[a-z_][a-z0-9_]*$/.test(user)) throw new Error("El usuario de DATABASE_URL solo puede llevar minúsculas, números y guion bajo.");
const [role] = await sql`select 1 from pg_roles where rolname = ${user}`;
if (!role) await sql.unsafe(`create role ${user} login password '${decodeURIComponent(password).replace(/'/g, "''")}' in role portal_app connection limit 50`);
await sql.unsafe(`alter role ${user} set search_path = app, pg_catalog`);
await sql.unsafe(`alter role ${user} set statement_timeout = '15s'`);
await sql.unsafe(`alter role ${user} set idle_in_transaction_session_timeout = '10s'`);
await sql.unsafe(`alter role ${user} set lock_timeout = '2s'`);
await sql.end();

await import("./db-seed.mts");
