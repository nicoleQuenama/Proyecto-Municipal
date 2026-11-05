import type { TargetKind } from "../deploy-targets";
import { cpanel } from "./cpanel";
import { ftp } from "./ftp";
import { sftp } from "./sftp";
import type { Deployer } from "./types";
import { vercel } from "./vercel";

/** Un tipo de servidor nuevo es una línea aquí (y sus campos en `deploy-targets.ts`). */
export const DEPLOYERS: Record<TargetKind, Deployer> = { vercel, ftp, sftp, cpanel };
