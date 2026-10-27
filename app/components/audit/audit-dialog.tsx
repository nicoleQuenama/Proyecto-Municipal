"use client";

import { hasPermission, useAuth } from "../auth/auth-context";
import { useCommands } from "../commands/commands-context";
import { Modal } from "../ui/modal";
import { AuditPanel } from "./audit-panel";

/** El panel de auditoría a casi pantalla completa; se monta solo mientras está abierto. */
export function AuditDialog() {
  const { dialog, closeDialog } = useCommands();
  const { currentUser } = useAuth();
  if (dialog !== "audit" || !hasPermission(currentUser, "viewAudit")) return null;

  return (
    <Modal label="Auditoría antes de publicar" size="full" onClose={closeDialog}>
      <AuditPanel />
    </Modal>
  );
}
