/**
 * Mantenimiento de la plataforma (usa DATABASE_ADMIN_URL: es trabajo de operación, no de la API):
 *   pnpm maintenance            una vez
 *   pnpm maintenance --dry      solo dice qué haría, sin borrar nada
 *   pnpm maintenance --loop     cada 24 h (lo usa `pnpm start` con RUN_MAINTENANCE=1)
 * 1) Borra de ImageKit y de la base los archivos que ya nadie usa (ni el diseño, ni una versión, ni una publicación; 7 días de
 *    gracia) y las subidas que se cortaron. 2) Limpia la caché de APIs vencida y los enlaces de contraseña viejos.
 */
import postgres from "postgres";
import { deleteFromImageKit, findFileId, imagekitConfigured } from "../app/server/media/imagekit.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const dry = process.argv.includes("--dry");
const loop = process.argv.includes("--loop");

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) throw new Error("Falta DATABASE_ADMIN_URL (ver .env.example).");
const sql = postgres(adminUrl, { prepare: false, onnotice: () => undefined, max: 2 });

interface Orphan {
  asset_id: string;
  imagekit_file_id: string | null;
  imagekit_path: string;
}

async function cleanAssets(): Promise<{ found: number; removed: number; failed: number }> {
  const orphans = await sql<Orphan[]>`select asset_id, imagekit_file_id, imagekit_path from app.find_orphan_assets()`;
  if (dry || orphans.length === 0) {
    for (const orphan of orphans) console.log(`  (simulación) sobraría ${orphan.imagekit_path}`);
    return { found: orphans.length, removed: 0, failed: 0 };
  }
  if (!imagekitConfigured()) throw new Error("Faltan las variables IMAGEKIT_* para borrar archivos en ImageKit.");

  let removed = 0;
  let failed = 0;
  for (const orphan of orphans) {
    try {
      // Una subida que se cortó puede no tener id aunque el archivo exista en ImageKit: se busca por su ruta.
      const fileId = orphan.imagekit_file_id ?? (await findFileId(orphan.imagekit_path));
      if (fileId) await deleteFromImageKit(fileId);
      await sql`delete from app.assets where id = ${orphan.asset_id}`;
      removed += 1;
    } catch (error) {
      // Si ImageKit no responde, la ficha se queda y se reintenta en la próxima pasada.
      failed += 1;
      console.error(`  no se pudo borrar ${orphan.imagekit_path}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return { found: orphans.length, removed, failed };
}

async function run() {
  const assets = await cleanAssets();
  console.log(`[mantenimiento] archivos sin uso: ${assets.found}${dry ? " (simulación)" : `, borrados ${assets.removed}, con error ${assets.failed}`}`);
  if (!dry) {
    const [purged] = await sql<{ cache_rows: string; token_rows: string }[]>`select cache_rows, token_rows from app.purge_expired()`;
    console.log(`[mantenimiento] caché vencida: ${purged.cache_rows}, enlaces de contraseña viejos: ${purged.token_rows}`);
  }
}

if (loop) {
  // La primera pasada espera un minuto: que la app termine de arrancar.
  setTimeout(function again() {
    run().catch((error) => console.error("[mantenimiento]", error)).finally(() => setTimeout(again, DAY_MS));
  }, 60_000);
} else {
  await run();
  await sql.end();
}
