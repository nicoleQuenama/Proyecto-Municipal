"use client";

import { useAuth } from "../auth/auth-context";
import { LoginForm } from "../auth/login-form";
import { CmsProviders } from "./cms-providers";
import { EditorWorkspace } from "./editor-workspace";

export function AppShell() {
  const { status, currentUser } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <span
          aria-label="Cargando"
          className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
        />
      </div>
    );
  }

  if (!currentUser) return <LoginForm />;

  return (
    <CmsProviders>
      <EditorWorkspace />
    </CmsProviders>
  );
}
