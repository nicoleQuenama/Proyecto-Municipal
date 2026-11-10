import { createHash } from "node:crypto";
import type { Tx } from "../db";
import { inProject } from "../site-access";
import type { Actor } from "../auth-accounts";
import type { Scope } from "../site/site-sql";
import { VersionError } from "../versions/branch-rows";
import { imagekitConfigured, publicUrl, uploadToImageKit } from "./imagekit";
import { compressMedia } from "./compress/compress-media";
import type { CompressionReport } from "./compress/types";
import { pickUploadUnit } from "../units/pick-upload-unit";
import { unitsOf } from "../units/units-access";
import { maxBytesOf, sniffMediaType, type MediaType } from "./sniff";
import { mediaFolder } from "./unit-folder";

/** Lo que recibe el editor de un archivo subido. */
export interface UploadedMedia {
  id: string;
  /** La dirección pública: es lo que se guarda en el diseño. */
  url: string;
  name: string;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
  /** Peso del archivo YA comprimido (es el que se guarda y el que cuenta para la cuota). */
  byteSize: number;
  /** La unidad dueña del archivo; nulo = global. */
  unitId: string | null;
  /** Cómo fue la compresión de esta subida (no se guarda: solo se informa). */
  compression?: CompressionReport;
}

interface AssetRow {
  id: string;
  status: string;
  imagekit_path: string;
  name: string;
  kind: "image" | "video";
  width: number | null;
  height: number | null;
  byte_size: string;
  unit_id: string | null;
}

const toUploaded = (row: AssetRow): UploadedMedia => ({ id: row.id, url: publicUrl(row.imagekit_path), name: row.name, kind: row.kind, width: row.width, height: row.height, byteSize: Number(row.byte_size), unitId: row.unit_id });

/** Un nombre seguro para la ruta: sin espacios ni símbolos raros, y con el tipo real como extensión. */
function safeFileName(name: string, type: MediaType): string {
  const base = name.replace(/\.[^.]*$/, "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "archivo";
  const extension = type === "image/jpeg" ? "jpg" : type.split("/")[1];
  return `${base}.${extension}`;
}

const COLUMNS = "id, status, imagekit_path, name, kind, width, height, byte_size, unit_id";

/**
 * Reserva la ficha (cobra la cuota). Si el MISMO contenido ya está en el proyecto, devuelve el que había y no se sube nada.
 * Un contenido que otra subida está terminando se rechaza: que reintente.
 */
async function reserve(tx: Tx, scope: Scope, userId: string, input: { name: string; type: MediaType; sha: Buffer; size: number; path: string; unitId: string | null }): Promise<{ existing: UploadedMedia } | { id: string; folder: string }> {
  const [found] = (await tx.unsafe(`select ${COLUMNS} from app.assets where organization_id = $1 and project_id = $2 and sha256 = $3 and coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($4::uuid, '00000000-0000-0000-0000-000000000000'::uuid) and deleted_at is null and status <> 'failed'`, [scope.org, scope.project, input.sha, input.unitId])) as unknown as AssetRow[];
  if (found?.status === "ready") return { existing: toUploaded(found) };
  if (found) throw new VersionError("Ese archivo se está subiendo: vuelve a intentarlo en unos segundos.", 409);

  const [made] = await tx.unsafe(
    `insert into app.assets (organization_id, project_id, kind, name, imagekit_path, content_type, byte_size, sha256, created_by, unit_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
    [scope.org, scope.project, input.type.startsWith("video/") ? "video" : "image", input.name.slice(0, 255), input.path, input.type, input.size, input.sha, userId, input.unitId],
  );
  return { id: made.id as string, folder: input.path.slice(0, input.path.lastIndexOf("/")) };
}

/**
 * Sube un archivo del equipo a ImageKit y lo deja registrado en el proyecto. Tres pasos, cada uno en lo suyo: reservar la ficha
 * (y la cuota) en la base, subir a ImageKit (sin transacción abierta: puede tardar) y marcarla lista; si la subida falla, la
 * ficha se borra y la cuota vuelve.
 */
export async function saveMedia(actor: Actor, name: string, data: Buffer, requestedUnit?: string | null): Promise<UploadedMedia> {
  if (!imagekitConfigured()) throw new VersionError("ImageKit no está configurado: faltan IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY e IMAGEKIT_URL_ENDPOINT en el servidor.", 503);
  const type = sniffMediaType(data);
  if (!type) throw new VersionError("Ese archivo no es una imagen o un video compatible (PNG, JPG, WebP, AVIF, GIF, MP4 o WebM).", 415);
  if (data.length > maxBytesOf(type)) throw new VersionError(`El archivo pesa más de ${maxBytesOf(type) / 1024 / 1024} MB.`, 413);

  // Se comprime ANTES de reservar: el tamaño y el contenido (sha256) de la ficha no cambian después y la cuota se cobra con el peso final.
  const { data: prepared, report } = await compressMedia(data, type);
  console.info(`[media] ${type}: ${report.originalBytes} → ${report.finalBytes} bytes (${report.savedPercent} %, ${report.step ?? report.reason}, ${report.ms} ms)`);

  const sha = createHash("sha256").update(prepared).digest();
  const fileName = `${sha.toString("hex").slice(0, 12)}-${safeFileName(name, type)}`;

  const reserved = await inProject(actor, async (tx, scope) => {
    // La unidad dueña del archivo: la pedida por el editor, o la única de la persona (la base de datos lo vuelve a comprobar).
    const unitId = pickUploadUnit(await unitsOf(tx), requestedUnit);
    return reserve(tx, scope, actor.user.id, { name, type, sha, size: prepared.length, path: `${mediaFolder(scope.org, scope.project, unitId)}/${fileName}`, unitId });
  });
  if ("existing" in reserved) return { ...reserved.existing, compression: report };

  try {
    const stored = await uploadToImageKit(prepared, type, reserved.folder, fileName);
    return await inProject(actor, async (tx, scope) => {
      const [row] = (await tx.unsafe(
        `update app.assets set status = 'ready', imagekit_file_id = $4, ready_at = now(), width = $5, height = $6
         where organization_id = $1 and project_id = $2 and id = $3 returning ${COLUMNS}`,
        [scope.org, scope.project, reserved.id, stored.fileId, stored.width ?? null, stored.height ?? null],
      )) as unknown as AssetRow[];
      return { ...toUploaded(row), compression: report };
    });
  } catch (error) {
    await inProject(actor, (tx, scope) => tx.unsafe(`delete from app.assets where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, reserved.id])).catch(() => undefined);
    throw error instanceof VersionError ? error : new VersionError(error instanceof Error ? error.message : "No se pudo subir el archivo.", 502);
  }
}
