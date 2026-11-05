import { directoriesOf, remotePath, type BundleFiles } from "./types";

/** Lo mínimo que hace falta de un servidor remoto para subir un árbol de archivos. */
export interface Remote {
  makeDir: (path: string) => Promise<void>;
  put: (path: string, data: Buffer) => Promise<void>;
}

/** Crea las carpetas y sube cada archivo, de uno en uno (los servidores de archivos no agradecen la prisa). Devuelve cuántos subió. */
export async function uploadTree(remote: Remote, root: string, files: BundleFiles): Promise<number> {
  for (const dir of directoriesOf(root, files)) await remote.makeDir(dir);
  let uploaded = 0;
  for (const [path, data] of Object.entries(files)) {
    await remote.put(remotePath(root, path), Buffer.from(data));
    uploaded += 1;
  }
  return uploaded;
}
