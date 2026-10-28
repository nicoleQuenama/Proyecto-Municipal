"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { Modal } from "../ui/modal";
import { TargetCard } from "./target-card";
import { useDeploy, type TargetKind } from "./use-deploy";

const link = "flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs hover:bg-hover";

function DeployDialog({ onClose }: { onClose: () => void }) {
  const { kinds, targets, error, outcome, save, remove, run } = useDeploy();

  return (
    <Modal label="Desplegar el sitio" size="lg" onClose={onClose}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Desplegar el sitio</h2>
          <p className="mt-0.5 text-xs text-ink-dim">Solo lo ven desarrolladores con permiso y superadministradores. Las claves se guardan en el servidor y no vuelven al navegador.</p>
        </div>
        <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink">
          ×
        </button>
      </header>

      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Sitio publicado</h3>
          <p className="text-xs text-ink-dim">Lo que se publicó con «Publicar» lo ve cualquiera en esta dirección, sin editor.</p>
          <a href="/ver" target="_blank" rel="noopener noreferrer" className={link}>
            Abrir el sitio publicado (/ver)
          </a>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Descargar el proyecto</h3>
          <p className="text-xs text-ink-dim">Todo el código y el sitio publicado, para ponerlo donde quieras.</p>
          <div className="grid grid-cols-2 gap-2">
            <a href="/api/cms/export?kind=zip" download className={link}>
              ZIP del proyecto
            </a>
            <a href="/api/cms/export?kind=docker" download className={link}>
              ZIP con Docker
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold">Servidores</h3>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {kinds &&
            (Object.keys(kinds) as TargetKind[]).map((kind) => (
              <TargetCard
                key={kind}
                kind={kind}
                info={kinds[kind]}
                saved={targets.find((t) => t.kind === kind)}
                outcome={outcome}
                onSave={(values) => save(kind, values)}
                onRemove={() => remove(kind)}
                onRun={() => run(kind)}
              />
            ))}
          <p className="text-[11px] text-ink-dim">Hoy se despliega directo a Vercel. FTP, SFTP y cPanel guardan sus datos, pero todavía no se pueden ejecutar: necesitan exportar el sitio como archivos estáticos.</p>
        </section>
      </div>
    </Modal>
  );
}

/** «Desplegar»: solo aparece para quien tiene permiso (desarrolladores y superadministradores sin ese veto). */
export function DeployButton() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  if (!hasPermission(currentUser, "deploy")) return null;

  return (
    <>
      <button
        type="button"
        title="Exportar el proyecto o desplegarlo a un servidor"
        onClick={() => setOpen(true)}
        className="my-2 flex items-center self-center rounded-md border border-line px-3 text-xs hover:bg-hover"
      >
        Desplegar
      </button>
      {open && <DeployDialog onClose={() => setOpen(false)} />}
    </>
  );
}
