/**
 * Alta de una organización nueva: SOLO la hacen los dueños del sistema (quien tiene DATABASE_ADMIN_URL), nunca la app.
 *   pnpm org:create <slug> "<Nombre>" <correo-del-superadmin> "<Nombre del superadmin>" <usuario> <contraseña>
 * Se crea con UNA sola cuenta: su superadministrador. Él arma después su propio equipo (invita a quien quiera y con el rol
 * que quiera) desde la app; los dueños del sistema no crean ninguna otra cuenta.
 */
import postgres from "postgres";
import { hashPassword } from "../app/server/password-hash.ts";

const [slug, name, email, adminName, username, password] = process.argv.slice(2);
if (!slug || !name || !email || !adminName || !username || !password) {
  console.error('Uso: pnpm org:create <slug> "<Nombre>" <correo> "<Nombre del superadmin>" <usuario> <contraseña>');
  process.exit(1);
}
if (!/^[a-z0-9-]{3,40}$/.test(slug)) throw new Error("El slug lleva de 3 a 40 letras minúsculas, números o guiones.");
if (password.length < 10) throw new Error("La contraseña del superadministrador debe tener al menos 10 caracteres.");

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("Falta DATABASE_ADMIN_URL (ver .env.example).");
const sql = postgres(adminUrl, { prepare: false, onnotice: () => undefined });

const [{ id }] = await sql<{ id: string }[]>`
  select app.provision_organization(${slug}, ${name}, ${email}, ${adminName}, ${username}, ${await hashPassword(password)}) as id`;
await sql.end();
console.log(`Organización «${name}» creada (${id}) con su superadministrador ${email}.`);
